import React, { useEffect, useRef, useState } from 'react';
import { Archetype } from '../types';
import { archetypeHue } from '../utils/palette';
import { useI18n } from '../i18n';
import { useTouchInput } from './useTouchInput';

interface ControlsProps {
  selectedArchetype: Archetype;
  available: Archetype[];
  onSelect: (type: Archetype) => void;
}

// Long enough to mean "inspect", short enough to show before the finger lifts.
const INSPECT_HOLD_MS = 450;
const INSPECT_VISIBLE_MS = 3200;

export const Controls: React.FC<ControlsProps> = ({ selectedArchetype, available, onSelect }) => {
  const { t } = useI18n();
  const touch = useTouchInput();
  const [inspected, setInspected] = useState<Archetype | null>(null);
  const holdTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const clearHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  // Hover reveals this on a mouse. A tap or a long-press reveals it on touch.
  const showDescription = (type: Archetype) => {
    setInspected(type);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setInspected(null), INSPECT_VISIBLE_MS);
  };

  return (
    <div className="fixed bottom-8 left-[calc((100%-4.25rem)/2)] z-50 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-md min-[481px]:left-1/2 min-[481px]:gap-4 min-[481px]:p-4">
      {touch && inspected && (
        <p
          role="status"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 w-[min(18rem,calc(100vw-5.5rem))] -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-1 text-center text-xs text-white"
        >
          {t.archetypes[inspected].description}
        </p>
      )}
      {available.map((type) => {
        const isSelected = selectedArchetype === type;

        return (
          <button
            key={type}
            onClick={() => {
              onSelect(type);
              if (touch) showDescription(type);
            }}
            onPointerDown={(event) => {
              if (event.pointerType !== 'touch') return;
              clearHold();
              holdTimer.current = window.setTimeout(() => showDescription(type), INSPECT_HOLD_MS);
            }}
            onPointerUp={clearHold}
            onPointerCancel={clearHold}
            onPointerLeave={clearHold}
            onContextMenu={(event) => {
              if (touch) event.preventDefault();
            }}
            className={`relative flex w-12 h-12 min-[481px]:w-16 min-[481px]:h-16 touch-manipulation flex-col items-center justify-center rounded-full transition-all duration-300 group ${
              isSelected
                ? 'scale-110 bg-white/10 ring-1 ring-white/50'
                : 'opacity-60 hover:bg-white/5 hover:opacity-100'
            }`}
          >
            {/* Glowing Indicator */}
            <div
              className="mb-1 h-4 w-4 rounded-full shadow-[0_0_10px_currentColor] transition-all"
              style={{
                backgroundColor: `hsl(${archetypeHue(type)}, 80%, 60%)`,
                color: `hsl(${archetypeHue(type)}, 80%, 60%)`,
              }}
            />
            <span className="text-[9px] font-bold uppercase leading-none tracking-wide min-[481px]:text-[10px] min-[481px]:tracking-widest">
              {t.archetypes[type].label}
            </span>

            {/* Mouse hover only. Touch uses the status line above the bar. */}
            {!touch && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full mb-4 rounded border border-white/20 bg-black px-3 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                {t.archetypes[type].description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
