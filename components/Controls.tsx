import React from 'react';
import { Archetype } from '../types';
import { ARCHETYPES } from '../constants';
import { ArchetypeGlyph } from './ArchetypeGlyph';

interface ControlsProps {
  selectedArchetype: Archetype;
  available: Archetype[];
  onSelect: (type: Archetype) => void;
}

export const Controls: React.FC<ControlsProps> = ({ selectedArchetype, available, onSelect }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-black/40 backdrop-blur-md p-4 rounded-full border border-white/10 shadow-2xl">
      {available.map((type) => {
        const info = ARCHETYPES[type];
        const isSelected = selectedArchetype === type;

        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`
                    relative group flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300
                    ${isSelected ? 'bg-white/10 scale-110 ring-1 ring-white/50' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}
                `}
          >
            {/* The same silhouette ideas of this archetype have on the canvas */}
            <ArchetypeGlyph type={type} size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{info.label}</span>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-4 px-3 py-1 bg-black text-white text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20">
              {info.description}
            </div>
          </button>
        );
      })}
    </div>
  );
};
