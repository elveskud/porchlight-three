// Small shared helpers for animation v5. Everything here is a pure function of its inputs (seek-safe).
import * as THREE from 'three';
export const clamp = THREE.MathUtils.clamp;
export const mix = THREE.MathUtils.lerp;
export const PI = Math.PI;

/** Smoothstep 0..1 (slow in, slow out). */
export const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
/** Bell curve centred on c with width w. */
export const pulse = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
/** Plain linear 0..1 ramp. */
export const ramp = (x, a, b) => clamp((x - a) / (b - a), 0, 1);

/** Deterministic 0..1 number from a string and an integer. Same inputs always give the same answer. */
export function hash01(text, n = 0) {
  let h = 2166136261 ^ n;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Damped spring step response: goes from 0 to 1, reaches its first peak at `peakTime` seconds,
 * then settles. `damping` is the damping ratio: 1 = no bounce, 0.45 = about 20% overshoot,
 * 0.3 = about 37%. Closed form of age, so it is seek-safe. Returns 0 for age <= 0.
 */
export function overshoot(age, peakTime = 0.2, damping = 0.45) {
  if (age <= 0) return 0;
  const z = clamp(damping, 0.05, 0.999), root = Math.sqrt(1 - z * z);
  const wd = PI / peakTime, wn = wd / root, t = age;
  return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z / root) * Math.sin(wd * t));
}

/** Warn once per message (so a missing move or face does not flood the console). */
const warned = new Set();
export function warnOnce(message) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn('[animation v5] ' + message);
}
export const warnings = () => [...warned];
