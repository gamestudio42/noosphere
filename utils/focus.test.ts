import { describe, expect, it } from 'vitest';
import { canAfford, drainFocus, regenFocus } from './focus';
import { FOCUS } from '../constants';

describe('focus', () => {
  it('regenerates faster with living hybrids, up to a cap', () => {
    const base = regenFocus(0, 0, 10);
    const boosted = regenFocus(0, 5, 10);
    const capped = regenFocus(0, 1000, 10);
    expect(boosted).toBeGreaterThan(base);
    expect(capped).toBeCloseTo(regenFocus(0, FOCUS.HYBRID_REGEN_CAP, 10));
  });

  it('never exceeds the maximum', () => {
    expect(regenFocus(FOCUS.MAX - 0.01, 0, 100)).toBe(FOCUS.MAX);
  });

  it('drains only while feeding and never goes negative', () => {
    expect(drainFocus(50, 0, 10)).toBe(50);
    expect(drainFocus(50, 3, 10)).toBeCloseTo(50 - FOCUS.FEED * 10);
    expect(drainFocus(0.1, 1, 10)).toBe(0);
  });

  it('checks affordability', () => {
    expect(canAfford(FOCUS.PLANT, FOCUS.PLANT)).toBe(true);
    expect(canAfford(FOCUS.PLANT - 1, FOCUS.PLANT)).toBe(false);
  });
});
