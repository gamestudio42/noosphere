
export type Archetype = 'RATIONAL' | 'EMOTIONAL' | 'CREATIVE' | 'PRIMAL';

export interface Vector2 {
  x: number;
  y: number;
}

// Behavioural multipliers; 1 = neutral
export interface Traits {
  decay: number;        // energy loss speed
  growth: number;       // energy needed to split (multiplies GROWTH_THRESHOLD)
  sociability: number;  // synthesis chance and reach
  gravity: number;      // pull exerted on nearby nodes
  inertia: number;      // lower max speed when > 1
}

export interface IdeaNode {
  id: string;
  type: Archetype; // dominant archetype (first of blend)
  blend: Archetype[]; // every archetype this idea carries, sorted; > 1 = hybrid
  traits: Traits;
  pos: Vector2;
  vel: Vector2;
  energy: number; // 0 to 100
  radius: number;
  parent?: string; // ID
  connections: string[]; // IDs
  createdAt: number;
  generation: number;
  hue: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export type SimEvent =
  | { kind: 'split'; x: number; y: number; node: IdeaNode }
  | { kind: 'synthesis'; x: number; y: number; a: IdeaNode; b: IdeaNode }
  | { kind: 'hybrid'; x: number; y: number; node: IdeaNode };

export interface SessionStats {
  startedAt: number;
  duration: number; // ms
  alive: number;
  hybridsAlive: number;
  peakAlive: number;
  maxGeneration: number;
  largestNetwork: number;
  maxBlend: number;
  bonds: number;
  hybridsBorn: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  test: (stats: SessionStats) => boolean;
}
