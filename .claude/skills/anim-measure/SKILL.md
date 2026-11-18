---
name: anim-measure
description: Measure animation quality with numbers and stills instead of guessing - motion checks, thresholds, strips, probes, close-ups and the order to run them. Use before and after any animation change, when something "feels off" but is hard to name, or before handing an episode over.
---
# Measure it

Eyes lie at 12 drawings a second and with a painted look. Measure first, then judge.

## Tools (in `tools/three-sets/`)
| Question | Tool | What it gives |
|---|---|---|
| Do feet slide, pop, over-step, stand like a statue? Are twos held? | `node verify-motion.cjs [page] [out.json]` | Fails (exit 1) with the path id and the number |
| Do mouths, seeks, footsteps and pictures line up? | `verify-episode04-v5.cjs` | Checks on the Ep 4 template build |
| What does the whole movement look like? | `strip.cjs` | 16 drawings in a row (the best way to see a pop, slide, or missing overshoot) |
| What does this frame look like? | `stills.cjs` | PNGs at given times |
| Close up or side view of one actor | `closeup.cjs` | Contact, clipping, faces |
| What is this value at time t? | `probe.cjs <page> "<js>"` | e.g. `episode.renderAt(12,{draw:false}); return episode.actors.riot.pelvis.position.y` |
| Before and after numbers | `audit-ep4.cjs` | Comparison table |
| Finished mp4 | `verify-film.py` | Frame and sync checks |

## Current limits (`verify-motion.cjs`)
Planted foot slide 0.02 per drawing (leg about 0.55), pelvis jump 0.15 per drawing, facing jump 1.2 rad per drawing, cadence 5.6 steps/s, idle pelvis range at least 0.008 (height) and 0.02 (side). Do not loosen a limit to pass. If a limit is wrong, say why and log it in `DECISIONS.md`.

## Numbers to read on your own
- **Volume** after squash: `r.motion.secondary.volume` near 1.0. Squash fractions stay inside 0.80-1.24.
- **Pose pops**: difference between consecutive drawings (12 per second) of the pelvis, root yaw, arms. A pop is a jump much larger than its neighbours.
- **Hold quality**: during holds, small movement must continue (breathing, idle balance) but the pose may not change.
- **Hang time and height** of jumps: compare with the plan (`anim-physics`: `g = 8h / T^2`).
- **Twos**: two 24 fps frames that share a drawing must be identical.

## Order of work for any animation change
1. Reproduce: `strip.cjs` or `probe.cjs` on the exact moment. Save the "before".
2. Change **one** number in **one** v5 / reference-v3 file.
3. `verify-motion.cjs`, then the episode check, then the strip again.
4. Compare numbers before and after. If better and nothing else got worse, keep it.
5. One line in `HANDOFF.md`.
6. Only then ask the user to approve. State the numbers, name anything under 4/5 in `anim-review`.

## Judge honestly
A check can pass and the motion can still be wrong (a foot that never slides but never lifts). Look at the strip after every pass. A check that fails is a finding; do not hide it by changing the check.
