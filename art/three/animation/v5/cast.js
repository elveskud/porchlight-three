// v5 cast: wraps v4 (same characters, same rig) and adds
//  - rest foot positions, so feet can stay planted at fixed spots while the pelvis moves (weight shift)
//  - an engine-owned reset of head and spine scale (seek-safe without the look module)
//  - validateTimeline(): fails loudly at load instead of producing a silent bad frame
import * as THREE from 'three';
import {makeActor as makeV4, applyActor as applyV4, CAST, EXTRA_CAST, neutral, reach} from '../v4/cast.js';
import {profiles} from '../v4/performance.js';
export {CAST, EXTRA_CAST, neutral, reach};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// New characters are added here, not in the finished v4 module. See docs/cards/add-a-character.md.
const custom = {};
/**
 * Register a new character built from an existing rig.
 * @param id       new actor id (also the speaker name in scripts)
 * @param base     an existing actor id to copy the rig from ('bash', 'riot', 'preston' ...)
 * @param extend   function(rig) that recolours the rig and adds meshes (outfit, ears, beak ...); may be omitted
 * @param profile  performance profile {amp, delay, tilt, tempo, breath}; amp = how big the gestures are (0.3 quiet .. 1.1 big)
 * @param size     optional [x, y, z] scale multiplied onto the rig
 */
export function registerCharacter(id, {base, extend = () => {}, profile, size = null}) {
  if (custom[id] || profiles[id]) throw new Error(`character "${id}" already exists`);
  if (!base || !profile) throw new Error('registerCharacter needs base and profile');
  custom[id] = {base, extend, size};
  profiles[id] = profile;
}

/**
 * Recolour a rig without touching the shared materials: every material whose colour is a key of `map` is cloned and recoloured.
 * Example: retint(rig, {0x8a5a36: 0xb87539}). Colours are sRGB hex.
 */
export function retint(r, map) {
  r.root.traverse((o) => {
    if (!o.isMesh) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    list.forEach((m, i) => {
      const hex = m.color ? m.color.getHex() : undefined;
      if (hex === undefined || map[hex] === undefined) return;
      const c = m.clone(); c.color.setHex(map[hex]);
      if (Array.isArray(o.material)) o.material[i] = c; else o.material = c;
    });
  });
}

const toon = (c) => new THREE.MeshToonMaterial({color: c});
const sphereGeo = new THREE.SphereGeometry(1, 20, 14);
function blob(parent, name, color, pos, scale) { const o = new THREE.Mesh(sphereGeo, toon(color)); o.name = name; o.position.set(...pos); o.scale.set(...scale); parent.add(o); return o; }

/**
 * Bash's mom, rebuilt from Bash's full bear (round ears, tan muzzle, nose, wide smile) in her own colours, with the floral apron over a red dress
 * and a hair bun (art/gemini/characters/12_bashs_mom.jpg). v4 built her from a head with the ears and muzzle hidden, which looked wrong.
 */
function makeMom() {
  const r = makeV4('bash');
  retint(r, {0x8a5a36: 0xb87539, 0xcfa070: 0xe3bb80, 0xe51b2d: 0xb84f42, 0xb30f1e: 0x873c36});
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), toon(0xb84f42)); skirt.name = 'red dress skirt'; skirt.position.set(0, 0.12, 0.01); skirt.scale.set(1.30, 0.52, 0.62); r.spine.add(skirt);
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#e9dfa9'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { const x = (i * 73) % 256, y = (i * 97) % 256; g.fillStyle = ['#bd605b', '#76944d', '#d39f56', '#758f9e'][i % 4]; for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(x + 8 * Math.cos(j * 1.256), y + 8 * Math.sin(j * 1.256), 5, 0, 7); g.fill(); } g.fillStyle = '#d7b46b'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshToonMaterial({color: 0xffffff, map: tex})); apron.name = 'floral apron'; apron.position.set(0, 0.62, 0.34); apron.scale.set(0.95, 1.12, 0.045); r.spine.add(apron);
  blob(r.head, 'hair bun', 0x6e4423, [0, 1.24, -0.10], [0.30, 0.28, 0.28]); blob(r.head, 'hair fringe', 0x6e4423, [0, 1.06, 0.20], [0.46, 0.13, 0.20]);
  r.root.scale.multiply(new THREE.Vector3(1.12, 1.08, 1)); r.root.userData.castId = 'bashmom';
  return r;
}

export function makeActor(id) {
  const c = custom[id];
  let r;
  if (id === 'bashmom') r = makeMom();
  else {
    r = makeV4(c ? c.base : id);
    if (c) { c.extend(r); if (c.size) r.root.scale.multiply(new THREE.Vector3(...c.size)); r.root.userData.castId = id; }
  }
  r.motion.spineBase = r.spine.scale.clone();
  // Measure where the feet stand in the neutral pose, in the actor's own (root-local) space.
  applyV4(r, neutral(), 0, 0);
  r.root.updateMatrixWorld(true);
  const local = (leg) => r.root.worldToLocal(leg.foot.getWorldPosition(V()));
  r.motion.restFeet = {L: local(r.legL), R: local(r.legR)};
  r.motion.restPelvisY = r.pelvis.position.y;
  return r;
}

export function applyActor(r, pose, t, blink) {
  // v4 does not reset these; the look module used to. Doing it here makes posing a pure function of the pose.
  r.head.scale.copy(r.motion.headBase);
  r.spine.scale.copy(r.motion.spineBase);
  applyV4(r, pose, t, blink);
}

/** World leg length (hip to ankle) of an actor, used to judge walk vs run. */
export function legLength(r) { return 0.97 * r.root.getWorldScale(V()).y; }

/**
 * Check the timeline before drawing. Throws for things that would otherwise give a silent wrong frame.
 * `known` = ids of actors that exist in the episode.
 */
export function validateTimeline(timeline, known) {
  const problems = [];
  for (const e of timeline.events) {
    const who = e.who;
    if (!known.includes(who) && !who.startsWith('family')) problems.push(`event ${e.id}: unknown actor "${who}"`);
    if (!(e.end > e.start)) problems.push(`event ${e.id}: end is not after start`);
    if (!e.silent && !(e.mouthCues && e.mouthCues.length)) problems.push(`event ${e.id}: spoken line has no mouth cues`);
  }
  for (const p of timeline.paths) {
    if (!(p.end > p.start)) problems.push(`path ${p.id}: zero or negative duration`);
    if (!p.points || p.points.length < 2) problems.push(`path ${p.id}: needs two points`);
    if (!p.plan) problems.push(`path ${p.id}: no gait plan (run prepare.py)`);
    else if (!p.plan.steps || !p.plan.steps.length) problems.push(`path ${p.id}: gait plan has no steps`);
  }
  const ids = new Set();
  for (const b of timeline.beats) { if (ids.has(b.id)) problems.push(`duplicate beat ${b.id}`); ids.add(b.id); }
  if (problems.length) throw new Error('Timeline problems:\n - ' + problems.join('\n - '));
}
