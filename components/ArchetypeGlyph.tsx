import React from 'react';
import { Archetype } from '../types';
import { ARCHETYPES } from '../constants';
import { svgPoints } from '../utils/shapes';

interface ArchetypeGlyphProps {
  type: Archetype;
  size?: number;
  className?: string;
}

// The archetype's silhouette as drawn on the canvas, in its colour
export const ArchetypeGlyph: React.FC<ArchetypeGlyphProps> = ({ type, size = 16, className }) => {
  const color = `hsl(${ARCHETYPES[type].hue}, 80%, 60%)`;
  const points = svgPoints(type);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ color, filter: `drop-shadow(0 0 4px ${color})` }}
    >
      {points ? (
        <polygon points={points} fill="currentColor" />
      ) : (
        <circle cx="12" cy="12" r="7" fill="currentColor" />
      )}
    </svg>
  );
};
