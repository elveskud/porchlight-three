// Derived from Claude’s original town.js; geography and original massing are retained.
import * as THREE from 'three';
import {LAKE,shore,ring,lakeDistance,AVENUES,STREETS,PEAKS,CREEK_IN,CREEK_OUT,RAIL,ROADS,SCALE} from './geography.js';
import {buildLandmark} from './landmarks.js';
import {intersection} from './routes.js';
export function buildTown(plan,seed=2026){
const S=SCALE,M=(x,y)=>new THREE.Vector3((x-750)*S,0,(y-500)*S);
const rng=(()=>{let value=seed;return()=>{value=(value+0x6D2B79F5)|0;let t=Math.imul(value^(value>>>15),1|value);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};})();
const C = {
  floor: 0x7fa36a, lawn: 0xb8d191, walk: 0xd9d5cb, road: 0xe3dccb, roadEdge: 0xa79f8c, line: 0xc7a64b,
  water: 0x5e9ab5, shore: 0xcdbf98, sand: 0xe6d3a2, fir: 0x2f5e3f, dec: 0x5e9150, aut1: 0xc9772e, aut2: 0xa8532a,
  mtn: 0xa9a6a0, snow: 0xf7f8fa, brick: 0x8a4b3c, concrete: 0x9aa0a4, wall: 0xf1e7d3, wood: 0x8a5a2b, dark: 0x2e3340,
  roofs: [0x8a4b3c, 0x4f6b5a, 0x5a6a80, 0x6e6359, 0xa86b45],
  houseWalls: [0xf1e7d3, 0xe8d9b5, 0xcfe0c0, 0xd8c3b0],
  red: 0xc9443b, blue: 0x3f6fa8, yellow: 0xe0b23a, awnA: 0xd8463e, awnB: 0xf0b662, cars: [0xc9443b, 0x3f6fa8, 0xe9e4d6, 0x5c7c4b, 0x2f3540, 0xd9a23a],
};

/* ------------------------------------------------------------------ helpers */

const mats = new Map();
const mat = (color, rough = 0.85) => {
  const k = color + '/' + rough;
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough }));
  return mats.get(k);
};
const litMats = [];
const inkMat = new THREE.LineBasicMaterial({ color: 0x2b2a26, transparent: true, opacity: 0.5 });                                   // windows and lamps that glow at night
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function meshAt(geo, color, p = [0, 0, 0], o = {}) {
  const m = new THREE.Mesh(geo, o.mat || mat(color, o.rough ?? 0.85));
  m.position.set(...p);
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  if (o.s) m.scale.set(...o.s);
  m.castShadow = true;
  m.receiveShadow = true;
  if (!o.noInk) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), inkMat));
  return m;
}

// flat shape on the ground from map points [x, y]
function flat(parent, pts, color, y = 0) {
  const sh = new THREE.Shape();
  pts.forEach(([x, yy], i) => { const v = M(x, yy); i ? sh.lineTo(v.x, -v.z) : sh.moveTo(v.x, -v.z); });
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), mat(color, 0.95));
  m.position.y = y;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// flat ellipse (map centre and radii)
function ellipse(parent, cx, cy, rx, ry, color, y = 0) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), mat(color, 0.95));
  m.position.set(...M(cx, cy).toArray().map((v, i) => (i === 1 ? y : v)));
  m.scale.set(rx * S, 1, ry * S);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// a road or path as flat strips along map points
function ribbon(parent, pts, w, color, y) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = M(...pts[i]), b = M(...pts[i + 1]);
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    if (!L) continue;
    const m = new THREE.Mesh(box(L, 0.03, w * S), mat(color, 0.9));
    m.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
    m.rotation.y = -Math.atan2(dz, dx);
    m.receiveShadow = true;
    parent.add(m);
  }
}

// map-space distance from a point to a polyline
function segD(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  let t = l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const plD = (p, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segD(p, pts[i], pts[i + 1])); return m; };

