// The city set for Porchlight season 1 (episodes 27-30), version 2.
// Matches the painted references: art/gemini/sets/33_city_street_winter.jpg (brick street, both sides, shop fronts,
// bus shelter, snow piles, glass tower with steam at the end) and 34_city_canal_bench.jpg (bare snowy tree, railing,
// lamp, bench, skyline behind the water). Positions are staging metres from maple_hollow_locations.json where the
// scripts name a place; the canal sits behind the south row so the street reads as a street.
// Grades: "autumn" (ep 27) or "winter" (ep 29-30). city.html?view=street&grade=winter

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// one fixed map: the same town on every refresh. Change the number with ?seed=123 for another layout.
const SEED = Number(new URLSearchParams(location.search).get('seed')) || 2026;
const rng = ((seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
})(SEED);

const C = {
  asphalt: 0x6b6e73, sidewalk: 0xaeb0ad, curb: 0x9ea19f, brick: 0xffffff, brickTint: [0x9a6150, 0x8f5a4a, 0x7f5a4f, 0xa26b56],
  stone: 0xb9b3a4, glass: 0x34495a, frame: 0xe8e3d6, steel: 0x6f767e, dark: 0x2a2f36, awn: [0x3c5a4e, 0x7a4a3e, 0x4d5a70, 0x8f7a48],
  bus: 0xc8493f, water: 0x6d8b98, ice: 0xbfd9e3, snow: 0xe0e8ec, bench: 0x6b4a2e, sky: [0x9aa6ad, 0xdfe6ea],
  skyline: 0x7f8a94, tree: 0x5f4f45, leaf: 0xb9742f,
};

/* ---------- helpers ---------- */

const mats = new Map();
const mat = (color, rough = 0.85) => {
  const k = color + '/' + rough;
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough }));
  return mats.get(k);
};
const inkMat = new THREE.LineBasicMaterial({ color: 0x23211d, transparent: true, opacity: 0.55 });
const winterOnly = [];              // groups shown only in winter
const autumnOnly = [];              // groups shown only in autumn
const paint = [];                   // { m, autumn, winter } colour swaps

function part(parent, geo, color, p, o = {}) {
  const m = new THREE.Mesh(geo, o.mat || mat(color, o.rough));
  m.position.set(...p);
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.shadow !== false;
  m.receiveShadow = true;
  if (!o.noInk) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), inkMat));
  parent.add(m);
  return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(...repeat);
  return t;
}

// brick wall: mortar lines and slightly different bricks
const brickTex = canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = '#cfc4ae'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 2; r++) {
    const off = r ? 32 : 0;
    for (let x = -32 + off; x < w + 32; x += 64) {
      const s = 0.82 + rng() * 0.26;
      g.fillStyle = `rgb(${Math.round(160 * s)},${Math.round(92 * s)},${Math.round(70 * s)})`;
      g.fillRect(x + 2, r * 32 + 2, 60, 28);
    }
  }
}, [1, 1]);

// window glass with a frame, one tile per window
const glassTex = canvasTex(64, 64, (g) => {
  g.fillStyle = '#2d3f4f'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(190,215,230,.22)'; g.fillRect(6, 4, 22, 56);
  g.fillStyle = 'rgba(190,215,230,.12)'; g.fillRect(36, 4, 22, 56);
});

// signs: painted text on a plane; shrinks to fit so it never runs off the board
function sign(parent, text, p, w, h, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round(512 * h / w);
  const g = cv.getContext('2d');
  g.fillStyle = opts.bg || '#e9e2cf';
  g.fillRect(0, 0, cv.width, cv.height);
  let px = opts.size || 96;
  g.font = `bold ${px}px Georgia, serif`;
  while (g.measureText(text).width > cv.width * 0.86 && px > 20) { px -= 4; g.font = `bold ${px}px Georgia, serif`; }
  g.fillStyle = opts.fg || '#2b2a26';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.globalAlpha = opts.faded ? 0.55 : 1;
  g.fillText(text, cv.width / 2, cv.height / 2);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
  m.position.set(...p);
  if (opts.ry) m.rotation.y = opts.ry;
  parent.add(m);
  return m;
}

// a snow pile: a squashed white blob on the ground
function snowPile(parent, x, z, s = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.8 * s, 12, 8), mat(C.snow, 0.95));
  m.scale.set(1.5, 0.35, 1.1);
  m.position.set(x, 0.12 * s, z);
  m.castShadow = false;
  parent.add(m);
  winterOnly.push(m);
  return m;
}

/* ---------- scene ---------- */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.style.cssText = 'margin:0;overflow:hidden;font-family:system-ui,sans-serif';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 600);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 2;
controls.maxDistance = 160;

const hemi = new THREE.HemisphereLight(0xeef4ff, 0x7d8189, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 1.6);
sun.position.set(-40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 70, bottom: -70, near: 1, far: 260 });
sun.shadow.bias = -0.0008;
scene.add(sun);

