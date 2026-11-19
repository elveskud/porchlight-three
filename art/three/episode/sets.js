// Episode 4 v5 set dressing, on top of sets.js (v4, unchanged). 17 Nov review: backgrounds must feel full; seated characters must really sit.
//  - park: more trees (both sides), shoreline bushes, flower patches, grass tufts, corner grass blades like the painting, a path,
//    a picnic blanket and basket, a lamp post, a rowboat, ducks on the lake and birds in the sky.
//  - apartment: the sofa and beanbag are rescaled to the actors' size (they were built for a body about twice as tall, so legs hung in the air and
//    cut into the cushions); Rocco gets a real beanbag to sit on.
import * as THREE from 'three';
import {createKit} from '../sets/primitives.js';
import {prepareEpisodeSets} from './sets-reference.js';
const rnd = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };   // deterministic 0..1

/** Seat heights used by the driver (world units): the top of the sofa cushions and of the beanbag mound after rescaling. */
export const SEATS = {sofaTop: 0.815 * 0.42, beanbagTop: 0.56, sofaFrontZ: -1.26};

function dressApartment(room) {
  const sofa = room.getObjectByName('orange sofa');
  if (sofa) sofa.scale.y = 0.42;                                     // seat top 0.815 -> 0.34: feet reach the floor; legs no longer sink into the cushions
  const bean = room.getObjectByName('green beanbag');
  if (bean) {
    const seat = bean.getObjectByName('beanbag seat'), back = bean.getObjectByName('beanbag back');
    if (seat) { seat.scale.set(1.05, 0.30, 0.85); seat.position.set(0, 0.26, 0); }
    if (back) { back.scale.set(0.85, 0.50, 0.30); back.position.set(0, 0.60, -0.38); }
  }
}

