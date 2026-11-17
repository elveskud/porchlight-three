// Standalone viewer for the shared modeled cast.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {S,C,clamp,lerp,sat,INK,SPHERE,std,part,grp,ell,caps,makeCharacter as originalCharacter,CAST,ANIMS,neutral,POSE_KEYS,applyPose as originalPose} from './art/three/characters/cast.js';

import {makeCharacter as refinedCharacter,applyPose as refinedPose} from './comparisons/episode01/source/refinements/cast.js';
const refinedViewer=new URLSearchParams(location.search).has('refined');
const makeCharacter=refinedViewer?refinedCharacter:originalCharacter,applyPose=refinedViewer?refinedPose:originalPose;

/* ------------------------------------------------------------------ scene */

const viewerWidth=()=>innerWidth>760&&!new URLSearchParams(location.search).has('scene')?innerWidth-270:innerWidth;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(viewerWidth(),innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.style.cssText = 'margin:0;overflow:hidden;background:#f5f0e8;font-family:system-ui,sans-serif';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f0e8);

const camera = new THREE.PerspectiveCamera(35, viewerWidth() / innerHeight, 0.5, 300);
camera.position.set(0, 3.6, 13.5);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.8, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.52;
controls.minDistance = 4;
controls.maxDistance = 30;
controls.update();

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);
const hemi = new THREE.HemisphereLight(0xfff2e0, 0xb7a58e, 0.8);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 10, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 7, bottom: -5, near: 1, far: 30 });
key.shadow.radius = 5;
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9ec5ff, 1.0);          // cool rim light from behind
rim.position.set(-6, 5, -7);
scene.add(rim);


function nameplate(text, x) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const ctx = cv.getContext('2d');
  ctx.font = '800 110px "Arial Narrow", Impact, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2b2630';
  ctx.fillText(text.toUpperCase(), 256, 84);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, 1.5);
  scene.add(m);
}

const SCENE = new URLSearchParams(location.search).get('scene');   // e.g. ?scene=rematch plays a scripted scene

const chars = CAST.map((spec, i) => {
  const rig = makeCharacter(spec);
  const x = (i - 1.5) * 2.8;
  rig.root.position.x = x;
  scene.add(rig.root);
  if (!SCENE) nameplate(spec.name, x);
  return {
    name: spec.name, rig, spd: spec.spd, hopK: spec.hopK, anim: 'idle', t: i * 1.7, cur: neutral(), blinkPhase: 0, nextBlink: 1 + i * 0.8,
    tRate: 1, path: [], faceEnd: 0, yaw: 0, yawT: 0, lookAt: null, talkUntil: 0, ph: i * 1.3,
  };
});

/* ------------------------------------------------------------------ sets
   A set is { group, env, update(dt, T) }. `env` re-tunes the lights/fog/background.
   Add a new set = write a build function that returns that object and register it in SETS. */

const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const stripeTex = (n) => canvasTex(256, 32, (c, w, h) => {
  for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#d8202a'; c.fillRect(i * w / n, 0, w / n + 1, h); }
});

// flat ground patch from [x, z] points (z is world z)
function blob(pts, y, color, rough = 0.95) {
  const sh = new THREE.Shape();
  pts.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), std(color, rough));
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

function makeStudio() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 72), std(0xece5d6, 0.95));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.RingGeometry(8.7, 9, 72), std(0xd8cfbc, 1));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005;
  g.add(floor, ring);
  return { group: g, env: { bg: 0xf5f0e8, fog: null, key: [0xffffff, 2.2, [5, 10, 8]], hemi: [0xfff2e0, 0xb7a58e, 0.8], rim: .15, amb: .65 }, update() {} };
}

/* ---- lake: the painted lake_day_v2 set, built in 3D ---- */

const PINE_CONE = new THREE.ConeGeometry(1, 1, 8);
const PINE_TRUNK = new THREE.CylinderGeometry(0.12, 0.16, 1, 6);
function pine(h, shade) {
  const g = new THREE.Group();
  const m = std(shade, 0.9);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(PINE_CONE, m);
    const w = 1 - i * 0.24;
    c.scale.set(h * 0.2 * w + 0.3, h * 0.36, h * 0.2 * w + 0.3);
    c.position.y = h * (0.3 + i * 0.22);
    g.add(c);
  }
  const t = new THREE.Mesh(PINE_TRUNK, std(0x5a3b22, 1));
  t.scale.set(1, h * 0.25, 1); t.position.y = h * 0.12;
  g.add(t);
  return g;
}

