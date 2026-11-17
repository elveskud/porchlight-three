// v5 locomotion: walks, runs and standing balance.
//
// The walk is *evaluated from a footstep plan* written by pipeline/gait_plan.py (path.plan).
//  - The pelvis follows a trapezoid speed profile (speed up, cruise, slow down).
//  - Every foot stays exactly where it landed until its takeoff time, then swings to the next landing.
//  - The walk starts and ends with both feet together, so there is no pop when the walk ends.
// Standing uses the actor's rest feet (planted at fixed spots) plus a slow weight shift, so bodies are never statues.
import * as THREE from 'three';
import {atDistance, pathInfo} from '../v4/locomotion.js';
import {clamp, mix, ease, hash01, PI} from './math.js';
export {pathInfo, atDistance};
// Seat, rise and crouch poses are unchanged from v4.
export {seatPose, settleSeat, risePose, crouchPose} from '../v4/locomotion.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TURN_TIME = 0.55;                 // seconds spent turning to the end facing
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** Pelvis distance along the path and speed at time t (matches pipeline/gait_plan.py distance_at). */
export function pelvisState(path, t) {
  const {plan} = path, D = path.end - path.start, r = plan.ramp, v = plan.cruise, L = plan.length;
  const u = clamp(t - path.start, 0, D);
  if (u < r) return {distance: v * u * u / (2 * r), speed: v * u / r};
  if (u <= D - r) return {distance: v * r / 2 + v * (u - r), speed: v};
  const w = D - u;
  return {distance: L - v * w * w / (2 * r), speed: v * w / r};
}

/** Direction the path points at distance d, as a yaw angle. */
function headingAt(path, d) {
  // Clamp inside the path: a lookahead past the last point would give a zero-length direction (heading 0).
  d = clamp(d, 0.05, Math.max(0.1, path.plan.length - 0.05));
  const a = atDistance(path, d - 0.05).point, b = atDistance(path, d + 0.05).point;
  return Math.atan2(b.x - a.x, b.z - a.z);
}

/** Facing at time t: the walking direction, turning to path.endYaw over the last TURN_TIME seconds. */
export function yawAt(path, t) {
  const heading = headingAt(path, pelvisState(path, t).distance + 0.1);
  if (path.endYaw === undefined || path.endYaw === null) return heading;
  return heading + wrapAngle(path.endYaw - heading) * ease((t - (path.end - TURN_TIME)) / TURN_TIME);
}

/**
 * Before a walk whose startYaw differs from its direction, the actor makes a stepping turn on the spot during the
 * PRE_TURN seconds before path.start, then walks straight off. Returns {yaw, turn} for stand(); turn is null when not turning.
 */
export const PRE_TURN = 0.4;
export function preTurn(path, t) {
  const heading = headingAt(path, 0.1), from = path.startYaw;
  if (from === undefined || from === null) return {yaw: heading, turn: null};
  const u = (t - (path.start - PRE_TURN)) / PRE_TURN;
  if (u <= 0) return {yaw: from, turn: null};
  if (u >= 1) return {yaw: heading, turn: null};
  return {yaw: from + wrapAngle(heading - from) * ease(u), turn: {from, to: heading, u}};
}

/**
 * Yaw a foot keeps while planted. Mid-walk steps are placed relative to the walking direction (not the body, which may
 * still be turning), so feet never end up too far behind. The last two steps use the end facing, so the walk finishes
 * with both feet side by side under the final pose.
 */
function landingYaw(path, step, index) {
  const steps = path.plan.steps;
  if (path.endYaw !== undefined && path.endYaw !== null && index >= steps.length - 1) return path.endYaw;     // only the closing step takes the final facing
  return yawAt(path, step.land);                                                                              // earlier steps follow the body, which is already turning
}

/** Where is this foot at time t? Returns {dist, yaw, swing (0..1 or null), lift, planted, sinceLand, ahead}. */
export function footState(path, side, t) {
  const {plan} = path, steps = plan.steps;
  const mine = steps.map((s, i) => ({s, i})).filter(x => x.s.side === side);
  const startYaw = headingAt(path, 0.1);   // a path with startYaw has already turned (see preTurn)
  let state = {dist: 0, yaw: startYaw, swing: null, lift: 0, planted: true, sinceLand: 1e9, stepIndex: -1};
  for (const {s, i} of mine) {
    if (t < s.takeoff) break;
    const yawFrom = state.yaw, yawTo = landingYaw(path, s, i);
    if (t < s.land) {
      const u = (t - s.takeoff) / (s.land - s.takeoff), e = ease(u);
      const liftMax = plan.mode === 'run' ? 0.13 : 0.075;
      return {dist: mix(s.from, s.to, e), yaw: yawFrom + wrapAngle(yawTo - yawFrom) * e, swing: u,
              lift: liftMax * Math.sin(PI * u) * clamp(plan.step / 0.45, 0.5, 1.3), planted: false, sinceLand: -1, stepIndex: i};
    }
    state = {dist: s.to, yaw: yawTo, swing: null, lift: 0, planted: true, sinceLand: t - s.land, stepIndex: i};
  }
  return state;
}

