import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

describe('settings', () => {
  it('falls back to defaults for missing or malformed values', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ volume: 'loud', muted: 1, shake: null, effects: 'ultra' })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('keeps valid values and clamps the volume', () => {
    expect(sanitizeSettings({ volume: 3, muted: true, shake: false, effects: 'reduced' })).toEqual({
      volume: 1,
      muted: true,
      shake: false,
      effects: 'reduced',
    });
    expect(sanitizeSettings({ volume: -1 }).volume).toBe(0);
  });
});