function house(color, roofColor, s = 1) {
  const g = new THREE.Group();
  const w = 3, h = 2.2, d = 2.6;
  g.add(part(new THREE.BoxGeometry(w, h, d), color, { pos: [0, h / 2, 0], ink: 0.04, rough: 0.8 }));
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 - 0.25, 0); sh.lineTo(w / 2 + 0.25, 0); sh.lineTo(0, 1.3); sh.closePath();
  const roof = new THREE.ExtrudeGeometry(sh, { depth: d + 0.5, bevelEnabled: false }).translate(0, 0, -(d + 0.5) / 2);
  g.add(part(roof, roofColor, { pos: [0, h, 0], ink: 0.04, rough: 0.85 }));
  g.add(part(new THREE.BoxGeometry(0.6, 1.1, 0.06), 0x4a2f1c, { pos: [-0.7, 0.55, d / 2 + 0.01], ink: 0.01 }));
  for (const x of [0.5, 1.1]) g.add(part(new THREE.BoxGeometry(0.4, 0.5, 0.06), 0xfff1b8, { pos: [x, 1.2, d / 2 + 0.01], ink: 0.01, rough: 0.3 }));
  g.add(part(new THREE.BoxGeometry(2.4, 0.12, 0.8), 0x2f6b3a, { pos: [0, 1.5, d / 2 + 0.35], ink: 0.015 }));    // porch roof
  g.scale.setScalar(s);
  return g;
}

function hall() {
  const g = new THREE.Group();
  g.add(part(new THREE.BoxGeometry(5, 3.2, 3.6), 0x7b6a54, { pos: [0, 1.6, 0], ink: 0.05, rough: 1 }));
  const sh = new THREE.Shape();
  sh.moveTo(-2.9, 0); sh.lineTo(2.9, 0); sh.lineTo(0, 1.9); sh.closePath();
  g.add(part(new THREE.ExtrudeGeometry(sh, { depth: 4.1, bevelEnabled: false }).translate(0, 0, -2.05), 0x5d5143, { pos: [0, 3.2, 0], ink: 0.05, rough: 1 }));
  g.add(part(new THREE.BoxGeometry(1.1, 1.6, 1.1), 0x7b6a54, { pos: [0, 5.2, -0.2], ink: 0.04, rough: 1 }));
  g.add(part(new THREE.ConeGeometry(0.85, 0.8, 4).rotateY(Math.PI / 4), 0x5d5143, { pos: [0, 6.4, -0.2], ink: 0.04 }));
  for (const x of [-1.6, -0.55, 0.55, 1.6]) {                     // boarded windows
    g.add(part(new THREE.BoxGeometry(0.7, 1.0, 0.05), 0x3b2f23, { pos: [x, 1.9, 1.82], ink: 0 }));
    for (const r of [0.5, -0.5]) g.add(part(new THREE.BoxGeometry(0.95, 0.12, 0.07), 0x9a8566, { pos: [x, 1.9, 1.86], rot: [0, 0, r], ink: 0 }));
  }
  g.add(part(new THREE.BoxGeometry(1.1, 1.7, 0.06), 0x3b2f23, { pos: [0, 0.85, 1.82], ink: 0 }));
  return g;
}

function church() {
  const g = new THREE.Group();
  g.add(part(new THREE.BoxGeometry(2, 1.8, 2.8), 0xf4f2ee, { pos: [0, 0.9, 0], ink: 0.04, rough: 0.8 }));
  const sh = new THREE.Shape();
  sh.moveTo(-1.15, 0); sh.lineTo(1.15, 0); sh.lineTo(0, 1.0); sh.closePath();
  g.add(part(new THREE.ExtrudeGeometry(sh, { depth: 3.1, bevelEnabled: false }).translate(0, 0, -1.55), 0x6b5848, { pos: [0, 1.8, 0], ink: 0.04 }));
  g.add(part(new THREE.BoxGeometry(0.8, 1.4, 0.8), 0xf4f2ee, { pos: [0, 2.9, 0.9], ink: 0.04 }));
  g.add(part(new THREE.ConeGeometry(0.6, 1.1, 4).rotateY(Math.PI / 4), 0x7a7d86, { pos: [0, 4.15, 0.9], ink: 0.04 }));
  g.add(part(new THREE.BoxGeometry(0.5, 0.9, 0.06), 0x6b4a2c, { pos: [0, 0.45, 1.42], ink: 0.01 }));
  return g;
}

