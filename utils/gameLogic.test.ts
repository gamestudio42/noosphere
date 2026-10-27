import { beforeEach, describe, expect, it } from 'vitest';
import {
  affinityBetween,
  blendHue,
  blendTraits,
  createNode,
  normalizeBlend,
  splitThreshold,
  updatePhysics,
} from './gameLogic';
import { seededRandom, setRandom } from './random';
import { AFFINITY, ARCHETYPES, PHYSICS } from '../constants';
import { IdeaNode, SimEvent } from '../types';

const W = 800;
const H = 600;

const step = (nodes: IdeaNode[], dt = 1, events: SimEvent[] = []) =>
  updatePhysics(nodes, [], W, H, dt, null, e => events.push(e)).nodes;

beforeEach(() => setRandom(seededRandom(42)));

describe('blends', () => {
  it('normalizes order and removes duplicates', () => {
    expect(normalizeBlend(['PRIMAL', 'RATIONAL', 'PRIMAL'])).toEqual(['RATIONAL', 'PRIMAL']);
  });

  it('averages traits', () => {
    const t = blendTraits(['RATIONAL', 'CREATIVE']);
    expect(t.decay).toBeCloseTo((ARCHETYPES.RATIONAL.traits.decay + ARCHETYPES.CREATIVE.traits.decay) / 2);
  });

  it('blends hues around the colour wheel', () => {
    // Instinct (10) + Feeling (320) meet at 345, not 165
    expect(blendHue(['PRIMAL', 'EMOTIONAL'])).toBeCloseTo(345);
  });

  it('reads affinity from the matrix', () => {
    expect(affinityBetween(['RATIONAL'], ['EMOTIONAL'])).toBe(AFFINITY.RATIONAL.EMOTIONAL);
  });

  it('makes hybrids bigger', () => {
    const plain = createNode(0, 0, 'RATIONAL');
    const hybrid = createNode(0, 0, ['RATIONAL', 'CREATIVE']);
    expect(hybrid.radius).toBeGreaterThan(plain.radius);
    expect(hybrid.blend).toEqual(['RATIONAL', 'CREATIVE']);
  });
});

describe('updatePhysics', () => {
  it('decays independently of frame rate', () => {
    const a = createNode(400, 300, 'RATIONAL');
    const b = createNode(400, 300, 'RATIONAL');
    a.energy = b.energy = 50;
    step(step([a], 1), 1);
    step([b], 2);
    expect(a.energy).toBeCloseTo(b.energy, 5);
  });

  it('makes Logic outlast Chaos', () => {
    const logic = createNode(200, 300, 'RATIONAL');
    const chaos = createNode(600, 300, 'CREATIVE');
    logic.energy = chaos.energy = 50;
    step([logic, chaos], 10);
    expect(logic.energy).toBeGreaterThan(chaos.energy);
  });

  it('removes dead ideas and their connections', () => {
    const a = createNode(300, 300, 'RATIONAL');
    const b = createNode(500, 300, 'RATIONAL');
    a.connections.push(b.id);
    b.connections.push(a.id);
    b.energy = 0.01;
    const next = step([a, b]);
    expect(next.map(n => n.id)).toEqual([a.id]);
    expect(a.connections).toEqual([]);
  });

  it('splits an idea that crosses its threshold', () => {
    const node = createNode(400, 300, 'CREATIVE');
    node.energy = splitThreshold(node) + 1;
    const events: SimEvent[] = [];
    const next = step([node], 1, events);
    expect(next).toHaveLength(2);
    const child = next[1];
    expect(child.parent).toBe(node.id);
    expect(node.connections).toContain(child.id);
    expect(events.some(e => e.kind === 'split')).toBe(true);
  });

  it('never exceeds the population cap', () => {
    const nodes = Array.from({ length: PHYSICS.MAX_NODES }, (_, i) => {
      const n = createNode((i * 37) % W, (i * 53) % H, 'CREATIVE');
      n.energy = 100;
      return n;
    });
    expect(step(nodes).length).toBeLessThanOrEqual(PHYSICS.MAX_NODES);
  });

  it('keeps ideas inside the board', () => {
    const node = createNode(-50, H + 50, 'RATIONAL');
    step([node]);
    expect(node.pos.x).toBeGreaterThanOrEqual(0);
    expect(node.pos.y).toBeLessThanOrEqual(H);
  });

  it('survives overlapping connected ideas without NaN', () => {
    const a = createNode(400, 300, 'RATIONAL');
    const b = createNode(400, 300, 'RATIONAL');
    a.connections.push(b.id);
    b.connections.push(a.id);
    step([a, b]);
    expect(Number.isFinite(a.pos.x) && Number.isFinite(b.pos.y)).toBe(true);
  });

  it('eventually births a hybrid from compatible archetypes', () => {
    let nodes = [createNode(380, 300, 'RATIONAL'), createNode(420, 300, 'CREATIVE')];
    const events: SimEvent[] = [];
    for (let f = 0; f < 60 * 60 && !events.some(e => e.kind === 'hybrid'); f++) {
      // Keep them alive the way a player's attention would
      for (const n of nodes) n.energy = Math.max(n.energy, 60);
      nodes = step(nodes, 1, events);
    }
    const hybrid = events.find(e => e.kind === 'hybrid');
    expect(hybrid).toBeDefined();
    if (hybrid?.kind === 'hybrid') expect(hybrid.node.blend).toEqual(['RATIONAL', 'CREATIVE']);
  });

  it('is deterministic for a given seed', () => {
    const run = () => {
      setRandom(seededRandom(7));
      let nodes = [createNode(300, 300, 'EMOTIONAL'), createNode(340, 320, 'PRIMAL')];
      for (const n of nodes) n.energy = 80;
      for (let f = 0; f < 600; f++) nodes = step(nodes);
      return nodes.map(n => [n.blend.join('+'), Math.round(n.pos.x), Math.round(n.energy)]);
    };
    expect(run()).toEqual(run());
  });
});
