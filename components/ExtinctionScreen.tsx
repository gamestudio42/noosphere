
import React from 'react';
import { Insight, SessionStats } from '../types';
import { INSIGHTS } from '../insights';
import { formatDuration } from '../utils/stats';

interface ExtinctionScreenProps {
  stats: SessionStats;
  insights: Insight[];
  onRestart: () => void;
  restartLabel?: string;
}

export const ExtinctionScreen: React.FC<ExtinctionScreenProps> = ({ stats, insights, onRestart, restartLabel = 'Plant a new mind' }) => {
  const rows: [string, React.ReactNode][] = [
    ['Mind age', formatDuration(stats.duration)],
    ['Most ideas at once', stats.peakAlive],
    ['Deepest generation', stats.maxGeneration],
    ['Largest web', stats.largestNetwork],
    ['Bonds formed', stats.bonds],
    ['Hybrids born', stats.hybridsBorn],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.8s_ease-out]">
      <div className="w-full max-w-md text-center">
        <h2 className="text-4xl font-light tracking-tighter mb-2">The mind forgot.</h2>
        <p className="text-stone-400 mb-8">Every idea faded. This is what it became:</p>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-8 text-left">
          {rows.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className="text-stone-500">{label}</dt>
              <dd className="text-right tabular-nums">{value}</dd>
            </React.Fragment>
          ))}
        </dl>

        <p className="text-[11px] uppercase tracking-widest text-stone-500 mb-2">
          Insights {insights.length}/{INSIGHTS.length}
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {INSIGHTS.map(insight => {
            const got = insights.some(i => i.id === insight.id);
            return (
              <span
                key={insight.id}
                title={insight.description}
                className={`px-3 py-1 rounded-full text-[11px] border ${got ? 'border-amber-200/60 text-amber-100' : 'border-white/10 text-stone-600'}`}
              >
                {got ? insight.title : '???'}
              </span>
            );
          })}
        </div>

        <button
          onClick={onRestart}
          autoFocus
          className="px-8 py-3 rounded-full border border-white/30 hover:border-white/70 hover:bg-white/5 transition-colors text-sm font-bold uppercase tracking-[0.3em]"
        >
          {restartLabel}
        </button>
      </div>
    </div>
  );
};
