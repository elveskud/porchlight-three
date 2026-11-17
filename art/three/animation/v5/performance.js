// v5 performance: lip sync, blinks, faces, gestures, listening and gaze. Every function is a pure function of time.
//
// What changed from v4 (see ISSUES.md):
//  * speech picks the mouth shape that is on screen for most of the drawing (and never drops a closed-lip A)
//  * blinks are a clean 3-drawing sequence on a seeded schedule
//  * faces blend toward their target by strength, so nothing pops when an emotion starts or ends
//  * gaze keeps its previous target and fades out slowly, with small seeded eye darts
//  * gestures use either hand, wind up first, and overshoot
//  * unknown `do` / `face` names print a warning once instead of doing nothing
import * as THREE from 'three';
import {neutral} from './cast.js';
import {profiles, pulse as _p} from '../v4/performance.js';
import {clamp, mix, ease, pulse, hash01, overshoot, warnOnce, PI} from './math.js';
export {profiles, ease, pulse};
const S = Math.sin;

// ---------------------------------------------------------------- clock

/** Is time t inside a "ones" window (24 drawings a second)? Everything else is drawn on twos (12 a second). */
export const isFast = (t, windows = []) => windows.some(([a, b]) => t >= a && t < b);
/** Start time of the drawing that shows time t. Whole drawings are held, so this is what the picture uses. */
export function sampleClock(t, windows = []) { const fps = isFast(t, windows) ? 24 : 12; return Math.floor(t * fps + 1e-7) / fps; }
/** How long the drawing that starts at tq stays on screen. */
export const drawingStep = (tq, windows = []) => 1 / (isFast(tq, windows) ? 24 : 12);

/** Extra "ones" windows around the biggest acting hits (shocked takes, punch lines). Merged with timeline.fastWindows. */
export function fastWindowsFor(timeline) {
  const hits = timeline.events.filter(e => e.punch || ['shocked', 'yelling'].includes(e.face)).map(e => [e.start - 0.04, e.start + 0.36]);
  const all = [...(timeline.fastWindows || []), ...hits].sort((a, b) => a[0] - b[0]), out = [];
  for (const w of all) { if (out.length && w[0] <= out.at(-1)[1] + 0.05) out.at(-1)[1] = Math.max(out.at(-1)[1], w[1]); else out.push([...w]); }
  return out;
}

// ---------------------------------------------------------------- lip sync

// width, height, teeth (Rhubarb shapes). Same shapes as v4.
const mouths = {X: [0, 0, 0], A: [.135, .012, 0], B: [.145, .046, 1], C: [.175, .100, 1], D: [.155, .155, .8], E: [.10, .103, 0], F: [.067, .084, 0], G: [.13, .029, 1], H: [.145, .065, .2]};
const CLOSED = {viseme: 'X', mouthWidth: 0, mouthHeight: 0, teeth: 0, jaw: 0, stress: 0};
// Shapes that are easy to lose on twos and matter to the eye get extra weight when a drawing has to pick one.
const CUE_WEIGHT = {A: 3.0, F: 1.6, G: 1.4, D: 1.1, X: 0.5};

/**
 * Mouth for the drawing that starts at tq and lasts dt seconds.
 * Picks the cue with the most weighted overlap, looking `lead` seconds ahead so the mouth is never late.
 */
