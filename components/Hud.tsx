import React from 'react';
import { SessionStats } from '../types';
import { INSIGHTS } from '../insights';
import { formatDuration } from '../utils/stats';
import { useI18n } from '../i18n';
import { useTouchInput } from './useTouchInput';

interface HudProps {
  stats: SessionStats | null;
  unlockedCount: number;
  objectives?: React.ReactNode; // replaces the how-to hints in the campaign
}

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-6">
    <span className="text-stone-500">{label}</span>
    <span className="tabular-nums text-stone-300">{value}</span>
  </div>
);

export const Hud: React.FC<HudProps> = ({ stats, unlockedCount, objectives }) => {
  const { t } = useI18n();
  const touch = useTouchInput();
  const h = t.hud;
  const howTo = touch ? h.howToTouch : h.howTo;
  return (
    <>
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight opacity-50">NOOSPHERE</h1>
        {stats && (
          <div className="mt-3 w-44 space-y-0.5 text-[11px] tracking-wider uppercase">
            <Stat label={h.ideas} value={stats.alive} />
            <Stat label={h.hybrids} value={stats.hybridsAlive} />
            <Stat label={h.generation} value={stats.maxGeneration} />
            <Stat label={h.largestWeb} value={stats.network} />
            {stats.doubtsAlive > 0 && (
              <Stat
                label={h.doubts}
                value={<span className="text-violet-300">{stats.doubtsAlive}</span>}
              />
            )}
            <Stat label={h.mindAge} value={formatDuration(stats.duration)} />
          </div>
        )}
      </div>

      <div className="absolute top-6 right-6 z-40 pointer-events-none text-right">
        {objectives ?? (
          <p className="text-xs text-stone-500 max-w-[200px] ml-auto">
            {howTo.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        )}
        <p className="mt-3 text-[11px] uppercase tracking-widest text-stone-400">
          {h.insights} {unlockedCount}/{INSIGHTS.length}
        </p>
      </div>
    </>
  );
};