function lifeguardTower() {
  const t = new THREE.Group();
  const wood = 0x8a5a2b, deck = 0xb07a3c;
  for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
    t.add(part(new THREE.CylinderGeometry(0.09, 0.11, 3.4, 10), wood, { pos: [x, 1.7, z], ink: 0.02 }));
  }
  for (const [x, z, ry] of [[0, -0.9, 0], [0, 0.9, 0], [-0.9, 0, Math.PI / 2], [0.9, 0, Math.PI / 2]]) {   // cross braces
    t.add(part(new THREE.BoxGeometry(0.07, 2.4, 0.07), wood, { pos: [x, 1.7, z], rot: [0, ry, 0.0], ink: 0.012 }));
  }
  t.add(part(new RoundedBoxGeometry(2.5, 0.16, 2.5, 2, 0.04), deck, { pos: [0, 3.4, 0], ink: 0.025 }));
  const railMat = new THREE.MeshStandardMaterial({ map: stripeTex(8), roughness: 0.8 });
  for (const [sx, sz, px, pz] of [[2.4, 0.08, 0, -1.16], [2.4, 0.08, 0, 1.16], [0.08, 2.3, -1.16, 0], [0.08, 2.3, 1.16, 0]]) {
    t.add(part(new THREE.BoxGeometry(sx, 0.5, sz), 0xffffff, { mat: railMat, pos: [px, 3.74, pz], ink: 0.018 }));
  }
  for (const [x, z] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
    t.add(part(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), wood, { pos: [x, 4.3, z], ink: 0.015 }));
  }
  const roofMat = new THREE.MeshStandardMaterial({ map: stripeTex(8), roughness: 0.8 });
  t.add(part(new THREE.ConeGeometry(2.1, 1.15, 8), 0xffffff, { mat: roofMat, pos: [0, 5.6, 0], rot: [0, Math.PI / 8, 0], ink: 0.03 }));
  const ladder = grp(t, 0.75, 1.7, 1.8, 'ladder');
  ladder.rotation.x = -0.34;
  for (const x of [-0.22, 0.22]) ladder.add(part(new THREE.BoxGeometry(0.07, 3.5, 0.07), wood, { pos: [x, 0, 0], ink: 0.012 }));
  for (let i = 0; i < 8; i++) ladder.add(part(new THREE.BoxGeometry(0.5, 0.045, 0.06), wood, { pos: [0, -1.5 + i * 0.43, 0], ink: 0.01 }));
  return t;
}

function dock() {
  const d = new THREE.Group();
  for (let i = 0; i < 10; i++) d.add(part(new THREE.BoxGeometry(0.56, 0.09, 1.7), i % 2 ? 0xa8763b : 0xb8854a, { pos: [i * 0.6, 0, 0], ink: 0.012 }));
  for (const z of [-0.6, 0.6]) d.add(part(new THREE.BoxGeometry(5.9, 0.14, 0.14), 0x6d4521, { pos: [2.7, -0.12, z], ink: 0.012 }));
  for (const [x, z, h] of [[0.1, -0.85, 1.3], [0.1, 0.85, 1.3], [3, -0.85, 1.3], [3, 0.85, 1.3], [5.6, 0.85, 1.9], [5.6, -0.85, 1.3]]) {
    d.add(part(new THREE.CylinderGeometry(0.1, 0.12, h, 10), 0x6d4521, { pos: [x, h / 2 - 0.9, z], ink: 0.018 }));
  }
  return d;
}

function canoe() {
  const g = new THREE.Group();
  const pinch = (geo) => {                                         // pull the ends into bow and stern
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * (1 - 0.72 * p.getX(i) ** 2));
    geo.computeVertexNormals();
    return geo;
  };
  const hull = pinch(new THREE.SphereGeometry(1, 36, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2));
  const m = part(hull, 0xc8202c, { scale: [2.3, 0.55, 0.78], pos: [0, 0.5, 0], ink: 0.03, rough: 0.55 });
  m.material.side = THREE.DoubleSide;
  g.add(m);
  const inside = pinch(new THREE.CircleGeometry(1, 36).rotateX(-Math.PI / 2));
  g.add(part(inside, 0x9a4a2a, { scale: [2.28, 1, 0.77], pos: [0, 0.47, 0], ink: 0, rough: 0.9 }));
  for (const x of [-0.7, 0.7]) g.add(part(new THREE.BoxGeometry(0.16, 0.06, 1.2), 0xd9a066, { pos: [x, 0.5, 0], ink: 0.01 }));
  return g;
}

