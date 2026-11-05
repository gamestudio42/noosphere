import { Archetype, Traits } from './types';

export const PHYSICS = {
  DRAG: 0.96,
  REPULSION: 150,
  ATTRACTION: 0.005,
  MAX_VELOCITY: 2,
  GROWTH_THRESHOLD: 90,
  DECAY_RATE: 0.05,
  CONNECTION_DISTANCE: 150,
  MAX_NODES: 150,
  MAX_CONNECTIONS: 6, // a saturated idea stops bonding
  SYNTHESIS_ENERGY: 6,
  HYBRID_COST: 15, // energy each parent spends on a hybrid
  SYNTHESIS_CHANCE: 0.003, // per node, per 60fps frame
  AFFINITY_RANGE: 220, // distance within which affinities push/pull
  AFFINITY_FORCE: 0.05,
  GRAVITY_RANGE: 220,
  GRAVITY_FORCE: 0.0025,
};

// Focus: the player's attention budget (campaign only)
export const FOCUS = {
  MAX: 100,
  REGEN: 0.1, // per 60fps frame
  HYBRID_REGEN: 0.01, // extra regen per living hybrid...
  HYBRID_REGEN_CAP: 10, // ...counting at most this many
  PLANT: 20,
  STIMULATE: 10,
  FEED: 0.25, // per frame while the cursor feeds an idea
  BANISH: 15,
};

export const DOUBT = {
  STRENGTH: 60, // on arrival
  MAX_STRENGTH: 150,
  DRAIN: 0.25, // energy taken from a latched idea per frame...
  RESIST: 0.25, // ...divided by 1 + RESIST * its connections
  FEED: 0.4, // strength gained per energy drained
  LOGIC_RANGE: 90, // Logic ideas within this range dissolve doubts
  LOGIC_DISSOLVE: 0.12, // strength lost per frame per nearby Logic idea
  ACCEL: 0.03,
  MAX_SPEED: 0.8,
  FIRST_DELAY_MS: 6000, // grace period once doubts are switched on
  INTERVAL_MAX_MS: 22000, // between arrivals, shrinking as the mind grows
  INTERVAL_MIN_MS: 5000,
  INTERVAL_PER_IDEA_MS: 300,
  BASE_MAX: 2, // concurrent doubts, plus one per 20 ideas
  MAX: 8,
};

export const ARCHETYPES: Record<
  Archetype,
  {
    label: string;
    hue: number;
    description: string;
    soundType: 'sine' | 'triangle' | 'square' | 'sawtooth';
    baseFreq: number;
    traits: Traits;
  }
> = {
  RATIONAL: {
    label: 'Logic',
    hue: 190, // Cyan
    description: 'Slow to fade. Builds stable structures.',
    soundType: 'square',
    baseFreq: 220,
    traits: { decay: 0.6, growth: 1.05, sociability: 0.8, gravity: 0, inertia: 1 },
  },
  EMOTIONAL: {
    label: 'Feeling',
    hue: 320, // Pink/Magenta
    description: 'Bonds easily with everything nearby.',
    soundType: 'sine',
    baseFreq: 330,
    traits: { decay: 1, growth: 1, sociability: 3, gravity: 0, inertia: 1 },
  },
  CREATIVE: {
    label: 'Chaos',
    hue: 45, // Gold/Yellow
    description: 'Multiplies fast, burns out fast.',
    soundType: 'triangle',
    baseFreq: 440,
    traits: { decay: 1.7, growth: 0.8, sociability: 1, gravity: 0, inertia: 0.7 },
  },
  PRIMAL: {
    label: 'Instinct',
    hue: 10, // Deep Red
    description: 'Heavy and slow. Pulls other ideas in.',
    soundType: 'sawtooth',
    baseFreq: 110,
    traits: { decay: 0.8, growth: 1.1, sociability: 1, gravity: 1, inertia: 2 },
  },
};

// How strongly archetype A is drawn to B (-1 repels, 1 attracts).
// Also scales the chance that the two synthesize.
export const AFFINITY: Record<Archetype, Record<Archetype, number>> = {
  RATIONAL: { RATIONAL: 0.3, EMOTIONAL: -0.6, CREATIVE: 0.5, PRIMAL: -0.2 },
  EMOTIONAL: { RATIONAL: -0.6, EMOTIONAL: 0.4, CREATIVE: 0.3, PRIMAL: 0.6 },
  CREATIVE: { RATIONAL: 0.5, EMOTIONAL: 0.3, CREATIVE: -0.3, PRIMAL: 0.2 },
  PRIMAL: { RATIONAL: -0.2, EMOTIONAL: 0.6, CREATIVE: 0.2, PRIMAL: 0.5 },
};

export const ARCHETYPE_ORDER: Archetype[] = ['RATIONAL', 'EMOTIONAL', 'CREATIVE', 'PRIMAL'];