/** Ankle height above the ground for a foot rolled by `roll` radians (keeps the sole above the floor). */
const ankle = (roll, scale) => (0.085 * Math.sin(roll) + Math.sqrt((0.105 * Math.cos(roll)) ** 2 + (0.235 * Math.sin(roll)) ** 2)) * scale;

/** Root-local rest offset of a foot, as a world offset for a body facing `yaw`. */
function restOffset(r, side, yaw) {
  const rest = r.motion.restFeet[side], scale = r.root.getWorldScale(V()).y;
  const right = V(Math.cos(yaw), 0, -Math.sin(yaw)), forward = V(Math.sin(yaw), 0, Math.cos(yaw));
  return right.multiplyScalar(rest.x * scale).add(forward.multiplyScalar(rest.z * scale));
}

/**
 * Evaluate the walk at time t. Returns everything applyGait needs. `r` is only used for the rest foot spacing.
 */
export function gait(path, t, r, {ground = null} = {}) {
  const {plan} = path, {distance, speed} = pelvisState(path, t), yaw = yawAt(path, t);
  const centre = atDistance(path, distance).point;
  if (ground) centre.y = ground(centre.x, centre.z);
  const feet = {}, dist = {};
  for (const side of ['L', 'R']) {
    const f = footState(path, side, t);
    dist[side] = f.dist;
    const p = atDistance(path, f.dist).point.add(restOffset(r, side, f.yaw));
    if (ground) p.y = ground(p.x, p.z);
    p.y += f.lift;
    // Heel strike just after landing, toes up in the air, toe-off as the pelvis passes well ahead of the foot.
    const ahead = (distance - f.dist) / plan.step;
    let roll = 0;
    if (f.swing !== null) roll = -0.15 * Math.sin(PI * f.swing);
    else { roll = -0.10 * clamp(1 - f.sinceLand / 0.08, 0, 1) + 0.20 * clamp((ahead - 0.3) / 0.3, 0, 1); }
    feet[side] = {target: p, roll, planted: f.planted, dist: f.dist, yaw: f.yaw, swing: f.swing, stepIndex: f.stepIndex};
  }
  const run = plan.mode === 'run';
  const w = ease(speed / (0.55 * plan.cruise));                // 0 standing .. 1 at pace
  const swing = clamp((dist.R - dist.L) / plan.step, -1.2, 1.2);      // >0 when the right foot is ahead: left arm forward
  const q = ((distance / plan.step + plan.lead) % 1 + 1) % 1;       // 0 at every landing
  const stanceStep = plan.swing >= 0.5 ? 0.76 : 1.24;                 // stance length in steps
  const bob = (run ? -1 : 1) * Math.cos(2 * PI * (q - stanceStep / 2)) * (run ? 0.04 : 0.018) * w;
  const sway = Math.cos(PI * (distance / plan.step - plan.lead)) * w;       // +1 when the weight is on the left foot
  return {id: path.id, position: centre, yaw, distance, speed, run, feet, w, swing, bob, sway, step: plan.step, moving: t > path.start && t < path.end};
}

/** Solve a two-bone leg to a world target. `yaw` (optional) sets the facing of the foot independently of the body. */
export function solveLeg(r, key, target, {roll = 0, yaw = null} = {}) {
  const leg = key === 'L' ? r.legL : r.legR, parent = r.pelvis;
  parent.updateWorldMatrix(true, true);
  const end = parent.worldToLocal(target.clone()), start = leg.hip.position.clone(), d = end.sub(start);
  const a = 0.55, b = 0.42, len = clamp(d.length(), 0.15, a + b - 0.0001);
  d.normalize();
  const along = (a * a - b * b + len * len) / (2 * len), height = Math.sqrt(Math.max(1e-6, a * a - along * along));
  const bend = V(0, 0, 1); bend.addScaledVector(d, -bend.dot(d)).normalize();
  const knee = start.clone().addScaledVector(d, along).addScaledVector(bend, height), goal = start.clone().addScaledVector(d, len);
  leg.hip.quaternion.setFromUnitVectors(V(0, -1, 0), knee.clone().sub(start).normalize());
  const lower = goal.sub(knee).applyQuaternion(leg.hip.quaternion.clone().invert()).normalize();
  leg.knee.quaternion.setFromUnitVectors(V(0, -1, 0), lower);
  r.root.updateMatrixWorld(true);
  const desired = yaw === null ? r.root.getWorldQuaternion(new THREE.Quaternion())
    : new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw);
  leg.foot.quaternion.copy(leg.knee.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(desired));
  leg.foot.rotateX(roll);
  r.root.updateMatrixWorld(true);
}

