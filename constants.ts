
import { Archetype } from './types';

export const PHYSICS = {
  DRAG: 0.96,
  REPULSION: 150,
  ATTRACTION: 0.005,
  MAX_VELOCITY: 2,
  GROWTH_THRESHOLD: 90,
  DECAY_RATE: 0.05,
  CONNECTION_DISTANCE: 120,
};

export const ARCHETYPES: Record<Archetype, { 
  label: string; 
  hue: number; 
  description: string; 
  soundType: 'sine' | 'triangle' | 'square' | 'sawtooth';
  baseFreq: number;
}> = {
  RATIONAL: {
    label: 'Logic',
    hue: 190, // Cyan
    description: 'Structured, metallic, cool.',
    soundType: 'square',
    baseFreq: 220,
  },
  EMOTIONAL: {
    label: 'Feeling',
    hue: 320, // Pink/Magenta
    description: 'Warm, soft, harmonic.',
    soundType: 'sine',
    baseFreq: 330,
  },
  CREATIVE: {
    label: 'Chaos',
    hue: 45, // Gold/Yellow
    description: 'Sparking, erratic, bright.',
    soundType: 'triangle',
    baseFreq: 440,
  },
  PRIMAL: {
    label: 'Instinct',
    hue: 10, // Deep Red
    description: 'Deep, slow, fundamental.',
    soundType: 'sawtooth',
    baseFreq: 110,
  },
};
