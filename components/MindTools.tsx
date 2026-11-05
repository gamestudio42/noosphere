import React, { useEffect, useState } from 'react';
import { Camera, Home, Volume2, VolumeX } from 'lucide-react';
import { isMuted, setMuted } from '../utils/audio';

const MUTE_KEY = 'noosphere:muted';

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
};

interface MindToolsProps {
  onHome: () => void;
  onExport: () => void;
}

const buttonClass =
  'w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-stone-300 hover:text-white hover:border-white/40 transition-colors';

export const MindTools: React.FC<MindToolsProps> = ({ onHome, onExport }) => {
  const [muted, setMutedState] = useState(() => readMuted() || isMuted());

  useEffect(() => {
    setMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Storage unavailable (private mode); the preference just won't persist
    }
  }, [muted]);

  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col gap-2">
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
        onClick={() => setMutedState((m) => !m)}
        title={muted ? 'Unmute' : 'Mute'}
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