/**
 * Lower the pelvis just enough that both legs can reach their targets (keeps knees within reach).
 * The total drop is capped (`cap`, rig units): when a foot is further than that, the leg simply stops at full reach for that drawing
 * (a foot a hair short of its mark) instead of the whole body ducking: a one-drawing dip reads as a glitch, a short foot does not.
 */
function reachDrop(r, targets, cap = 0.12) {
  const scale = r.root.getWorldScale(V()).y; let total = 0;
  for (let pass = 0; pass < 3; pass++) {
    let drop = 0; r.root.updateMatrixWorld(true);
    for (const key of ['L', 'R']) {
      const {target, roll} = targets[key], t = target.clone(); t.y += ankle(roll, scale);
      const leg = key === 'L' ? r.legL : r.legR, end = r.pelvis.worldToLocal(t).sub(leg.hip.position);
      const vertical = Math.sqrt(Math.max(0.04, 0.965 ** 2 - end.x ** 2 - end.z ** 2));
      drop = Math.max(drop, -end.y - vertical);
    }
    if (drop < 1e-5 || total >= cap) break;
    const step = Math.min(0.18, drop + 0.001, cap - total); r.pelvis.position.y -= step; total += step;
  }
}

/** Apply a walk sample to an actor: root, pelvis, both legs, counter-swinging arms, torso twist. */
export function applyGait(r, s) {
  r.root.position.copy(s.position); r.root.rotation.set(0, s.yaw, 0);
  const rest = r.motion.restPelvisY, scale = r.root.getWorldScale(V()).y;
  const meanDrop = s.run ? 0.14 : 0.10;
  const sideL = Math.sign(r.motion.restFeet.L.x) || -1;
  r.pelvis.position.y = rest - meanDrop * s.w + s.bob;
  r.pelvis.position.x = sideL * 0.03 * s.w * s.sway;
  r.pelvis.rotation.y += 0.06 * s.swing * s.w * (s.run ? 1.4 : 1);
  r.root.updateMatrixWorld(true);
  reachDrop(r, s.feet);
  r.motion.contacts = [];
  for (const key of ['L', 'R']) {
    const f = s.feet[key], t = f.target.clone(); t.y += ankle(f.roll, scale);
    solveLeg(r, key, t, {roll: f.roll, yaw: f.yaw});
    r.motion.contacts.push({side: key, stance: f.planted, dist: f.dist, target: t.toArray(), actual: (key === 'L' ? r.legL : r.legR).foot.getWorldPosition(V()).toArray()});
  }
  // Opposite arm swings with each leg. Added on top of the gesture pose so speaking arms are not wiped.
  const amp = (s.run ? 0.75 : 0.34) * s.w;
  r.armL.sh.rotation.x -= amp * s.swing;
  r.armR.sh.rotation.x += amp * s.swing;
  if (s.run) { r.armL.el.rotation.x -= 0.9 * s.w; r.armR.el.rotation.x -= 0.9 * s.w; }
  const twist = -0.075 * s.swing * s.w * (s.run ? 1.4 : 1);
  r.spine.rotation.y += twist; r.head.rotation.y -= twist * 0.6;
  r.spine.rotation.x += (s.run ? 0.13 : 0.03) * s.w;
  r.head.rotation.x -= (s.run ? 0.07 : 0.015) * s.w;
}

/**
 * Slow deterministic weight shift for a standing actor. Returns channels in rig units / radians.
 * It is a pure function of (id, t): the same time always gives the same pose.
 */
export function idleBalance(id, t, {energy = 1} = {}) {
  const period = 3.8 + 3.0 * hash01(id, 1), offset = hash01(id, 2) * period;
  const x = Math.sin(2 * PI * (t + offset) / period);
  const shiftCurve = Math.tanh(2.4 * x) / Math.tanh(2.4);          // holds a pose, then moves: reads as a weight shift on twos
  const amp = (0.7 + 0.5 * hash01(id, 3)) * energy;
  const settle = 0.5 + 0.5 * Math.cos(PI * shiftCurve);             // 1 when centred, 0 when fully shifted
  return {
    shift: 0.050 * amp * shiftCurve,                                // pelvis moves over the support foot
    sway: 0.060 * amp * shiftCurve,                                 // far hip drops
    drop: 0.032 + 0.016 * settle,                                   // knees never locked straight
    counter: -0.050 * amp * shiftCurve,                             // chest tilts against the hips
    headCounter: 0.018 * amp * shiftCurve,
    side: Math.sign(shiftCurve) || 1,
  };
}

