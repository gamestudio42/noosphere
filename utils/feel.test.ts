import { describe, expect, it } from 'vitest';
import {
  FEEL,
  addRipple,
  addTrauma,
  decayFeel,
  newFeel,
  shakeOffset,
  startHero,
  timeScale,
  zoom,
} from './feel';

describe('game feel', () => {
  it('slows time on a hero moment and eases back to full speed', () => {
    const feel = newFeel();
    expect(timeScale(feel, 0)).toBe(1);
    startHero(feel, 100, 100, 1000);
    expect(timeScale(feel, 1000)).toBeCloseTo(FEEL.HERO_SLOWEST);
    expect(timeScale(feel, 1000 + FEEL.HERO_MS / 2)).toBeGreaterThan(FEEL.HERO_SLOWEST);
    expect(timeScale(feel, 1000 + FEEL.HERO_MS)).toBe(1);
    expect(zoom(feel, 1000)).toBeCloseTo(FEEL.HERO_ZOOM);
    expect(zoom(feel, 1000 + FEEL.HERO_MS)).toBe(0);
  });

  it('forgets a finished hero moment', () => {
    const feel = newFeel();
    startHero(feel, 0, 0, 0);
    decayFeel(feel, FEEL.HERO_MS + 1, 16);
    expect(feel.heroAt).toBeNull();
    expect(feel.heroPos).toBeNull();
  });

  it('shakes in proportion to trauma squared and settles', () => {
    const feel = newFeel();
    expect(shakeOffset(feel, 123)).toEqual({ x: 0, y: 0 });
    addTrauma(feel, 2);
    expect(feel.trauma).toBe(1);
    const strong = shakeOffset(feel, 123);
    expect(Math.abs(strong.x)).toBeLessThanOrEqual(FEEL.MAX_SHAKE_PX);
    decayFeel(feel, 0, 10_000);
    expect(feel.trauma).toBe(0);
  });

  it('drops finished ripples and caps how many are alive', () => {
    const feel = newFeel();
    for (let i = 0; i < FEEL.MAX_RIPPLES + 5; i++) {
      addRipple(feel, { x: 0, y: 0, born: i, duration: 100, from: 0, to: 10, hue: 0, width: 1 });
    }
    expect(feel.ripples).toHaveLength(FEEL.MAX_RIPPLES);
    decayFeel(feel, 1000, 16);
    expect(feel.ripples).toHaveLength(0);
  });
});
