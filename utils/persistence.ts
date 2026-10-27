
import { Doubt, GameMode, IdeaNode } from '../types';
import { blendTraits, normalizeBlend } from './gameLogic';
import { CampaignState } from '../campaign';

// Each mode keeps its own mind. v1 saves predate modes and were sandboxes.
const keyFor = (mode: GameMode) => `noosphere:mind:v2:${mode}`;
const LEGACY_KEY = 'noosphere:mind:v1';

export interface SavedMind {
  savedAt: number;
  width: number;
  height: number;
  nodes: IdeaNode[];
  focus?: number;
  doubts?: Doubt[];
  session: {
    duration: number;
    peakAlive: number;
    maxGeneration: number;
    largestNetwork: number;
    maxBlend: number;
    bonds: number;
    hybridsBorn: number;
    doubtsBanished?: number;
    doubtsDissolved?: number;
    planted?: number;
    splits?: number;
    unlocked: string[];
  };
}

// Browser storage can be missing or throw (private mode, blocked site data),
// so every access is guarded and failure just means "no saved mind".
export const saveMind = (mode: GameMode, mind: SavedMind) => {
  try {
    localStorage.setItem(keyFor(mode), JSON.stringify(mind));
    if (mode === 'free') localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
};

export const clearMind = (mode: GameMode) => {
  try {
    localStorage.removeItem(keyFor(mode));
    if (mode === 'free') localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
};

export const loadMind = (mode: GameMode): SavedMind | null => {
  try {
    const raw = localStorage.getItem(keyFor(mode)) ?? (mode === 'free' ? localStorage.getItem(LEGACY_KEY) : null);
    if (!raw) return null;
    const mind = JSON.parse(raw) as SavedMind;
    if (!Array.isArray(mind.nodes)) return null;
    // Drop anything corrupted by an older bug (NaN positions save as null)
    mind.nodes = mind.nodes.filter(n => Number.isFinite(n.pos?.x) && Number.isFinite(n.pos?.y));
    if (mind.nodes.length === 0) return null;
    mind.doubts = mind.doubts?.filter(d => Number.isFinite(d.pos?.x) && Number.isFinite(d.pos?.y));
    // Traits are derived data; recompute in case archetype tuning changed
    for (const n of mind.nodes) {
      n.blend = normalizeBlend(n.blend);
      n.traits = blendTraits(n.blend);
    }
    return mind;
  } catch {
    return null;
  }
};

export const hasSavedMind = (mode: GameMode) => loadMind(mode) !== null;

const CAMPAIGN_KEY = 'noosphere:campaign:v1';

export const saveCampaign = (state: CampaignState) => {
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const loadCampaign = (): CampaignState | null => {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as CampaignState;
    if (typeof state.chapter !== 'number') return null;
    // Hold timers are measured in mind age, which doesn't survive a reload exactly
    return { chapter: state.chapter, baseline: state.baseline ?? {}, done: state.done ?? [], holdSince: {} };
  } catch {
    return null;
  }
};

export const clearCampaign = () => {
  try {
    localStorage.removeItem(CAMPAIGN_KEY);
  } catch {
    // ignore
  }
};