// window textures: one tile = one window; lit version glows at night
function tile(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const winTex = tile((g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#4f6a80'; g.fillRect(12, 10, 40, 34);
  g.fillStyle = '#ffffff'; g.fillRect(31, 10, 3, 34);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(12, 44, 40, 4);
});
const litTex = tile((g) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#ffd27a'; g.fillRect(12, 10, 40, 34);
});

// building facade: colour + window grid, glowing at night
function facade(color, w, h) {
  const map = winTex.clone(), em = litTex.clone();
  map.repeat.set(Math.max(1, Math.round(w / 0.25)), Math.max(1, Math.round(h / 0.3)));
  em.repeat.copy(map.repeat);
  map.needsUpdate = em.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ color, map, emissiveMap: em, emissive: 0xffc86e, emissiveIntensity: 0, roughness: 0.8 });
  litMats.push(m);
  return m;
}

const world=new THREE.Group();world.name='Maple Hollow';
const layers={};for(const name of ['terrain','water','roads','rail','buildings','vegetation','landmarks','drafts','bridges','parcels']){const g=new THREE.Group();g.name=name;world.add(g);layers[name]=g;}
let W=layers.terrain;
const reserved=plan.sites.filter(s=>s.parcel).map(s=>({at:s.at,w:s.parcel[0],h:s.parcel[1]}));
const withinParcel=(x,y,margin=0)=>reserved.some(p=>Math.abs(x-p.at[0])<p.w/2+margin&&Math.abs(y-p.at[1])<p.h/2+margin);
/* ------------------------------------------------------------------ geography (map coordinates) */

const LC=LAKE,LP=shore,LD=lakeDistance,AV=AVENUES,ST=STREETS,peaks=PEAKS,creekIn=CREEK_IN,creekOut=CREEK_OUT,rail=RAIL,roads=ROADS;
const islands=[{x:330,y:330,rx:30,ry:18},{x:470,y:460,rx:12,ry:9}];
/* ------------------------------------------------------------------ ground, lake, creek, mountains */

const floor = meshAt(new THREE.BoxGeometry(34, .15, 25), C.floor, [0, -.12, 0]);
floor.castShadow = false;
W.add(floor);
flat(W, rect(690, 372, 1380, 888), C.lawn, 0.005);
flat(W, rect(700, 382, 1366, 718), C.walk, 0.01);
// berry farms and hay fields
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
  flat(W, rect(420 + c * 66, 730 + r * 62, 478 + c * 66, 784 + r * 62), [C.dec, 0xd8c27a, 0x8e6b4a, 0x6e9447][(r + c) % 4], 0.01);
}

W=layers.water;
// lake: sand, shore, water
flat(W, ring(0.16, 96), C.sand, 0.0);
flat(W, ring(0.07), C.shore, 0.005);
flat(W, ring(0), C.water, 0.01);
islands.forEach((i) => { ellipse(W, i.x, i.y, i.rx + 3, i.ry + 3, C.shore, 0.012); ellipse(W, i.x, i.y, i.rx, i.ry, C.lawn, 0.016); });

function tube(pts) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => { const v = M(x, y); return new THREE.Vector3(v.x, 0.03, v.z); }));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.09, 6), mat(C.water, 0.3));
  W.add(m);
}
tube(creekIn);
tube(creekOut);

W=layers.terrain;
peaks.forEach((p) => {
  const h = p.r * S * 1.25;
  W.add(meshAt(new THREE.ConeGeometry(p.r * S * 0.9, h, 7), C.mtn, [...M(p.x, p.y).toArray().map((v, i) => (i === 1 ? h / 2 : v))]));
  W.add(meshAt(new THREE.ConeGeometry(p.r * S * 0.36, h * 0.35, 7), C.snow, [...M(p.x, p.y).toArray().map((v, i) => (i === 1 ? h * 0.82 : v))]));
});

