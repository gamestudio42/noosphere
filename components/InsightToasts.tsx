
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Insight } from '../types';

interface InsightToastsProps {
  toasts: { key: number; insight: Insight }[];
}

export const InsightToasts: React.FC<InsightToastsProps> = ({ toasts }) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
      {toasts.map(({ key, insight }) => (
        <div
          key={key}
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-2xl animate-[fadeIn_0.4s_ease-out]"
        >
          <Sparkles size={16} className="text-amber-200 shrink-0" />
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white">{insight.title}</p>
            <p className="text-[11px] text-stone-400">{insight.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
