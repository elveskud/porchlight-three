// Lake day v2 as a 3D scene, built from the project's layer pipeline (art/hd):
//   - the clean background plate sits far back,
//   - the 17 foreground layers (tools/occluders.py) each sit at their own depth, scaled so everything lines up
//     with the painting from the starting camera,
//   - "Relief" turns the whole painting into a depth-shaped surface (from the depth map).
// Move the mouse to look around: the layers slide against each other (parallax). Scroll to zoom.

import * as THREE from 'three';

const SET = 'lake_day_v2';
const HD = 'art/hd';
const W = 16, H = W * 572 / 1024;          // the painting, in world units
const CAM_Z = 16;
const BG_Z = -4.75;                         // clean plate depth (z -9.5 in the pipeline, halved)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.style.cssText = 'margin:0;overflow:hidden;background:#111;font-family:system-ui,sans-serif';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, CAM_Z);

const loader = new THREE.TextureLoader();
const tex = (url) => { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// scale that makes a plane at depth z line up with the painting seen from the starting camera
const fit = (z) => (CAM_Z - BG_Z) / (CAM_Z - z);

// the starting camera sees height H at the background: pick the field of view so it fills the window
function setFov() {
  const dist = CAM_Z - BG_Z;
  const va = innerWidth / innerHeight, pa = W / H;
  const h = va > pa ? W / va : H;                       // fill the window, crop the rest
  camera.fov = 2 * Math.atan(h / 2 / dist) * 180 / Math.PI;
  camera.aspect = va;
  camera.updateProjectionMatrix();
}
setFov();

const world = new THREE.Group();
scene.add(world);
const layers = new THREE.Group();
world.add(layers);

// clean plate (the painting with the foreground objects painted out)
const bg = new THREE.Mesh(
  new THREE.PlaneGeometry(W * fit(BG_Z), H * fit(BG_Z)),
  new THREE.MeshBasicMaterial({ map: tex(`${HD}/sets/${SET}_clean.png`) }),
);
bg.position.z = BG_Z;
layers.add(bg);

// foreground layers, each at its own depth
fetch(`${HD}/sets/${SET}.json`).then((r) => r.json()).then((spec) => {
  spec.fronts.forEach((f) => {
    const z = f.z * 0.5;                                 // pipeline depth -> world depth
    const s = fit(z);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(W * s, H * s),
      new THREE.MeshBasicMaterial({ map: tex(`${HD}/fronts/${SET}_${f.name}.png`), transparent: true, depthWrite: false }),
    );
    m.position.z = z;
    m.renderOrder = z;
    layers.add(m);
  });
  info.textContent = `Lake day v2 · ${spec.fronts.length} layers + clean plate`;
});

// relief: the whole painting pushed out by its depth map (a real 3D surface)
const relief = new THREE.Mesh(
  new THREE.PlaneGeometry(W, H, 320, 180),
  new THREE.MeshStandardMaterial({
    map: tex(`${HD}/sets/${SET}.png`),
    displacementMap: tex(`${HD}/occluders/${SET}_depth.png`),
    displacementScale: 4, displacementBias: -2, roughness: 1,
  }),
);
relief.material.map.colorSpace = THREE.SRGBColorSpace;
relief.scale.setScalar(fit(0));
relief.visible = false;
scene.add(relief);
const light = new THREE.DirectionalLight(0xffffff, 2.4);
light.position.set(-3, 4, 8);
scene.add(light, new THREE.AmbientLight(0xffffff, 1.2));

// UI
const info = document.createElement('div');
info.style.cssText = 'position:fixed;top:12px;left:12px;padding:8px 12px;border-radius:10px;background:rgba(248,250,243,.92);color:#2b3529;font-size:13px';
info.textContent = 'Lake day v2';
document.body.appendChild(info);
const bar = document.createElement('div');
bar.style.cssText = 'position:fixed;bottom:12px;left:12px;display:flex;gap:6px';
bar.innerHTML = `<button id="b-layers">Layers</button><button id="b-relief">Relief</button><button id="b-explode">Explode layers</button>`;
document.body.appendChild(bar);
bar.querySelectorAll('button').forEach((b) => { b.style.cssText = 'font:inherit;padding:6px 10px;border-radius:8px;border:1px solid #d2d9c8;background:rgba(248,250,243,.95);cursor:pointer'; });

let mode = 'layers', explode = false;
const setMode = (m) => { mode = m; layers.visible = m === 'layers'; relief.visible = m === 'relief'; };
bar.querySelector('#b-layers').onclick = () => setMode('layers');
bar.querySelector('#b-relief').onclick = () => setMode('relief');
bar.querySelector('#b-explode').onclick = () => { explode = !explode; };

// look around: pointer moves the camera sideways, so near layers slide against far ones
const ptr = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = (e.clientY / innerHeight) * 2 - 1; });
let zoom = 0;
addEventListener('wheel', (e) => { zoom = Math.max(-6, Math.min(6, zoom + e.deltaY * 0.01)); });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); setFov(); });

const params = new URLSearchParams(location.search);
if (params.get('mode') === 'relief') setMode('relief');
if (params.get('x')) { ptr.x = Number(params.get('x')); ptr.y = Number(params.get('y') || 0); }

function tick(t) {
  requestAnimationFrame(tick);
  const tx = ptr.x * 2.2, ty = -ptr.y * 1.2;
  camera.position.x += (tx - camera.position.x) * 0.08;
  camera.position.y += (ty - camera.position.y) * 0.08;
  camera.position.z = CAM_Z - zoom;
  camera.lookAt(0, 0, BG_Z * 0.5);
  // explode: pull the layers apart in depth so you can see each one
  layers.children.forEach((m, i) => { if (i > 0) m.position.z = (m.userData.z0 ??= m.position.z) + (explode ? i * 0.35 : 0); });
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