// sky gradient behind everything
function skyTex(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const skyWinter = skyTex('#8e9092', '#d5d9dc');
const skyAutumn = skyTex('#8fb2c9', '#f0e6d2');
scene.background = skyWinter;
scene.fog = new THREE.Fog(0xcfd7dc, 110, 330);

const set = new THREE.Group();
scene.add(set);

/* ---------- ground ---------- */

const ground = part(set, box(260, 0.2, 200), 0x9aa092, [160, -0.1, 30], { shadow: false });
const road = part(set, box(110, 0.04, 8), C.asphalt, [160, 0.02, 35]);                  // z 31..39
const walkN = part(set, box(110, 0.12, 3), C.sidewalk, [160, 0.06, 27.5]);             // north pavement
const walkS = part(set, box(110, 0.12, 3), C.sidewalk, [160, 0.06, 40.5]);             // south pavement, z 39..42
const curbN = part(set, box(110, 0.16, 0.4), C.curb, [160, 0.08, 31.2]);
const curbS = part(set, box(110, 0.16, 0.4), C.curb, [160, 0.08, 38.8]);
paint.push({ m: road, autumn: C.asphalt, winter: 0x868b92 }, { m: walkN, autumn: C.sidewalk, winter: 0xe3e6e8 }, { m: walkS, autumn: C.sidewalk, winter: 0xe3e6e8 });

// canal behind the south row: water along x at z 58..64, stone banks and a railing
const water = part(set, box(110, 0.06, 6), C.water, [160, 0.03, 61], { rough: 0.15 });
const ice = part(set, box(110, 0.07, 6), C.ice, [160, 0.04, 61], { rough: 0.25 });
const bankN = part(set, box(110, 0.2, 2.2), C.stone, [160, 0.1, 57.1]);
const bankS = part(set, box(110, 0.2, 3.4), C.stone, [160, 0.1, 65.7]);
paint.push({ m: ice, autumn: 0x9fc9d6, winter: 0xdcf1f8 });
for (let x = 112; x < 210; x += 2.6) part(set, new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), C.steel, [x, 0.9, 56.2], { noInk: true });
for (let x = 112; x < 210; x += 2.6) part(set, box(2.4, 0.06, 0.06), C.steel, [x, 1.4, 56.2], { noInk: true });

/* ---------- north row (behind the road, z 22-30) ---------- */

const north = [
  { id: 'motel', x: 130, w: 14, h: 6.5, tint: C.brickTint[0], sign: 'MOTEL', signBg: '#2e5b4a', signFg: '#f2ead6' },
  { id: 'city_pool', x: 145, w: 14, h: 9, glass: true, sign: 'AQUATIC', signBg: '#24434f', signFg: '#e8f2f5' },
  { id: 'city_archive', x: 160, w: 14, h: 11, tint: C.brickTint[2], sign: 'HALL OF RECORDS', signBg: '#d8d0bb', signFg: '#2b2a26', size: 70 },
  { id: 'city_shop', x: 174, w: 10, h: 5, tint: C.brickTint[1], sign: 'LAMP', signBg: '#8b7340', signFg: '#f0e2b6', faded: true, awn: C.awn[3] },
  { id: 'charity_shop', x: 185, w: 10, h: 5.5, tint: C.brickTint[3], sign: 'CHARITY SHOP', signBg: '#e6dfc7', signFg: '#3c4a2c', size: 66, awn: C.awn[0] },
  { id: 'brick_end', x: 198, w: 12, h: 9, tint: C.brickTint[0] },
];
// south row (z 42-50), with a gap at x 156-178 for the bridge access
const south = [
  { id: 'south_a', x: 118, w: 14, h: 8, tint: C.brickTint[2], sign: 'BOOKS', signBg: '#e4dcc4', signFg: '#3a3026', awn: C.awn[2] },
  { id: 'south_b', x: 134, w: 12, h: 9, tint: C.brickTint[3], awn: C.awn[0] },
  { id: 'south_c', x: 188, w: 12, h: 7, tint: C.brickTint[1], awn: C.awn[1] },
  { id: 'south_d', x: 202, w: 12, h: 12, tint: C.brickTint[0], awn: C.awn[2] },
];

