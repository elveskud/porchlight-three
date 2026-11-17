"""Footstep planner for a walk or run along a straight or bent path.

Why this exists: the old gait used one smoothstep and one fixed stride, so characters scurried at
10-26 steps a second and their feet teleported when the walk ended. This planner works the other way round:
it chooses a speed profile and a step length first, then lays out every footstep so that
  * the character starts and ends standing, with both feet together (double support),
  * the cadence is a natural 2-3 steps a second (walk) or 4-5 steps a second (run),
  * each foot lands exactly where the next stance begins.

The JavaScript side (art/three/animation/v5/locomotion.js) only *evaluates* the plan, so footstep sounds
(which use the landing times written here) always match the picture.

Plan fields (all distances in world units, times in seconds from the episode start):
  mode      'walk' or 'run'
  length    path length
  ramp      seconds spent speeding up, and again slowing down
  cruise    constant speed between the ramps
  step      step length h (path length / number of steps)
  swing     fraction of one foot's own cycle spent in the air
  steps     [{k, side, takeoff, land, from, to}] landing order; the last entry is the closing step
"""
import math

WALK_CADENCE = 2.6       # steps per second for a normal walk
WALK_MAX_CADENCE = 3.5   # above this many steps per second the cycle becomes a run
WALK_STEP_LEG = 0.65     # longest walking step, in leg lengths (longer steps force a big pelvis dip at double support)
RUN_CADENCE = 4.7        # steps per second at a run (quick, energetic)
RUN_STEP_LEG = (0.55, 1.1)   # shortest and longest running step, in leg lengths


def distance_at(plan, start, end, t):
    """Pelvis distance along the path at time t (trapezoid speed profile)."""
    D = end - start
    r, v, L = plan['ramp'], plan['cruise'], plan['length']
    u = min(max(t - start, 0.0), D)
    if u < r:
        return v * u * u / (2 * r)
    if u <= D - r:
        return v * r / 2 + v * (u - r)
    w = D - u
    return L - v * w * w / (2 * r)


def time_at(plan, start, end, dist):
    """Inverse of distance_at: the time when the pelvis reaches `dist`."""
    D = end - start
    r, v, L = plan['ramp'], plan['cruise'], plan['length']
    dist = min(max(dist, 0.0), L)
    if dist <= v * r / 2:
        return start + math.sqrt(2 * r * dist / v)
    if dist <= L - v * r / 2:
        return start + r + (dist - v * r / 2) / v
    return end - math.sqrt(max(0.0, 2 * r * (L - dist) / v))


def plan_path(start, end, length, leg, mode=None):
    """Make a gait plan for one path. `leg` is the world length of the actor's leg.
    `mode` 'walk' forces a walking cycle (longer steps allowed) for quiet or in-character moments; None picks walk or run by speed."""
    D = end - start
    if D <= 0 or length <= 0:
        raise ValueError('path needs a positive duration and length')
    ramp = min(0.30, D * 0.25)
    cruise = length / (D - ramp)
    if mode == 'walk':
        mode, step, longest = 'walk', min(max(cruise / WALK_CADENCE, 0.35 * leg), 0.66 * leg), 0.72 * leg
    elif cruise / (WALK_STEP_LEG * leg) <= WALK_MAX_CADENCE:
        mode, step, longest = 'walk', min(max(cruise / WALK_CADENCE, 0.35 * leg), WALK_STEP_LEG * leg), WALK_STEP_LEG * leg * 1.05
    else:
        mode, longest = 'run', RUN_STEP_LEG[1] * leg
        step = min(max(cruise / RUN_CADENCE, RUN_STEP_LEG[0] * leg), longest)
    n = max(2, round(length / step), math.ceil(length / longest))
    # A very short, very fast path (a dash of a metre in half a second) uses fewer, longer steps instead of a flutter.
    while mode == 'run' and n > 2 and (n + 1) / D > 5.0 and length / (n - 1) <= 1.4 * leg:
        n -= 1
    h = length / n
    swing = 0.62 if mode == 'run' else 0.38
    lead = 1 - swing          # a stance foot starts this many steps ahead of the pelvis and ends as far behind: centred on the hip
    plan = {'mode': mode, 'length': length, 'ramp': ramp, 'cruise': cruise, 'step': h, 'swing': swing, 'lead': lead, 'n': n}

    # Landing times: step k lands when the pelvis is `lead` steps short of the new foot, i.e. at (k - lead) h.
    land = {k: time_at(plan, start, end, (k - lead) * h) for k in range(1, n + 1)}
    sides = {k: 'L' if k % 2 == 1 else 'R' for k in range(1, n + 1)}
    feet_pos = {'L': 0.0, 'R': 0.0}
    steps = []
    # A foot lifts when the pelvis has moved `lead` steps past it, so no foot ever trails further than it leads.
    # (In a run this lifts the back foot before the front foot lands: a short flight, as in a real run.)
    for k in range(1, n + 2):
        side = sides[k] if k <= n else ('R' if sides[n] == 'L' else 'L')
        land_t = land[k] if k <= n else end                       # the closing step lands exactly at the end
        to = k * h if k <= n else length
        takeoff = max(start, time_at(plan, start, end, (k - 2 + lead) * h))
        if k == n + 1:
            takeoff = min(takeoff, end - 0.24)           # the closing foot gets a real swing, or the pelvis stretches after it
        last_land = max([s['land'] for s in steps if s['side'] == side], default=-1e9)
        takeoff = max(takeoff, last_land + 0.04)         # never lift before the foot has landed
        takeoff = min(takeoff, land_t - 0.05)
        steps.append({'k': k, 'side': side, 'takeoff': takeoff, 'land': land_t, 'from': feet_pos[side], 'to': to})
        feet_pos[side] = to
    plan['steps'] = steps
    return plan


def contacts(plan):
    """Landing times for footstep sounds: [{'time', 'side'}]."""
    return [{'time': s['land'], 'side': s['side']} for s in plan['steps']]


def check_plan(plan, start, end):
    """Return a list of problems (empty list = fine). Used by prepare.py and the verify scripts."""
    problems = []
    last = {'L': -1e9, 'R': -1e9}
    for s in plan['steps']:
        if not (s['takeoff'] < s['land']):
            problems.append(f"step {s['k']}: takeoff is not before landing")
        if s['takeoff'] < last[s['side']] + 0.04:
            problems.append(f"step {s['k']}: foot lifts less than 0.04 s after it landed")
        last[s['side']] = s['land']
    gaps = [b['land'] - a['land'] for a, b in zip(plan['steps'], plan['steps'][1:])]
    # Peak steps per second between landings, ignoring the slow-start step and the closing step.
    if len(gaps) > 3 and min(gaps[1:-1]) < 1 / 6.5:
        problems.append(f'steps closer than 1/6.5 s ({1 / min(gaps[1:-1]):.1f} steps/s)')
    return problems
