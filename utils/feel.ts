// Game feel: click ripples, screen shake and the slow-motion beat when a new
// kind of hybrid is born. Pure state and maths; the board applies it.

export interface Ripple {
  x: number;
  y: number;
  born: number; // ms, same clock as requestAnimationFrame
  duration: number;
  from: number; // radius at birth
  to: number; // radius at the end
  hue: number;
  width: number;
}

export interface Feel {
  trauma: number; // 0..1, shake strength is its square
  heroAt: number | null; // when the last hero moment began
  heroPos: { x: number; y: number } | null;
  ripples: Ripple[];
}

export const FEEL = {
  MAX_SHAKE_PX: 9,
  TRAUMA_DECAY_PER_S: 1.6,
  HERO_MS: 900, // slow motion and zoom ease back over this long
  HERO_SLOWEST: 0.25, // time scale at the start of a hero moment
  HERO_ZOOM: 0.035, // extra scale at its peak
  MAX_RIPPLES: 24,
};

export const newFeel = (): Feel => ({ trauma: 0, heroAt: null, heroPos: null, ripples: [] });

export const addTrauma = (feel: Feel, amount: number) => {
  feel.trauma = Math.min(1, feel.trauma + amount);
};

export const addRipple = (feel: Feel, ripple: Ripple) => {
  feel.ripples.push(ripple);
  if (feel.ripples.length > FEEL.MAX_RIPPLES) feel.ripples.shift();
};

export const startHero = (feel: Feel, x: number, y: number, now: number) => {
  feel.heroAt = now;
  feel.heroPos = { x, y };
};

// Progress of the hero moment, 0 at its start, 1 once it is over
const heroProgress = (feel: Feel, now: number) =>
  feel.heroAt === null ? 1 : Math.min(1, Math.max(0, (now - feel.heroAt) / FEEL.HERO_MS));

// Simulation speed: drops on a hero moment, then eases back to full speed
export const timeScale = (feel: Feel, now: number) => {
  const k = heroProgress(feel, now);
  return FEEL.HERO_SLOWEST + (1 - FEEL.HERO_SLOWEST) * k * k;
};

// Extra zoom toward the hero, fading out as time catches up
export const zoom = (feel: Feel, now: number) => {
  const k = heroProgress(feel, now);
  return FEEL.HERO_ZOOM * (1 - k) * (1 - k);
};

// Smooth pseudo-random shake: three detuned sines per axis
export const shakeOffset = (feel: Feel, now: number) => {
  const amount = FEEL.MAX_SHAKE_PX * feel.trauma * feel.trauma;
  if (amount < 0.05) return { x: 0, y: 0 };
  const t = now / 1000;
  return {
    x: amount * (Math.sin(t * 47) * 0.5 + Math.sin(t * 71 + 1.3) * 0.3 + Math.sin(t * 113) * 0.2),
    y:
      amount *
      (Math.sin(t * 53 + 2.1) * 0.5 + Math.sin(t * 89) * 0.3 + Math.sin(t * 127 + 0.7) * 0.2),
  };
};

// Ages the feel by real (not slowed) time
export const decayFeel = (feel: Feel, now: number, elapsedMs: number) => {
  feel.trauma = Math.max(0, feel.trauma - (FEEL.TRAUMA_DECAY_PER_S * elapsedMs) / 1000);
  if (feel.ripples.length > 0) {
    feel.ripples = feel.ripples.filter((r) => now - r.born < r.duration);
  }
  if (feel.heroAt !== null && heroProgress(feel, now) >= 1) {
    feel.heroAt = null;
    feel.heroPos = null;
  }
};