function building(b, z, depth, facing) {
  const { x, w, h } = b;
  const body = part(set, box(w, h, depth), 0xffffff, [x, h / 2, z], {
    mat: b.glass ? new THREE.MeshStandardMaterial({ color: 0x7f9bab, roughness: 0.3, metalness: 0.1 })
      : new THREE.MeshStandardMaterial({ map: brickTex.clone(), color: b.tint || 0xa0695a, roughness: 0.9 }),
  });
  if (!b.glass) body.material.map.repeat.set(Math.max(1, Math.round(w / 2.6)), Math.max(1, Math.round(h / 1.4)));
  body.material.map && (body.material.map.needsUpdate = true);
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry, 30), inkMat));
  // cornice and roof
  part(set, box(w + 0.4, 0.45, depth + 0.4), 0xd8d2c4, [x, h + 0.22, z], { rough: 0.7 });
  if (!b.glass) winterOnly.push(part(set, box(w * 0.92, 0.12, depth * 0.92), C.snow, [x, h + 0.5, z], { rough: 0.95 }));
  // window grid on the street face
  const fz = z + facing * (depth / 2 + 0.03);
  const floors = Math.max(1, Math.floor((h - 2.4) / 2.2));
  for (let f = 0; f < floors; f++) {
    const y = 2.8 + f * 2.2;
    if (b.glass) continue;
    for (let c = 0; c < 4; c++) {
      const wx = x - w / 2 + 1.2 + (c + 0.5) * ((w - 2.4) / 4);
      part(set, box(0.9, 1.2, 0.08), C.frame, [wx, y + 0.6, fz], { noInk: true, rough: 0.6 });
      part(set, box(0.7, 1.0, 0.1), 0x2d3f4f, [wx, y + 0.6, fz + facing * 0.01], { noInk: true, rough: 0.3 });
    }
  }
  if (b.glass) {
    // a glass curtain wall: horizontal bands
    for (let f = 0; f < floors + 1; f++) part(set, box(w - 0.5, 0.12, 0.1), 0x4d6372, [x, 2 + f * 2.2, fz], { noInk: true });
  }
  // shop front and awning on the ground floor
  if (!b.glass && h < 8) {
    part(set, box(w - 2.2, 2.3, 0.12), 0x26303a, [x, 1.3, fz], { rough: 0.3 });
    part(set, box(w - 2.2, 0.15, 0.12), C.frame, [x, 2.5, fz], { noInk: true });
  }
  if (b.awn) part(set, box(w - 1.6, 0.35, 1.4), b.awn, [x, 2.8, z + facing * (depth / 2 + 0.7)], { rough: 0.7 });
  if (b.sign) sign(set, b.sign, [x, h - 1.2, z + facing * (depth / 2 + 0.05)], Math.min(w * 0.8, 9), 1.4, {
    bg: b.signBg, fg: b.signFg, faded: b.faded, size: b.size, ry: facing < 0 ? Math.PI : 0,
  });
  return body;
}

north.forEach((b) => building(b, 26, 8, 1));
south.forEach((b) => building(b, 46, 8, -1));

// the far glass tower with steam (ep 27 "Aquatic" building) at the end of the street
const tower = { x: 206, w: 12, h: 20, z: 24 };
part(set, box(tower.w, tower.h, 10), 0x5d7485, [tower.x, tower.h / 2, tower.z], { mat: new THREE.MeshStandardMaterial({ color: 0x5d7485, roughness: 0.25, metalness: 0.2 }) });
part(set, box(tower.w + 0.3, 0.5, 10.3), 0x3d4c58, [tower.x, tower.h + 0.25, tower.z], { rough: 0.7 });
part(set, box(1.2, 1.4, 1.2), C.steel, [tower.x, tower.h + 1.2, tower.z], { rough: 0.6 });
const steam = [];
for (let k = 0; k < 4; k++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.7 + k * 0.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 1 }));
  s.position.set(tower.x, tower.h + 2 + k * 1.4, tower.z);
  set.add(s);
  steam.push(s);
}

// far skyline silhouettes beyond the street
const skyline = new THREE.Group();
set.add(skyline);
const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
for (let i = 0; i < 26; i++) {
  const h = 8 + rnd() * 26, w = 6 + rnd() * 8, x = 100 + i * 9 + rnd() * 4;
  const m = part(skyline, box(w, h, 12), C.skyline, [x, h / 2, -60 - rnd() * 20], { noInk: true, shadow: false, rough: 1 });
  winterOnly.push(m);
  paint.push({ m, autumn: 0x7c8794, winter: C.skyline });
}

/* ---------- street and canal furniture ---------- */

