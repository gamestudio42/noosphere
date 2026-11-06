import { Archetype } from '../types';
import { ARCHETYPES } from '../constants';
import {
  Layers,
  Mood,
  arpeggioNote,
  degreeHz,
  layersFor,
  nextStep,
  noteFor,
  stepSeconds,
} from './music';

// Singletons for the Audio Context
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;
let ambienceGain: GainNode | null = null;
let ambienceFilter: BiquadFilterNode | null = null;
let tensionGain: GainNode | null = null;
let tensionFilter: BiquadFilterNode | null = null;
// Everything rhythmic is laid on one grid counted from this moment
let gridOrigin = 0;
let layers: Layers = layersFor({ size: 0, hybrids: 0, threat: 0 });

const MASTER_VOLUME = 0.3;
let muted = false;
// Whether a mind is on screen; the menu has no sound
let boardActive = false;
// A paused mind is silent too
let paused = false;
// Player volume, 0..1, on top of MASTER_VOLUME
let volume = 1;

// Once started, the drone and the reverb keep the audio thread busy even when
// silent, so the context is suspended whenever nothing can be heard.
const SUSPEND_DELAY_MS = 400; // lets the mute fade and short tails finish
let suspendTimer: ReturnType<typeof setTimeout> | undefined;

const audible = () =>
  !muted &&
  !paused &&
  boardActive &&
  (typeof document === 'undefined' || document.visibilityState !== 'hidden');

const syncContext = () => {
  if (!audioCtx) return;
  clearTimeout(suspendTimer);
  if (audible()) {
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } else {
    suspendTimer = setTimeout(() => {
      if (audioCtx && !audible() && audioCtx.state === 'running') void audioCtx.suspend();
    }, SUSPEND_DELAY_MS);
  }
};

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', syncContext);

// Called by the board as it mounts and unmounts
export const setAudioActive = (active: boolean) => {
  boardActive = active;
  syncContext();
};

export const setAudioPaused = (value: boolean) => {
  paused = value;
  syncContext();
};

const masterLevel = () => (muted ? 0 : MASTER_VOLUME * volume);

export const setVolume = (value: number) => {
  volume = Math.max(0, Math.min(1, value));
  if (audioCtx && masterGain)
    masterGain.gain.setTargetAtTime(masterLevel(), audioCtx.currentTime, 0.05);
};

// Polyphony Management to prevent crashes
let activeVoices = 0;
const MAX_POLYPHONY = 20; // Maximum simultaneous sounds allowed

const getCtx = () => {
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();

      // Master Volume
      masterGain = audioCtx.createGain();
      masterGain.gain.value = masterLevel();
      masterGain.connect(audioCtx.destination);

      // Initialize Shared FX
      createSharedReverb(audioCtx);
      createAmbience(audioCtx);
      createTension(audioCtx);
      gridOrigin = audioCtx.currentTime;
      window.setInterval(scheduleScore, SCHEDULER_MS);
    }
  }
  return audioCtx;
};

// Create the Reverb ONCE and reuse it (Huge performance fix)
const createSharedReverb = (ctx: AudioContext) => {
  // Impulse Response Generation (The "Atmosphere")
  const length = 2 * ctx.sampleRate;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Decaying noise
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }

  reverbNode = ctx.createConvolver();
  reverbNode.buffer = impulse;

  // Wet Mix Level for the Reverb
  reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.4;

  // Chain: Reverb -> ReverbGain -> Master
  reverbNode.connect(reverbGain);
  if (masterGain) reverbGain.connect(masterGain);
};

// Low drone under everything; silent until setAmbience raises it
const createAmbience = (ctx: AudioContext) => {
  ambienceGain = ctx.createGain();
  ambienceGain.gain.value = 0;
  ambienceFilter = ctx.createBiquadFilter();
  ambienceFilter.type = 'lowpass';
  ambienceFilter.frequency.value = 200;

  // Root and a slightly detuned fifth for a slow beating texture
  for (const freq of [55, 82.7]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(ambienceFilter);
    osc.start();
  }
  ambienceFilter.connect(ambienceGain);
  if (masterGain) ambienceGain.connect(masterGain);
};

