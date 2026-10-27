
import { Archetype } from '../types';
import { ARCHETYPES } from '../constants';

// Singletons for the Audio Context
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;

// Polyphony Management to prevent crashes
let activeVoices = 0;
const MAX_POLYPHONY = 20; // Maximum simultaneous sounds allowed

const getCtx = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
        audioCtx = new Ctx();
        
        // Master Volume
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
        
        // Initialize Shared FX
        createSharedReverb(audioCtx);
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

export const playTone = (type: Archetype, energy: number = 0.5) => {
  // 1. Safety Limit (Polyphony)
  if (activeVoices > MAX_POLYPHONY) return;

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
  env.gain.linearRampToValueAtTime(0.1 + (energy * 0.1), t + 0.1); // Attack
  env.gain.exponentialRampToValueAtTime(0.001, t + 2 + (energy * 2)); // Decay

  // 4. Filter (Muffles low energy ideas)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200 + (energy * 2000), t);

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
