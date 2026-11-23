import { describe, expect, it } from 'vitest';
import { TOUCH_TAP_MS, TOUCH_TAP_SLOP, touchReleaseKind } from './pointer';

describe('touch release', () => {
  it('treats a short, still press as a tap', () => {
    expect(touchReleaseKind(0, 0)).toBe('tap');
    expect(touchReleaseKind(TOUCH_TAP_MS, TOUCH_TAP_SLOP)).toBe('tap');
  });

  it('treats a long press or a drag as attention, the stand-in for hover', () => {
    expect(touchReleaseKind(TOUCH_TAP_MS + 1, 0)).toBe('hold');
    expect(touchReleaseKind(40, TOUCH_TAP_SLOP + 0.1)).toBe('hold');
  });
});
