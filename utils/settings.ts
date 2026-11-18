// Player preferences, kept in the browser. Storage can be missing or throw
// (private mode, blocked site data), so every access is guarded and the
// defaults apply when it fails.

import type { PaletteName } from './palette';

export type Effects = 'full' | 'reduced';

export interface Settings {
  volume: number; // 0..1, applied on top of the mix
  muted: boolean;
  shake: boolean; // screen shake on hits, births and denied actions
  effects: Effects; // reduced: no trails, particles, ripples or slow motion
  palette: PaletteName; // colourblind: archetype hues that stay apart for every colour vision
  glow: boolean; // WebGL bloom and living background (falls back to the 2D canvas)
}

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  muted: false,
  shake: true,
  effects: 'full',
  palette: 'default',
  glow: false,
};

const KEY = 'noosphere:settings:v1';
// Before settings existed, mute was the only preference
const LEGACY_MUTE_KEY = 'noosphere:muted';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Keeps only well-formed values, so a hand-edited or older save can't break the game
export const sanitizeSettings = (raw: unknown): Settings => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  return {
    volume:
      typeof r.volume === 'number' && Number.isFinite(r.volume)
        ? clamp01(r.volume)
        : DEFAULT_SETTINGS.volume,
    muted: typeof r.muted === 'boolean' ? r.muted : DEFAULT_SETTINGS.muted,
    shake: typeof r.shake === 'boolean' ? r.shake : DEFAULT_SETTINGS.shake,
    effects: r.effects === 'reduced' || r.effects === 'full' ? r.effects : DEFAULT_SETTINGS.effects,
    palette:
      r.palette === 'default' || r.palette === 'colourblind' ? r.palette : DEFAULT_SETTINGS.palette,
    glow: typeof r.glow === 'boolean' ? r.glow : DEFAULT_SETTINGS.glow,
  };
};

// ?fx=glow or ?fx=flat switches the WebGL glow and remembers the choice
const fxFromQuery = (): boolean | null => {
  try {
    const fx = new URLSearchParams(window.location.search).get('fx');
    return fx === 'glow' ? true : fx === 'flat' ? false : null;
  } catch {
    return null;
  }
};

export const loadSettings = (): Settings => {
  const loaded = loadStoredSettings();
  const fx = fxFromQuery();
  return fx === null ? loaded : { ...loaded, glow: fx };
};

const loadStoredSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitizeSettings(JSON.parse(raw));
    return { ...DEFAULT_SETTINGS, muted: localStorage.getItem(LEGACY_MUTE_KEY) === '1' };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (settings: Settings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    localStorage.removeItem(LEGACY_MUTE_KEY);
  } catch {
    // Storage unavailable; the preference just won't persist
  }
};