function cattail(h) {
  const g = new THREE.Group();
  g.add(part(new THREE.CylinderGeometry(0.02, 0.03, h, 6), 0x6a7a2a, { pos: [0, h / 2, 0], ink: 0 }));
  g.add(part(SPHERE, 0x7a4a2a, { scale: ell(0.065, 0.22, 0.065), pos: [0, h + 0.05, 0], ink: 0.01 }));
  return g;
}
function tuft(color, h) {
  const g = new THREE.Group();
  const m = std(color, 0.9);
  for (let i = -2; i <= 2; i++) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.07, h * (1 - Math.abs(i) * 0.12), 4), m);
    b.position.set(i * 0.08, h * 0.45, 0);
    b.rotation.z = -i * 0.28;
    g.add(b);
  }
  return g;
}

function buildLake() {
  const g = new THREE.Group();
  const R = rng(11);
  const sway = [], clouds = [];

  // sky dome: blue to pale horizon
  const skyTex = canvasTex(8, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#4fa8ee'); gr.addColorStop(0.42, '#8fd0f8'); gr.addColorStop(0.5, '#d4f0ff'); gr.addColorStop(1, '#d4f0ff');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  g.add(sky);

  // water with scrolling ripple streaks
  const ripple = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#35a5ee'; c.fillRect(0, 0, w, h);
    c.lineCap = 'round';
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * w, y = Math.random() * h, len = 20 + Math.random() * 40;
      c.strokeStyle = Math.random() < 0.6 ? 'rgba(255,255,255,0.45)' : 'rgba(30,120,200,0.45)';
      c.lineWidth = 2 + Math.random() * 3;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len / 2, y - 5, x + len, y); c.stroke();
    }
  }, [16, 16]);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: ripple, roughness: 0.3, metalness: 0.0 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.12, -60);
  water.receiveShadow = true;
  g.add(water);

  // beach: shallow band, wet sand, golden sand (wavy shoreline)
  const shore = (dz) => { const pts = []; for (let x = -55; x <= 55; x += 2.5) pts.push([x, -3.4 + dz + 1.1 * S(x * 0.33) + 0.7 * S(x * 0.11 + 1)]); return pts; };
  const poly = (pts) => [...pts, [55, 30], [-55, 30]];
  g.add(blob(poly(shore(-1.6)), -0.09, 0x7fd0f6, 0.5));
  g.add(blob(poly(shore(-0.5)), -0.05, 0xd9a24a));
  g.add(blob(poly(shore(0)), 0.0, 0xf2b52a));
  for (let i = 0; i < 26; i++) {                                   // darker sand swirls
    const x = (R() - 0.5) * 40, z = 3 + R() * 9;
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.6 + R() * 1.2, 20), std(0xe9a421, 1));
    s.rotation.x = -Math.PI / 2; s.scale.y = 0.35; s.position.set(x, 0.005, z);
    g.add(s);
  }

  // far shores
  g.add(blob([[-70, -25], [-30, -25.5], [0, -26.5], [30, -25.5], [70, -25], [70, -120], [-70, -120]], -0.06, 0x58a63a));
  g.add(blob([[-60, -9], [-30, -9.5], [-17, -11], [-11, -15], [-15, -21], [-30, -25], [-60, -25]], -0.03, 0x67b83e));
  g.add(blob([[3, -17.5], [9, -18.2], [15, -17.4], [24, -18.5], [36, -21], [46, -28], [46, -60], [3, -60]], -0.04, 0x6cc23e));

  // hill + boarded-up hall
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), std(0x4fae38, 0.95));
  hill.scale.set(17, 6.4, 10); hill.position.set(23, -1.8, -36);
  g.add(hill);
  const h = hall(); h.position.set(24, 4.1, -35); h.scale.setScalar(1.7); h.rotation.y = -0.2;
  g.add(h);

  // little town on the right shore
  const ch = church(); ch.position.set(6, -0.04, -20.5); ch.scale.setScalar(1.35); g.add(ch);
  [[0x4aa84a, 0x6b4a2f, 10.8], [0x4a86d8, 0x6b4a2f, 15.2], [0xd63c3c, 0x6b4a2f, 19.6]].forEach(([c, rc, x], i) => {
    const hs = house(c, rc, 1.55); hs.position.set(x, -0.04, -20.5 - i * 0.2); g.add(hs);
  });

  // pines: left forest (tall), right slope, far row
  const shades = [0x1d6b34, 0x14572a, 0x23783a];
  const forest = (n, x0, x1, z0, z1, h0, h1) => {
    for (let i = 0; i < n; i++) {
      const p = pine(h0 + R() * (h1 - h0), shades[Math.floor(R() * 3)]);
      p.position.set(x0 + R() * (x1 - x0), 0, z0 - R() * (z0 - z1));
      g.add(p);
    }
  };
  forest(34, -40, -12, -10, -24, 7, 12);
  forest(14, 26, 38, -22, -30, 3, 6);
  forest(16, 5, 18, -17, -22, 2.6, 4.2);
  forest(60, -70, 70, -42, -60, 9, 16);

  // landmarks on the beach
  const tower = lifeguardTower(); tower.position.set(-9.8, 0, -3.2); tower.rotation.y = 0.12; g.add(tower);
  const dk = dock(); dk.position.set(-8.4, 0.45, -4.8); dk.rotation.y = -0.18; g.add(dk);
  const cn = canoe(); cn.position.set(-6.2, 0.02, -2.0); cn.rotation.y = 0.14; g.add(cn);

  // rocks and bushes
  const rock = (x, y, z, s, c = 0x8a8d96) => {
    const r = part(new THREE.DodecahedronGeometry(1, 1), c, { pos: [x, y, z], scale: [s * 1.3, s * 0.8, s], ink: 0.03, rough: 0.95 });
    r.rotation.y = R() * 3; g.add(r);
  };
  rock(-7.9, 0.28, -0.9, 0.55); rock(-9.4, 0.2, 0.4, 0.4, 0x7d808a); rock(11, 0.2, -1.4, 0.45); rock(-13, 0.3, 2, 0.6);
  const bush = (x, z, s) => {
    for (let i = 0; i < 3; i++) {
      g.add(part(SPHERE, i % 2 ? 0x7fb53a : 0x93c443, { scale: ell(s, s * 0.8, s), pos: [x + (i - 1) * s * 0.9, s * 0.55, z + (i % 2) * 0.3], ink: 0.03, rough: 0.95 }));
    }
  };
  bush(-13.5, 0.5, 1.3); bush(13, 0.2, 1.2);

  // cattails + yellow grass tufts at the water's edge and in the corners
  const cat = (x, z) => {
    const c = new THREE.Group(); c.position.set(x, 0, z);
    for (let i = 0; i < 3; i++) {
      const k = cattail(1.1 + R() * 0.9);
      k.position.x = (i - 1) * 0.18; k.rotation.z = (R() - 0.5) * 0.35; k.rotation.x = (R() - 0.5) * 0.25;
      c.add(k);
    }
    c.userData.phase = R() * 6; g.add(c); sway.push(c);
  };
  [[0.8, -2.2], [2.6, -2.5], [4.4, -2.1], [6.2, -2.6], [8.1, -2.2], [-3.6, -3.1], [10, -1], [-11, 3.5], [11.5, 4], [-6, 6.5], [6.8, 7]].forEach(([x, z]) => cat(x, z));
  for (let i = 0; i < 40; i++) {
    const t = tuft(R() < 0.5 ? 0xf0c020 : 0xf7d65a, 0.5 + R() * 0.5);
    const side = R() < 0.5 ? -1 : 1;
    t.position.set(side * (6 + R() * 12), 0, -2 + R() * 11);
    t.rotation.y = (R() - 0.5) * 0.8; t.userData.phase = R() * 6; g.add(t); sway.push(t);
  }

  // clouds
  const cloudMat = std(0xffffff, 1);
  cloudMat.emissive = new THREE.Color(0xffffff); cloudMat.emissiveIntensity = 0.55;
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const m = new THREE.Mesh(SPHERE, cloudMat);
      const r = 2 + R() * 2;
      m.scale.set(r * 1.2, r * 0.7, r * 0.7);
      m.position.set((k - 2) * 2.6, (k === 2 ? 1 : 0) + R() * 0.6, R());
      c.add(m);
    }
    c.position.set(-60 + i * 20 + R() * 8, 18 + R() * 8, -80 - R() * 25);
    g.add(c); clouds.push(c);
  }

  return {
    group: g,
    env: { bg: 0xd4f0ff, fog: [0xd4f0ff, 55, 190], key: [0xfff1d0, 2.5, [6, 12, 9]], hemi: [0xbfe6ff, 0xe3c070, 0.95], rim: 0.35, amb: 0.4 },
    update(dt, T) {
      ripple.offset.x += dt * 0.004; ripple.offset.y += dt * 0.0015;
      clouds.forEach((c) => { c.position.x += dt * 0.35; if (c.position.x > 80) c.position.x = -80; });
      sway.forEach((o) => { o.rotation.z = 0.04 * S(T * 1.3 + o.userData.phase); });
    },
  };
}