/* ------------------------------------------------------------------ roads and rail */

W=layers.roads;
roads.forEach((r) => {
  ribbon(W, r.pts, r.w + 3, C.roadEdge, 0.02);
});
roads.forEach((r) => {
  ribbon(W, r.pts, r.w, r.gravel ? 0xb9ab8a : C.road, 0.035);
});
// Main Street double yellow line and crosswalk lanes
ribbon(W, [[697.5357616273116, 468.8], [1365, 468.8]], 0.6, C.line, 0.045);
ribbon(W, [[697.5357616273116, 471.2], [1365, 471.2]], 0.6, C.line, 0.045);
W=layers.rail;
ribbon(W, rail, 6, 0x6d4521, 0.03);
ribbon(W, rail.map(([x, y]) => [x, y - 2]), 0.6, C.dark, 0.05);
ribbon(W, rail.map(([x, y]) => [x, y + 2]), 0.6, C.dark, 0.05);

/* ------------------------------------------------------------------ downtown: brick and concrete blocks */

W=layers.buildings;
const keep = [[842, 450], [990, 450]];                      // Mayor's office and Gus's garage stay as lawns
const skipB = new Set(['0,1', '1,1', '3,2', '4,2', '0,3', '5,2', '6,2', '7,2']);
const dtBlocks = [];
for (let j = 0; j < 4; j++) for (let i = 0; i < AV.length - 1; i++) {
  if (skipB.has(i + ',' + j)) continue;
  const x0 = AV[i] + 10, x1 = AV[i + 1] - 10, z0 = ST[j] + 10, z1 = ST[j + 1] - 10;
  const xm = (x0 + x1) / 2;
  [[x0, xm - 1.5], [xm + 1.5, x1]].forEach(([a, b]) => {
    if (keep.some(([px, py]) => px > a - 8 && px < b + 8 && py > z0 - 8 && py < z1 + 8)) return;
    const tower = rng() < 0.1 && j < 3;
    const h = tower ? 1.2 + rng() * 0.6 : 0.35 + rng() * 0.4;
    if(reserved.some(p=>a<p.at[0]+p.w/2+3&&b>p.at[0]-p.w/2-3&&z0<p.at[1]+p.h/2+3&&z1>p.at[1]-p.h/2-3))return;
    dtBlocks.push({ a, b, z0, z1, h });
  });
}
dtBlocks.forEach((b) => {
  const a = M(b.a, b.z0), c = M(b.b, b.z1), w = c.x - a.x, d = c.z - a.z, cx = (a.x + c.x) / 2, cz = (a.z + c.z) / 2;
  const col = [C.brick, C.concrete, 0xb5573f, 0xd8c7a4, 0x8fa9aa][Math.floor(rng() * 5)];
  const m = new THREE.Mesh(box(w, b.h, d), facade(col, w, b.h));
  m.position.set(cx, b.h / 2, cz);
  m.castShadow = m.receiveShadow = true;
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), inkMat));
  W.add(m);
  // rooftop units on some blocks
  for (let k = 0; k < 2; k++) {
    if (rng() < 0.6) W.add(meshAt(box(w * 0.25, 0.12, d * 0.25), 0x9aa0a4, [cx + (k ? 0.12 : -0.12) * w, b.h + 0.06, cz + (k ? 0.1 : -0.1) * d]));
  }
});
// apartment complexes: U-shaped, courtyard in the middle
[[5, 2], [6, 2], [7, 2]].forEach(([i, j]) => {
  const x0 = AV[i] + 10, x1 = AV[i + 1] - 10, z0 = ST[j] + 10, z1 = ST[j + 1] - 10, t = (z1 - z0) * 0.28, s = (x1 - x0) * 0.3;
  [[x0, z0, x1, z0 + t], [x0, z1 - t, x1, z1], [x0, z0 + t, x0 + s, z1 - t], [x1 - s, z0 + t, x1, z1 - t]].forEach(([a, b, c, d]) => {
    const p = M(a, b), q = M(c, d), w = q.x - p.x, dd = q.z - p.z, h = 1.1;
    const m = new THREE.Mesh(box(w, h, dd), facade(0xcfc8ba, w, h));
    m.position.set((p.x + q.x) / 2, h / 2, (p.z + q.z) / 2);
    m.castShadow = m.receiveShadow = true;
    W.add(m);
  });
  flat(W, rect(x0 + s, z0 + t, x1 - s, z1 - t), C.lawn, 0.02);
});

