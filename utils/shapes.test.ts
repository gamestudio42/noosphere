import { describe, expect, it } from 'vitest';
import { SHAPES, svgPoints } from './shapes';
import { ARCHETYPE_ORDER } from '../constants';

// Shoelace formula
const area = (points: readonly (readonly [number, number])[]) =>
  Math.abs(
    points.reduce((sum, [x, y], i) => {
      const [nx, ny] = points[(i + 1) % points.length];
      return sum + x * ny - nx * y;
    }, 0),
  ) / 2;

describe('archetype shapes', () => {
  it('gives every archetype a different silhouette', () => {
    const outlines = ARCHETYPE_ORDER.map((t) => JSON.stringify(SHAPES[t]));
    expect(new Set(outlines).size).toBe(ARCHETYPE_ORDER.length);
  });

  it('keeps each silhouette about as big as the circle', () => {
    for (const type of ARCHETYPE_ORDER) {
      const outline = SHAPES[type];
      const a = outline ? area(outline) : Math.PI;
      expect(a / Math.PI).toBeGreaterThan(0.9);
      expect(a / Math.PI).toBeLessThan(1.1);
    }
  });

  it('describes polygons for SVG and leaves the circle to the caller', () => {
    expect(svgPoints('EMOTIONAL')).toBeUndefined();
    expect(svgPoints('PRIMAL')?.split(' ')).toHaveLength(3);
  });
});