const SETS = { studio: makeStudio(), lake: null };
SETS.studio.group.name = 'studio';
scene.add(SETS.studio.group);
let activeSet = SETS.studio;

function showSet(name) {
  if (name === 'lake' && !SETS.lake) { SETS.lake = buildLake(); SETS.lake.group.name = 'lake'; scene.add(SETS.lake.group); }
  for (const [k, s] of Object.entries(SETS)) if (s) s.group.visible = k === name;
  activeSet = SETS[name];
  const e = activeSet.env;
  scene.background = new THREE.Color(e.bg);
  scene.fog = e.fog ? new THREE.Fog(...e.fog) : null;
  key.color.set(e.key[0]); key.intensity = e.key[1]; key.position.set(...e.key[2]);
  hemi.color.set(e.hemi[0]); hemi.groundColor.set(e.hemi[1]); hemi.intensity = e.hemi[2];
  rim.intensity = e.rim; ambient.intensity = e.amb;
}

/* ------------------------------------------------------------------ UI */

const style = document.createElement('style');
style.textContent = `
#panel{position:fixed;top:16px;right:16px;width:230px;padding:14px;border-radius:14px;color:#f4eee4;
 background:rgba(30,26,34,.82);backdrop-filter:blur(8px);box-shadow:0 8px 30px rgba(0,0,0,.25);font-size:13px;user-select:none}
#panel{max-height:calc(100dvh - 32px);overflow:auto}
@media(max-width:760px){#panel{width:190px;max-height:40vh;top:auto;bottom:12px;right:12px;font-size:11px}}
#panel h3{margin:0 0 10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
#panel .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}
#panel button,#panel select{font:inherit;color:inherit;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);
 border-radius:8px;padding:7px 8px;cursor:pointer;text-transform:capitalize}
#panel button:hover{background:rgba(255,255,255,.2)}
#panel button.on{background:#ff6a00;border-color:#ff6a00;color:#1a1210;font-weight:700}
#panel .row{display:flex;gap:8px;align-items:center;margin-bottom:10px}
#panel .row label{opacity:.7;min-width:44px}
#panel select{flex:1;text-transform:none}
#panel input[type=range]{flex:1;accent-color:#ff6a00}
#panel #play{flex:1}
`;
document.head.appendChild(style);

