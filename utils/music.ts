import { Archetype } from '../types';

// The mind plays in A minor pentatonic over a slow pulse. Any notes of the
// scale sound well together, so a hybrid's chord or a burst of bonds always
// lands as music. Pure maths; utils/audio.ts turns it into sound.

export const MUSIC = {
  ROOT_HZ: 55, // A1
  BPM: 84,
  STEPS_PER_BEAT: 4, // sixteenth notes
  STEPS_PER_BAR: 16,
  BARS_PER_CHORD: 2,
};

// Semitones above the root for each degree of the pentatonic scale
const PENTATONIC = [0, 3, 5, 7, 10];

// Frequency of a scale degree counted up from the root (5 degrees an octave)
export const degreeHz = (degree: number) => {
  const octave = Math.floor(degree / PENTATONIC.length);
  const step = PENTATONIC[((degree % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length];
  return MUSIC.ROOT_HZ * Math.pow(2, octave + step / 12);
};

// Each archetype sings in its own register: Instinct low, Logic in the middle,
// Feeling above it and Chaos at the top. [lowest, highest] degree.
export const REGISTERS: Record<Archetype, readonly [number, number]> = {
  PRIMAL: [5, 9], // A2-G3
  RATIONAL: [10, 14], // A3-G4
  EMOTIONAL: [13, 17], // E4-D5
  CREATIVE: [15, 20], // A4-A5
};

// A note for an archetype. Energetic ideas sing higher in their register;
// `roll` (0..1) picks among the nearby notes so repeats don't drone.
export const noteFor = (type: Archetype, energy: number, roll: number) => {
  const [low, high] = REGISTERS[type];
  const span = high - low;
  const centre = low + Math.round(Math.max(0, Math.min(1, energy)) * span);
  const offset = Math.floor(roll * 3) - 1; // -1, 0 or +1
  return degreeHz(Math.max(low, Math.min(high, centre + offset)));
};

export const stepSeconds = () => 60 / MUSIC.BPM / MUSIC.STEPS_PER_BEAT;

// Start of the first grid step at or after `time` (seconds), counted from `origin`
export const nextStep = (time: number, origin: number) => {
  const step = stepSeconds();
  // + 0 turns a -0 from Math.ceil into 0
  const index = Math.ceil((time - origin) / step - 1e-6) + 0;
  return { index, time: origin + index * step };
};

// The chord roots cycle i - III - VII - IV in scale degrees, so the arpeggio
// wanders without ever leaving the key
const CHORD_ROOTS = [0, 1, 4, 2];
// Arpeggio over one bar of eighth notes, in scale degrees above the chord root
const ARPEGGIO = [0, 2, 4, 5, 4, 2, 5, 7];

export const arpeggioNote = (stepIndex: number) => {
  const bar = Math.floor(stepIndex / MUSIC.STEPS_PER_BAR);
  const root = CHORD_ROOTS[Math.floor(bar / MUSIC.BARS_PER_CHORD) % CHORD_ROOTS.length];
  const eighth = Math.floor((stepIndex % MUSIC.STEPS_PER_BAR) / 2);
  return degreeHz(10 + root + ARPEGGIO[eighth]);
};

export interface Mood {
  size: number; // 0..1, how full the mind is
  hybrids: number; // living hybrids
  threat: number; // 0..1, how hard doubts are pressing or how close extinction is
}

export interface Layers {
  drone: number; // 0..1 levels
  pulse: number;
  arpeggio: number;
  tension: number;
}

// Layers enter as the mind grows; tension rises under attack and pulls the
// gentler layers back
export const layersFor = ({ size, hybrids, threat }: Mood): Layers => {
  const s = Math.max(0, Math.min(1, size));
  const t = Math.max(0, Math.min(1, threat));
  return {
    drone: s > 0 ? 0.3 + 0.7 * s : 0,
    pulse: s >= 0.1 ? Math.min(1, (s - 0.1) / 0.3 + t * 0.5) : t * 0.6,
    arpeggio: hybrids >= 3 ? Math.min(1, (hybrids - 2) / 8) * (1 - 0.7 * t) : 0,
    tension: t,
  };
};

// How hard the mind is being pressed: latched doubts, or a mind about to die
export const threatFor = (alive: number, latched: number) => {
  const fromDoubts = Math.min(1, latched / 3);
  const fromSize = alive > 0 && alive < 4 ? (4 - alive) / 4 : 0;
  return Math.max(fromDoubts, fromSize);
};
