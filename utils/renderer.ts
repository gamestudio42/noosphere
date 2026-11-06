import { Doubt, IdeaNode, Particle, Vector2 } from '../types';
import { ATTENTION_RADIUS } from './gameLogic';
import { doubtRadius } from './doubts';
import { Ripple } from './feel';

export const BACKGROUND = '#050505';

const SWEEP_MS = 250;
let lastSweep = 0;

interface FrameOptions {
  width: number;
  height: number;
  time: number; // ms, drives the synapse undulation
  attention: Vector2 | null;
  reducedMotion: boolean;
  ripples?: Ripple[];
}

// Stable per-idea phase so synapses undulate instead of flickering
const phases = new Map<string, number>();
const phaseFor = (id: string) => {
  let phase = phases.get(id);
  if (phase === undefined) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    phase = (((h >>> 0) % 1000) / 1000) * Math.PI * 2;
    // Ids are never reused; forget the dead now and then
    if (phases.size > 4000) phases.clear();
    phases.set(id, phase);
  }
  return phase;
};

// Synapses whose ends look alike are drawn in one path per colour; only
// those joining clearly different ends pay for their own gradient.
const HUE_STEP = 6;
const ALPHA_STEPS = 12;
const GRADIENT_HUE = 18;
const GRADIENT_ALPHA = 0.2;

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D,
  nodes: IdeaNode[],
  particles: Particle[],
  doubts: Doubt[],
  { width, height, time, attention, reducedMotion, ripples = [] }: FrameOptions,
) => {
  // The canvas is transparent over a CSS background. Fading alpha with
  // destination-out leaves trails that fully vanish, unlike painting a
  // translucent dark rect, which rounds to permanent grey smears.
  if (reducedMotion) {
    ctx.clearRect(0, 0, width, height);
  } else {
    // 8-bit alpha still gets stuck at 1-2 with a 0.2 fade, so a few times a
    // second a stronger sweep zeroes that residue. Trails are nearly gone by
    // then, so the sweep isn't visible.
    const sweep = time - lastSweep > SWEEP_MS;
    if (sweep) lastSweep = time;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = sweep ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalCompositeOperation = 'lighter';

  // Synapses look their ends up by id
  const nodeMap = new Map<string, IdeaNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  // Draw Connections (Synapses)
  ctx.lineWidth = 1;
  // Flat curve coordinates (x0, y0, cx, cy, x1, y1) per colour
  const batches = new Map<string, number[]>();

  for (const node of nodes) {
    for (const targetId of node.connections) {
      const target = nodeMap.get(targetId);
      if (!target) continue;
      // Each bond is listed by both ends: draw it once, from the smaller id
      if (node.id > target.id && target.connections.includes(node.id)) continue;

      const energyA = Math.max(0, Math.min(1, node.energy / 100));
      const energyB = Math.max(0, Math.min(1, target.energy / 100));

      // Gentle curve that sways perpendicular to the synapse
      const dx = target.pos.x - node.pos.x;
      const dy = target.pos.y - node.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const sway = reducedMotion
        ? 0
        : Math.min(8, len * 0.08) *
          Math.sin(time * 0.0015 + phaseFor(node.id) + phaseFor(target.id));
      const midX = (node.pos.x + target.pos.x) / 2 - (dy / len) * sway;
      const midY = (node.pos.y + target.pos.y) / 2 + (dx / len) * sway;

      if (
        hueGap(node.hue, target.hue) > GRADIENT_HUE ||
        Math.abs(energyA - energyB) > GRADIENT_ALPHA
      ) {
        const grad = ctx.createLinearGradient(node.pos.x, node.pos.y, target.pos.x, target.pos.y);
        grad.addColorStop(0, `hsla(${node.hue}, 80%, 50%, ${energyA})`);
        grad.addColorStop(1, `hsla(${target.hue}, 80%, 50%, ${energyB})`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(node.pos.x, node.pos.y);
        ctx.quadraticCurveTo(midX, midY, target.pos.x, target.pos.y);
        ctx.stroke();
        continue;
      }

      // Midway round the colour wheel (signed, so 350 and 10 meet at 0)
      const turn = ((((target.hue - node.hue) % 360) + 540) % 360) - 180;
      const hue = Math.round((node.hue + turn / 2) / HUE_STEP) * HUE_STEP;
      const alpha = Math.round(((energyA + energyB) / 2) * ALPHA_STEPS) / ALPHA_STEPS;
      if (alpha === 0) continue;
      const key = `hsla(${hue}, 80%, 50%, ${alpha})`;
      let batch = batches.get(key);
      if (!batch) batches.set(key, (batch = []));
      batch.push(node.pos.x, node.pos.y, midX, midY, target.pos.x, target.pos.y);
    }
  }

  for (const [color, curves] of batches) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < curves.length; i += 6) {
      ctx.moveTo(curves[i], curves[i + 1]);
      ctx.quadraticCurveTo(curves[i + 2], curves[i + 3], curves[i + 4], curves[i + 5]);
    }
    ctx.stroke();
  }

  // Draw Nodes
  nodes.forEach((node) => {
    const glow = Math.max(0, Math.min(1, node.energy / 100));
    const color = `hsla(${node.hue}, 100%, 60%, ${glow})`;

    ctx.beginPath();
    ctx.arc(node.pos.x, node.pos.y, node.radius * (0.8 + glow * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Hybrids get a ring so they read as a different kind of idea
    if (node.blend.length > 1) {
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, node.radius * 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${node.hue}, 100%, 75%, ${0.3 + glow * 0.5})`;
      ctx.stroke();
    }

    // Core
    ctx.beginPath();
    ctx.arc(node.pos.x, node.pos.y, node.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Interaction Highlight (energy feeding happens in updatePhysics)
    if (
      attention &&
      Math.hypot(attention.x - node.pos.x, attention.y - node.pos.y) < ATTENTION_RADIUS
    ) {
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, node.radius * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  });

  // Draw Particles. Batching them by colour measured slower than this: most
  // share one colour already, and the canvas skips redundant state changes.
  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;

  // Ripples: expanding rings from clicks and births, easing out as they fade
  for (const r of ripples) {
    const k = Math.min(1, Math.max(0, (time - r.born) / r.duration));
    const ease = 1 - (1 - k) * (1 - k) * (1 - k);
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.from + (r.to - r.from) * ease, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${r.hue}, 100%, 75%, ${(1 - k) * 0.8})`;
    ctx.lineWidth = r.width * (1 - k * 0.6);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Doubts are drawn normally (not additively) so they darken what they cover
  ctx.globalCompositeOperation = 'source-over';
  doubts.forEach((doubt) => drawDoubt(ctx, doubt, time, reducedMotion));
};

const DOUBT_POINTS = 14;

// A jagged, writhing blot of darkness with a pale rim
const drawDoubt = (
  ctx: CanvasRenderingContext2D,
  doubt: Doubt,
  time: number,
  reducedMotion: boolean,
) => {
  const r = doubtRadius(doubt);
  const t = reducedMotion ? 0 : time * 0.004;
  ctx.beginPath();
  for (let i = 0; i <= DOUBT_POINTS; i++) {
    const a = (i / DOUBT_POINTS) * Math.PI * 2;
    const spike = i % 2 === 0 ? 1.15 : 0.8;
    const wobble = 1 + 0.15 * Math.sin(t + i * 1.7 + doubt.seed);
    const x = doubt.pos.x + Math.cos(a) * r * spike * wobble;
    const y = doubt.pos.y + Math.sin(a) * r * spike * wobble;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(6, 3, 12, 0.88)';
  ctx.fill();
  // Latched doubts flare as they feed
  ctx.strokeStyle = doubt.target ? 'hsla(280, 60%, 70%, 0.8)' : 'hsla(265, 30%, 65%, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(doubt.pos.x, doubt.pos.y, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(275, 50%, 40%, 0.6)';
  ctx.fill();
};

// Save the current canvas as a PNG, composited over the page background
export const exportCanvas = (canvas: HTMLCanvasElement) => {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noosphere-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
};