// bus shelter with glass panels (painting 33, left): bus stop at (140, 40)
{
  const x = 140, z = 40.6;
  part(set, box(5.2, 0.12, 2.2), C.steel, [x, 2.6, z], { rough: 0.5 });
  part(set, box(5.2, 0.08, 2.2), 0x394048, [x, 2.7, z], { rough: 0.5 });
  [[-2.5, -0.9], [2.5, -0.9], [-2.5, 0.9], [2.5, 0.9]].forEach(([dx, dz]) => part(set, box(0.12, 2.6, 0.12), C.steel, [x + dx, 1.3, z + dz], { rough: 0.5 }));
  const glass = new THREE.MeshStandardMaterial({ color: 0xaecbd6, transparent: true, opacity: 0.35, roughness: 0.1 });
  part(set, box(4.8, 2.2, 0.05), 0, [x, 1.5, z - 0.9], { mat: glass, shadow: false, noInk: true });
  part(set, box(0.05, 2.2, 1.8), 0, [x - 2.4, 1.5, z], { mat: glass, shadow: false, noInk: true });
  part(set, box(4.0, 0.12, 0.6), C.bench, [x, 0.8, z - 0.5]);
  sign(set, 'BUS STOP', [x + 2.8, 1.8, z + 0.5], 1.4, 0.45, { bg: '#e7e1cc', fg: '#2b2a26', size: 60 });
}
// phone repair stall (174, 33.5)
{
  const x = 174, z = 33.5;
  part(set, box(2.6, 2.4, 1.6), 0xe1ddd0, [x, 1.2, z], { rough: 0.5 });
  part(set, box(2.2, 1.1, 0.05), 0x2f3a40, [x, 1.4, z + 0.83], { rough: 0.3 });
  sign(set, 'PHONE REPAIR', [x, 2.6, z + 0.82], 2.4, 0.5, { bg: '#2e5b4a', fg: '#f2ead6', size: 60 });
}
// clothes rack with coats on the pavement (ep 27 "Coats"), (185, 36.6)
{
  const x = 185, z = 37.2;
  part(set, new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8).rotateZ(Math.PI / 2), C.steel, [x, 1.5, z], { rough: 0.4 });
  [[-0.9, 0x6d3d7f], [-0.3, 0x9a7a4a], [0.3, 0x2e4f6a], [0.9, 0x8b3a2c], [0.0, 0xc7b99a]].forEach(([dx, c]) => part(set, box(0.42, 1.0, 0.2), c, [x + dx, 1.0, z], { rough: 0.9 }));
  part(set, new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), C.steel, [x - 1.2, 0.3, z], { noInk: true });
  part(set, new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), C.steel, [x + 1.2, 0.3, z], { noInk: true });
}
// lamp posts with globe lanterns along both pavements
for (let x = 116; x < 210; x += 22) {
  [27.6, 40.4].forEach((z) => {
    part(set, new THREE.CylinderGeometry(0.1, 0.13, 6, 8), C.dark, [x, 3, z], { rough: 0.5 });
    part(set, new THREE.CylinderGeometry(0.22, 0.14, 0.5, 10), C.dark, [x, 6.3, z], { rough: 0.4 });
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffd58a, emissiveIntensity: 0.4 }));
    g.position.set(x, 6.8, z);
    set.add(g);
  });
}
// snow piles on the kerbs and by the buildings (winter only)
[[118, 33.5], [132, 37.8], [150, 32], [170, 38.6], [190, 33], [122, 38.5], [178, 32.5]].forEach(([x, z], i) => snowPile(set, x, z, 0.9 + (i % 3) * 0.25));
[[124, 42.3], [156, 43.5], [198, 42], [146, 39.2]].forEach(([x, z]) => snowPile(set, x, z, 1.1));

/* ---------- trees: bare with snow in winter, leafy in autumn ---------- */

function bareTree(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  part(g, new THREE.CylinderGeometry(0.13, 0.22, 4.6, 8), C.tree, [0, 2.3, 0], { rough: 0.95 });
  [[0.8, 3.4, 0.6, 1.3], [-0.9, 3.9, -0.2, 1.1], [0.2, 4.6, -0.7, 1.0], [-0.4, 4.9, 0.4, 0.8]].forEach(([bx, by, bz, len]) => {
    const b = part(g, new THREE.CylinderGeometry(0.06, 0.1, len, 5), C.tree, [bx / 2, by, bz / 2], { noInk: true });
    b.rotation.set(0.6 * bz, 0, -0.6 * bx);
    const snow = part(g, new THREE.SphereGeometry(0.2, 8, 6), C.snow, [bx * 0.6, by + 0.35, bz * 0.6], { noInk: true, rough: 0.95 });
    snow.scale.set(1.3, 0.5, 1.0);
    winterOnly.push(snow);
  });
  set.add(g);
  winterOnly.push(g);
  return g;
}
function leafyTree(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  part(g, new THREE.CylinderGeometry(0.2, 0.3, 3.2, 8), C.tree, [0, 1.6, 0], { rough: 0.95 });
  part(g, new THREE.SphereGeometry(1.7, 12, 10), C.leaf, [0, 4.2, 0], { rough: 0.9 });
  set.add(g);
  autumnOnly.push(g);
  return g;
}
[[124, 66.5], [180, 66.8], [198, 66.6]].forEach(([x, z]) => {
  bareTree(x, z);
  leafyTree(x, z);
});

/* ---------- bench and footbridge on the canal ---------- */

// bench by the railing (painting 34, centre): (150, 0, 59)
{
  const x = 150, z = 58.2;
  part(set, box(3.2, 0.12, 0.7), C.bench, [x, 0.75, z]);
  part(set, box(3.2, 0.7, 0.1), C.bench, [x, 1.1, z - 0.33]);
  [-1.3, 1.3].forEach((dx) => part(set, box(0.12, 0.75, 0.6), C.dark, [x + dx, 0.37, z], { noInk: true }));
}
// footbridge across the canal at x 167 (the scripts' bridge)
{
  const x = 167;
  part(set, box(4, 0.3, 14), C.stone, [x, 0.35, 61], { rough: 0.8 });
  [-1.8, 1.8].forEach((dx) => part(set, box(0.12, 0.9, 14), C.steel, [x + dx, 0.9, 61], { rough: 0.5 }));
}

/* ---------- the bus ---------- */

const bus = new THREE.Group();
part(bus, box(7.5, 2.8, 2.4), C.bus, [0, 1.55, 0], { rough: 0.5 });
part(bus, box(7.6, 0.9, 2.45), 0x2d3b48, [0, 2.1, 0], { rough: 0.2 });
[-2.6, -0.7, 1.2, 2.9].forEach((dx) => part(bus, box(0.9, 1.0, 2.5), 0x2d3b48, [dx, 2.0, 0], { rough: 0.2 }));
[-2.4, 2.4].forEach((dx) => part(bus, new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12).rotateX(Math.PI / 2), 0x1d1d1d, [dx, 0.4, 1.25]));
bus.position.set(120, 0, 35);
set.add(bus);

