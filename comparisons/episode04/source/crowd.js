// Bash's six relatives for Episode 4 v5. 17 Nov review: "the extras need a better look, and the ones in the back don't move much".
// v4 used six scaled clones of Bash in a pile behind the picnic table, standing still. Now each relative has their own hoodie colour,
// size and accessory, they stand in a loose group beside the tables (not inside them), face the speaker, and keep doing things:
// waving, cheering with a hop, laughing, whispering to a neighbour, pointing. All of it is a pure function of time (seek-safe).
import {makeActor, retint} from '../../../art/three/animation/v5/cast.js';
import {box, ball, line} from './props.js';
import * as THREE from 'three';
import {ease, mix, hash01, PI} from '../../../art/three/animation/v5/math.js';

const cap = (r, c, back = false) => { ball(r.head, 'cap', c, [0, 1.13, -0.03], [0.72, 0.42, 0.54]); box(r.head, 'cap brim', c, [0, 1.0, back ? -0.40 : 0.40], [0.8, 0.07, 0.45]); };
const bow = (r, c) => { for (const s of [-1, 1]) ball(r.head, 'hair bow', c, [s * 0.2, 1.26, 0.05], [0.2, 0.14, 0.08]); ball(r.head, 'hair bow knot', c, [0, 1.26, 0.07], [0.07, 0.07, 0.07]); };
const pigtails = (r, c) => { for (const s of [-1, 1]) { ball(r.head, 'pigtail', c, [s * 0.80, 0.80, -0.06], [0.2, 0.24, 0.2]); ball(r.head, 'pigtail tie', 0xe0533d, [s * 0.70, 0.93, -0.04], [0.07, 0.05, 0.07]); } };
const glasses = (r, c) => { for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.018, 7, 40), new THREE.MeshToonMaterial({color: c})); m.name = 'round glasses'; m.position.set(s * 0.31, 0.72, 0.43); r.head.add(m); } line(r.head, 'glasses bridge', c, [[-0.1, 0.74, 0.44], [0, 0.77, 0.46], [0.1, 0.74, 0.44]], 0.012); };
const bun = (r, c) => { ball(r.head, 'hair bun', c, [0, 1.25, -0.12], [0.3, 0.28, 0.28]); ball(r.head, 'hair fringe', c, [0, 1.06, 0.2], [0.46, 0.12, 0.2]); };
const tuft = (r, c) => { ball(r.head, 'hair tuft', c, [0.05, 1.22, 0.05], [0.14, 0.18, 0.1]); };
const beard = (r, c) => { ball(r.head, 'moustache', c, [0, 0.36, 0.42], [0.30, 0.07, 0.07]); };

/** id, size, hoodie [main, dark], accessory, home position [x,y,z]. Home positions frame the main group: three at the left edge and three at the right, a little nearer the camera than the line (so they show and add depth). */
export const KIN = [
  {id: 'family0', size: 1.10, hoodie: [0x4f7a62, 0x3b5d4a], extra: (r) => { cap(r, 0x3f4a63); beard(r, 0x4a2f1a); }, home: [-9.6, 0, 2.2]},        // dad
  {id: 'family1', size: 0.92, hoodie: [0x8b6fb0, 0x6c548f], extra: (r) => { bow(r, 0xf08aa8); }, home: [8.8, 0, 5.0]},                          // big sister
  {id: 'family2', size: 0.98, hoodie: [0x7c8890, 0x5e6a72], extra: (r) => { cap(r, 0x3d6aa8, true); }, home: [-10.4, 0, 4.4]},                  // teen brother
  {id: 'family3', size: 0.66, hoodie: [0xe0b43a, 0xb8902a], extra: (r) => { pigtails(r, 0x5a3a20); }, home: [7.5, 0, 5.8]},                    // little sister
  {id: 'family4', size: 0.62, hoodie: [0x4a8bd6, 0x376bab], extra: (r) => { tuft(r, 0x5a3a20); }, home: [-8.3, 0, 3.4]},                         // little brother
  {id: 'family5', size: 0.95, hoodie: [0xb58aa5, 0x8c6680], extra: (r) => { bun(r, 0xd9d6d0); glasses(r, 0x6b5a4a); }, home: [10.4, 0, 4.6]},    // grandma
];

export function buildFamily(scene, actors) {
  for (const k of KIN) {
    const r = makeActor('bash');
    retint(r, {0xe51b2d: k.hoodie[0], 0xb30f1e: k.hoodie[1]});
    r.root.scale.multiplyScalar(k.size); k.extra(r);
    actors[k.id] = r; scene.add(r.root); r.root.visible = false;
  }
}

const smooth = (u) => (u <= 0 || u >= 1) ? 0 : Math.pow(Math.sin(PI * u), 0.6);

/**
 * What relative number `i` is doing at time t. Edits the pose `p` in place and returns {hop, yawBias}.
 * Each relative runs a 5-6 second cycle with a different gesture each time round, offset from the others so they are never in step.
 */
export function crowdActs(p, i, t, kid = false) {
  const L = 5.0 + i * 0.55, shifted = t + i * 2.3, ph = shifted % L, cycle = Math.floor(shifted / L), kind = (cycle + i) % 5;
  const env = smooth((ph - 0.9) / 2.0);
  p.torsoZ += 0.03 * Math.sin(t * 0.9 + i * 1.7); p.headZ += 0.04 * Math.sin(t * 0.7 + i); p.torsoX += 0.015 * Math.sin(t * 1.6 + i * 0.6);   // always a little alive
  let hop = 0;
  if (kind === 0) { p.aRo = mix(p.aRo, 1.5, env); p.aRb = mix(p.aRb, 0.45, env); p.aRw = 0.32 * Math.sin(ph * 9) * env; p.handR = 'open'; }                            // wave
  if (kind === 1) { for (const s of ['L', 'R']) { p['a' + s + 'o'] = mix(p['a' + s + 'o'], 1.3, env); p['a' + s + 'b'] = mix(p['a' + s + 'b'], 0.3, env); } p.handL = p.handR = 'open'; hop = (kid ? 0.14 : 0.09) * Math.abs(Math.sin(ph * 7)) * env; p.laugh = 0.7 * env; }   // cheer + hop
  if (kind === 2) { p.laugh = env; p.squint = Math.max(p.squint || 0, 0.3 * env); p.torsoX += 0.04 * Math.sin(ph * 11) * env; p.headX -= 0.07 * env; }                  // laugh
  if (kind === 3) { p.torsoZ += 0.12 * env; p.headZ += 0.15 * env; p.headY = 0.2 * env; }                                                                          // lean in and whisper
  if (kind === 4) { p.aRf = mix(p.aRf, 0.8, env); p.aRb = mix(p.aRb, 0.2, env); p.handR = 'point'; p.headX -= 0.04 * env; }                                         // point at the action
  if (kid && kind !== 1) hop = 0.05 * Math.abs(Math.sin(t * 3.1 + i)) * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 2));                                                     // kids fidget on the spot
  return {hop, kind, env};
}
