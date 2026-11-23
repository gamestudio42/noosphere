import React from 'react';
import { Camera, Home, Pause, Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';

interface MindToolsProps {
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onHome: () => void;
  onExport: () => void;
}

const buttonClass =
  'flex h-11 w-11 min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-black/40 text-stone-300 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white';

export const MindTools: React.FC<MindToolsProps> = ({
  muted,
  onToggleMute,
  onPause,
  onHome,
  onExport,
}) => {
  const { t } = useI18n();
  const k = t.tools;
  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col gap-2 max-[480px]:right-3">
      <button className={buttonClass} onClick={onPause} title={k.pauseHint} aria-label={k.pause}>
        <Pause size={18} />
      </button>
      <button className={buttonClass} onClick={onHome} title={k.homeHint} aria-label={k.home}>
        <Home size={18} />
      </button>
      <button
        className={buttonClass}
        onClick={onToggleMute}
        title={`${muted ? k.unmute : k.mute} (M)`}
        aria-label={muted ? k.unmute : k.mute}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <button
        className={buttonClass}
        onClick={onExport}
        title={k.saveImageHint}
        aria-label={k.saveImage}
      >
        <Camera size={18} />
      </button>
    </div>
  );
};
