
import React, { useCallback, useState } from 'react';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Hud } from './components/Hud';
import { InsightToasts } from './components/InsightToasts';
import { ExtinctionScreen } from './components/ExtinctionScreen';
import { Archetype, Insight, SessionStats } from './types';
import { BrainCircuit } from 'lucide-react';

const TOAST_MS = 4500;

const App: React.FC = () => {
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('RATIONAL');
  const [started, setStarted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [unlocked, setUnlocked] = useState<Insight[]>([]);
  const [toasts, setToasts] = useState<{ key: number; insight: Insight }[]>([]);
  const [extinct, setExtinct] = useState<SessionStats | null>(null);

  const handleInsight = useCallback((insight: Insight) => {
      setUnlocked(prev => [...prev, insight]);
      const key = Date.now() + Math.random();
      setToasts(prev => [...prev, { key, insight }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.key !== key)), TOAST_MS);
  }, []);

  const restart = () => {
      setExtinct(null);
      setStats(null);
      setUnlocked([]);
      setToasts([]);
      setSessionKey(k => k + 1);
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
                    onClick={() => setStarted(true)}
                    className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-white/20 hover:border-white/60 transition-colors"
                 >
                     <div className="absolute inset-0 w-full h-full bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                     <span className="relative text-sm font-bold uppercase tracking-[0.3em]">Enter The Mind</span>
                 </button>
             </div>
          </div>
      );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden">

      {/* UI Overlay */}
      <Hud stats={stats} unlockedCount={unlocked.length} />
      <InsightToasts toasts={toasts} />

      {/* Main Simulation */}
      <Board
        key={sessionKey}
        selectedArchetype={selectedArchetype}
        onStats={setStats}
        onInsight={handleInsight}
        onExtinct={setExtinct}
      />

      {/* Controls */}
      <Controls
        selectedArchetype={selectedArchetype}
        onSelect={setSelectedArchetype}
      />

      {extinct && (
        <ExtinctionScreen stats={extinct} insights={unlocked} onRestart={restart} />
      )}

    </div>
  );
};

export default App;
