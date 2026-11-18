import { Archetype, GameRules, SessionStats } from './types';
import { ARCHETYPE_ORDER } from './constants';

export interface Objective {
  id: string;
  stat: keyof SessionStats;
  target: number;
  cumulative?: boolean; // counts only what happened during this chapter
  holdSeconds?: number; // the stat must stay at target this long
}

export interface Chapter {
  id: string;
  unlocks: Archetype[];
  doubts?: boolean; // doubts arrive from this chapter on
  objectives: Objective[];
}

// Each chapter introduces one idea and only asks for what it just taught.
// Titles, intros, labels and hints live in i18n/, keyed by these ids.
export const CHAPTERS: Chapter[] = [
  {
    id: 'awakening',
    unlocks: ['RATIONAL'],
    objectives: [
      {
        id: 'plant',
        stat: 'planted',
        target: 3,
        cumulative: true,
      },
      {
        id: 'split',
        stat: 'splits',
        target: 1,
        cumulative: true,
      },
      {
        id: 'bond',
        stat: 'bonds',
        target: 1,
        cumulative: true,
      },
    ],
  },
  {
    id: 'chaos',
    unlocks: ['CREATIVE'],
    objectives: [
      {
        id: 'hybrid',
        stat: 'hybridsBorn',
        target: 1,
        cumulative: true,
      },
      {
        id: 'grow',
        stat: 'alive',
        target: 15,
      },
    ],
  },
  {
    id: 'doubt',
    unlocks: [],
    doubts: true,
    objectives: [
      {
        id: 'banish',
        stat: 'doubtsBanished',
        target: 3,
        cumulative: true,
      },
      {
        id: 'hold',
        stat: 'alive',
        target: 20,
        holdSeconds: 60,
      },
    ],
  },
  {
    id: 'feeling',
    unlocks: ['EMOTIONAL'],
    objectives: [
      {
        id: 'trinity',
        stat: 'maxBlend',
        target: 3,
      },
      {
        id: 'web',
        stat: 'network',
        target: 20,
      },
    ],
  },
  {
    id: 'instinct',
    unlocks: ['PRIMAL'],
    objectives: [
      {
        id: 'whole',
        stat: 'maxBlend',
        target: 4,
      },
      {
        id: 'endure',
        stat: 'alive',
        target: 35,
        holdSeconds: 60,
      },
    ],
  },
];

export interface CampaignState {
  chapter: number; // CHAPTERS.length once the campaign is complete
  baseline: Partial<Record<keyof SessionStats, number>>; // stats when the chapter began
  done: string[]; // objective ids completed in this chapter
  holdSince: Record<string, number>; // mind age (ms) when a hold objective was first met
  holdMissedAt?: Record<string, number>; // mind age (ms) when a running hold first dipped
}

// A hold survives a brief dip below target: an idea dying and its neighbour
// splitting a moment later shouldn't throw away a minute of play
export const HOLD_GRACE_MS = 5000;

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
  holdMissedAt: {},
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
  const holdMissedAt = { ...state.holdMissedAt };
  const completed: Objective[] = [];
  let changed = false;

  for (const objective of chapter.objectives) {
    if (done.includes(objective.id)) continue;
    const { value } = objectiveProgress(objective, state, stats);
    const met = value >= objective.target;

    if (objective.holdSeconds) {
      const running = objective.id in holdSince;
      if (!met) {
        if (!running) continue;
        if (!(objective.id in holdMissedAt)) {
          holdMissedAt[objective.id] = stats.duration;
          changed = true;
        } else if (stats.duration - holdMissedAt[objective.id] > HOLD_GRACE_MS) {
          delete holdSince[objective.id];
          delete holdMissedAt[objective.id];
          changed = true;
        }
        continue;
      }
      if (objective.id in holdMissedAt) {
        delete holdMissedAt[objective.id];
        changed = true;
      }
      if (!running) {
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
      state: { chapter: state.chapter + 1, baseline, done: [], holdSince: {}, holdMissedAt: {} },
      completed,
      chapterCompleted: chapter,
    };
  }

  return {
    state: { ...state, done, holdSince, holdMissedAt },
    completed,
    chapterCompleted: null,
  };
};
