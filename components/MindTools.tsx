import React from 'react';
import { Camera, Home, Pause, Volume2, VolumeX } from 'lucide-react';

interface MindToolsProps {
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onHome: () => void;
  onExport: () => void;
}

const buttonClass =
  'w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-stone-300 hover:text-white hover:border-white/40 transition-colors';

export const MindTools: React.FC<MindToolsProps> = ({
  muted,
  onToggleMute,
  onPause,
  onHome,
  onExport,
}) => {
  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col gap-2">
      <button
        className={buttonClass}
        onClick={onPause}
        title="Pause, settings and keyboard shortcuts (Esc)"
        aria-label="Pause"
      >
        <Pause size={18} />
      </button>
      <button
        className={buttonClass}
        onClick={onHome}
        title="Back to menu (your mind is saved)"
        aria-label="Back to menu"
      >
        <Home size={18} />
      </button>
      <button
        className={buttonClass}
        onClick={onToggleMute}
        title={muted ? 'Unmute (M)' : 'Mute (M)'}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <button
        className={buttonClass}
        onClick={onExport}
        title="Save a portrait of this mind"
        aria-label="Save image"
      >
        <Camera size={18} />
      </button>
    </div>
  );
};