/* ---------- more set dressing (batch 1) ---------- */

// zebra crossing near the bus stop (x 128-136) and a manhole on the road
for (let z = 31.8; z < 39; z += 1.1) part(set, box(8, 0.03, 0.55), 0xe9e4d6, [132, 0.05, z], { noInk: true, shadow: false });
part(set, new THREE.CylinderGeometry(0.5, 0.5, 0.04, 14), 0x3e4248, [158, 0.05, 35], { noInk: true, shadow: false });
// litter bins, a fire hydrant, a parking meter and a bike rack on the pavements
[[178.5, 40.8], [121, 40.8]].forEach(([x, z]) => part(set, new THREE.CylinderGeometry(0.24, 0.2, 0.95, 10), 0x3c4a3a, [x, 0.5, z], { rough: 0.6 }));
part(set, new THREE.CylinderGeometry(0.16, 0.18, 0.8, 10), 0xc0392b, [134, 0.42, 38.8], { rough: 0.5 });
part(set, new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), C.steel, [112, 0.65, 38.8], { rough: 0.5 });
part(set, box(0.25, 0.35, 0.2), C.dark, [112, 1.4, 38.8], { rough: 0.4 });
[144, 146.2, 148.4].forEach((x) => part(set, box(0.1, 0.6, 0.1), C.steel, [x, 0.4, 42.2], { rough: 0.5 }));
// a parked delivery van in the south lane
{
  const van = new THREE.Group();
  part(van, box(4, 1.7, 1.9), 0xe7e2d4, [0, 1.05, 0], { rough: 0.4 });
  part(van, box(4.05, 0.5, 1.95), 0x2f3a40, [0, 0.6, 0], { rough: 0.5 });
  part(van, box(1.0, 1.2, 1.85), 0xe7e2d4, [-1.5, 1.35, 0], { rough: 0.4 });
  part(van, box(0.9, 0.6, 1.6), 0x2d3b48, [-1.52, 1.6, 0], { rough: 0.2 });
  [-1.3, 1.2].forEach((dx) => part(van, new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12).rotateX(Math.PI / 2), 0x1d1d1d, [dx, 0.42, 0.98]));
  van.position.set(192, 0, 35.8);
  set.add(van);
}
// season dressing: snow drifts and tyre tracks in winter, puddles and leaves in autumn
[[124, 31.6, 4.5], [166, 38.5, 6], [198, 31.5, 3.5]].forEach(([x, z, l]) => {
  const d = part(set, box(l, 0.14, 0.9), C.snow, [x, 0.1, z], { rough: 0.95, noInk: true, shadow: false });
  winterOnly.push(d);
});
for (let x = 118; x < 205; x += 14) {
  const t = part(set, box(3.5, 0.02, 0.12), 0x5d6065, [x, 0.07, 33.8], { rough: 0.95, noInk: true, shadow: false });
  winterOnly.push(t);
}
[[146, 33, 2.2], [176, 36.6, 1.6], [116, 35.2, 2.6]].forEach(([x, z, r]) => {
  const p = new THREE.Mesh(new THREE.CircleGeometry(r, 18).rotateX(-Math.PI / 2), mat(0x5b6f7e, 0.1));
  p.scale.set(1.4, 1, 0.8);
  p.position.set(x, 0.09, z);
  set.add(p);
  autumnOnly.push(p);
});
for (let k = 0; k < 40; k++) {
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), mat(k % 2 ? 0xb9742f : 0x9c4d25, 0.95));
  l.scale.set(1.4, 0.2, 1);
  l.position.set(118 + ((k * 37) % 92), 0.14, [27.8, 40.2, 33][k % 3] + ((k * 13) % 5) * 0.1);
  set.add(l);
  autumnOnly.push(l);
}

/* ---------- batch 2: look (cracks, shop door, shovel) ---------- */

// road cracks (winter only)
[[126, 36.2, 0.4], [151, 33.4, -0.3], [171, 37.6, 0.2], [189, 34.6, 0.6], [138, 36.8, -0.5]].forEach(([x, z, r]) => {
  const c = part(set, box(2.4, 0.02, 0.07), 0x3c3f44, [x, 0.075, z], { noInk: true, shadow: false });
  c.rotation.y = r;
  winterOnly.push(c);
});
// ice cracks on the canal (winter only)
[[152, 60], [166, 62.5], [181, 59.6]].forEach(([x, z]) => {
  const c = part(set, box(3, 0.02, 0.05), 0x5c7180, [x, 0.085, z], { noInk: true, shadow: false });
  c.rotation.y = 0.3;
  winterOnly.push(c);
});
// the Lamp shop door, and a snow shovel leaning by the charity rail (winter only)
part(set, box(1.1, 2.1, 0.1), 0x2a3138, [174.5, 1.05, 30.15], { noInk: true, rough: 0.5 });
part(set, box(0.8, 1.6, 0.05), 0x5b7286, [174.5, 1.2, 30.22], { noInk: true, rough: 0.2 });
{
  const shovel = new THREE.Group();
  shovel.position.set(188.6, 0, 31.8);
  shovel.rotation.z = -0.12;
  set.add(shovel);
  winterOnly.push(shovel);
  part(shovel, new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), C.bench, [0, 0.8, 0], { noInk: true });
  part(shovel, box(0.5, 0.45, 0.04), C.steel, [0, 0.05, 0], { noInk: true });
}