// Main Street: awnings, shop fronts, parked cars and lamps
for (let x = 720; x < 1365; x += 60) {
  const p = M(x, 452), q = M(x, 490);
  [[p, C.awnA], [q, C.awnB]].forEach(([v, col]) => W.add(meshAt(box(0.5, 0.04, 0.12), col, [v.x, 0.18, v.z])));
}
for (let x = 720; x < 1365; x += 13 + rng() * 10) {
  if (AV.some((a) => Math.abs(a - x) < 10)) continue;
  [-1, 1].forEach((s) => { if (rng() < 0.55) { const v = M(x, 470 + s * 7.6); W.add(meshAt(box(0.16, 0.08, 0.08), C.cars[Math.floor(rng() * 6)], [v.x, 0.08, v.z])); } });
}
[[1360, 463], [1420, 456], [905, 640], [720, 600], [1040, 800], [560, 470]].forEach(([x, y]) => {
  if(LD(x,y)<.1)return;const v = M(x, y); W.add(meshAt(box(0.16, 0.08, 0.08), C.cars[Math.floor(rng() * 6)], [v.x, 0.08, v.z]));
});

/* ------------------------------------------------------------------ houses along residential roads */

const houses = [];
const roadPolys = roads.map((r) => r.pts);
roads.forEach(r=>{
 if(!r.h)return;let walked=0,next=12;
 for(let i=1;i<r.pts.length;i++){
  const [ax,ay]=r.pts[i-1],[bx,by]=r.pts[i],L=Math.hypot(bx-ax,by-ay);if(!L)continue;
  const ux=(bx-ax)/L,uy=(by-ay)/L;
  while(next<=walked+L){const t=next-walked;next+=24;
   for(const side of [-1,1]){
    const x=ax+ux*t-uy*side*21,y=ay+uy*t+ux*side*21;
    if(x<12||x>1485||y<12||y>985||withinParcel(x,y,12))continue;
    if(x>690&&x<1372&&y>372&&y<718)continue;
    if(LD(x,y)<.3||peaks.some(p=>Math.hypot(x-p.x,y-p.y)<p.r*.9))continue;
    if(roadPolys.some((pts,k)=>plD([x,y],pts)<roads[k].w/2+10))continue;
    if(houses.some(h=>Math.hypot(h[0]-x,h[1]-y)<20))continue;
    houses.push([x,y,ux,uy,side]);
   }
  }walked+=L;
 }
});
const wallCols = C.houseWalls, roofCols = C.roofs;
houses.forEach(([x, y, ux, uy], i) => {
  const g = new THREE.Group();
  const p = M(x, y);
  g.position.copy(p);
  g.rotation.y = -Math.atan2(uy, ux);
  const body = meshAt(box(0.27, 0.22, 0.24), wallCols[i % wallCols.length], [0, 0.11, 0]);
  const roof = meshAt(new THREE.ConeGeometry(0.22, 0.2, 4), roofCols[i % roofCols.length], [0, 0.32, 0], { ry: Math.PI / 4 });
  g.add(body, roof);
  W.add(g);
});

/* ------------------------------------------------------------------ trees */

