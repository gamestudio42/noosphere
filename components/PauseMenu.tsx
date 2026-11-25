import React, { useEffect, useRef } from 'react';
import { Settings } from '../utils/settings';
import { glowEnabled } from '../utils/glow';
import { LOCALES, LOCALE_NAMES, isLocale, useI18n } from '../i18n';

interface PauseMenuProps {
  settings: Settings;
  onChange: (next: Settings) => void;
  onResume: () => void;
  onHome: () => void;
  onFullscreen: () => void;
  fullscreen: boolean;
  canFullscreen: boolean;
}

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
  const { t, locale, setLocale } = useI18n();
  const p = t.pause;
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
          {p.title}
        </h2>
        <p className="text-xs text-stone-500 mb-5">{p.subtitle}</p>

        <div className="flex flex-col gap-2 mb-6">
          <button
            ref={resumeRef}
            onClick={onResume}
            className="w-full rounded-full border border-cyan-300/50 bg-cyan-300/10 py-2 text-sm uppercase tracking-widest text-cyan-100 hover:bg-cyan-300/20"
          >
            {p.resume}
          </button>
          <button
            onClick={onHome}
            className="w-full rounded-full border border-white/15 py-2 text-sm uppercase tracking-widest text-stone-300 hover:border-white/40"
          >
            {p.home}
          </button>
        </div>

        <h3 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-1">{p.settings}</h3>
        <div className="divide-y divide-white/5 mb-5">
          <label className="block py-2">
            <span className="flex justify-between text-sm text-stone-200">
              {p.volume}
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
              aria-label={p.volume}
            />
          </label>
          <Toggle
            label={p.sound}
            hint={p.soundHint}
            checked={!settings.muted}
            onChange={(on) => set('muted', !on)}
          />
          <Toggle
            label={p.shake}
            hint={p.shakeHint}
            checked={settings.shake}
            onChange={(on) => set('shake', on)}
          />
          <Toggle
            label={p.effects}
            hint={p.effectsHint}
            checked={settings.effects === 'full'}
            onChange={(on) => set('effects', on ? 'full' : 'reduced')}
          />
          <Toggle
            label={p.palette}
            hint={p.paletteHint}
            checked={settings.palette === 'colourblind'}
            onChange={(on) => set('palette', on ? 'colourblind' : 'default')}
          />
          <Toggle
            label={p.glow}
            hint={p.glowHint}
            checked={glowEnabled(settings.glow)}
            onChange={(on) => set('glow', on ? 'on' : 'off')}
          />
          {canFullscreen && (
            <Toggle
              label={p.fullscreen}
              hint={p.fullscreenHint}
              checked={fullscreen}
              onChange={onFullscreen}
            />
          )}
          <label className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-stone-200">{p.language}</span>
            <select
              value={locale}
              onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}
              className="bg-transparent border border-white/15 rounded-full px-3 py-1 text-sm text-stone-200"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l} className="bg-black">
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h3 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">{p.keyboard}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {p.shortcuts.map(([keys, action]) => (
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
