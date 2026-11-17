# Card: fix an animation problem (find the cause fast)
First: see it. `strip.cjs` (16 drawings in a row) or `stills.cjs`. Then pick the symptom.

| Symptom | Look in | Likely cause |
|---|---|---|
| Feet slide or jump when a walk starts or ends | `v5/locomotion.js` `footState`, `stand`; `pipeline/gait_plan.py` | path plan wrong; `verify-motion.cjs` names the path |
| Legs scurry / too many steps | `gait_plan.py` constants (`WALK_*`, `RUN_*`) or the path is too fast: lengthen it in `prepare.py` | speed above ~2.5 units/s is a run |
| Body pops when walk ends | `applyGait` mean drop, `preTurn`, `yawAt` | facing turn, see `PRE_TURN`, `TURN_TIME` |
| Statue when standing | `idleBalance` amplitude (`shift`, `sway`, `drop`) in `locomotion.js` | amplitude too small |
| Mouth late or wrong shape | `speechShape` in `v5/performance.js` (lead 0.045 s, `CUE_WEIGHT`) | cue shorter than a drawing |
| Face snaps | `FACES` entry, `expression()` blend | assigned instead of mixed |
| Eyes/head snap or never move | `attention()`, `GAZE_HOLD`, `dart()` | target missing in `rigs` (actor off screen) |
| Blink odd | `blinkSchedule`, `BLINK` | seeded: change the gap numbers |
| Looks stiff / rubbery wrong | `squash.js` `squashAt` terms, `MIN/MAX` | add a term; keep volume |
| Ears/tail dead | `v5/secondary.js` `followThrough` (`drag`) | speed history not passed from the driver |
| Cast looks pasted on | `reference-v3/lighting.js` record for that set; contact shadow in `look.js` | wrong `light` / `shadowMul` |
| Line too thin/thick, paper too strong | `shaders.js` screen pass (`radius`, `amount`, `uPaper`, `uBoil`) | numbers at the top of `main()` |
| Wrong picture after a code change | cache | scene clips reuse only when the whole-tree hash is equal; run without `SCENE_ONLY` |

## Method
1. Reproduce with `probe.cjs` (print the numbers at one time): `node tools/three-sets/probe.cjs <page> "episode.renderAt(12,{draw:false}); return episode.actors.riot.pelvis.position.y"`.
2. Change ONE number in ONE v5/reference-v3 file. Never edit v3, v4, reference-v2 (finished builds depend on them).
3. Re-run `verify-motion.cjs` and `verify-episode04-v5.cjs`, look at the strip again.
4. Log what you changed in `HANDOFF.md` (one line).

## Do NOT read
`ISSUES.md` (unless asked), `IMPROVEMENTS.md`, `comparisons/*/*-checks.json`, shader code outside the screen pass.