W=layers.vegetation;
const trees = { fir: [], dec: [], aut: [] };
let placed = 0;
for (let i = 0; i < 40000 && placed < 1100; i++) {
  const x = rng() * 1500, y = rng() * 1000;
  if (LD(x, y) < 0.12 || withinParcel(x,y,5)) continue;
  if (x > 690 && x < 1380 && y > 372 && y < 888) continue;
  if (peaks.some((p) => Math.hypot(x - p.x, y - p.y) < p.r * 0.8)) continue;
  if (roadPolys.some((pts, k) => plD([x, y], pts) < roads[k].w / 2 + 4)) continue;
  if (houses.some((h) => Math.hypot(h[0] - x, h[1] - y) < 12)) continue;
  const r = rng();
  const k = x > 1462 ? 'aut' : r < 0.22 ? 'dec' : 'fir';
  trees[k].push([x, y, rng()]);
  placed++;
}
const dummy = new THREE.Object3D();
function instanced(list, geo, color) {
  const im = new THREE.InstancedMesh(geo, mat(color, 0.9), list.length);
  list.forEach(([x, y, r], i) => {
    dummy.position.copy(M(x, y));
    const s = 0.7 + r * 0.7;
    dummy.scale.set(s, s * (0.9 + r * 0.4), s);
    dummy.rotation.set(0, r * 6.28, 0);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  });
  im.castShadow = true;
  W.add(im);
}
instanced(trees.fir, new THREE.ConeGeometry(0.18, 0.6, 7).translate(0, 0.3, 0), C.fir);
instanced(trees.dec, new THREE.SphereGeometry(0.16, 10, 8).translate(0, 0.22, 0), C.dec);
instanced(trees.aut, new THREE.ConeGeometry(0.18, 0.6, 7).translate(0, 0.3, 0), C.aut1);

/* ------------------------------------------------------------------ landmarks (each one clickable) */

const lampMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffb830, emissiveIntensity: 0 }); litMats.push(m); return m; };