// A low A against a B-flat: a minor second that swells while the mind is under attack
const createTension = (ctx: AudioContext) => {
  tensionGain = ctx.createGain();
  tensionGain.gain.value = 0;
  tensionFilter = ctx.createBiquadFilter();
  tensionFilter.type = 'lowpass';
  tensionFilter.frequency.value = 300;
  for (const freq of [110, 116.54]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(tensionFilter);
    osc.start();
  }
  tensionFilter.connect(tensionGain);
  if (masterGain) tensionGain.connect(masterGain);
};

// The score follows the mind: how full it is, how many hybrids live and how
// hard it is pressed. No-op until audio has started.
export const setMood = (mood: Mood) => {
  layers = layersFor(mood);
  if (!audioCtx || !ambienceGain || !ambienceFilter || !tensionGain || !tensionFilter) return;
  const t = audioCtx.currentTime;
  const size = Math.max(0, Math.min(1, mood.size));
  ambienceGain.gain.setTargetAtTime(layers.drone * 0.11, t, 1.5);
  ambienceFilter.frequency.setTargetAtTime(200 + size * 700, t, 1.5);
  tensionGain.gain.setTargetAtTime(layers.tension * 0.035, t, 0.8);
  tensionFilter.frequency.setTargetAtTime(300 + layers.tension * 500, t, 0.8);
};

// Lookahead scheduler: a timer wakes often and books the score's notes a
// little ahead on the audio clock, so timing stays exact even if the timer
// is late
const SCHEDULER_MS = 25;
const LOOKAHEAD_S = 0.12;
let nextScoreStep = 0;

const scheduleScore = () => {
  if (!audioCtx || audioCtx.state !== 'running' || !audible()) return;
  const until = audioCtx.currentTime + LOOKAHEAD_S;
  // Never schedule in the past (after a suspend the clock has moved on)
  const first = nextStep(audioCtx.currentTime, gridOrigin);
  if (nextScoreStep < first.index) nextScoreStep = first.index;
  for (;;) {
    const time = gridOrigin + nextScoreStep * stepSeconds();
    if (time >= until) break;
    playStep(nextScoreStep, time);
    nextScoreStep++;
  }
};

const playStep = (index: number, time: number) => {
  // Heartbeat on every beat; under attack it doubles into lub-dub
  if (index % 4 === 0 && layers.pulse > 0.02) heartbeat(time, layers.pulse);
  if (index % 4 === 2 && layers.tension > 0.3) heartbeat(time, layers.tension * 0.6);
  // Eighth-note arpeggio once a few hybrids are alive
  if (index % 2 === 0 && layers.arpeggio > 0.02) pluck(arpeggioNote(index), time, layers.arpeggio);
};

// One short-lived voice: oscillator -> envelope -> dry and reverb sends
const voice = (
  ctx: AudioContext,
  type: OscillatorType,
  time: number,
  length: number,
  peak: number,
  wet: boolean,
) => {
  const osc = ctx.createOscillator();
  osc.type = type;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(peak, time + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, time + length);
  osc.connect(env);
  if (masterGain) env.connect(masterGain);
  if (wet && reverbNode) env.connect(reverbNode);
  osc.start(time);
  osc.stop(time + length + 0.05);
  osc.onended = () => {
    osc.disconnect();
    env.disconnect();
  };
  return osc;
};

const heartbeat = (time: number, level: number) => {
  if (!audioCtx) return;
  const osc = voice(audioCtx, 'sine', time, 0.28, 0.32 * level, false);
  osc.frequency.setValueAtTime(62, time);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.2);
};

const pluck = (freq: number, time: number, level: number) => {
  if (!audioCtx) return;
  const osc = voice(audioCtx, 'triangle', time, 0.6, 0.035 * level, true);
  osc.frequency.setValueAtTime(freq, time);
};

export const isMuted = () => muted;

export const setMuted = (value: boolean) => {
  muted = value;
  if (audioCtx && masterGain) {
    masterGain.gain.setTargetAtTime(masterLevel(), audioCtx.currentTime, 0.05);
  }
  syncContext();
};

// At most this many automatic notes start on one sixteenth, so a burst of
// bonds plays as a chord instead of a smear
const MAX_NOTES_PER_STEP = 3;
const notesPerStep = new Map<number, number>();