/* ---------- grade ---------- */

let currentGrade = 'autumn';
function setGrade(g) {
  currentGrade = g;
  const winter = g === 'winter';
  winterOnly.forEach((o) => { o.visible = winter; });
  autumnOnly.forEach((o) => { o.visible = !winter; });
  paint.forEach(({ m, autumn, winter: w }) => m.material.color.set(winter ? w : autumn));
  scene.background = winter ? skyWinter : skyAutumn;
  scene.fog = new THREE.Fog(winter ? 0xc9ced2 : 0xe9dfcb, 110, 330);
  hemi.intensity = winter ? 1.2 : 1.4;
  sun.intensity = winter ? 1.5 : 2.2;
  ground.material.color.set(winter ? 0xe7ecef : 0x8f9a7a);
  panel.querySelectorAll('button[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === g));
}

/* ---------- spots and views ---------- */

const SPOTS = {
  'bus stop': [140, 40], 'phone repair stall': [174, 33.5], 'charity shop rail': [185, 37.2], 'city shop door': [174, 30],
  'motel door': [130, 30], 'pool entrance': [145, 30], 'archive door (Hall of Records)': [160, 30],
  'canal bench': [150, 58.2], 'footbridge': [167, 61],
};
const spotMarkers = new THREE.Group();
spotMarkers.visible = false;
set.add(spotMarkers);
Object.entries(SPOTS).forEach(([name, [x, z]]) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff7a2b }));
  m.position.set(x, 0.3, z);
  m.userData.name = name;
  spotMarkers.add(m);
});

const VIEWS = {
  street: { pos: [112, 2.4, 35], look: [200, 4.2, 30] },        // down the street, both sides, the glass tower at the end
  canal: { pos: [136, 2.6, 76], look: [158, 2.2, 60] },          // from the far bank, the bench and skyline
  shop: { pos: [170, 2.2, 43.5], look: [176, 2.4, 26] },         // the shop fronts across the road
  overview: { pos: [160, 80, 118], look: [160, 0, 34] },
};
function view(name) {
  const v = VIEWS[name] || VIEWS.street;
  camera.position.set(...v.pos);
  controls.target.set(...v.look);
  controls.update();
}

/* ---------- UI ---------- */

const style = document.createElement('style');
style.textContent = `
#panel{position:fixed;left:16px;bottom:16px;width:260px;padding:12px;border-radius:14px;background:rgba(248,250,243,.93);color:#2b3529;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.18)}
#panel h3{margin:10px 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.65}
#panel .row{display:flex;gap:6px;flex-wrap:wrap}
#panel button{font:inherit;color:inherit;background:#fff;border:1px solid #d2d9c8;border-radius:8px;padding:5px 8px;cursor:pointer}
#panel button.on,#panel button:hover{border-color:#d9822b;background:#fff8ee}
#info{position:fixed;top:16px;left:16px;padding:8px 12px;border-radius:10px;background:rgba(248,250,243,.9);font-size:13px;color:#2b3529}
`;
document.head.appendChild(style);

const panel = document.createElement('div');
panel.id = 'panel';
panel.innerHTML = `
<div class="row"><button data-grade="autumn">Autumn (ep 27)</button><button data-grade="winter">Winter (ep 29-30)</button></div>
<h3>View</h3>
<div class="row"><button data-view="street">Street</button><button data-view="canal">Canal</button><button data-view="shop">Shop fronts</button><button data-view="overview">Overview</button></div>
<h3>Debug</h3>
<div class="row"><button id="spots">Show spots</button></div>`;
document.body.appendChild(panel);
const info = document.createElement('div');
info.id = 'info';
info.textContent = 'City set · Porchlight season 1';
document.body.appendChild(info);

panel.querySelectorAll('button[data-grade]').forEach((b) => (b.onclick = () => setGrade(b.dataset.grade)));
panel.querySelectorAll('button[data-view]').forEach((b) => (b.onclick = () => view(b.dataset.view)));
panel.querySelector('#spots').onclick = (e) => {
  spotMarkers.visible = !spotMarkers.visible;
  e.target.classList.toggle('on', spotMarkers.visible);
};
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- map tools (batch 1: top-down, grid, finder, distance, export) ---------- */