const LEGACY_PLACES = [
  { id: 'apt', name: "Riot & Rocco's apartment", at: [675, 312], desc: 'Small, messy, cozy, in an old two-storey building on the east shore. The porch light on the stoop means game night.',
    build: (g) => {
      g.add(meshAt(box(0.55, 0.4, 0.42), C.wall, [0, 0.2, 0]), meshAt(box(0.62, 0.08, 0.5), C.roofs[0], [0, 0.44, 0]));
      g.add(meshAt(box(0.5, 0.05, 0.14), C.wood, [0, 0.05, 0.28]));
      g.add(meshAt(new THREE.SphereGeometry(0.04, 8, 6), 0, [0.22, 0.3, 0.36], { mat: lampMat() }));
    } },
  { id: 'hall', name: 'The haunted house', at: [470, 108], desc: 'The old festival hall, boarded up for decades, alone in a clearing on the hill north of the lake.',
    build: (g) => {
      g.add(meshAt(box(0.9, 0.5, 0.7), 0x5e5a50, [0, 0.25, 0]), meshAt(box(1.0, 0.12, 0.8), C.dark, [0, 0.56, 0]));
      g.add(meshAt(box(0.25, 0.7, 0.25), 0x5e5a50, [0.3, 0.9, 0]), meshAt(new THREE.ConeGeometry(0.2, 0.3, 4), C.dark, [0.3, 1.4, 0], { ry: Math.PI / 4 }));
      [-0.3, 0, 0.3].forEach((x) => { g.add(meshAt(box(0.16, 0.22, 0.04), 0x3b2f23, [x, 0.3, 0.36])); g.add(meshAt(box(0.22, 0.03, 0.05), C.wood, [x, 0.3, 0.37], { ry: 0.6 })); });
    } },
  { id: 'tower', name: 'Lifeguard tower', at: () => LP(1.8, 0.08), desc: "Riot's red-and-white tower on the sandy south beach, with swim buoys out front.",
    build: (g) => {
      [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].forEach(([x, z]) => g.add(meshAt(new THREE.CylinderGeometry(0.02, 0.025, 0.85, 8), C.wood, [x, 0.42, z])));
      g.add(meshAt(box(0.66, 0.05, 0.66), C.wood, [0, 0.87, 0]));
      g.add(meshAt(new THREE.ConeGeometry(0.46, 0.3, 8), C.awnA, [0, 1.15, 0]));
    } },
  { id: 'park', name: 'The park', at: () => LP(1.15, 0.62), desc: 'Big lawn with old maples between the beach and the town. The one open space on the lake.',
    build: (g) => {
      g.add(meshAt(new THREE.CylinderGeometry(0.9, 0.9, 0.02, 24), C.lawn, [0, 0.01, 0], { s: [1, 1, 0.55] }));
      [[-0.45, -0.1], [0.4, 0.2], [0.1, -0.35]].forEach(([x, z]) => { g.add(meshAt(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 6), C.wood, [x, 0.15, z])); g.add(meshAt(new THREE.SphereGeometry(0.22, 10, 8), C.dec, [x, 0.42, z])); });
    } },
  { id: 'stage', name: 'Festival stage', at: () => LP(0.72, 0.12), desc: 'On the east beach, where the old festival game is played. Finale location.',
    build: (g) => { g.add(meshAt(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 16, 1, false, 0, Math.PI), C.wall, [0, 0.12, 0], { ry: Math.PI / 2 })); } },
  { id: 'brook', name: "Mrs. Brook's porch", at: () => LP(Math.PI, 0.36), desc: 'A cabin on the west side of Lakeshore Drive, straight across the water from the apartment. A candle in the window every storm night.',
    build: (g) => {
      g.add(meshAt(box(0.36, 0.25, 0.28), 0x4f6b5a, [0, 0.13, 0]), meshAt(box(0.42, 0.05, 0.34), C.roofs[3], [0, 0.27, 0]));
      g.add(meshAt(new THREE.SphereGeometry(0.03, 8, 6), C.yellow, [0.2, 0.08, 0.16], { mat: lampMat() }));
    } },
  { id: 'ranger', name: "Big Hal's ranger station", at: [118, 150], desc: 'End of the gravel road in the deep forest. Trails head up into the high woods.',
    build: (g) => { g.add(meshAt(box(0.4, 0.3, 0.32), 0x4f6b5a, [0, 0.15, 0]), meshAt(box(0.44, 0.04, 0.36), C.dark, [0, 0.32, 0]), meshAt(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), C.dark, [0.15, 0.56, 0])); } },
  { id: 'square', name: 'Town square', at: [840, 510], desc: 'A lawn with a bandstand and the town notice board, on Main Street opposite the Mayor\'s office.',
    build: (g) => {
      g.add(meshAt(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 8), C.wall, [0, 0.02, 0]), meshAt(new THREE.ConeGeometry(0.32, 0.22, 8), C.blue, [0, 0.2, 0]));
      g.add(meshAt(box(0.3, 0.2, 0.03), C.wood, [0.6, 0.12, 0.3]));
    } },
  { id: 'mayor', name: "Mayor's office", at: [842, 450], desc: 'Small town hall with a clock, on Main Street facing the town square.',
    build: (g) => { g.add(meshAt(box(0.45, 0.3, 0.3), C.wall, [0, 0.15, 0]), meshAt(box(0.1, 0.12, 0.1), C.wall, [0, 0.36, 0]), meshAt(new THREE.ConeGeometry(0.1, 0.12, 4), C.dark, [0, 0.48, 0], { ry: Math.PI / 4 })); } },
  { id: 'garage', name: "Gus's garage", at: [990, 450], desc: 'Workshop on Main Street with a radio mast on the roof. Gus runs the town radio from here.',
    build: (g) => { g.add(meshAt(box(0.5, 0.3, 0.36), 0xd8cfb8, [0, 0.15, 0]), meshAt(box(0.3, 0.2, 0.02), C.dark, [0, 0.1, 0.19])); g.add(meshAt(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 6), C.dark, [0.18, 0.47, 0])); } },
  { id: 'school', name: 'School and gym', at: [1000, 590], desc: 'Brick school with the old gym. Bash and Pip go Tuesdays and Thursdays because it is summer.',
    build: (g) => { g.add(meshAt(box(0.9, 0.36, 0.5), C.brick, [0, 0.18, 0]), meshAt(box(0.5, 0.5, 0.4), C.brick, [0.3, 0.25, -0.3])); } },
  { id: 'townline', name: 'The town line', at: [1458, 430], desc: 'The sign on Route 9 where summer stops. Past it the trees are already turning.',
    build: (g) => { g.add(meshAt(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), C.dark, [0, 0.2, 0]), meshAt(box(0.45, 0.2, 0.03), C.wall, [0, 0.42, 0])); } },
  { id: 'mill', name: 'Old mill', at: [830, 190], desc: 'The old mill on Fern Creek, with its wheel and the lumber yard beside it.',
    build: (g) => { g.add(meshAt(box(0.5, 0.35, 0.35), 0x8a6a4a, [0, 0.18, 0]), meshAt(new THREE.TorusGeometry(0.16, 0.025, 6, 16), C.wood, [0.36, 0.2, 0], { ry: Math.PI / 2 })); } },
  { id: 'lumber', name: 'Lumber yard', at: [868, 262], desc: 'Stacks of cut timber beside the mill.',
    build: (g) => { [0, 1, 2, 3, 4].forEach((k) => g.add(meshAt(box(0.6 + (k % 2) * 0.1, 0.05, 0.1), C.awnB, [0, 0.03 + k * 0.05, 0]))); } },
  { id: 'marina', name: 'Marina', at: () => LP(0.22, 0), desc: 'Three wooden piers with rowboats and a yellow floatplane. Not in the bible yet: a new idea.',
    build: (g) => { [0, 0.3, 0.6].forEach((z) => g.add(meshAt(box(0.5, 0.05, 0.05), C.wood, [0, 0.05, z - 0.3]))); g.add(meshAt(box(0.25, 0.05, 0.12), C.wall, [0.2, 0.06, 0.1])); } },
  { id: 'church', name: 'Lake church', at: [760, 670], desc: 'A small white church with a spire, between the houses and the lake.',
    build: (g) => { g.add(meshAt(box(0.3, 0.3, 0.42), C.wall, [0, 0.15, 0]), meshAt(box(0.2, 0.45, 0.2), C.wall, [0, 0.52, 0.1]), meshAt(new THREE.ConeGeometry(0.14, 0.3, 4), C.dark, [0, 0.9, 0.1], { ry: Math.PI / 4 })); } },
  { id: 'campground', name: 'Campground', at: [85, 690], desc: 'Tents and a fire ring in the west woods. A natural spot for ghost stories. Not in the bible yet.',
    build: (g) => { [[-0.25, -0.15, C.awnA], [0.1, -0.2, C.yellow], [0, 0.2, C.blue]].forEach(([x, z, c]) => g.add(meshAt(new THREE.ConeGeometry(0.14, 0.2, 4), c, [x, 0.1, z], { ry: Math.PI / 4 }))); g.add(meshAt(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 10), 0x5a4a3a, [0.3, 0.01, 0.1])); } },
  { id: 'lookout', name: 'Fire lookout', at: [1250, 262], desc: 'A little cabin on stilts on the ridge. You can see the whole town from here. Not in the bible yet.',
    build: (g) => { [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(([x, z]) => g.add(meshAt(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 6), C.wood, [x, 0.35, z]))); g.add(meshAt(box(0.3, 0.2, 0.3), C.wall, [0, 0.8, 0])); g.add(meshAt(new THREE.ConeGeometry(0.22, 0.14, 4), C.dark, [0, 0.97, 0], { ry: Math.PI / 4 })); } },
  { id: 'depot', name: 'Train depot', at: [900, 950], desc: 'A small station on the railway along the south edge. Trains pass but rarely stop. Not in the bible yet.',
    build: (g) => { g.add(meshAt(box(0.7, 0.25, 0.22), 0xa86b45, [0, 0.13, 0]), meshAt(box(0.74, 0.04, 0.26), C.dark, [0, 0.27, 0])); } },
  { id: 'water', name: 'Water tower', at: [1320, 750], desc: 'The water tower on the south-east edge of downtown.',
    build: (g) => { [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].forEach(([x, z]) => g.add(meshAt(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6), C.dark, [x, 0.25, z]))); g.add(meshAt(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 14), C.wall, [0, 0.62, 0])); } },
  { id: 'berry', name: 'Berry farm', at: [612, 910], desc: 'Berry bushes and a red barn at the south end of the valley.',
    build: (g) => { g.add(meshAt(box(0.4, 0.2, 0.22), 0xb5442f, [0, 0.1, 0])); } },
];

