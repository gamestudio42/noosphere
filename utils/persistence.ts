
import { IdeaNode } from '../types';
import { blendTraits, normalizeBlend } from './gameLogic';

const KEY = 'noosphere:mind:v1';

export interface SavedMind {
  savedAt: number;
  width: number;
  height: number;
  nodes: IdeaNode[];
  session: {
    duration: number;
    peakAlive: number;
    maxGeneration: number;
    largestNetwork: number;
    maxBlend: number;
    bonds: number;
    hybridsBorn: number;
    unlocked: string[];
  };
}

// Browser storage can be missing or throw (private mode, blocked site data),
// so every access is guarded and failure just means "no saved mind".
export const saveMind = (mind: SavedMind) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(mind));
  } catch {
    // ignore
  }
};

export const clearMind = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

export const loadMind = (): SavedMind | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const mind = JSON.parse(raw) as SavedMind;
    if (!Array.isArray(mind.nodes) || mind.nodes.length === 0) return null;
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

export const hasSavedMind = () => loadMind() !== null;
