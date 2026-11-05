import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export interface Toast {
  key: number;
  kind: 'insight' | 'objective';
  title: string;
  description: string;
}

interface InsightToastsProps {
  toasts: Toast[];
}

export const InsightToasts: React.FC<InsightToastsProps> = ({ toasts }) => {
  return (
    <div
      className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(({ key, kind, title, description }) => (
        <div
          key={key}
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-2xl animate-[fadeIn_0.4s_ease-out]"
        >
          {kind === 'insight' ? (
            <Sparkles size={16} className="text-amber-200 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-cyan-200 shrink-0" />
          )}
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white">{title}</p>
            <p className="text-[11px] text-stone-400">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