const clickable=[],placeGroups={};
for(const p of plan.sites){
 const g=new THREE.Group();g.name=p.id;g.userData={site:p.id,name:p.name,district:p.district,draft:p.draft,location_ids:p.location_ids};g.position.copy(M(...p.at));
 if(!buildLandmark(p,g)){const legacy=LEGACY_PLACES.find(l=>l.id===p.id);legacy?.build(g);}
 g.traverse(o=>{if(o.isMesh){o.userData.site=p.id;clickable.push(o);}if(o.isPointLight){o.userData.dayIntensity=o.intensity;}});
 if(p.parcel){const marker=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-p.parcel[0]/2,-p.parcel[1]/2],[p.parcel[0]/2,-p.parcel[1]/2],[p.parcel[0]/2,p.parcel[1]/2],[-p.parcel[0]/2,p.parcel[1]/2]].map(([x,y])=>new THREE.Vector3(x*S,.06,y*S))),new THREE.LineBasicMaterial({color:p.draft?0xb28259:0x6b9277,transparent:true,opacity:.65}));marker.position.copy(M(...p.at));layers.parcels.add(marker);}
 (p.draft?layers.drafts:layers.landmarks).add(g);placeGroups[p.id]=g;
}
// Every road/creek intersection receives a bridge deck rather than disappearing into water.
const bridges=[];
for(const creek of [creekIn,creekOut])for(let c=1;c<creek.length;c++)for(const road of roads)for(let i=1;i<road.pts.length;i++){
 const hit=intersection(creek[c-1],creek[c],road.pts[i-1],road.pts[i]);if(!hit)continue;
 const a=creek[c-1],b=creek[c],p=[a[0]+(b[0]-a[0])*hit.t,a[1]+(b[1]-a[1])*hit.t];if(bridges.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<9))continue;bridges.push(p);
 const g=new THREE.Group();g.name='creek bridge';g.position.copy(M(...p));g.rotation.y=-Math.atan2(road.pts[i][1]-road.pts[i-1][1],road.pts[i][0]-road.pts[i-1][0]);
 g.add(meshAt(box(.45,.035,road.w*S+.04),C.wood,[0,.05,0]));for(const z of [-road.w*S/2,road.w*S/2])g.add(meshAt(box(.45,.025,.018),C.wood,[0,.12,z]));layers.bridges.add(g);
}
layers.drafts.visible=false;layers.parcels.visible=false;
world.userData={town:'Maple Hollow',seed,units:'1 Three.js unit = 50 proposed planning metres',layout:'Proposed, not surveyed',sites:plan.sites,houseCount:houses.length,treeCount:placed,bridgeCount:bridges.length};
return {world,layers,placeGroups,clickable,litMats,houses,bridges};
}
