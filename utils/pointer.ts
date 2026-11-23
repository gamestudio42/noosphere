// A short, still touch is a tap (plant, stimulate, banish). Anything longer
// or that travels is the touch stand-in for hover: pay attention, don't act.
export const TOUCH_TAP_MS = 280;
export const TOUCH_TAP_SLOP = 14;

export type TouchRelease = 'tap' | 'hold';

export const touchReleaseKind = (durationMs: number, distancePx: number): TouchRelease =>
  durationMs <= TOUCH_TAP_MS && distancePx <= TOUCH_TAP_SLOP ? 'tap' : 'hold';
