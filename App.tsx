import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Hud } from './components/Hud';
import { InsightToasts, Toast } from './components/InsightToasts';
import { Objectives } from './components/Objectives';
import { ChapterCard } from './components/ChapterCard';
import { ExtinctionScreen } from './components/ExtinctionScreen';
import { MindTools } from './components/MindTools';
import { FocusBar } from './components/FocusBar';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { Settings, loadSettings, saveSettings } from './utils/settings';
import { exportCanvas } from './utils/renderer';
import { clearCampaign, clearMind, loadCampaign, saveCampaign } from './utils/persistence';
import { playCue, setMuted, setVolume } from './utils/audio';
import { ARCHETYPE_ORDER } from './constants';
import { Archetype, GameMode, GameRules, Insight, SessionStats } from './types';
import {
  CampaignState,
  Chapter,
  advanceCampaign,
  currentChapter,
  newCampaign,
  restartChapter,
  rulesFor,
  unlockedArchetypes,
} from './campaign';

const TOAST_MS = 4500;
// The sandbox: everything unlocked, nothing costs anything
const FREE_RULES: GameRules = { focus: false, doubts: false };

const App: React.FC = () => {
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('RATIONAL');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [unlocked, setUnlocked] = useState<Insight[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [extinct, setExtinct] = useState<SessionStats | null>(null);
  const [deniedAt, setDeniedAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [fullscreen, setFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [campaign, setCampaign] = useState<CampaignState>(() => loadCampaign() ?? newCampaign());
  // Stats arrive from the loop; the ref lets the handler see the latest campaign
  const campaignRef = useRef(campaign);
  // Title card for the chapter that just began; undefined hides it, null ends the campaign
  const [card, setCard] = useState<{ key: number; chapter: Chapter | null } | undefined>(undefined);

  // Settings take effect at once and are remembered
  useEffect(() => {
    setMuted(settings.muted);
    setVolume(settings.volume);
    saveSettings(settings);
  }, [settings]);

  const canFullscreen =
    typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const inCampaign = mode === 'campaign';
  const rules = inCampaign ? rulesFor(campaign) : FREE_RULES;
  const available = inCampaign ? unlockedArchetypes(campaign) : ARCHETYPE_ORDER;
  const archetype = available.includes(selectedArchetype) ? selectedArchetype : available[0];

  const updateCampaign = (next: CampaignState) => {
    campaignRef.current = next;
    setCampaign(next);
    saveCampaign(next);
  };

  const pushToast = useCallback((toast: Omit<Toast, 'key'>) => {
    const key = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, key }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.key !== key)), TOAST_MS);
  }, []);

  const showCard = (chapter: Chapter | null) => setCard({ key: Date.now(), chapter });

  const handleStats = (next: SessionStats) => {
    setStats(next);
    if (!inCampaign) return;
    const update = advanceCampaign(campaignRef.current, next);
    if (update.state === campaignRef.current) return;
    updateCampaign(update.state);
    for (const objective of update.completed) {
      pushToast({ kind: 'objective', title: 'Objective complete', description: objective.label });
    }
    if (update.chapterCompleted) {
      playCue('chapter');
      const upcoming = currentChapter(update.state);
      showCard(upcoming);
      // Hand the player whatever the new chapter just unlocked
      if (upcoming?.unlocks.length) setSelectedArchetype(upcoming.unlocks[0]);
    }
  };

  const handleInsight = useCallback(
    (insight: Insight) => {
      setUnlocked((prev) => [...prev, insight]);
      pushToast({ kind: 'insight', title: insight.title, description: insight.description });
    },
    [pushToast],
  );

  const resetSession = () => {
    setPaused(false);
    setExtinct(null);
    setStats(null);
    setUnlocked([]);
    setToasts([]);
    setCard(undefined);
    setSessionKey((k) => k + 1);
  };

  const restart = () => {
    if (inCampaign) updateCampaign(restartChapter(campaignRef.current));
    resetSession();
  };

  const play = (next: GameMode) => {
    resetSession();
    setMode(next);
    // Fresh campaigns and returning players both get the current chapter's card
    if (next === 'campaign') showCard(currentChapter(campaignRef.current));
  };

  const goHome = () => {
    resetSession();
    setMode(null);
  };

  const resetCampaign = () => {
    clearMind('campaign');
    clearCampaign();
    updateCampaign(newCampaign());
  };

  // Keyboard play
  const playing = mode !== null && !extinct;
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const key = e.key.toLowerCase();
      // Esc always works, even with a menu control focused; other keys stay
      // out of the way of text fields and sliders
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'TEXTAREA' ||
        (target instanceof HTMLInputElement && target.type !== 'checkbox');
      if (typing && key !== 'escape') return;
      if (key === 'escape' || key === 'p') {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (key === 'm') {
        setSettings((s) => ({ ...s, muted: !s.muted }));
      } else if (key === 'f' && canFullscreen) {
        toggleFullscreen();
      } else if (!paused && /^[1-4]$/.test(key)) {
        const type = available[Number(key) - 1];
        if (type) setSelectedArchetype(type);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, paused, available, canFullscreen, toggleFullscreen]);

  // Leaving the tab pauses the mind, so it isn't lost while nobody watches
  useEffect(() => {
    if (!playing) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') setPaused(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [playing]);

  if (!mode) {
    return <MainMenu campaign={campaign} onPlay={play} onResetCampaign={resetCampaign} />;
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* UI Overlay */}
      <Hud
        stats={stats}
        unlockedCount={unlocked.length}
        objectives={inCampaign ? <Objectives campaign={campaign} stats={stats} /> : undefined}
      />
      <InsightToasts toasts={toasts} />

      {/* Main Simulation */}
      <Board
        key={`${mode}-${sessionKey}`}
        mode={mode}
        selectedArchetype={archetype}
        rules={rules}
        onStats={handleStats}
        onInsight={handleInsight}
        onExtinct={setExtinct}
        onRestore={setUnlocked}
        onDenied={() => setDeniedAt(Date.now())}
        paused={paused}
        shake={settings.shake}
        reducedEffects={settings.effects === 'reduced'}
        canvasRef={canvasRef}
      />

      {rules.focus && stats && <FocusBar focus={stats.focus} deniedAt={deniedAt} />}

      {card && (
        <ChapterCard key={card.key} chapter={card.chapter} onDone={() => setCard(undefined)} />
      )}

      {/* Controls */}
      <Controls
        selectedArchetype={archetype}
        available={available}
        onSelect={setSelectedArchetype}
      />

      <MindTools
        muted={settings.muted}
        onToggleMute={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
        onPause={() => setPaused(true)}
        onHome={goHome}
        onExport={() => canvasRef.current && exportCanvas(canvasRef.current)}
      />

      {paused && !extinct && (
        <PauseMenu
          settings={settings}
          onChange={setSettings}
          onResume={() => setPaused(false)}
          onHome={goHome}
          onFullscreen={toggleFullscreen}
          fullscreen={fullscreen}
          canFullscreen={canFullscreen}
        />
      )}

      {extinct && (
        <ExtinctionScreen
          stats={extinct}
          insights={unlocked}
          onRestart={restart}
          restartLabel={inCampaign ? 'Retry this chapter' : 'Plant a new mind'}
        />
      )}
    </div>
  );
};

export default App;
