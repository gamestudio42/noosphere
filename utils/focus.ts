import { FOCUS } from '../constants';

// Living hybrids clear the mind: each one speeds up focus regeneration
export const regenFocus = (focus: number, hybridsAlive: number, dt: number) => {
  const rate = FOCUS.REGEN + FOCUS.HYBRID_REGEN * Math.min(hybridsAlive, FOCUS.HYBRID_REGEN_CAP);
  return Math.min(FOCUS.MAX, focus + rate * dt);
};

// Feeding drains focus at a flat rate, however many ideas are under the cursor
export const drainFocus = (focus: number, fed: number, dt: number) =>
  fed > 0 ? Math.max(0, focus - FOCUS.FEED * dt) : focus;

export const canAfford = (focus: number, cost: number) => focus >= cost;