const panel = document.createElement('div');
panel.id = 'panel';
panel.innerHTML = `<h3>Porchlight · cast</h3><div class="row"><label>View</label><select id="view"><option value="front">Front</option><option value="quarter">Three-quarter</option><option value="side">Side</option></select></div><h3>Animations</h3><div class="grid"></div>
<div class="row"><label>Set</label><select id="set"><option value="studio">Studio</option><option value="lake">Lake</option></select></div>
<div class="row"><label>Who</label><select id="who"><option value="all">Everyone</option>${CAST.map((c) => `<option>${c.name}</option>`).join('')}</select></div>
<div class="row"><button id="play">Pause</button></div>
<div class="row"><label>Speed</label><input id="speed" type="range" min="0.1" max="2.5" step="0.05" value="1"><span id="speedv">1.0×</span></div>`;
document.body.appendChild(panel);

let playing = true, speed = 1, globalT = 0;
const grid = panel.querySelector('.grid');
const whoSel = panel.querySelector('#who');
const playBtn = panel.querySelector('#play');
const targets = () => (whoSel.value === 'all' ? chars : chars.filter((c) => c.name === whoSel.value));

function refreshButtons() {
  const sel = targets();
  for (const b of grid.children) b.classList.toggle('on', sel.every((c) => c.anim === b.dataset.a));
}
function setAnim(name) {
  targets().forEach((c) => { c.anim = name; c.t = 0; });
  refreshButtons();
}
Object.keys(ANIMS).forEach((name) => {
  const b = document.createElement('button');
  b.textContent = name; b.dataset.a = name;
  b.onclick = () => setAnim(name);
  grid.appendChild(b);
});
whoSel.onchange = refreshButtons;
panel.querySelector('#view').onchange=e=>{const angle={front:0,quarter:Math.PI/5,side:Math.PI/2}[e.target.value];chars.forEach(c=>c.rig.root.rotation.y=angle);};
panel.querySelector('#set').onchange = (e) => showSet(e.target.value);
showSet(SCENE || new URLSearchParams(location.search).get('set') === 'lake' ? 'lake' : 'studio');
if (SCENE) panel.style.display = 'none';
panel.querySelector('#set').value = activeSet === SETS.lake ? 'lake' : 'studio';
const togglePlay = () => { playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play'; };
playBtn.onclick = togglePlay;
panel.querySelector('#speed').oninput = (e) => {
  speed = +e.target.value;
  panel.querySelector('#speedv').textContent = speed.toFixed(1) + '×';
};
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); togglePlay(); } });
addEventListener('resize', () => {
  const width=viewerWidth();camera.aspect=width/innerHeight;camera.updateProjectionMatrix();renderer.setSize(width,innerHeight);
});
refreshButtons();
window.porchlight = { chars, setAnim, ANIMS, camera, controls, renderer, neutral, applyPose };      // handy for poking at it from the console

