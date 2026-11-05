import { Archetype, GameRules, SessionStats } from './types';
import { ARCHETYPE_ORDER } from './constants';

export interface Objective {
  id: string;
  label: string;
  hint: string; // shown while this is the next objective
  stat: keyof SessionStats;
  target: number;
  cumulative?: boolean; // counts only what happened during this chapter
  holdSeconds?: number; // the stat must stay at target this long
}

export interface Chapter {
  id: string;
  title: string;
  intro: string;
  unlocks: Archetype[];
  doubts?: boolean; // doubts arrive from this chapter on
  objectives: Objective[];
}

// Each chapter introduces one idea and only asks for what it just taught
export const CHAPTERS: Chapter[] = [
  {
    id: 'awakening',
    title: 'Awakening',
    intro: 'A single thought flickers in the dark. Tend it.',
    unlocks: ['RATIONAL'],
    objectives: [
      {
        id: 'plant',
        label: 'Plant 3 ideas',
        hint: 'Click empty space to plant an idea. Planting spends focus.',
        stat: 'planted',
        target: 3,
        cumulative: true,
      },
      {
        id: 'split',
        label: 'Help an idea divide',
        hint: 'Hover over an idea to feed it with attention until it splits.',
        stat: 'splits',
        target: 1,
        cumulative: true,
      },
      {
        id: 'bond',
        label: 'Let two ideas bond',
        hint: 'Ideas that drift close together bond on their own.',
        stat: 'bonds',
        target: 1,
        cumulative: true,
      },
    ],
  },
  {
    id: 'chaos',
    title: 'Chaos',
    intro: 'Something restless stirs.',
    unlocks: ['CREATIVE'],
    objectives: [
      {
        id: 'hybrid',
        label: 'Birth a hybrid',
        hint: 'Plant Chaos beside Logic. When different ideas bond, something new is born.',
        stat: 'hybridsBorn',
        target: 1,
        cumulative: true,
      },
      {
        id: 'grow',
        label: 'Keep 15 ideas alive',
        hint: 'Chaos multiplies fast and burns out fast. Logic endures.',
        stat: 'alive',
        target: 15,
      },
    ],
  },
  {
    id: 'doubt',
    title: 'Doubt',
    intro: 'Not every thought is welcome.',
    unlocks: [],
    doubts: true,
    objectives: [
      {
        id: 'banish',
        label: 'Banish 3 doubts',
        hint: 'Click a doubt to banish it. Logic ideas slowly see through them.',
        stat: 'doubtsBanished',
        target: 3,
        cumulative: true,
      },
      {
        id: 'hold',
        label: 'Keep 20 ideas alive for 60s',
        hint: 'Well connected ideas resist doubt. Living hybrids restore focus.',
        stat: 'alive',
        target: 20,
        holdSeconds: 60,
      },
    ],
  },
  {
    id: 'feeling',
    title: 'Feeling',
    intro: 'Warmth floods the mind.',
    unlocks: ['EMOTIONAL'],
    objectives: [
      {
        id: 'trinity',
        label: 'Carry 3 archetypes in one idea',
        hint: 'Hybrids bond too. Feeling bonds with almost anything, but clashes with Logic.',
        stat: 'maxBlend',
        target: 3,
      },
      {
        id: 'web',
        label: 'Join 20 ideas in one web',
        hint: 'Feeling reaches far. Keep a single network growing.',
        stat: 'network',
        target: 20,
      },
    ],
  },
  {
    id: 'instinct',
    title: 'Instinct',
    intro: 'Something ancient wakes beneath it all.',
    unlocks: ['PRIMAL'],
    objectives: [
      {
        id: 'whole',
        label: 'Unite all 4 archetypes in one idea',
        hint: 'Instinct pulls ideas together and loves Feeling.',
        stat: 'maxBlend',
        target: 4,
      },
      {
        id: 'endure',
        label: 'Keep 40 ideas alive for 90s',
        hint: 'The whole mind, defended. This is the last trial.',
        stat: 'alive',
        target: 40,
        holdSeconds: 90,
      },
    ],
  },
];

export interface CampaignState {
  chapter: number; // CHAPTERS.length once the campaign is complete
  baseline: Partial<Record<keyof SessionStats, number>>; // stats when the chapter began
  done: string[]; // objective ids completed in this chapter
  holdSince: Record<string, number>; // mind age (ms) when a hold objective was first met
}

export const newCampaign = (): CampaignState => ({
  chapter: 0,
  baseline: {},
  done: [],
  holdSince: {},
});

export const isComplete = (state: CampaignState) => state.chapter >= CHAPTERS.length;

export const currentChapter = (state: CampaignState): Chapter | null =>
  CHAPTERS[state.chapter] ?? null;

// Everything taught so far stays in play
const reached = (state: CampaignState) => CHAPTERS.slice(0, state.chapter + 1);

export const rulesFor = (state: CampaignState): GameRules => ({
  focus: true,
  doubts: reached(state).some((c) => c.doubts),
});

export const unlockedArchetypes = (state: CampaignState): Archetype[] => {
  const unlocked = new Set(reached(state).flatMap((c) => c.unlocks));
  return ARCHETYPE_ORDER.filter((t) => unlocked.has(t));
};

export const objectiveProgress = (
  objective: Objective,
  state: CampaignState,
  stats: SessionStats,
) => {
  const base = objective.cumulative ? (state.baseline[objective.stat] ?? 0) : 0;
  const value = Math.max(0, stats[objective.stat] - base);
  const since = state.holdSince[objective.id];
  const held = since === undefined ? 0 : (stats.duration - since) / 1000;
  return { value, held };
};

// After an extinction the chapter is retried: finished objectives stay
// finished, but counters restart with the new mind
export const restartChapter = (state: CampaignState): CampaignState => ({
  ...state,
  baseline: {},
  holdSince: {},
});

export interface CampaignUpdate {
  state: CampaignState;
  completed: Objective[];
  chapterCompleted: Chapter | null;
}

// Pure: checks objectives against fresh stats and moves the campaign on
export const advanceCampaign = (state: CampaignState, stats: SessionStats): CampaignUpdate => {
  const chapter = currentChapter(state);
  if (!chapter) return { state, completed: [], chapterCompleted: null };

  const done = [...state.done];
  const holdSince = { ...state.holdSince };
  const completed: Objective[] = [];
  let changed = false;

  for (const objective of chapter.objectives) {
    if (done.includes(objective.id)) continue;
    const { value } = objectiveProgress(objective, state, stats);
    const met = value >= objective.target;

    if (objective.holdSeconds) {
      if (!met) {
        if (objective.id in holdSince) {
          delete holdSince[objective.id];
          changed = true;
        }
        continue;
      }
      if (!(objective.id in holdSince)) {
        holdSince[objective.id] = stats.duration;
        changed = true;
      }
      if (stats.duration - holdSince[objective.id] < objective.holdSeconds * 1000) continue;
    } else if (!met) {
      continue;
    }

    done.push(objective.id);
    completed.push(objective);
    changed = true;
  }

  if (!changed) return { state, completed, chapterCompleted: null };

  if (done.length === chapter.objectives.length) {
    // Snapshot every stat so the next chapter's counters start from zero
    const baseline = Object.fromEntries(Object.entries(stats)) as CampaignState['baseline'];
    return {
      state: { chapter: state.chapter + 1, baseline, done: [], holdSince: {} },
      completed,
      chapterCompleted: chapter,
    };
  }

  return { state: { ...state, done, holdSince }, completed, chapterCompleted: null };
};