function dressPark(park, anim) {
  const k = createKit(park, 'day'), {box, sphere, beam, group, tree, cylinder, mesh} = k;
  const G = [0x5f8f4c, 0x6e9d55, 0x4f7f45, 0x78a45a];
  // Trees on the land (the lake starts at z = -7). Both sides, a few depths: the frame is never a bare lawn.
  for (const [x, z, s] of [[-9.8, -4.2, 1.35], [-12.8, -1.2, 1.6], [-14.5, 3.5, 1.5], [13, -3.8, 1.5], [16.5, -0.5, 1.8], [11, -5.8, 1.2], [-2.5, -6.0, 1.0], [3.5, -6.2, 1.1]]) tree([x, 0, z], s);
  // Bushes: shoreline clumps and corners of the tables.
  const bush = (x, z, s = 1, c = 0) => { const g = group('park bush', [x, 0, z]); for (let i = 0; i < 3; i++) sphere('bush mass', G[(c + i) % 4], [(i - 1) * 0.55 * s, 0.38 * s, (i % 2) * 0.2], [0.75 * s, 0.55 * s, 0.7 * s], g); return g; };
  for (const [i, x] of [-8.2, -4.4, 0.6, 4.2, 9.4, 12.6].entries()) bush(x, -5.7 + (i % 2) * 0.5, 1 + (i % 3) * 0.15, i);
  bush(9.8, 0.2, 1.0, 3);
  // Flower patches and grass tufts across the near lawn. No ink on these tiny things (they would turn into dark specks).
  const COLORS = [0xf2d04a, 0xf08a9c, 0xffffff, 0xb48ae0];
  let n = 0;
  for (const [px, pz] of [[-7.5, 6.0], [-2.6, 7.2], [3.9, 6.6], [8.4, 5.8], [-10.5, 4.2], [11.5, 3.8]]) {
    const g = group('flower patch', [px, 0, pz]);
    for (let i = 0; i < 9; i++, n++) {
      const x = (rnd(n, 1) - 0.5) * 2.2, z = (rnd(n, 2) - 0.5) * 1.4, h = 0.22 + rnd(n, 3) * 0.14;
      const stem = beam('flower stem', 0x4f7f45, [x, 0, z], [x + 0.02, h, z], 0.012, g); stem.userData.noInk = true;
      const f = sphere('flower head', COLORS[(n + i) % 4], [x + 0.02, h, z], [0.05, 0.05, 0.05], g); f.userData.noInk = true;
    }
  }
  for (let c = 0; c < 34; c++) {
    const x = (rnd(c, 4) - 0.5) * 30, z = 2.6 + rnd(c, 5) * 7, g = group('grass tuft', [x, 0, z]);
    for (let i = 0; i < 4; i++) { const a = (i - 1.5) * 0.16, b = beam('grass blade', 0x4f7f45, [a, 0, 0], [a * 1.8 + (rnd(c, i) - 0.5) * 0.1, 0.30 + rnd(c, 6 + i) * 0.14, 0.02], 0.012, g); b.userData.noInk = true; }
  }
  // Tall grass blades in the lower corners, like the painting (23_park_day.jpg): thin cones, leaning outward.
  for (const side of [-1, 1]) for (let i = 0; i < 22; i++) {
    const x = side * (5.0 + rnd(i, 7) * 3.4), z = 8.4 + rnd(i, 8) * 0.9, h = 0.6 + rnd(i, 9) * 0.8;
    const bl = mesh('foreground grass blade', new THREE.ConeGeometry(0.045, 1, 3), [0x3f6f3a, 0x4f7f45, 0x35612f][i % 3], [x, h / 2, z], [1, h, 0.6], park, {ink: false});
    bl.rotation.z = -side * (0.08 + rnd(i, 10) * 0.28); bl.userData.noInk = true;
  }
  // A sandy path from the foreground to the shore, stepping stones, a blanket with a basket and a ball, a lamp post.
  const PATH = [[-2.6, 12], [-1.4, 8.5], [0.6, 5], [2.2, 1.2], [2.6, -2.5], [2.9, -5.6]];
  for (let i = 0; i < PATH.length - 1; i++) {
    const [x0, z0] = PATH[i], [x1, z1] = PATH[i + 1], len = Math.hypot(x1 - x0, z1 - z0);
    const seg = box('sandy path', 0xd6c48f, [(x0 + x1) / 2, 0.012, (z0 + z1) / 2], [1.7, 0.02, len + 0.5], park, {ink: false}); seg.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  }
  for (const [x, z] of [[-4.2, 4.6], [-5.2, 5.4], [6.2, 4.4], [7.1, 5.2]]) cylinder('stepping stone', 0xaaa597, [x, 0.02, z], 0.32, 0.05, park);
  const blanket = group('picnic blanket', [-6.4, 0, 6.6]); blanket.scale.setScalar(0.85);
  box('blanket', 0xc75a48, [0, 0.02, 0], [2.4, 0.03, 1.7], blanket, {ink: false});
  for (const x of [-0.8, 0, 0.8]) box('blanket stripe', 0xf1e6cf, [x, 0.04, 0], [0.22, 0.01, 1.7], blanket, {ink: false});
  box('picnic basket', 0x9c7a45, [-0.4, 0.2, 0.1], [0.62, 0.34, 0.44], blanket);
  k.torus('basket handle', 0x7a5c33, [-0.4, 0.4, 0.1], 0.2, 0.025, blanket, [0, 0, 0]);
  sphere('beach ball', 0xd9503f, [0.75, 0.13, 0.3], [0.13, 0.13, 0.13], blanket);
  const lamp = group('park lamp post', [-12.5, 0, -2.0]); beam('lamp post', 0x394248, [0, 0, 0], [0, 3.1, 0], 0.07, lamp); sphere('lamp globe', 0xfff1c9, [0, 3.3, 0], [0.26, 0.26, 0.26], lamp);
  // Lake life: a rowboat, ducks (they bob), a buoy; birds in the sky (they flap).
  const boat = group('rowboat', [-2.4, 0.05, -11]); boat.rotation.y = 0.3;
  sphere('boat hull', 0xb5493a, [0, 0.05, 0], [1.25, 0.3, 0.55], boat); sphere('boat inside', 0xd9b58a, [0, 0.16, 0], [1.0, 0.12, 0.4], boat);
  box('boat seat', 0x8c6a3f, [0, 0.2, 0], [0.12, 0.05, 0.7], boat);
  sphere('buoy', 0xe0533d, [9, 0.1, -13], [0.22, 0.28, 0.22]); sphere('buoy stripe', 0xffffff, [9, 0.2, -13], [0.23, 0.07, 0.23]);
  for (const [i, [x, z]] of [[-6.5, -9.2], [-5.4, -9.9], [4.8, -10.5], [6.1, -9.7], [7.0, -11.2]].entries()) {
    const d = group('duck', [x, 0.04, z]); d.userData.phase = i * 1.3; d.rotation.y = i % 2 ? 0.6 : -0.5;
    sphere('duck body', i % 3 === 0 ? 0xefe9d8 : 0xb98f5a, [0, 0.12, 0], [0.34, 0.2, 0.22], d); sphere('duck head', 0x2f7050, [0.28, 0.3, 0], [0.14, 0.14, 0.14], d);
    box('duck beak', 0xf0a030, [0.43, 0.28, 0], [0.12, 0.04, 0.08], d, {ink: false}); anim.ducks.push(d);
  }
  for (let i = 0; i < 4; i++) {
    const b = group('bird', [-14 + i * 9 + (i % 2) * 3, 11 + (i % 3) * 1.6, -28]); b.userData.phase = i * 0.9;
    const l = box('bird wing left', 0x39414a, [-0.5, 0, 0], [1.0, 0.1, 0.25], b, {ink: false}), r = box('bird wing right', 0x39414a, [0.5, 0, 0], [1.0, 0.1, 0.25], b, {ink: false});
    b.userData.wings = [l, r]; b.scale.setScalar(1.15); anim.birds.push(b);
  }
}

/** Build the v4 sets, dress them, tag the new meshes for the look, and return an animate(t) function for ducks and birds. */
export function prepareEpisodeSetsV5(modeled) {
  const info = prepareEpisodeSets(modeled);
  const anim = {ducks: [], birds: []};
  dressApartment(modeled.apartment);
  dressPark(modeled.park, anim);
  for (const id of ['park', 'apartment']) modeled[id].traverse((o) => {
    if (!o.isMesh || !o.material?.color || o.userData.referenceColor) return;
    o.userData.referenceSet = id; o.userData.referenceColor = o.material.color.getHexString();
  });
  const animate = (t) => {
    for (const d of anim.ducks) { d.position.y = 0.04 + 0.025 * Math.sin(t * 1.7 + d.userData.phase); d.rotation.z = 0.05 * Math.sin(t * 1.3 + d.userData.phase); }
    for (const b of anim.birds) { const w = 0.35 * Math.sin(t * 7 + b.userData.phase); b.userData.wings[0].rotation.z = w; b.userData.wings[1].rotation.z = -w; b.position.x += 0; }
  };
  return {...info, animate};
}
