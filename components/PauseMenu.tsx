import React, { useEffect, useRef } from 'react';
import { Settings } from '../utils/settings';

interface PauseMenuProps {
  settings: Settings;
  onChange: (next: Settings) => void;
  onResume: () => void;
  onHome: () => void;
  onFullscreen: () => void;
  fullscreen: boolean;
  canFullscreen: boolean;
}

export const SHORTCUTS: [string, string][] = [
  ['Esc / P', 'Pause and resume'],
  ['1 – 4', 'Choose an archetype'],
  ['M', 'Mute or unmute'],
  ['F', 'Fullscreen'],
];

const Toggle: React.FC<{
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
    <span>
      <span className="block text-sm text-stone-200">{label}</span>
      <span className="block text-[11px] text-stone-500">{hint}</span>
    </span>
    <input
      type="checkbox"
      className="h-4 w-4 accent-cyan-300"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

export const PauseMenu: React.FC<PauseMenuProps> = ({
  settings,
  onChange,
  onResume,
  onHome,
  onFullscreen,
  fullscreen,
  canFullscreen,
}) => {
  const resumeRef = useRef<HTMLButtonElement>(null);
  // Keyboard players land on Resume
  useEffect(() => resumeRef.current?.focus(), []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl">
        <h2 id="pause-title" className="text-3xl font-light tracking-tighter mb-1">
          Paused
        </h2>
        <p className="text-xs text-stone-500 mb-5">The mind waits. No time passes.</p>

        <div className="flex flex-col gap-2 mb-6">
          <button
            ref={resumeRef}
            onClick={onResume}
            className="w-full rounded-full border border-cyan-300/50 bg-cyan-300/10 py-2 text-sm uppercase tracking-widest text-cyan-100 hover:bg-cyan-300/20"
          >
            Resume
          </button>
          <button
            onClick={onHome}
            className="w-full rounded-full border border-white/15 py-2 text-sm uppercase tracking-widest text-stone-300 hover:border-white/40"
          >
            Back to menu
          </button>
        </div>

        <h3 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-1">Settings</h3>
        <div className="divide-y divide-white/5 mb-5">
          <label className="block py-2">
            <span className="flex justify-between text-sm text-stone-200">
              Volume
              <span className="tabular-nums text-stone-500">
                {Math.round(settings.volume * 100)}%
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => set('volume', Number(e.target.value))}
              className="w-full accent-cyan-300"
              aria-label="Volume"
            />
          </label>
          <Toggle
            label="Sound"
            hint="Notes, cues and the score"
            checked={!settings.muted}
            onChange={(on) => set('muted', !on)}
          />
          <Toggle
            label="Screen shake"
            hint="On hits, births and denied actions"
            checked={settings.shake}
            onChange={(on) => set('shake', on)}
          />
          <Toggle
            label="Full effects"
            hint="Off: no trails, particles, ripples or slow motion"
            checked={settings.effects === 'full'}
            onChange={(on) => set('effects', on ? 'full' : 'reduced')}
          />
          {canFullscreen && (
            <Toggle
              label="Fullscreen"
              hint="Fill the whole screen"
              checked={fullscreen}
              onChange={onFullscreen}
            />
          )}
        </div>

        <h3 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Keyboard</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {SHORTCUTS.map(([keys, action]) => (
            <React.Fragment key={keys}>
              <dt className="font-mono text-stone-300">{keys}</dt>
              <dd className="text-stone-500">{action}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
};
