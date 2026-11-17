import { Archetype, IdeaNode } from '../types';
import { ARCHETYPES } from '../constants';

// Archetype colours on screen. The simulation keeps each idea's hue in the
// default palette (it is saved with the mind); drawing maps it to the chosen
// one, so switching palettes recolours a running mind at once.

export type PaletteName = 'default' | 'colourblind';

export const PALETTES: Record<PaletteName, Record<Archetype, number>> = {
  default: {
    RATIONAL: ARCHETYPES.RATIONAL.hue,
    EMOTIONAL: ARCHETYPES.EMOTIONAL.hue,
    CREATIVE: ARCHETYPES.CREATIVE.hue,
    PRIMAL: ARCHETYPES.PRIMAL.hue,
  },
  // The four hues that stay furthest apart under protanopia, deuteranopia and
  // tritanopia when drawn as hsl(h, 100%, 60%): worst-case ΔE about 54 against
  // about 21 for the default palette (Machado 2009 simulation, CIELAB ΔE76).
  // Each archetype keeps the nearest of the four to its usual colour.
  colourblind: {
    RATIONAL: 180, // cyan
    EMOTIONAL: 350, // rose
    CREATIVE: 60, // yellow
    PRIMAL: 235, // blue
  },
};

let current: PaletteName = 'default';

export const setPalette = (name: PaletteName) => {
  current = name;
};

export const archetypeHue = (type: Archetype) => PALETTES[current][type];

// Circular mean, so e.g. 350 and 10 blend to 0, not 180
export const blendHueIn = (blend: Archetype[], hues: Record<Archetype, number>) => {
  let x = 0;
  let y = 0;
  for (const t of blend) {
    const rad = (hues[t] * Math.PI) / 180;
    x += Math.cos(rad);
    y += Math.sin(rad);
  }
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

// Per blend: how far the chosen palette moves its hue from the default one
const shifts = new Map<string, number>();

export const displayHue = (node: IdeaNode) => {
  if (current === 'default') return node.hue;
  const key = `${current}:${node.blend.join('+')}`;
  let shift = shifts.get(key);
  if (shift === undefined) {
    shift = blendHueIn(node.blend, PALETTES[current]) - blendHueIn(node.blend, PALETTES.default);
    shifts.set(key, shift);
  }
  // Keeps each idea's small random variation around its blend's colour
  return (((node.hue + shift) % 360) + 360) % 360;
};
