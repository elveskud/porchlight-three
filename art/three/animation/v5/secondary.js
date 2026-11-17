// v5 secondary motion: ears, tail, clothing and breathing that react to how the body just moved.
// Everything is computed from the speed at time t and a moment earlier, never from frame history,
// so jumping to any frame gives the same picture (seek-safe).
import * as THREE from 'three';
import {profiles} from '../v4/performance.js';
import {clamp} from './math.js';
export {groupReaction, stagedDiscovery, seatResponse, volumeScale} from '../v4/secondary.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/**
 * @param speedNow   walking speed now (world units / s)
 * @param speedBefore  speed `lag` seconds earlier (so a stop shows as drag: ears and tail swing on after the body halts)
 */
export function followThrough(r, pose, t, {speedNow = 0, speedBefore = 0, seated = false, colliders = []} = {}) {
  const id = r.root.userData.castId, c = profiles[id], drag = clamp((speedBefore - speedNow) / 2.5, -1, 1), moving = clamp(speedNow / 2, 0, 1);
  r.spine.scale.multiply(V(1 + .0035 * Math.sin(t * c.breath), 1 + .0035 * Math.sin(t * c.breath), 1 + .0035 * Math.sin(t * c.breath)));
  r.head.scale.x *= 1 / Math.max(.94, Math.cos(r.head.rotation.y));
  r.ears.forEach((ear, i) => {
    ear.rotation.x += drag * .22 + moving * .02 * Math.sin(t * 7 - i * .5);
    ear.rotation.z += .025 * (pose.laugh || 0) * Math.sin(t * 11 - i * .3);
  });
  r.tail.chain.forEach((bone, i) => {
    bone.rotation.z += drag * .35 * Math.exp(-i * .18) + moving * .03 * Math.sin(t * 4.5 - i * .6);
  });
  if (seated) r.tail.chain[0].rotation.z = id === 'rocco' ? -1.0 : .85;
  const corrections = [];
  if (colliders.length && r.tail.chain.length > 1) {
    for (let attempt = 0; attempt < 4; attempt++) {
      r.root.updateMatrixWorld(true); let hit = false;
      for (const bone of r.tail.chain.slice(1)) if (colliders.some(box => box.containsPoint(bone.getWorldPosition(V())))) { hit = true; break; }
      if (!hit) break;
      r.tail.chain[0].rotation.z += id === 'rocco' ? -.15 : .15; corrections.push('tail');
    }
  }
  // Clothing hem swings out when moving and trails after a stop.
  const flap = .004 + .012 * moving + .012 * Math.abs(drag);
  for (const {o, base} of r.motion.clothing) {
    const a = o.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], hem = Math.max(0, 1 - (y + .5));
      a.setXYZ(i, x, y, z + flap * hem * Math.sin(t * 3.1 + x * 5) + .02 * drag * hem);
    }
    a.needsUpdate = true;
  }
  r.motion.secondary = {...(r.motion.secondary || {}), tailCorrections: corrections.length, drag};
  r.root.updateMatrixWorld(true);
}