// An idea's note, always in key. Player actions sound at once; automatic
// events (bonds, splits, births) wait for the next sixteenth so the mind
// keeps time.
export const playTone = (type: Archetype, energy: number = 0.5, onBeat = false) => {
  // 1. Safety Limit (Polyphony)
  if (!audible() || activeVoices > MAX_POLYPHONY) return;

  const ctx = getCtx();
  if (!ctx || !masterGain || !reverbNode) return;
  if (ctx.state === 'suspended') ctx.resume();

  let t = ctx.currentTime;
  if (onBeat) {
    const step = nextStep(t + 0.01, gridOrigin);
    const count = notesPerStep.get(step.index) ?? 0;
    if (count >= MAX_NOTES_PER_STEP) return;
    notesPerStep.set(step.index, count + 1);
    if (notesPerStep.size > 64) notesPerStep.delete(notesPerStep.keys().next().value!);
    t = step.time;
  }

  activeVoices++;
  const config = ARCHETYPES[type];

  // 2. Oscillator: a note of the scale in this archetype's register
  const osc = ctx.createOscillator();
  osc.type = config.soundType;
  osc.frequency.setValueAtTime(noteFor(type, energy, Math.random()), t);

  // 3. Envelope (Volume Shape)
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.1 + energy * 0.1, t + 0.1); // Attack
  env.gain.exponentialRampToValueAtTime(0.001, t + 2 + energy * 2); // Decay

  // 4. Filter (Muffles low energy ideas)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200 + energy * 2000, t);

  // 5. Routing (The Efficient Way)
  osc.connect(filter);
  filter.connect(env);

  // Split signal: Dry -> Master, Wet -> Shared Reverb
  env.connect(masterGain); // Dry signal
  env.connect(reverbNode); // Wet signal (Send to shared reverb)

  // 6. Play & Cleanup
  osc.start(t);
  const stopTime = t + 3; // Allow tail to fade
  osc.stop(stopTime);

  // Garbage Collection Helper
  setTimeout(
    () => {
      osc.disconnect();
      filter.disconnect();
      env.disconnect();
      activeVoices--;
    },
    (t - ctx.currentTime) * 1000 + 3100,
  );
};

// Hybrids sound as a chord of every archetype they carry
export const playBlend = (blend: Archetype[], energy: number = 0.5, onBeat = false) => {
  if (blend.length === 1) return playTone(blend[0], energy, onBeat);
  blend.forEach((type) => playTone(type, energy * 0.7, onBeat));
};

// Short cues for game events. Doubt and denied stay out of key on purpose.
type Cue = 'denied' | 'doubt' | 'banish' | 'chapter';

const CUES: Record<
  Cue,
  { freqs: number[]; type: OscillatorType; length: number; gain: number; glide?: number }
> = {
  denied: { freqs: [70], type: 'sine', length: 0.25, gain: 0.25, glide: 0.6 },
  doubt: { freqs: [92, 97.5], type: 'sawtooth', length: 1.6, gain: 0.06 }, // detuned, uneasy
  banish: { freqs: [degreeHz(16), degreeHz(19)], type: 'triangle', length: 0.8, gain: 0.08 }, // C5, G5
  // A minor with the octave, rolled
  chapter: {
    freqs: [degreeHz(10), degreeHz(11), degreeHz(13), degreeHz(15)],
    type: 'sine',
    length: 3.5,
    gain: 0.07,
  },
};

export const playCue = (cue: Cue) => {
  if (!audible() || activeVoices > MAX_POLYPHONY) return;
  const ctx = getCtx();
  if (!ctx || !masterGain || !reverbNode) return;
  if (ctx.state === 'suspended') ctx.resume();

  const config = CUES[cue];
  const t = ctx.currentTime;
  activeVoices++;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(config.gain, t + 0.02);
  env.gain.exponentialRampToValueAtTime(0.001, t + config.length);
  env.connect(masterGain);
  env.connect(reverbNode);

  const oscs = config.freqs.map((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = config.type;
    // Chords arpeggiate slightly so they bloom instead of hitting at once
    const start = t + (cue === 'chapter' ? i * 0.12 : 0);
    osc.frequency.setValueAtTime(freq, start);
    if (config.glide)
      osc.frequency.exponentialRampToValueAtTime(freq * config.glide, start + config.length);
    osc.connect(env);
    osc.start(start);
    osc.stop(t + config.length + 0.6);
    return osc;
  });

  setTimeout(
    () => {
      oscs.forEach((o) => o.disconnect());
      env.disconnect();
      activeVoices--;
    },
    (config.length + 0.7) * 1000,
  );
};