const EPS = {
  'bus stop': 'ep 27, 29, 30', 'phone repair stall': 'ep 27', 'charity shop rail': 'ep 27, 29, 30', 'city shop door': 'ep 27, 29, 30',
  'motel door': 'ep 27, 28, 29', 'pool entrance': 'ep 27, 28', 'archive door (Hall of Records)': 'ep 27, 29, 30',
  'canal bench': 'ep 29, 30', 'footbridge': 'ep 29',
};
const grid = new THREE.GridHelper(240, 48, 0x6a7a6a, 0x9aa89a);     // 5 m squares
grid.position.set(160, 0.07, 30);
grid.visible = false;
set.add(grid);

const tstyle = document.createElement('style');
tstyle.textContent = `#tools button{font:inherit;color:inherit;background:#fff;border:1px solid #d2d9c8;border-radius:8px;padding:5px 8px;cursor:pointer}
#tools button:hover,#tools button.on{border-color:#d9822b;background:#fff8ee}
#places button{display:block;width:100%;text-align:left;margin-bottom:3px}
#places small{opacity:.65;margin-left:4px}`;
document.head.appendChild(tstyle);

const tools = document.createElement('div');
tools.id = 'tools';
tools.style.cssText = 'position:fixed;top:16px;right:16px;width:270px;max-height:calc(100vh - 32px);overflow:auto;padding:12px;border-radius:14px;background:rgba(248,250,243,.93);color:#2b3529;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.18)';
tools.innerHTML = `
<div style="display:flex;gap:6px;flex-wrap:wrap"><button id="topdown">Top-down</button><button id="gridbtn">Grid</button><button id="export">Export PNG</button></div>
<input id="find" placeholder="Find a place…" style="width:100%;margin-top:10px;padding:6px;border-radius:8px;border:1px solid #d2d9c8;box-sizing:border-box">
<div id="places" style="margin-top:8px"></div>
<div style="margin-top:10px">Distance: <select id="from"></select> to <select id="to"></select></div>
<div id="dist" style="margin-top:4px;font-weight:700"></div>`;
document.body.appendChild(tools);

const placesBox = tools.querySelector('#places');
const find = tools.querySelector('#find');
function flyToSpot(name) {
  const [x, z] = SPOTS[name];
  controls.target.set(x, 0.8, z);
  camera.position.set(x + 2, 4, z + 6);
  controls.update();
}
Object.entries(SPOTS).forEach(([name]) => {
  const b = document.createElement('button');
  b.dataset.name = name;
  b.innerHTML = `${name}<small>${EPS[name] || ''}</small>`;
  b.onclick = () => flyToSpot(name);
  placesBox.appendChild(b);
});
find.oninput = () => {
  const q = find.value.toLowerCase();
  placesBox.querySelectorAll('button').forEach((b) => { b.style.display = b.dataset.name.includes(q) ? '' : 'none'; });
};
const names = Object.keys(SPOTS);
['from', 'to'].forEach((id, i) => {
  const s = tools.querySelector('#' + id);
  names.forEach((n, k) => { const o = document.createElement('option'); o.value = n; o.textContent = n; if (k === i) o.selected = true; s.appendChild(o); });
});
function updateDistance() {
  const a = SPOTS[tools.querySelector('#from').value], b = SPOTS[tools.querySelector('#to').value];
  tools.querySelector('#dist').textContent = a && b ? `${Math.hypot(a[0] - b[0], a[1] - b[1]).toFixed(1)} m` : '';
}
tools.querySelector('#from').onchange = updateDistance;
tools.querySelector('#to').onchange = updateDistance;
updateDistance();

let topDown = false;
tools.querySelector('#topdown').onclick = (e) => {
  topDown = !topDown;
  e.target.classList.toggle('on', topDown);
  if (topDown) { camera.position.set(160, 120, 34.01); controls.target.set(160, 0, 34); }
  else view('street');
  controls.update();
};
tools.querySelector('#gridbtn').onclick = (e) => { grid.visible = !grid.visible; e.target.classList.toggle('on', grid.visible); };
tools.querySelector('#export').onclick = () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = renderer.domElement.toDataURL('image/png');
  a.download = `city-set-${currentGrade}.png`;
  a.click();
};

/* ---------- map tools (batch 3: route, walk time, time of day, fog, night, legend, shot path, notes) ---------- */

// route line between the two places picked for the distance readout
const routeGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const route = new THREE.Line(routeGeo, new THREE.LineDashedMaterial({ color: 0xd9822b, dashSize: 0.6, gapSize: 0.4 }));
route.computeLineDistances();
route.visible = false;
set.add(route);
function drawRoute() {
  const a = SPOTS[tools.querySelector('#from').value], b = SPOTS[tools.querySelector('#to').value];
  route.visible = !!(a && b);
  if (!route.visible) return;
  routeGeo.setFromPoints([new THREE.Vector3(a[0], 0.6, a[1]), new THREE.Vector3(b[0], 0.6, b[1])]);
  route.computeLineDistances();
  const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
  tools.querySelector('#dist').textContent = `${d.toFixed(1)} m · about ${Math.round(d / 1.4)} s walk`;
}
['from', 'to'].forEach((id) => tools.querySelector('#' + id).addEventListener('change', drawRoute));
drawRoute();

