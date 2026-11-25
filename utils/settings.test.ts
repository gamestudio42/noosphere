import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

describe('settings', () => {
  it('falls back to defaults for missing or malformed values', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(
      sanitizeSettings({
        volume: 'loud',
        muted: 1,
        shake: null,
        effects: 'ultra',
        palette: 'neon',
        glow: 'yes',
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid values and clamps the volume', () => {
    expect(
      sanitizeSettings({
        volume: 3,
        muted: true,
        shake: false,
        effects: 'reduced',
        palette: 'colourblind',
        glow: 'on',
      }),
    ).toEqual({
      volume: 1,
      muted: true,
      shake: false,
      effects: 'reduced',
      palette: 'colourblind',
      glow: 'on',
    });
    expect(sanitizeSettings({ volume: -1 }).volume).toBe(0);
  });

  it('moves saves from the opt-in glow prototype to the new modes', () => {
    expect(sanitizeSettings({ glow: false }).glow).toBe('auto');
    expect(sanitizeSettings({ glow: true }).glow).toBe('on');
    expect(sanitizeSettings({ glow: 'off' }).glow).toBe('off');
  });
});
