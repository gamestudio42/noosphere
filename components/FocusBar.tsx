import React from 'react';
import { FOCUS } from '../constants';
import { useI18n } from '../i18n';

interface FocusBarProps {
  focus: number;
  deniedAt: number; // changes on every denied action, replaying the shake
}

export const FocusBar: React.FC<FocusBarProps> = ({ focus, deniedAt }) => {
  const { t } = useI18n();
  const pct = Math.max(0, Math.min(1, focus / FOCUS.MAX)) * 100;
  const low = focus < FOCUS.STIMULATE;
  return (
    <div
      key={deniedAt}
      className={`fixed bottom-[8.5rem] left-1/2 -translate-x-1/2 z-50 w-64 pointer-events-none ${deniedAt ? 'animate-[shake_0.35s_ease-in-out]' : ''}`}
      role="meter"
      aria-label={t.focus}
      aria-valuemin={0}
      aria-valuemax={FOCUS.MAX}
      aria-valuenow={Math.round(focus)}
    >
      <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] mb-1">
        <span className={low ? 'text-rose-300' : 'text-stone-400'}>{t.focus}</span>
        <span className="tabular-nums text-stone-500">{Math.floor(focus)}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-linear ${low ? 'bg-rose-400' : 'bg-gradient-to-r from-cyan-300 to-white'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
