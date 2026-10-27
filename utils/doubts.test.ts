import { beforeEach, describe, expect, it } from 'vitest';
import { doubtAt, maxDoubts, spawnDoubt, spawnInterval, updateDoubts, DoubtEvent } from './doubts';
import { createNode } from './gameLogic';
import { seededRandom, setRandom } from './random';
import { DOUBT } from '../constants';
import { Doubt } from '../types';

const W = 800;
const H = 600;

const doubtAtPos = (x: number, y: number): Doubt => ({ ...spawnDoubt(W, H), pos: { x, y } });

beforeEach(() => setRandom(seededRandom(7)));

describe('doubts', () => {
  it('spawn just outside the screen', () => {
    for (let i = 0; i < 20; i++) {
      const d = spawnDoubt(W, H);
      const outside = d.pos.x < 0 || d.pos.x > W || d.pos.y < 0 || d.pos.y > H;
      expect(outside).toBe(true);
    }
  });

  it('arrive more often and in greater numbers as the mind grows', () => {
    expect(spawnInterval(100)).toBeLessThan(spawnInterval(0));
    expect(spawnInterval(10000)).toBe(DOUBT.INTERVAL_MIN_MS);
    expect(maxDoubts(60)).toBeGreaterThan(maxDoubts(0));
    expect(maxDoubts(10000)).toBe(DOUBT.MAX);
  });

  it('seek, latch onto and drain the nearest idea', () => {
    const node = createNode(400, 300, 'EMOTIONAL');
    node.vel = { x: 0, y: 0 };
    node.energy = 80;
    let doubts = [doubtAtPos(300, 300)];
    const events: DoubtEvent[] = [];
    for (let i = 0; i < 600; i++) doubts = updateDoubts(doubts, [node], W, H, 1, e => events.push(e));
    expect(events.some(e => e.kind === 'latch' && e.node === node)).toBe(true);
    expect(node.energy).toBeLessThan(80);
    expect(doubts[0].strength).toBeGreaterThan(DOUBT.STRENGTH);
  });

  it('drain well connected ideas more slowly', () => {
    const lonely = createNode(400, 300, 'EMOTIONAL');
    const social = createNode(400, 300, 'EMOTIONAL');
    social.connections = ['a', 'b', 'c', 'd'];
    lonely.energy = social.energy = 80;
    updateDoubts([doubtAtPos(400, 300)], [lonely], W, H, 10, () => {});
    updateDoubts([doubtAtPos(400, 300)], [social], W, H, 10, () => {});
    expect(social.energy).toBeGreaterThan(lonely.energy);
  });

  it('are dissolved by nearby Logic ideas', () => {
    const logic = [createNode(400, 300, 'RATIONAL'), createNode(410, 300, 'RATIONAL'), createNode(400, 310, 'RATIONAL')];
    let doubts = [doubtAtPos(460, 300)];
    const events: DoubtEvent[] = [];
    for (let i = 0; i < 600 && doubts.length; i++) doubts = updateDoubts(doubts, logic, W, H, 1, e => events.push(e));
    expect(doubts).toHaveLength(0);
    expect(events.some(e => e.kind === 'dissolved')).toBe(true);
  });

  it('can be found under the cursor', () => {
    const d = doubtAtPos(100, 100);
    expect(doubtAt([d], 105, 100)).toBe(d);
    expect(doubtAt([d], 300, 300)).toBeNull();
  });
});
