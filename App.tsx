
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
import { exportCanvas } from './utils/renderer';
import { hasSavedMind, loadCampaign, saveCampaign } from './utils/persistence';
import { playCue } from './utils/audio';
import { Archetype, Insight, SessionStats } from './types';
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
import { BrainCircuit } from 'lucide-react';

const TOAST_MS = 4500;

const App: React.FC = () => {
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('RATIONAL');
  const [started, setStarted] = useState(false);
  const [resumable] = useState(hasSavedMind);
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

  const rules = rulesFor(campaign);
  const available = unlockedArchetypes(campaign);
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

  const restart = () => {
      setExtinct(null);
      setStats(null);
      setUnlocked([]);
      setToasts([]);
      updateCampaign(restartChapter(campaignRef.current));
      setSessionKey(k => k + 1);
  };

  const start = () => {
      setStarted(true);
      // Fresh campaigns and returning players both get the current chapter's card
      showCard(currentChapter(campaignRef.current));
  };

  if (!started) {
      return (
          <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
             {/* Intro Animation Background */}
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full blur-[100px] animate-pulse"></div>
                 <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full blur-[80px] animate-bounce duration-[5s]"></div>
             </div>

             <div className="relative z-10 max-w-xl">
                 <div className="mx-auto w-16 h-16 mb-6 text-cyan-400">
                    <BrainCircuit size={64} strokeWidth={1} />
                 </div>
                 <h1 className="text-6xl font-light mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-purple-200">
                    NOOSPHERE
                 </h1>
                 <p className="text-xl text-stone-400 font-light mb-12 tracking-wide">
                    An ecosystem of living ideas. <br/>
                    Plant. Observe. Connect.
                 </p>

                 <button
                    onClick={start}
                    className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-white/20 hover:border-white/60 transition-colors"
                 >
                     <div className="absolute inset-0 w-full h-full bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                     <span className="relative text-sm font-bold uppercase tracking-[0.3em]">{resumable ? 'Return To The Mind' : 'Enter The Mind'}</span>
                 </button>
             </div>
          </div>
      );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden">

      {/* UI Overlay */}
      <Hud stats={stats} unlockedCount={unlocked.length} objectives={<Objectives campaign={campaign} stats={stats} />} />
      <InsightToasts toasts={toasts} />

      {/* Main Simulation */}
      <Board
        key={sessionKey}
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

      {/* Controls */}
      {card && <ChapterCard key={card.key} chapter={card.chapter} onDone={() => setCard(undefined)} />}

      <Controls
        selectedArchetype={archetype}
        available={available}
        onSelect={setSelectedArchetype}
      />

      <MindTools onExport={() => canvasRef.current && exportCanvas(canvasRef.current)} />

      {extinct && (
        <ExtinctionScreen stats={extinct} insights={unlocked} onRestart={restart} restartLabel="Retry this chapter" />
      )}

    </div>
  );
};

export default App;