// extra controls: time of day, fog, night, shot path, legend
const extra = document.createElement('div');
extra.style.cssText = 'margin-top:12px;border-top:1px solid #d2d9c8;padding-top:10px';
extra.innerHTML = `
<div>Time of day: <b id="hour">14:00</b></div>
<input id="time" type="range" min="6" max="20" step="0.5" value="14" style="width:100%">
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
  <button id="fog">Fog</button><button id="night">Night</button>
</div>
<div style="margin-top:10px;font-weight:700">Shot path</div>
<div style="display:flex;gap:6px;flex-wrap:wrap"><button id="saveshot">Save this view</button><button id="showpath">Show path</button><button id="clearshots">Clear</button></div>
<div id="shots" style="margin-top:6px;font-size:12px;opacity:.8"></div>
<div style="margin-top:10px;font-weight:700">Legend</div>
<div style="font-size:12px;line-height:1.6">
  <span style="color:#ff7a2b">●</span> spot (from the list)<br>
  <span style="color:#d9822b">- - -</span> route between two spots<br>
  <span style="color:#3f7fd0">- - -</span> shot path (saved views)<br>
  Grey squares = 5 m grid · white bars = crossing · grey blobs = snow (winter)
</div>
<div style="margin-top:10px;font-weight:700">Notes <span id="noteFor" style="font-weight:400;opacity:.7"></span></div>
<textarea id="notes" rows="3" placeholder="Pick a place to write a note" style="width:100%;box-sizing:border-box;border-radius:8px;border:1px solid #d2d9c8;padding:6px;font:inherit"></textarea>`;
tools.appendChild(extra);

const timeInput = extra.querySelector('#time');
function applyTime(h) {
  const k = Math.max(0, Math.sin((Math.PI * (h - 6)) / 14));   // 0 at dawn/dusk, 1 at noon
  sun.position.set(-40 + (h - 13) * 6, 6 + 54 * k, 30);
  extra.querySelector('#hour').textContent = `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
}
timeInput.oninput = () => applyTime(+timeInput.value);
applyTime(14);

let fogOn = false, nightOn = false;
extra.querySelector('#fog').onclick = (e) => {
  fogOn = !fogOn;
  e.target.classList.toggle('on', fogOn);
  scene.fog.near = fogOn ? 30 : 110;
  scene.fog.far = fogOn ? 120 : 330;
};
extra.querySelector('#night').onclick = (e) => {
  nightOn = !nightOn;
  e.target.classList.toggle('on', nightOn);
  scene.background = nightOn ? new THREE.Color(0x1a2230) : (currentGrade === 'winter' ? skyWinter : skyAutumn);
  hemi.intensity = nightOn ? 0.35 : (currentGrade === 'winter' ? 1.2 : 1.4);
  sun.intensity = nightOn ? 0.25 : (currentGrade === 'winter' ? 1.5 : 2.2);
  set.traverse((o) => { if (o.material && o.material.emissive && o.material.emissive.getHex() === 0xffd58a) o.material.emissiveIntensity = nightOn ? 1.8 : 0.4; });
};

// saved shots and the path through them
const shots = [];
const pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x3f7fd0 }));
pathLine.visible = false;
scene.add(pathLine);
function drawShots() {
  extra.querySelector('#shots').textContent = shots.length ? shots.map((s, i) => `${i + 1}. (${s.pos.map((v) => v.toFixed(0)).join(', ')})`).join('  ') : 'No shots saved yet.';
  pathLine.geometry.setFromPoints(shots.map((s) => new THREE.Vector3(...s.pos)));
}
extra.querySelector('#saveshot').onclick = () => { shots.push({ pos: camera.position.toArray(), target: controls.target.toArray() }); drawShots(); };
extra.querySelector('#showpath').onclick = (e) => { pathLine.visible = !pathLine.visible; e.target.classList.toggle('on', pathLine.visible); };
extra.querySelector('#clearshots').onclick = () => { shots.length = 0; drawShots(); };
drawShots();

// notes per place, kept in this browser only
const notesBox = extra.querySelector('#notes');
const noteFor = extra.querySelector('#noteFor');
let noteKey = null;
function loadNote(name) {
  try { return localStorage.getItem('city-note-' + name) || ''; } catch (e) { return ''; }
}
function saveNote() {
  if (!noteKey) return;
  try { localStorage.setItem('city-note-' + noteKey, notesBox.value); } catch (e) { /* storage blocked: the note stays on screen only */ }
}
placesBox.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !b.dataset.name) return;
  noteKey = b.dataset.name;
  noteFor.textContent = `· ${noteKey}`;
  notesBox.value = loadNote(noteKey);
});
notesBox.addEventListener('input', saveNote);

/* ---------- loop ---------- */

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const t = clock.getElapsedTime();
  bus.position.x = 120 + ((t * 4) % 90);
  steam.forEach((s, i) => {
    const k = ((t * 0.8 + i * 0.7) % 4) / 4;
    s.position.y = tower.h + 2 + i * 1.4 + k * 2;
    s.material.opacity = 0.4 * (1 - k);
  });
  controls.update();
  renderer.render(scene, camera);
}
const params = new URLSearchParams(location.search);
view(params.get('view') || 'street');
setGrade(params.get('grade') === 'winter' ? 'winter' : 'autumn');
tick();
