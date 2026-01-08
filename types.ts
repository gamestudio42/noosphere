
export type Archetype = 'RATIONAL' | 'EMOTIONAL' | 'CREATIVE' | 'PRIMAL';

export interface Vector2 {
  x: number;
  y: number;
}

export interface IdeaNode {
  id: string;
  type: Archetype;
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

export interface GameState {
  nodes: IdeaNode[];
  particles: Particle[];
  selectedArchetype: Archetype;
  isRunning: boolean;
  message: string | null;
  ideaCount: number;
}
