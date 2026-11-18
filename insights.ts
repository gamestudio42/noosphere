import { Insight } from './types';

// Titles and descriptions live in i18n/, keyed by id
export const INSIGHTS: Insight[] = [
  {
    id: 'first-bond',
    test: (s) => s.bonds >= 1,
  },
  {
    id: 'hybrid',
    test: (s) => s.hybridsBorn >= 1,
  },
  {
    id: 'lineage',
    test: (s) => s.maxGeneration >= 5,
  },
  {
    id: 'trinity',
    test: (s) => s.maxBlend >= 3,
  },
  {
    id: 'web',
    test: (s) => s.largestNetwork >= 20,
  },
  {
    id: 'crowd',
    test: (s) => s.peakAlive >= 60,
  },
  {
    id: 'whole-mind',
    test: (s) => s.maxBlend >= 4,
  },
  {
    id: 'clarity',
    test: (s) => s.doubtsBanished + s.doubtsDissolved >= 10,
  },
  {
    id: 'long-memory',
    test: (s) => s.duration >= 5 * 60 * 1000,
  },
];
