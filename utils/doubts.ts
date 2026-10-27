import { Doubt, IdeaNode } from '../types';
import { DOUBT } from '../constants';
import { random } from './random';

export type DoubtEvent =
  | { kind: 'latch'; doubt: Doubt; node: IdeaNode }
  | { kind: 'dissolved'; doubt: Doubt };

let idCounter = 0;

export const doubtRadius = (doubt: Doubt) => 8 + doubt.strength * 0.08;

// Doubts creep in from just outside a random edge
export const spawnDoubt = (width: number, height: number): Doubt => {
  const side = Math.floor(random() * 4);
  const t = random();
  const pos =
    side === 0 ? { x: t * width, y: -20 } :
    side === 1 ? { x: width + 20, y: t * height } :
    side === 2 ? { x: t * width, y: height + 20 } :
    { x: -20, y: t * height };
  return {
    id: `doubt-${idCounter++}`,
    pos,
    vel: { x: 0, y: 0 },
    strength: DOUBT.STRENGTH,
    target: null,
    seed: random() * 1000,
  };
};

// Bigger minds attract doubts more often, and more of them at once
export const spawnInterval = (alive: number) =>
  Math.max(DOUBT.INTERVAL_MIN_MS, DOUBT.INTERVAL_MAX_MS - alive * DOUBT.INTERVAL_PER_IDEA_MS);

export const maxDoubts = (alive: number) =>
  Math.min(DOUBT.MAX, DOUBT.BASE_MAX + Math.floor(alive / 20));

// The doubt under a point, if any (slightly generous to be easy to click)
export const doubtAt = (doubts: Doubt[], x: number, y: number) =>
  doubts.find(d => Math.hypot(d.pos.x - x, d.pos.y - y) < doubtRadius(d) + 12) ?? null;

// Moves doubts, drains the ideas they latch onto and removes dissolved ones.
// Drained energy is applied to the nodes in place; physics cleans up the dead.
export const updateDoubts = (
  doubts: Doubt[],
  nodes: IdeaNode[],
  width: number,
  height: number,
  dt: number,
  onEvent: (event: DoubtEvent) => void
): Doubt[] => {
  for (const doubt of doubts) {
    let nearest: IdeaNode | null = null;
    let nearestDist = Infinity;
    let logicNear = 0;
    for (const node of nodes) {
      const d = Math.hypot(node.pos.x - doubt.pos.x, node.pos.y - doubt.pos.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = node;
      }
      if (d < DOUBT.LOGIC_RANGE && node.blend.includes('RATIONAL')) logicNear++;
    }

    doubt.strength -= DOUBT.LOGIC_DISSOLVE * logicNear * dt;

    if (nearest && nearestDist < doubtRadius(doubt) + nearest.radius) {
      // Latched: cling to the idea and feed on it
      if (doubt.target !== nearest.id) {
        doubt.target = nearest.id;
        onEvent({ kind: 'latch', doubt, node: nearest });
      }
      const drain = (DOUBT.DRAIN * dt) / (1 + DOUBT.RESIST * nearest.connections.length);
      nearest.energy -= drain;
      doubt.strength += drain * DOUBT.FEED;
      const follow = Math.min(1, 0.1 * dt);
      doubt.pos.x += (nearest.pos.x - doubt.pos.x) * follow;
      doubt.pos.y += (nearest.pos.y - doubt.pos.y) * follow;
      doubt.vel.x = nearest.vel.x;
      doubt.vel.y = nearest.vel.y;
    } else {
      doubt.target = null;
      // Seek the nearest idea, or drift toward the centre of an empty mind
      const tx = nearest ? nearest.pos.x : width / 2;
      const ty = nearest ? nearest.pos.y : height / 2;
      const d = Math.hypot(tx - doubt.pos.x, ty - doubt.pos.y) || 1;
      doubt.vel.x += ((tx - doubt.pos.x) / d) * DOUBT.ACCEL * dt;
      doubt.vel.y += ((ty - doubt.pos.y) / d) * DOUBT.ACCEL * dt;
      const speed = Math.hypot(doubt.vel.x, doubt.vel.y);
      if (speed > DOUBT.MAX_SPEED) {
        doubt.vel.x = (doubt.vel.x / speed) * DOUBT.MAX_SPEED;
        doubt.vel.y = (doubt.vel.y / speed) * DOUBT.MAX_SPEED;
      }
      doubt.pos.x += doubt.vel.x * dt;
      doubt.pos.y += doubt.vel.y * dt;
    }

    doubt.strength = Math.min(doubt.strength, DOUBT.MAX_STRENGTH);
  }

  return doubts.filter(doubt => {
    if (doubt.strength > 0) return true;
    onEvent({ kind: 'dissolved', doubt });
    return false;
  });
};
