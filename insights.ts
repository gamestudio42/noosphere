
import { Insight } from './types';

export const INSIGHTS: Insight[] = [
  {
    id: 'first-bond',
    title: 'First Bond',
    description: 'Two ideas found each other.',
    test: s => s.bonds >= 1,
  },
  {
    id: 'hybrid',
    title: 'Hybrid Thought',
    description: 'Different ways of thinking merged into something new.',
    test: s => s.hybridsBorn >= 1,
  },
  {
    id: 'lineage',
    title: 'Lineage',
    description: 'An idea reached its fifth generation.',
    test: s => s.maxGeneration >= 5,
  },
  {
    id: 'trinity',
    title: 'Trinity',
    description: 'One idea carries three archetypes.',
    test: s => s.maxBlend >= 3,
  },
  {
    id: 'web',
    title: 'Web of Thought',
    description: 'Twenty ideas joined in a single network.',
    test: s => s.largestNetwork >= 20,
  },
  {
    id: 'crowd',
    title: 'Crowded Mind',
    description: 'Sixty ideas alive at once.',
    test: s => s.peakAlive >= 60,
  },
  {
    id: 'whole-mind',
    title: 'Whole Mind',
    description: 'Logic, feeling, chaos and instinct in a single idea.',
    test: s => s.maxBlend >= 4,
  },
  {
    id: 'long-memory',
    title: 'Long Memory',
    description: 'The mind stayed alive for five minutes.',
    test: s => s.duration >= 5 * 60 * 1000,
  },
];