/* ------------------------------------------------------------------ scripted scene
   Episode 1, "Rematch" (lake, day): Riot at the tower, Rocco asleep, Bash and Pip walk in from the left.
   Positions are world x/z on the beach; yaw 0 faces the camera, +yaw turns toward +x. Animation only: no UI, no text. */

const REMATCH = {
  length: 37.5, pause: 2.5,
  start: {
    Riot:  { x: -7.4, z: 0.2, yaw: 0.6, anim: 'idle' },
    Rocco: { x: -4.6, z: 1.0, yaw: 0.1, anim: 'sleep' },
    Bash:  { x: -13, z: 3.4, yaw: Math.PI / 2, anim: 'idle' },
    Pip:   { x: -14, z: 3.8, yaw: Math.PI / 2, anim: 'idle' },
  },
  cam: { from: [-1.0, 2.9, 14.5], to: [-2.6, 2.6, 12.8], look: [-3.7, 1.8, 0] },
  lines: [   // who, start, duration, pose, who they talk to
    ['Riot', 6.8, 2.9, 'waveL', 'Bash'],   // School's out! How was summer school? (waves with the arm nearest the camera)
    ['Pip', 10.1, 4.0, 'nervous', 'Riot'], // It's not summer school. It's just school. In summer.
    ['Bash', 14.5, 3.6, 'idle', 'Riot'],   // Tuesdays and Thursdays. The owl says it builds character.
    ['Rocco', 18.4, 2.0, 'sleep', null],   // Builds character. In July.
    ['Bash', 20.8, 3.4, 'yellpoint', 'Riot'], // Riot. Game night. Tonight. I want a rematch.
    ['Riot', 24.6, 2.0, 'cocky', 'Bash'],  // You lost the last three.
    ['Bash', 26.9, 1.9, 'yell', 'Riot'],   // Which is why I'm due.
    ['Pip', 29.2, 1.9, 'idle', 'Rocco'],   // That's not how it works.
    ['Rocco', 31.5, 1.7, 'sleep', null],   // Let him have this.
    ['Riot', 33.6, 1.8, 'present', 'Bash'], // Then it's official.
  ],
};

// Recording hooks (set by the recorder before the page loads): real voice timing and mouth levels.
const RECORD = new URLSearchParams(location.search).has('record');
if (window.__LINES) REMATCH.lines = window.__LINES;           // [[who, start, dur, pose, to], ...]
if (window.__LENGTH) REMATCH.length = window.__LENGTH;
const MOUTH_FPS = 30;

const SCENES = { rematch: REMATCH };
const SC = SCENES[SCENE];
const byName = Object.fromEntries(chars.map((c) => [c.name, c]));
let sceneT = 0, cueIdx = 0, cues = [];

if (SC) {
  cues.push([0.1, 'Bash', { path: [[-4.2, 3.4], [0.0, 0.6]], face: -0.8 }]);
  cues.push([1.8, 'Pip', { path: [[-5, 3.9], [-2.4, 1.6]], face: -0.5 }]);
  cues.push([3.4, 'Riot', { look: 'Bash' }]);
  for (const [who, t, d, pose, to] of SC.lines) {
    cues.push([t, who, { anim: pose, talk: d, look: to }]);
    for (const other of ['Riot', 'Rocco', 'Bash', 'Pip']) {
      if (other !== who && other !== 'Rocco') cues.push([t, other, { look: who }]);
    }
    cues.push([t + d, who, { anim: who === 'Rocco' ? 'sleep' : 'idle' }]);
  }
  cues.sort((a, b) => a[0] - b[0]);
}

function runCue(who, o) {
  const c = byName[who];
  if (o.anim) { c.anim = o.anim; c.t = 0; }
  if (o.path) { c.path = o.path.slice(); c.faceEnd = o.face; c.anim = 'walk'; c.tRate = 1.8; c.t = 0; }
  if ('look' in o) c.lookAt = o.look;
  if (o.talk) c.talkUntil = sceneT + o.talk;
}

function resetScene() {
  sceneT = 0; cueIdx = 0;
  for (const c of chars) {
    const s = SC.start[c.name];
    c.rig.root.position.set(s.x, 0, s.z);
    c.yaw = c.yawT = s.yaw; c.anim = s.anim; c.t = c.ph; c.tRate = 1; c.path = []; c.lookAt = null; c.talkUntil = 0;
    c.cur = neutral();
  }
}

