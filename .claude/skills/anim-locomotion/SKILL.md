---
name: anim-locomotion
description: Walks, runs, turns, starts and stops for Porchlight using the v5 gait system - stride against speed, cadence per character, bob and sway, planted feet, the gait planner. Use when a character walks or runs wrongly, scurries, glides, pops at the end of a path, or when planning any movement across a set.
---
# Locomotion (v5)

## Pieces
- `pipeline/gait_plan.py`: plans footsteps for each path in Python. JS only plays the plan (`art/three/animation/v5/locomotion.js`: `pelvisState`, `yawAt`, `preTurn`, `footState`, `gait`, `solveLeg`, `applyGait`).
- Constants (in `gait_plan.py`): walk cadence 2.6 steps/s, above 3.5 steps/s it becomes a run; longest walking step 0.65 leg; run cadence 4.7 steps/s, run step 0.55-1.1 leg.
- Speed above about 2.5 world units/s is a run. A path that is too short for its time will scurry, so lengthen the path in `prepare.py` or give it more time.
- `TURN_TIME 0.55 s` turn to the final facing, `PRE_TURN 0.4 s` turn before moving off.

## Rules that make a walk read
1. **Step length follows speed.** Never speed a walk up by taking more steps per second alone. Change length, then cadence. Looks wrong: tiny steps fast (scurry) or huge steps slow (gliding).
2. **Weight per character**: Bash heavy (slow cadence, long contact, big sway), Pip light (quick, bouncy), Riot standard, Rocco slouched and relaxed. Give them different cadence and bob (`bob` and `sway` in `gait`), not the same walk.
3. **Bob**: pelvis up and down twice per stride (walk 0.018, run 0.04 as the base). The pelvis is lowest at heel strike.
4. **Sway and counter-rotation**: weight over the planted foot; arms swing opposite to legs (`swing`); head stays steady and levels the view.
5. **Start**: lean into it, first step small. **Stop**: last step short, body settles with `overshoot`, ears and tail carry on (`anim-secondary`). The `squashAt` crouch and arrival terms add the wind-up and landing.
6. **Turns**: look first (eyes, head), then body, then feet step around. Do not spin the root while the feet stay planted.
7. **Arrival pose** must match the next action: if they sit next, face the seat; if they talk, face the speaker (`anim-staging` for eyelines).
8. **Groups**: different timing per character, never walk in unison (no twinning). Offsets of 0.2-0.5 s on start, different stride.

## Energy and mood
- Excited: faster cadence, bigger bob and arm swing. Scared: shorter steps, head low, looking around. Tired or sulking: long drag, short lift (`liftMax` is lower), slow arms.
- Lift: foot lift 0.075 (walk) or 0.13 (run), scaled by step size. Raise it for a sneak or a stomp.

## Standing is movement too
`stand()` with `idleBalance(id, t, {energy})`: a held pose, then a weight shift, with the pelvis over the support foot. Each character has its own period (3.8-6.8 s) and amplitude, from `hash01(id)`. No statue: `verify-motion.cjs` fails a standing pelvis that does not move.

## Working on a path
1. Draw the path in `comparisons/episode04/source/timeline-v5.json` or `prepare.py`.
2. Check the speed: length / duration. Under 1.0 slow walk, 1.0-2.5 walk, above 2.5 run.
3. Run `node tools/three-sets/verify-motion.cjs`. It names the path if feet slide, the pelvis pops, the facing jumps, or cadence is above 5.6 steps/s.
4. Look at `strip.cjs` across the start and the stop.

## Do not
Edit v3 or v4. Change one constant at a time and log it in `HANDOFF.md`.
