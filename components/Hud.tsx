
import React from 'react';
import { SessionStats } from '../types';
import { INSIGHTS } from '../insights';
import { formatDuration } from '../utils/stats';

interface HudProps {
  stats: SessionStats | null;
  unlockedCount: number;
}

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-6">
    <span className="text-stone-500">{label}</span>
    <span className="tabular-nums text-stone-300">{value}</span>
  </div>
);

export const Hud: React.FC<HudProps> = ({ stats, unlockedCount }) => {
  return (
    <>
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
          <h1 className="text-2xl font-bold tracking-tight opacity-50">NOOSPHERE</h1>
          {stats && (
            <div className="mt-3 w-44 space-y-0.5 text-[11px] tracking-wider uppercase">
              <Stat label="Ideas" value={stats.alive} />
              <Stat label="Hybrids" value={stats.hybridsAlive} />
              <Stat label="Generation" value={stats.maxGeneration} />
              <Stat label="Largest web" value={stats.largestNetwork} />
              <Stat label="Mind age" value={formatDuration(stats.duration)} />
            </div>
          )}
      </div>

      <div className="absolute top-6 right-6 z-40 pointer-events-none text-right">
          <p className="text-xs text-stone-500 max-w-[200px]">
              Click to plant an idea.<br/>
              Hover to pay attention.<br/>
              Ideas die when forgotten.
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-stone-400">
              Insights {unlockedCount}/{INSIGHTS.length}
          </p>
      </div>
    </>
  );
};
