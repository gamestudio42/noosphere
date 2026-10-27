
import React, { useCallback, useRef, useState } from 'react';
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
import { exportCanvas } from './utils/renderer';
import { clearCampaign, clearMind, loadCampaign, saveCampaign } from './utils/persistence';
import { playCue } from './utils/audio';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [campaign, setCampaign] = useState<CampaignState>(() => loadCampaign() ?? newCampaign());
  // Stats arrive from the loop; the ref lets the handler see the latest campaign
  const campaignRef = useRef(campaign);
  // Title card for the chapter that just began; undefined hides it, null ends the campaign
  const [card, setCard] = useState<{ key: number; chapter: Chapter | null } | undefined>(undefined);

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
      setToasts(prev => [...prev, { ...toast, key }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.key !== key)), TOAST_MS);
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

  const handleInsight = useCallback((insight: Insight) => {
      setUnlocked(prev => [...prev, insight]);
      pushToast({ kind: 'insight', title: insight.title, description: insight.description });
  }, [pushToast]);

  const resetSession = () => {
      setExtinct(null);
      setStats(null);
      setUnlocked([]);
      setToasts([]);
      setCard(undefined);
      setSessionKey(k => k + 1);
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
        canvasRef={canvasRef}
      />

      {rules.focus && stats && <FocusBar focus={stats.focus} deniedAt={deniedAt} />}

      {card && <ChapterCard key={card.key} chapter={card.chapter} onDone={() => setCard(undefined)} />}

      {/* Controls */}
      <Controls
        selectedArchetype={archetype}
        available={available}
        onSelect={setSelectedArchetype}
      />

      <MindTools onHome={goHome} onExport={() => canvasRef.current && exportCanvas(canvasRef.current)} />

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
