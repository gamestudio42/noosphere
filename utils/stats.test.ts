import { describe, expect, it } from 'vitest';
import { formatDuration, largestNetwork } from './stats';
import { createNode } from './gameLogic';

describe('largestNetwork', () => {
  it('counts the biggest connected group', () => {
    const [a, b, c, d] = ['RATIONAL', 'RATIONAL', 'RATIONAL', 'RATIONAL'].map(() =>
      createNode(0, 0, 'RATIONAL'),
    );
    a.connections.push(b.id);
    b.connections.push(a.id, c.id);
    c.connections.push(b.id);
    expect(largestNetwork([a, b, c, d])).toBe(3);
  });

  it('is zero for an empty mind', () => {
    expect(largestNetwork([])).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(65_000)).toBe('1:05');
  });
});