/**
 * Stand with both feet planted at the actor's rest spots, with idle weight shift.
 * Use instead of v4 plantFeet. `ground(x,z)` gives floor height; `idle` comes from idleBalance (or null for none).
 */
export function stand(r, ground = () => r.root.position.y, {idle = null, yaw = null, turn = null} = {}) {
  r.root.updateMatrixWorld(true);
  const scale = r.root.getWorldScale(V()).y, targets = {}, rootPos = r.root.position;
  // World spot of a rest foot for a body facing `facing` (root position is fixed while standing).
  const spot = (key, facing) => {
    const o = restOffset(r, key, facing), p = rootPos.clone().add(o);
    p.y = ground(p.x, p.z);
    return p;
  };
  const yawNow = yaw ?? r.root.rotation.y, feetYaw = {L: yawNow, R: yawNow};
  if (turn) {
    // A stepping turn: one foot steps to its new spot, then the other. Planted feet never slide.
    const lead = wrapAngle(turn.to - turn.from) >= 0 ? 'L' : 'R', follow = lead === 'L' ? 'R' : 'L';
    const phase = {[lead]: ease(turn.u / 0.55), [follow]: ease((turn.u - 0.45) / 0.55)};
    for (const key of ['L', 'R']) {
      const a = phase[key], from = spot(key, turn.from), to = spot(key, turn.to), p = from.clone().lerp(to, a);
      p.y = ground(p.x, p.z) + 0.07 * Math.sin(PI * a) * scale / 0.56;
      targets[key] = {target: p, roll: -0.12 * Math.sin(PI * a), a};
      feetYaw[key] = turn.from + wrapAngle(turn.to - turn.from) * a;
    }
  } else {
    for (const key of ['L', 'R']) targets[key] = {target: spot(key, yawNow), roll: 0};
  }
  const sideL = Math.sign(r.motion.restFeet.L.x) || -1;
  if (idle && !turn) {
    r.pelvis.position.y = r.motion.restPelvisY - idle.drop;
    r.pelvis.position.x = idle.shift * -sideL;       // positive shift = over the right-hand foot (checked by eye in the stills)
    r.pelvis.rotation.z += idle.sway * -sideL;
    r.spine.rotation.z += idle.counter * -sideL;
    r.head.rotation.z += idle.headCounter * -sideL;
  } else r.pelvis.position.y = r.motion.restPelvisY - 0.02;
  r.root.updateMatrixWorld(true);
  reachDrop(r, targets);
  r.motion.contacts = [];
  for (const key of ['L', 'R']) {
    const {target, roll} = targets[key], t = target.clone(); t.y += ankle(roll, scale);
    solveLeg(r, key, t, {roll, yaw: feetYaw[key]});
    const a = targets[key].a, planted = a === undefined || a <= 1e-6 || a >= 1 - 1e-6;
    r.motion.contacts.push({side: key, stance: planted, dist: a === undefined ? null : a <= 1e-6 ? 'from' : a >= 1 - 1e-6 ? 'to' : a, target: t.toArray(), actual: (key === 'L' ? r.legL : r.legR).foot.getWorldPosition(V()).toArray()});
  }
}

/**
 * Seated legs that fit the seat. The hip sits at `hipY` (world, the root's height); the floor is at `floor`.
 * If the feet can reach the floor with shins straight down, the thighs tilt down just enough to put the soles on it.
 * If the seat is too high for that (a kid on a tall chair), the thighs go level and the shins swing a little: dangling legs.
 * Returns {f, k} for p.lLf = p.lRf = f and p.lLk = p.lRk = k. A pure function of its inputs (seek-safe).
 */
export function seatedLegs({hipY, floor = 0, scale, t = 0, id = '', swing = 0.05}) {
  const local = (hipY - floor) / scale, cosf = (local - (0.115 + 0.42)) / 0.55;      // 0.115 = foot clearance, 0.42 = shin, 0.55 = thigh (rig units)
  if (cosf <= 0.92 && cosf >= -0.2) { const f = Math.acos(clamp(cosf, -0.2, 0.92)); return {f, k: f, planted: true}; }
  const phase = hash01(id, 21) * 6.28;                                              // dangling: level thighs, shins swing like a kid's
  return {f: 1.50, k: 1.50 + swing * 6 * Math.sin(t * 2.1 + phase), planted: false};
}
