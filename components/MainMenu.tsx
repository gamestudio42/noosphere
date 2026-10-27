
import React, { useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { CHAPTERS, CampaignState, currentChapter } from '../campaign';
import { GameMode } from '../types';
import { hasSavedMind } from '../utils/persistence';

interface MainMenuProps {
  campaign: CampaignState;
  onPlay: (mode: GameMode) => void;
  onResetCampaign: () => void;
}

const buttonClass = 'group relative w-72 px-8 py-4 bg-transparent overflow-hidden rounded-full border transition-colors';

const MenuButton: React.FC<{ onClick: () => void; primary?: boolean; label: string; detail: string }> = ({ onClick, primary, label, detail }) => (
  <button
    onClick={onClick}
    className={`${buttonClass} ${primary ? 'border-white/30 hover:border-white/70' : 'border-white/10 hover:border-white/40'}`}
  >
    <div className="absolute inset-0 w-full h-full bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
    <span className="relative block text-sm font-bold uppercase tracking-[0.3em]">{label}</span>
    <span className="relative block mt-1 text-[11px] text-stone-500 tracking-wide">{detail}</span>
  </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({ campaign, onPlay, onResetCampaign }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const chapter = currentChapter(campaign);
  const started = campaign.chapter > 0 || campaign.done.length > 0 || hasSavedMind('campaign');

  const campaignDetail = !chapter
    ? 'Complete. Return to the whole mind.'
    : started
      ? `Chapter ${campaign.chapter + 1}/${CHAPTERS.length}: ${chapter.title}`
      : 'Learn the mind, chapter by chapter.';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
       {/* Intro Animation Background */}
       <div className="absolute inset-0 opacity-20 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full blur-[80px] animate-bounce duration-[5s]"></div>
       </div>

       <div className="relative z-10 max-w-xl flex flex-col items-center">
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

           <div className="flex flex-col gap-3">
             <MenuButton primary onClick={() => onPlay('campaign')} label={started ? 'Continue' : 'Begin'} detail={campaignDetail} />
             <MenuButton
               onClick={() => onPlay('free')}
               label="Free Mind"
               detail={hasSavedMind('free') ? 'Return to your sandbox.' : 'No focus, no doubts. Just play.'}
             />
           </div>

           {started && (
             <button
               onClick={() => {
                 if (!confirmReset) return setConfirmReset(true);
                 setConfirmReset(false);
                 onResetCampaign();
               }}
               onBlur={() => setConfirmReset(false)}
               className={`mt-8 text-[11px] uppercase tracking-widest transition-colors ${confirmReset ? 'text-rose-300' : 'text-stone-600 hover:text-stone-400'}`}
             >
               {confirmReset ? 'Click again to erase campaign progress' : 'Restart campaign'}
             </button>
           )}
       </div>
    </div>
  );
};