const wrapPi = (a) => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

function sceneStep(dt) {
  sceneT += dt;
  while (cueIdx < cues.length && cues[cueIdx][0] <= sceneT) { const [, who, o] = cues[cueIdx++]; runCue(who, o); }
  for (const c of chars) {
    const pos = c.rig.root.position;
    if (c.path.length) {                                           // walking along a path
      const [tx, tz] = c.path[0];
      const dx = tx - pos.x, dz = tz - pos.z, dist = Math.hypot(dx, dz), step = 2.4 * c.spd * dt;
      if (dist <= step) {
        pos.x = tx; pos.z = tz; c.path.shift();
        if (!c.path.length) { c.anim = 'idle'; c.tRate = 1; c.t = 0; c.yawT = c.faceEnd; }
      } else {
        pos.x += (dx / dist) * step; pos.z += (dz / dist) * step; c.yawT = Math.atan2(dx, dz);
      }
    }
    c.yaw += wrapPi(c.yawT - c.yaw) * (1 - Math.exp(-dt * 8));
    c.rig.root.rotation.y = c.yaw;
  }
  const e = THREE.MathUtils.smoothstep(sceneT / SC.length, 0, 1);   // one slow push-in, no cuts
  camera.position.set(lerp(SC.cam.from[0], SC.cam.to[0], e), lerp(SC.cam.from[1], SC.cam.to[1], e), lerp(SC.cam.from[2], SC.cam.to[2], e));
  camera.lookAt(...SC.cam.look);
  if (sceneT > SC.length + SC.pause) resetScene();
}

// layered on top of an animation: talking mouth, and looking at whoever is speaking
function actingOverlay(c, p) {
  const lvl = window.__ENV && window.__ENV[c.name];            // mouth level from the real voice audio (0..1)
  if (lvl) {
    if (c.talkUntil > sceneT) {
      const v = lvl[Math.round(sceneT * MOUTH_FPS)] || 0;
      p.mouth = clamp(p.mouth * 0.5 + 1.25 * v, 0, 1.1);
      p.headX += 0.03 * S(sceneT * 6 + c.ph) * Math.min(1, v * 3); p.browY += 0.012;
    }
  } else if (c.talkUntil > sceneT) {
    p.mouth = clamp(p.mouth * 0.6 + 0.55 * Math.abs(S(sceneT * 9 + c.ph)), 0, 1.1);
    p.headX += 0.03 * S(sceneT * 6 + c.ph); p.browY += 0.012;
  }
  if (c.lookAt && c.anim !== 'sleep') {
    const o = byName[c.lookAt].rig.root.position, me = c.rig.root.position;
    const local = wrapPi(Math.atan2(o.x - me.x, o.z - me.z) - c.yaw);
    p.headY += clamp(local * 0.8, -0.85, 0.85);
    p.lookX += clamp(local, -1, 1) * 0.5;
  }
}

if (SC) { controls.enabled = false; resetScene(); }

/* ------------------------------------------------------------------ loop */

const clock = new THREE.Clock();
const BLINK_LEN = 0.16;

function step(dt) {
  if (playing) {
    const sdt = dt * speed;
    globalT += sdt;
    activeSet.update(sdt, globalT);
    if (SC) sceneStep(sdt);
    const a = 1 - Math.exp(-dt * 9 * Math.max(0.3, speed));        // blend between animations
    for (const c of chars) {
      c.t += sdt * c.spd * c.tRate;
      const target = neutral();
      ANIMS[c.anim](c.t, target, c);
      if (SC) actingOverlay(c, target);
      for (const k of POSE_KEYS) c.cur[k] = lerp(c.cur[k], target[k], a);

      c.nextBlink -= sdt;
      if (c.nextBlink < 0) { c.blinkPhase = BLINK_LEN; c.nextBlink = 2 + Math.random() * 3.5; }
      let blink = 0;
      if (c.blinkPhase > 0) { c.blinkPhase -= sdt; blink = S(Math.PI * (1 - Math.max(0, c.blinkPhase) / BLINK_LEN)); }
      applyPose(c.rig, c.cur, globalT * c.spd, blink);
    }
  }
  if (!SC) controls.update();
  renderer.render(scene, camera);
}
function tick() {
  requestAnimationFrame(tick);
  step(Math.min(clock.getDelta(), 0.05));
}
// ?record: no free-running loop. The recorder calls __step(1/30) and grabs the canvas, so every frame is exact.
if (RECORD) {
  window.__step = (dt) => { step(dt); return renderer.domElement.toDataURL('image/jpeg', 0.93); };
  window.__ready = true;
} else {
  tick();
}
