
// Swappable random source so the simulation can be made deterministic in tests
let source: () => number = Math.random;

export const random = () => source();

export const setRandom = (fn: () => number) => {
  source = fn;
};

// Small seeded PRNG (mulberry32)
export const seededRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
