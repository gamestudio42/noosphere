import { Archetype } from '../types';
import { ARCHETYPES } from '../constants';

// Singletons for the Audio Context
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;
let ambienceGain: GainNode | null = null;
let ambienceFilter: BiquadFilterNode | null = null;

const MASTER_VOLUME = 0.3;
let muted = false;

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
      masterGain.gain.value = muted ? 0 : MASTER_VOLUME;
      masterGain.connect(audioCtx.destination);

      // Initialize Shared FX
      createSharedReverb(audioCtx);
      createAmbience(audioCtx);
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

// level 0..1, usually how full the mind is. No-op until audio has started.
export const setAmbience = (level: number) => {
  if (!audioCtx || !ambienceGain || !ambienceFilter) return;
  const t = audioCtx.currentTime;
  const clamped = Math.max(0, Math.min(1, level));
  ambienceGain.gain.setTargetAtTime(clamped > 0 ? 0.03 + clamped * 0.08 : 0, t, 1.5);
  ambienceFilter.frequency.setTargetAtTime(200 + clamped * 700, t, 1.5);
};

export const isMuted = () => muted;

export const setMuted = (value: boolean) => {
  muted = value;
  if (audioCtx && masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, audioCtx.currentTime, 0.05);
  }
};

export const playTone = (type: Archetype, energy: number = 0.5) => {
  // 1. Safety Limit (Polyphony)
  if (muted || activeVoices > MAX_POLYPHONY) return;

  const ctx = getCtx();
  if (!ctx || !masterGain || !reverbNode) return;
  if (ctx.state === 'suspended') ctx.resume();

  activeVoices++;

  const config = ARCHETYPES[type];
  const t = ctx.currentTime;

  // 2. Oscillator (The Sound Source)
  const osc = ctx.createOscillator();
  osc.type = config.soundType;

  // Detune slightly for organic feel
  const variance = (Math.random() - 0.5) * 10;
  // Harmonic series based on energy
  const harmonic = Math.floor(Math.random() * 4) + 1;
  osc.frequency.setValueAtTime(config.baseFreq * (energy > 0.8 ? harmonic : 1) + variance, t);

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
  setTimeout(() => {
    osc.disconnect();
    filter.disconnect();
    env.disconnect();
    activeVoices--;
  }, 3100);
};

// Hybrids sound as a chord of every archetype they carry
export const playBlend = (blend: Archetype[], energy: number = 0.5) => {
  if (blend.length === 1) return playTone(blend[0], energy);
  blend.forEach((type) => playTone(type, energy * 0.7));
};

// Short non-musical cues for game events
type Cue = 'denied' | 'doubt' | 'banish' | 'chapter';

const CUES: Record<
  Cue,
  { freqs: number[]; type: OscillatorType; length: number; gain: number; glide?: number }
> = {
  denied: { freqs: [70], type: 'sine', length: 0.25, gain: 0.25, glide: 0.6 },
  doubt: { freqs: [92, 97.5], type: 'sawtooth', length: 1.6, gain: 0.06 }, // detuned, uneasy
  banish: { freqs: [660, 990], type: 'triangle', length: 0.8, gain: 0.08, glide: 1.5 },
  chapter: { freqs: [220, 277.2, 329.6, 440], type: 'sine', length: 3.5, gain: 0.07 },
};

export const playCue = (cue: Cue) => {
  if (muted || activeVoices > MAX_POLYPHONY) return;
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
