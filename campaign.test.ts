import { describe, expect, it } from 'vitest';
import {
  HOLD_GRACE_MS,
  CHAPTERS,
  advanceCampaign,
  isComplete,
  newCampaign,
  restartChapter,
  rulesFor,
  unlockedArchetypes,
  CampaignState,
} from './campaign';
import { SessionStats } from './types';

const stats = (overrides: Partial<SessionStats> = {}): SessionStats => ({
  startedAt: 0,
  duration: 0,
  alive: 1,
  hybridsAlive: 0,
  peakAlive: 1,
  maxGeneration: 0,
  network: 1,
  largestNetwork: 1,
  maxBlend: 1,
  bonds: 0,
  hybridsBorn: 0,
  planted: 0,
  splits: 0,
  focus: 100,
  doubtsAlive: 0,
  doubtsBanished: 0,
  doubtsDissolved: 0,
  ...overrides,
});

const atChapter = (id: string): CampaignState => ({
  ...newCampaign(),
  chapter: CHAPTERS.findIndex((c) => c.id === id),
});

describe('campaign', () => {
  it('starts with Logic only and no doubts', () => {
    const state = newCampaign();
    expect(unlockedArchetypes(state)).toEqual(['RATIONAL']);
    expect(rulesFor(state)).toEqual({ focus: true, doubts: false });
  });

  it('keeps earlier unlocks and rules in later chapters', () => {
    const state = atChapter('feeling');
    expect(unlockedArchetypes(state)).toEqual(['RATIONAL', 'EMOTIONAL', 'CREATIVE']);
    expect(rulesFor(state).doubts).toBe(true);
  });

  it('completes objectives one by one and then the chapter', () => {
    let update = advanceCampaign(newCampaign(), stats({ planted: 3 }));
    expect(update.completed.map((o) => o.id)).toEqual(['plant']);
    expect(update.chapterCompleted).toBeNull();

    update = advanceCampaign(update.state, stats({ planted: 3, splits: 1, bonds: 2 }));
    expect(update.chapterCompleted?.id).toBe('awakening');
    expect(update.state.chapter).toBe(1);
    expect(update.state.done).toEqual([]);
  });

  it('counts cumulative objectives from the start of the chapter', () => {
    // Hybrids born before the chapter began don't count
    const state = { ...atChapter('chaos'), baseline: { hybridsBorn: 4 } };
    expect(advanceCampaign(state, stats({ hybridsBorn: 4 })).completed).toEqual([]);
    expect(advanceCampaign(state, stats({ hybridsBorn: 5 })).completed.map((o) => o.id)).toEqual([
      'hybrid',
    ]);
  });

  it('requires hold objectives to stay met for their whole duration', () => {
    let state: CampaignState = { ...atChapter('doubt'), done: ['banish'] };
    state = advanceCampaign(state, stats({ alive: 20, duration: 10_000 })).state;
    expect(state.holdSince.hold).toBe(10_000);

    // A brief dip keeps the timer running...
    state = advanceCampaign(state, stats({ alive: 19, duration: 40_000 })).state;
    expect(state.holdSince.hold).toBe(10_000);
    state = advanceCampaign(state, stats({ alive: 20, duration: 44_000 })).state;
    expect(state.holdSince.hold).toBe(10_000);

    // ...but staying below target past the grace period resets it
    state = advanceCampaign(state, stats({ alive: 19, duration: 45_000 })).state;
    state = advanceCampaign(
      state,
      stats({ alive: 19, duration: 45_000 + HOLD_GRACE_MS + 1 }),
    ).state;
    expect(state.holdSince.hold).toBeUndefined();

    state = advanceCampaign(state, stats({ alive: 25, duration: 50_000 })).state;
    expect(
      advanceCampaign(state, stats({ alive: 25, duration: 109_000 })).chapterCompleted,
    ).toBeNull();
    expect(
      advanceCampaign(state, stats({ alive: 25, duration: 110_000 })).chapterCompleted?.id,
    ).toBe('doubt');
  });

  it('keeps finished objectives when a chapter is retried', () => {
    const state: CampaignState = {
      ...atChapter('doubt'),
      baseline: { doubtsBanished: 9 },
      done: ['banish'],
      holdSince: { hold: 5 },
    };
    expect(restartChapter(state)).toEqual({
      ...state,
      baseline: {},
      holdSince: {},
      holdMissedAt: {},
    });
  });

  it('ends after the last chapter', () => {
    let state: CampaignState = {
      ...atChapter('instinct'),
      done: ['whole'],
      holdSince: { endure: 0 },
    };
    state = advanceCampaign(state, stats({ alive: 35, duration: 60_000 })).state;
    expect(isComplete(state)).toBe(true);
    expect(unlockedArchetypes(state)).toHaveLength(4);
    expect(advanceCampaign(state, stats()).state).toBe(state);
  });
});
