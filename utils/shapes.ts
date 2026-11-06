import { Archetype } from '../types';

// Every archetype has a silhouette as well as a colour, so ideas stay
// readable without colour vision: Logic is a square, Feeling a circle,
// Chaos a four-point star and Instinct a triangle.

type Point = readonly [number, number];

const polygon = (sides: number, rotation: number, scale: number): Point[] =>
  Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i / sides) * Math.PI * 2;
    return [Math.cos(a) * scale, Math.sin(a) * scale] as const;
  });

const star = (points: number, inner: number, scale: number): Point[] =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    const r = (i % 2 === 0 ? 1 : inner) * scale;
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  });

// Unit outlines (radius 1 means "as big as the idea's circle"). Scales keep
// the area of each silhouette close to the circle's, so no archetype looks
// bigger than another. null draws a circle.
export const SHAPES: Record<Archetype, readonly Point[] | null> = {
  RATIONAL: polygon(4, Math.PI / 4, 1.25),
  EMOTIONAL: null,
  CREATIVE: star(4, 0.45, 1.55),
  PRIMAL: polygon(3, -Math.PI / 2, 1.5),
};

// Adds the archetype's outline to the current path
export const traceShape = (
  ctx: CanvasRenderingContext2D,
  type: Archetype,
  x: number,
  y: number,
  r: number,
) => {
  const outline = SHAPES[type];
  if (!outline) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
    return;
  }
  ctx.moveTo(x + outline[0][0] * r, y + outline[0][1] * r);
  for (let i = 1; i < outline.length; i++) ctx.lineTo(x + outline[i][0] * r, y + outline[i][1] * r);
  ctx.closePath();
};

// SVG points for the same outline, centred in a 24x24 box
export const svgPoints = (type: Archetype, r = 7) =>
  SHAPES[type]?.map(([x, y]) => `${(12 + x * r).toFixed(2)},${(12 + y * r).toFixed(2)}`).join(' ');