export function speechShape(event, tq, dt = 1 / 12, lead = 0.045) {
  if (!event || event.silent) return {...CLOSED};
  const a = tq + lead - event.start, b = a + dt;
  if (b <= 0 || a >= event.end - event.start) return {...CLOSED};
  const cues = event.mouthCues || [];
  let best = null, bestScore = 0;
  for (const c of cues) {
    const overlap = Math.min(b, c.end) - Math.max(a, c.start);
    if (overlap <= 0) continue;
    const score = overlap * (CUE_WEIGHT[c.value] ?? 1);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  if (!best) return {...CLOSED};
  const [w, h, teeth] = mouths[best.value] || mouths.X;
  // Loudness: average of the 50 Hz envelope over the drawing.
  const env = event.envelope || [];
  let sum = 0, n = 0;
  for (let i = Math.max(0, Math.floor(a * 50)); i <= Math.min(env.length - 1, Math.floor(b * 50)); i++) { sum += env[i]; n++; }
  const energy = n ? sum / n : 0.65, quiet = event.quiet ? 0.76 : 1, stress = 0.65 + 0.35 * energy;
  return {viseme: best.value, mouthWidth: w, mouthHeight: h * stress * quiet, teeth, jaw: h / 0.155 * stress * quiet, stress: energy};
}

// ---------------------------------------------------------------- blinks

const BLINK = [0.55, 1.0, 0.45];            // three drawings: closing, closed, opening
const schedules = new Map();
function blinkSchedule(who, timeline) {
  const key = who + '|' + timeline.duration;
  if (schedules.has(key)) return schedules.get(key);
  const list = [], snap = (t) => Math.round(t * 12) / 12, quick = who === 'pip' || who === 'dot';
  let t = 0.8 + 2.6 * hash01(who, 0), i = 1;
  while (t < timeline.duration) { list.push(snap(t)); if (quick && hash01(who, 100 + i) < 0.4) list.push(snap(t + 0.33)); t += 2.4 + 3.2 * hash01(who, i++); }
  // A blink just before someone speaks and one just after they finish, unless one is already close.
  for (const e of timeline.events) if (e.who === who && !e.silent) for (const at of [e.start - 0.17, e.end + 0.12]) if (!list.some(s => Math.abs(s - at) < 0.9)) list.push(snap(at));
  list.sort((a, b) => a - b);
  schedules.set(key, list);
  return list;
}
/** Eye closure 0..1 for the drawing at tq. Depends only on the actor's name, never on the order of `profiles`. */
export function blinkAt(who, tq, timeline) {
  for (const s of blinkSchedule(who, timeline)) {
    const idx = Math.round((tq - s) * 12);
    if (idx >= 0 && idx < BLINK.length && Math.abs(tq - s - idx / 12) < 0.02) return BLINK[idx];
  }
  return 0;
}

// ---------------------------------------------------------------- faces

// Each face is a set of target values. Additive channels are scaled by strength; `smile` is mixed toward its target.
const FACES = {
  happy: {brow: .10, browY: -.02, headX: -.045, smile: 1},
  hype: {brow: .10, browY: -.02, headX: -.045, smile: 1},
  cocky: {brow: .10, browY: -.02, headX: -.045, smile: 1, browAsym: .03},
  determined: {brow: .10, browY: -.02, headX: -.045, smile: .75},
  nervous: {brow: -.16, browY: .035, headZ: .045, earL: .11, earR: .07, smile: .35, tension: 1},
  scared: {brow: -.16, browY: .035, headZ: .045, earL: .11, earR: .07, smile: .25, tension: 1},
  embarrassed: {brow: -.16, browY: .035, headZ: .045, earL: .11, earR: .07, smile: .45},
  sad: {brow: -.09, headX: .04, lids: .08, smile: -.45},
  gloom: {brow: -.09, headX: .04, lids: .08, smile: -.45},
  soft: {brow: -.09, headX: .04, lids: .08, smile: .65},
  sleepy: {lids: .50, headX: .16, headZ: .07, smile: .5},
  asleep: {lids: .98, headX: .16, headZ: .07, smile: .5},
  shocked: {browY: .09, headX: -.055, earL: -.05, earR: -.05, smile: .12, lids: -.10, tension: 1},
  yelling: {browY: .09, headX: -.055, earL: -.05, earR: -.05, smile: .55},
  suspicious: {lids: .22, browAsym: .075, headZ: .025, smile: .40, tension: 1},
  deadpan: {lids: .22, browAsym: .075, headZ: .025, smile: .25},
  laughing: {squint: .30, headX: -.06, smile: 1},
  smug: {lids: .24, browAsym: .05, headZ: -.03, smile: .85},
  side_eye_r: {lookX: .9, lids: .10, smile: .6},
  side_eye_l: {lookX: -.9, lids: .10, smile: .6},
};
/** Move the pose toward a face. `g` (0..1) is how much of the face is showing. */
export function expression(p, face, g = 1) {
  const f = FACES[face];
  if (!f) { if (face) warnOnce(`unknown face "${face}" (known: ${Object.keys(FACES).join(', ')})`); return; }
  for (const [k, v] of Object.entries(f)) {
    if (k === 'smile') p.smile = mix(p.smile, v, g);
    else if (k === 'tension') p.faceTension = Math.max(p.faceTension || 0, g);
    else p[k] = (p[k] || 0) + v * g;
  }
}

// ---------------------------------------------------------------- pose

const ACTIONS = new Set(['gloom', 'present', 'point', 'hips', 'nod', 'nervous', 'laugh', 'chuckle', 'wave', 'shrug', 'facepalm', 'munch', 'stare', 'count', 'thumbs', 'chin', 'lean', 'slouch']);

/** Add a one-handed (or two-handed) talking gesture. `side` is 'R', 'L' or 'B'. */
function talkingGesture(p, side, g, accent, syllable, antic) {
  const sides = side === 'B' ? ['L', 'R'] : [side], share = side === 'B' ? 0.7 : 1;
  for (const s of sides) {
    p['a' + s + 'o'] += .16 * g * share;
    p['a' + s + 'f'] += (.36 * accent * g * (.7 + .3 * syllable) - .14 * antic) * share;   // pulls back before the accent
    p['a' + s + 'b'] += .44 * g * share;
    p['hand' + s] = 'open';
    p['a' + s + 'w'] += .08 * accent * g * share;
  }
}

/** The whole pose of one actor for the drawing that starts at tq. `timeline.events` drives acting. */
export function poseAt(who, tq, timeline, beat, {dt = 1 / 12} = {}) {
  const c = profiles[who];
  if (!c) throw new Error(`poseAt: no performance profile for "${who}"`);
  const p = neutral(), events = timeline.events;
  const active = events.filter(e => e.who === who && tq >= e.start && tq < e.end).at(-1);
  const upcoming = events.find(e => e.who === who && e.start > tq && e.start - tq < .22);
  const last = [...events].reverse().find(e => e.who === who && e.end < tq);
  const e = active || upcoming, quiet = !!e?.quiet || beat?.mood === 'soft', amp = c.amp * (quiet ? .42 : 1);
  const phase = hash01(who, 7) * 20;
  // Resting body: slow breath, slightly different arms every few seconds so the two sides never match.
  p.torsoX = .010 * S(tq * c.breath + phase); p.torsoZ = .008 * S(tq * .7 + c.tempo + phase); p.headZ = c.tilt;
  p.aLo = .10 + (who === 'bash' ? .04 : 0) + .030 * S(tq * .37 + phase);
  p.aRo = .13 + .030 * S(tq * .31 + phase * 1.7);
  p.aLb = (who === 'pip' ? .12 : .04) + .04 * Math.max(0, S(tq * .23 + phase));
  p.aRb = .08 + .05 * Math.max(0, S(tq * .29 + phase * .6));
  p.asymmetry = who === 'rocco' ? .45 : .12; p.browAsym = 0; p.lidAsym = who === 'rocco' ? .03 : 0;
  p.handL = p.handR = 'relax'; p.fingerCurl = 0; p.thumb = .10; p.wristPitch = 0; p.earL = p.earR = 0; p.earX = 0;
  p.tailWag = quiet ? .018 : .035; p.tailSpd = 1.15; p.tailLift = 0; p.smile = .85; p.lids = who === 'rocco' ? .15 : 0; p.noBlink = 0;

  // The face the actor was wearing a moment ago fades out smoothly (no pop at the end).
  if (last && tq - last.end < 2.6) expression(p, last.face || (FACES[last.do] ? last.do : null), .45 * (1 - ease((tq - last.end) / 2.6)));

  if (e) {
    const age = tq - e.start, d = e.end - e.start;
    const enter = overshoot(age, .16, .5), leave = ease((d - age) / .32), hold = ease(age / .22) * leave;
    const antic = pulse(age, -.08, .07) * amp;
    const syllable = active ? speechShape(e, tq, dt).stress : 0;
    const accent = pulse(age, Math.min(.55, d * .35), .18) + .45 * pulse(age, d * .74, .22), g = amp * enter * leave;
    const side = hash01(e.id || who, 5) < .62 ? 'R' : hash01(e.id || who, 5) < .85 ? 'L' : 'B';
    p.torsoX += (.025 * accent - .05 * antic) * amp; p.torsoY = .015 * accent * amp * (side === 'L' ? -1 : 1);
    p.headX += (-.03 * accent + .025 * pulse(age, d - .08, .15)) * amp;
    p.browAsym += .025 * accent;
    talkingGesture(p, side, g, accent, syllable, antic);
    expression(p, e.face || (FACES[e.do] ? e.do : null), hold);
    const act = e.do;
    if (act && !ACTIONS.has(act) && !FACES[act]) warnOnce(`unknown action "${act}" on ${e.id || who}`);
    if (act === 'gloom') { p.headX += .13 * hold; p.aLo = mix(p.aLo, .02, hold); p.aRo = mix(p.aRo, .02, hold); p.smile = mix(p.smile, -.4, hold); }
    if (act === 'present' || e.face === 'hype') { p.aLo += .28 * g; p.aRo += .35 * g; p.aLf += .2 * g; p.aRf += .24 * g; p.handL = p.handR = 'open'; }
    if (act === 'point') { p.aRf = mix(p.aRf, .75, g); p.aRb = mix(p.aRb, .22, g); p.handR = 'point'; }
    if (act === 'hips') { p.aLo = mix(p.aLo, .43, hold); p.aRo = mix(p.aRo, .43, hold); p.aLb = mix(p.aLb, 1.1, hold); p.aRb = mix(p.aRb, 1.1, hold); p.handL = p.handR = 'grip'; }
    if (act === 'nod') p.headX += .12 * pulse(age, .45, .20);
    if (act === 'nervous' || e.face === 'nervous') { p.aLo = mix(p.aLo, .04, hold); p.aRo = mix(p.aRo, .04, hold); p.aRb = mix(p.aRb, .55, hold); p.handR = 'grip'; p.aRw += .015 * S(age * 21) * hold; }
    if (act === 'laugh' || act === 'chuckle' || e.face === 'laughing') {
      p.squint = Math.max(p.squint || 0, .30 * hold); p.headX -= .06 * hold; p.torsoX += .02 * S(age * 11) * hold;
      p.laugh = hold * (.4 + .6 * syllable); p.smile = mix(p.smile, 1, hold);
    }
    if (act === 'wave') { p.aRo = mix(p.aRo, 1.5, hold); p.aRb = mix(p.aRb, .45, hold); p.aRw = .32 * S(age * 8) * hold; }
    if (act === 'shrug') { for (const s of ['L', 'R']) { p['a' + s + 'o'] = mix(p['a' + s + 'o'], .45, hold); p['a' + s + 'b'] = mix(p['a' + s + 'b'], .70, hold); } p.handL = p.handR = 'open'; p.headZ += .05 * hold; p.torsoY += .02 * hold; }
    if (act === 'facepalm') { p.aRf = mix(p.aRf, .95, hold); p.aRb = mix(p.aRb, 1.55, hold); p.headX = mix(p.headX, .17, hold); }
    if (act === 'stare') { p.lids -= .12 * hold; p.browY += .05 * hold; p.noBlink = hold; p.headX -= .02 * hold; }
    if (act === 'count') { p.aRf = mix(p.aRf, .7, g); p.aRb = mix(p.aRb, 1.2, g); p.aRo = mix(p.aRo, .30, g); p.handR = 'point'; p.aRw += .07 * S(age * 9) * hold; }
    if (act === 'thumbs') { p.aRf = mix(p.aRf, .8, g); p.aRb = mix(p.aRb, 1.25, g); p.handR = 'grip'; p.thumb = .9 * hold + .1; }
    if (act === 'chin') { p.aRf = mix(p.aRf, .9, hold); p.aRb = mix(p.aRb, 1.85, hold); p.handR = 'relax'; p.headX += .06 * hold; p.headZ += .05 * hold; }
    if (act === 'lean') { p.torsoX += .16 * hold; p.headX -= .05 * hold; }
    if (act === 'slouch') { p.torsoX += .20 * hold; p.headX += .10 * hold; p.aLo = mix(p.aLo, .02, hold); p.aRo = mix(p.aRo, .02, hold); p.lids += .10 * hold; }
    if (e.silent) { p.handR = 'relax'; p.aRf *= .25; p.aRo *= .3; p.aRb *= .3; }
    p.fingerCurl = act === 'hips' ? .1 : 0;
  } else {
    // Listening: a clear nod or two, a brow flick, and the arms settling after the actor's own line.
    const spoken = events.find(x => tq >= x.start && tq < x.end), delay = c.delay;
    if (spoken && spoken.who !== who) {
      const a = tq - spoken.start - delay, len = spoken.end - spoken.start, nod = .05 + .05 * c.amp;
      p.headX += nod * pulse(a, Math.min(1.0, len * .5), .22) + .6 * nod * pulse(a, len * .85, .2);
      p.browY += .02 * pulse(a, .45, .25); p.headZ += .02 * S(a * 1.3) * Math.min(1, a + 1);
    }
    if (last && tq - last.end < .65) { const w = 1 - ease((tq - last.end) / .65); p.aRb += .12 * w * c.amp; p.aRf += .06 * w * c.amp; }
  }
  Object.assign(p, speechShape(active, tq, dt));
  if (active?.silent && active.do === 'munch') { const chew = .5 + .5 * Math.sin(tq * 6); p.mouthHeight = .025 * chew; p.mouthWidth = .10; p.jaw = .15 * chew; }
  p.faceTension = Math.max(p.faceTension || 0, ['scared', 'nervous', 'shocked', 'suspicious'].includes(e?.face) ? 1 : 0);
  p.mouth = p.mouthHeight / .155; p.mouthCorners = p.smile;
  p.earL += .018 * S(tq * 1.1 + c.delay); p.earR += .014 * S(tq * .95 + .7);
  return p;
}

// ---------------------------------------------------------------- gaze

const GAZE_HOLD = 1.0, GAZE_FADE = 0.9;
const sorted = new WeakMap();
const byTime = (timeline) => { if (!sorted.has(timeline)) sorted.set(timeline, [...timeline.events].sort((a, b) => a.start - b.start)); return sorted.get(timeline); };
const targetOf = (id, e, rigs) => { const tid = id === e.who ? e.to : e.who; return tid && rigs[tid] && tid !== id ? tid : null; };

function headDirection(r, other, tmp = {}) {
  const target = other.head.localToWorld(new THREE.Vector3(0, .70, .43)), head = r.head.localToWorld(new THREE.Vector3(0, .65, .35));
  return target.sub(head).applyQuaternion(r.root.getWorldQuaternion(new THREE.Quaternion()).invert());
}
/** Deterministic eye dart: a quick glance to a seeded spot for about a quarter of a second every few seconds. */
function dart(id, t) {
  const period = 2.1 + 1.6 * hash01(id, 11), k = Math.floor((t + hash01(id, 12) * period) / period), local = (t + hash01(id, 12) * period) - k * period;
  const on = pulse(local, .12, .09);
  return {x: (hash01(id + k, 13) - .5) * .05 * on, y: (hash01(id + k, 14) - .5) * .022 * on};
}

/**
 * Point heads and eyes. Keeps the previous target while the new one takes over, and fades gaze back to neutral
 * slowly when nobody is talking. `rigs` = the visible actors, by id.
 */
export function attention(rigs, timeline, tq, beat) {
  const events = byTime(timeline);
  let cur = -1; for (let i = 0; i < events.length; i++) if (events[i].start <= tq) cur = i; else break;
  for (const [id, r] of Object.entries(rigs)) {
    const castId = r.root.userData.castId || id, c = profiles[id] || profiles[castId] || profiles.bash;
    let yaw = 0, pitch = 0, eyeX = 0, eyeY = 0;
    if (cur >= 0) {
      const e = events[cur], prev = cur > 0 ? events[cur - 1] : null;
      const tNew = targetOf(id, e, rigs), tOld = prev ? targetOf(id, prev, rigs) : null;
      const fade = (ev) => 1 - ease((tq - ev.end - GAZE_HOLD) / GAZE_FADE);
      const wHead = ease((tq - e.start - c.delay) / .22), wEye = ease((tq - e.start - c.delay + .10) / .12);
      const pose = (tid, ev) => {
        if (!tid) return {yaw: 0, pitch: 0, ex: 0, ey: 0};
        const d = headDirection(r, rigs[tid]), f = fade(ev);
        return {yaw: clamp(Math.atan2(d.x, Math.max(.65, Math.abs(d.z))), -.40, .40) * .65 * f,
                pitch: clamp(-Math.atan2(d.y, Math.hypot(d.x, d.z)) * .28, -.10, .10) * f,
                ex: clamp(d.x * .022, -.04, .04) * f, ey: clamp(d.y * .025, -.024, .024) * f};
      };
      const a = pose(tNew, e), b = pose(tOld, prev || e);
      yaw = mix(b.yaw, a.yaw, wHead); pitch = mix(b.pitch, a.pitch, wHead); eyeX = mix(b.ex, a.ex, wEye); eyeY = mix(b.ey, a.ey, wEye);
    }
    const d = dart(id, tq);
    r.head.rotation.y = yaw; r.head.rotation.x += pitch;
    r.face.pupils.forEach(pu => { pu.position.x = clamp(eyeX + d.x, -.05, .05); pu.position.y = clamp(eyeY + d.y, -.03, .03); });
  }
}

/** Look at a point in the world (props, off-screen sounds). Same as v4. */
export function lookAtObject(r, target, weight = 1) {
  const local = r.head.worldToLocal(target.clone()), distance = Math.max(.2, local.length());
  r.head.rotation.x += clamp(-local.y * .08, -.12, .15) * weight;
  r.face.pupils.forEach((p, i) => { p.position.x = clamp(local.x * .04 + (i ? -.006 : .006) / distance, -.045, .045) * weight; p.position.y = clamp(local.y * .035, -.03, .03) * weight; });
}
