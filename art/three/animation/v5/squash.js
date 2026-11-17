// v5 squash and stretch: rubbery timing on the hits that matter (stops, starts, punch lines, takes, laughs).
// Pure function of time. The result is applied by applyBodyScale() to the spine (body + head + arms) and head,
// keeping volume: when height grows, width shrinks, so the character always looks solid and never inflated.
import * as THREE from 'three';
import {clamp, ease, pulse, overshoot, PI} from './math.js';
const MIN = 0.80, MAX = 1.24;      // v4 was clamped to 0.93..1.07, which is why nothing ever visibly squashed

/** Squash terms for one actor at time tq. Returns {body, head}: fractions where +0.1 = 10% taller, -0.1 = 10% shorter. */
export function squashAt(who, tq, {paths = [], events = [], pose = null} = {}) {
  let body = 0, head = 0;
  for (const p of paths) {
    if (p.who !== who) continue;
    const toStart = tq - p.start, sinceEnd = tq - p.end, run = p.plan?.mode === 'run';
    // Wind up before moving off (a small crouch), then stretch into the first step.
    if (toStart > -0.16 && toStart < 0.35) body += -0.06 * pulse(toStart, -0.07, 0.06) + 0.04 * pulse(toStart, 0.14, 0.10);
    // Arrive: land low, spring back past neutral, settle.
    if (sinceEnd >= 0 && sinceEnd < 0.7) body += -(run ? 0.11 : 0.07) * (1 - overshoot(sinceEnd, 0.15, 0.38));
  }
  for (const e of events) {
    if (e.who !== who) continue;
    const age = tq - e.start;
    if (age < -0.1 || age > 1.2) continue;
    if (e.punch) body += 0.07 * pulse(age, 0.10, 0.09) - 0.05 * pulse(age, 0.34, 0.10);
    if (e.face === 'shocked' || e.face === 'yelling') {
      head += 0.16 * pulse(age, 0.08, 0.07) - 0.06 * pulse(age, 0.30, 0.09);        // the take: head stretches, then squashes back
      body += 0.05 * pulse(age, 0.08, 0.07) - 0.03 * pulse(age, 0.30, 0.09);
    }
    if (e.do === 'nod') head += -0.035 * pulse(age, 0.45, 0.12);
    if (e.do === 'laugh' || e.do === 'chuckle' || e.face === 'laughing') {
      const hold = ease(age / 0.2) * ease((e.end - e.start - age) / 0.3);
      body += 0.03 * Math.sin(age * 2 * PI * 3.0) * hold;                           // 3 bounces a second = 4 drawings each
      head += 0.02 * Math.sin(age * 2 * PI * 3.0 + 0.6) * hold;
    }
  }
  return {body: clamp(body, MIN - 1, MAX - 1), head: clamp(head, MIN - 1, MAX - 1)};
}

/** Apply squash with volume preserved. Call after applyActor (which resets scales). */
export function applyBodyScale(r, {body = 0, head = 0}) {
  const y = 1 + body, xz = 1 / Math.sqrt(y);
  r.spine.scale.multiply(new THREE.Vector3(xz, y, xz));
  const hy = 1 + head, hxz = 1 / Math.sqrt(hy);
  r.head.scale.multiply(new THREE.Vector3(hxz, hy, hxz));
  r.motion.secondary = {...(r.motion.secondary || {}), squashBody: body, squashHead: head, volume: xz * xz * y};
  return r.motion.secondary.volume;
}
