// rng.js — a small seeded random number generator.
// The same seed always gives the same activity, which is what lets
// tools/validate.mjs test thousands of variations and lets "Shuffle" be undone.

export function makeRng(seed) {
  let a = seed >>> 0 || 1;
  const float = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(float() * (hi - lo + 1)); // inclusive
  const pick = (arr) => arr[Math.floor(float() * arr.length)];
  const bool = (p = 0.5) => float() < p;
  const shuffle = (arr) => {
    const a2 = [...arr];
    for (let i = a2.length - 1; i > 0; i--) {
      const j = Math.floor(float() * (i + 1));
      [a2[i], a2[j]] = [a2[j], a2[i]];
    }
    return a2;
  };
  const sample = (arr, k) => shuffle(arr).slice(0, k);
  return { float, int, pick, bool, shuffle, sample };
}

export const newSeed = () => (Math.random() * 0xffffffff) >>> 0;
