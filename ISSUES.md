# ISSUES — Three.js pipeline audit (17 Nov 2026)

Test bed: Episode 4 (`comparisons/episode04`, `art/three/animation/v4`, `art/three/illustrated/reference-v2`).
Status key: **VERIFIED** = reproduced by running code or rendering; **READ** = found by reading code, not reproduced; **FIXED** = fixed in v5 / reference-v3 and re-checked; **OPEN** = not fixed.
Numbers come from `tools/three-sets/audit-ep4.cjs` (saved in `comparisons/episode04/audit-v4-before.json`) and the timeline data. Old Blender problems you asked about are answered in the table at the end.


## Status after this session (17 Nov 2026)
**FIXED in v5 / reference-v3 and re-checked on Episode 4:** A1 walks (footstep planner), A2 lip sync (closed-lip A never dropped; very short cues under ~40 ms still cannot show on twos), A3 expressions blend, A4 gaze (held target, fade, eye darts; one-drawing head snaps 375 → 103, eye snaps 333 → 75 per film, cuts excluded), A5 weight shift (knee bend 0.03 → 0.28 rad, pelvis sway 0 → 0.09), A6 foot/pelvis pop at path ends (pelvis jump 0.1–0.25 → ≤ 0.14 including the run start; planted feet slide ≤ 0.012), A7 gait arms/bob/stride, A8 standing turns (new stepping turn; the old `pivotTurn` is not used), A9 blinks, A10 unknown moves warn once and `stare, count, thumbs, chin, lean, slouch, laughing, smug, side_eye_*` are implemented, A11 gestures (either hand, wind-up, overshoot, bigger nods), A12 squash/stretch/takes (clamp 0.80–1.24), A13 scale reset now inside `applyActor`, A14 follow-through from speed history (ears, tail, hem drag), L1–L3 per-set light/shadow/tint (all 20 catalog ids), L2 contact shadows, L4 paper, L5 boiling coloured ink, L6 two painted shadow bands, L7 no blending in the ink pass, L8 lens flattening on the exteriors, L10 skipped meshes warn, B1 scene boundary epsilon, B2 framing check on cached scenes and no film on failure, B3 whole-tree cache hash, B4 new checks (see below), B5 checks that can fail, B7 `prepare.py` runs here, B8 film check rewritten (`verify-film.py`), B9 runtime installed (root `package.json`, `.venv-mix`), B10 BT.709 tags and encoder error handler, B11 unknown beat throws, D1 pavilion path relative.
**NOT fixed (be honest):** A15 jaw contour / `mouthCorners` (cosmetic), A16 only partly (timeline is validated at load; other crash edges remain), A17 seated feet still hang above the floor, L9 missing-asset errors (`story-props.js` path is relative now; a failed texture still only logs), L11 done only for v5 (`render.cjs` v4 keeps its list), L12 the four `look.js` copies remain (v2, v3, reference-v1/v2 untouched on purpose; reference-v3 is the new one). Ep 1–3 were not ported (decision). Mouth shapes shorter than a drawing cannot all be shown on twos.

## New findings this session
- **A18 VERIFIED (fixed in v5): the six bear relatives moved their mouths with Bash's every line.** In v4 `put()` used `poseAt('bash', ...)` for the crowd, so they spoke Bash's visemes (probe: bash, family0, family3 all showed B, G, B, H, B). v5 gives the crowd an empty timeline (they stand, breathe and react).
- **A19 staging, not engine:** 11 of 12 Episode 4 paths move faster than a walk (≥ 1.5 units/s for a 0.55 leg), so they are drawn as a jog. Slow them in `prepare.py` if calm walks are wanted. `marlo-stepaside` covers 1.35 units in 0.6 s.
- **A20 VERIFIED: the first v5 build had the foot stance wrong** (a stance foot trailed 0.74 step but led 0.5, so the pelvis dipped to 0.46). Fixed in `pipeline/gait_plan.py` (a foot lifts when the pelvis is `lead` steps past it). Kept here because it is the kind of error `verify-motion.cjs` now catches.
- **B12 checker:** `ES.warn` flood hidden by early stops; `features` module never copied (stubbed); sfx list in the checker used function names; 11 scripts are 159–172 s at 3.1 words/s.
- **Old checks kept for history, not used for v5:** `verify-episode04.cjs`, `verify-episode04-export.py`, `verify-episode04-player.cjs`, `browser-checks.json` (many cannot fail, see QA above).

## Checks that replace the old ones (they can fail)
`verify-motion.cjs` (planted-foot slide, pelvis and facing jumps, steps/s, idle sway, held drawings), `verify-episode04-v5.cjs` (60 out-of-order seeks, nine mouth shapes, no mouth later than one drawing, 114 footstep sounds = landings in the picture, pictures not black, camera never jumps in dialogue), `verify-film.py` (size, 4,664 frames, decode, loudness −14 LUFS, BT.709, black only in the final fade, drawn on twos by peak frame difference).

## Review round 2 (user, 17 Nov): found, fixed, and what is left
- **R1 VERIFIED, FIXED: characters appeared and vanished in the middle of the picture.** Exits ended 1-6 units inside the frame (the actor was simply no longer drawn), and mid-scene entrances started inside it. Cause: path end points chosen for staging, not for the camera. Fix: every entrance starts and every exit ends off-screen (camera edges measured per scene in `prepare.py`), and `verify-episode04-v5.cjs` now fails if any actor appears or disappears inside the frame (0 found now).
- **R2 VERIFIED, FIXED: seated characters were wrong.** The furniture was built for a body about twice as tall (sofa seat 0.815 against a leg length of 0.54), so Bash's and Pip's legs hung in the air and cut into the cushions, and Rocco's whole body sat inside the beanbag. Fix: `seatedLegs()` in `v5/locomotion.js` fits the legs to the seat (soles on the floor, or dangling and swinging if the seat is too high); the sofa is rescaled (seat 0.34), the beanbag rebuilt as a low mound; seated actors turn a few degrees so the legs read from the front camera. Rocco's close-up shows him properly seated. Not changed: the bench and the stoop (no complaint); the sofa is lower than in the painting, because the actors are small.
- **R3 FIXED: Bash's mom had no ears, muzzle or nose.** v4 built her from a head with all face parts hidden (`extend()` hides everything that is not on a keep list). v5 builds her from Bash's full bear (round ears, tan muzzle, nose) in her own colours, with the apron, dress, hair bun and fringe (reference `art/gemini/characters/12_bashs_mom.jpg`).
- **R4 FIXED: the extras (six relatives) were clones standing in a pile inside the picnic table, doing nothing.** Now six individuals (hoodie colour, size, cap, bow, pigtails, glasses, moustache, bun), in two groups framing the scene, turned toward the group, each on its own cycle of waving, cheering with a hop, laughing, whispering and pointing (arm travel 0.3-0.44 rad a second, hops up to 0.14, against about 0 before).
- **R5 FIXED: empty backgrounds.** The park (scenes 1, 4, 5) was a bare lawn. Added: eight more trees, shoreline bushes, flower patches, grass tufts, corner grass blades like the painting, a sandy path, a picnic blanket and basket, a rowboat, a buoy, five bobbing ducks, flapping birds; the camera is lower so less bare ground shows. Other scenes were already full. There is no automatic "fullness" check: judged by eye.
- **R6 FIXED: the title sequence cropped the lookout tower** (the roof ran off the left edge). The camera is panned so the whole tower is in frame.
- **R7 FIXED: the ending had a text word, not the logo.** It now shows the Friendzy app icon (graffiti logo), small on black after the lamp click, popping in and holding about two seconds. The file is copied from the Friendzy app folder (see `HANDOFF.md`).
- **R8 DONE: a few close-ups** (user asked). Seven, each held for the line and a beat: Riot reacting to the reveal, Rocco "Some guy", Riot "No no no", Rocco "...Is it?", Preston "Hm.", Riot and Rocco on the stoop. The QA checks that each keeps the head inside the frame, lasts over a second, and that no other camera jump happens in the dialogue scenes.
- **R9 DONE: joggers faster.** Runs are about 3.1 units a second (was 1.6-2.4) with a quicker step (4.7 a second). Walkers who should walk (the hiker, Preston at the lake, Marlo at the notice) walk.
- **Found while doing this (fixed):** a code comment I wrote swallowed Riot's line in the apartment scene (Riot was missing); the new QA caught it. At the end of fast runs the pelvis dipped for one drawing (the pelvis chased a far foot while the body turned): the drop is now capped. The first foot of the closing step now gets a minimum swing.
- **Left:** the sofa and bench seats are not checked against the paintings' proportions; the relatives could be separate character sheets (they are Bash's rig with accessories); the hiker still runs in profile (a human with a backpack seen from the side looks flat).

## Ranked list

### Critical
**A1. Walks scurry (10–26 steps a second) and the feet teleport at the end.** VERIFIED
- Symptom: legs strobe at 12 fps; footstep sound machine-guns. At the end of every walk the feet jump 0.16–0.31 units (the leg is 0.54 long) and the pelvis jumps up to 0.25 in one drawing.
- Cause: `gait()` uses a smoothstep over the whole path and one fixed stride of 0.27 (`v4/locomotion.js:8`; `prepare.py:44,56-62`). Peak speed is 1.5 times the average. Measured over all 12 Episode 4 paths: average 6.8–17.4 steps/s, peak 10.5–26.3. Feet only ever trail the pelvis, and the walk-to-stand switch (`episode.js:24`) snaps to a different pose and pelvis height (0.995 vs 1.085).
- Fix (v5): footstep planner. Speed-based stride, trapezoid speed, feet land in double support at start and end, walk or run cycle by speed. Python and JS share the plan; footstep sounds use the real landing times.
- Risk: medium (footstep audio changes; paths faster than a walk are drawn as a run).

**L1. Scene lights do nothing.** VERIFIED (code + stills)
- Symptom: every set looks evenly lit; the lamp, window and sunset do not touch the cast.
- Cause: every mesh becomes a `ShaderMaterial` without `lights` (`reference-v2/look.js:60`). Hemisphere, ambient and practical lights added by the episode are ignored. Real light inputs are a tint table keyed by set id and one fixed `uLight` for every set (`look.js:59,70`).
- Fix (reference-v3): per-set lighting records (light direction, shadow colour, key, pool, tint) read from the paintings; dead lights no longer added.
- Risk: low to medium (needs a look at each set).

**L2. Nothing casts a shadow, so the cast floats.** VERIFIED (stills)
- Cause: shadow map off (`look.js:9`); `castShadow=false` (`look.js:61`); no contact-shadow mesh in the v4 cast (that mesh exists only in the Episode 1 refinements).
- Fix: flat contact-shadow decal under each actor in the set's shadow colour.

### High
**A2. Lip sync is late and loses short mouth shapes.** VERIFIED
- 53% of the 741 Rhubarb cues are shorter than one drawing (1/12 s); 16% (121) are never shown in any drawing, 7 of them closed-lip `A`. Pictures are floored to the 12 fps grid, so every mouth lags the sound by 0–83 ms with no lead (`v4/performance.js:63,9-14`).
- Fix: pick the cue with the largest overlap per drawing (closed A, then F and G first), 1–2 frame lead, no cross-blend on twos.

**A3. Expressions pop instead of blending.** VERIFIED
- Smile jumps 1.3 in one drawing (riot, t=119.5 s). `p.smile` and `p.lids` are assigned, not mixed; strength is ignored (`v4/performance.js:19-26`); the emotion switches off hard at 2.2 s.
- Fix: mix toward target by strength; ease out.

**A4. Head and eyes snap.** VERIFIED
- Head yaw jumps 0.26 rad (15°) and the pupils jump 0.04 in one drawing (riot, t=7.33 s). With no event, `attention` skips everything and the head returns to centre in one drawing (`v4/performance.js:54-61`); no previous target, no eye darts, no look-away.
- Fix: held previous target, ease out, seeded eye darts.

**A5. Standing characters are statues.** VERIFIED
- Over 10 s standing in s04: pelvis height range 0, pelvis sway 0, feet range 0, knee bend 0.03 rad; only the head turns. Hip height at rest equals full leg reach, so legs are locked straight; `shift`, `sway`, `lean`, `air`, `headY`, `torsoY` are never driven in v3/v4.
- Fix: deterministic weight-shift channel (hip drop, sway, knee soften) with the feet planted at fixed positions.

**A6/A7/A8. Walk details.** READ (A6 verified under A1)
- Arm swing and bob use a fixed stride of 0.31 for every actor (`applyGait` `v4/locomotion.js:23`), amplitudes of 0.7 cm, one bob per cycle, same-side arm swing. `pivotTurn` drags the right foot around the left in an arc and takes the root yaw instantly (`:33`).
- Fix: contralateral arms from the real feet, two bobs per cycle, a real stepping turn.

**B1. A scene starts one drawing late.** VERIFIED
- s03 boundary: 784.0000000000001 frames → `Math.ceil` = 785 (`render.cjs:8`), and the beat lookup uses raw `t>=b.start`. s03 appears at 32.75 s instead of 32.667 s.
- Fix: epsilon in both places.

**B2/B3. The render can approve a bad film.** READ
- Cached scenes skip the framing check (`render.cjs:14-17`); the cache hash ignores `ep04.json`, cues, voices and the voice manifest (`:10`); the film is muxed before the check can fail (`:19-20`).
- Fix: always check; hash everything; fail before muxing.

**B7/B8. The pipeline cannot be re-run from this folder.** VERIFIED
- `prepare.py` finds no voice sources (the manifest points at the deleted Blender folder) and dies with a bare `KeyError`, then would hit `SameFileError`. `verify-episode04-export.py:13` reads the deleted source path; `reviews/` did not exist; Playwright lived only in `/private/tmp`; `pyloudnorm` missing.
- Fix: voices come from `assets/vo/<id>.wav` (already there); root `package.json`; `.venv-mix`.

**L3. Only a few sets have their own lighting.** READ + stills
- The tint table covers 8 ids. `stoop_sunset`, `main_street`, `park`, `lake`, storm sets, `school_gym`, `walt_*` fall back to day tint (`look.js:70`). `*_storm` never matches `night`. The sunset cast is not tinted at all. A global warm finish (`shaders.js:65`), a fixed warm lamp colour (`:44`) and an olive shadow (`look.js:58`) sit on every set, against the "no generic warm palette" rule.

**QA. Many checks cannot fail.** VERIFIED
- Foot error measured 3.6e-15 vs limit 0.035 (feet are snapped to their own IK targets); volume error 3.3e-16 (normalised by construction); stance slide 5.4e-15; `actions.*` read flags the driver sets itself; `visemes` collected, never asserted; `pinError` 0.0084 vs limit 0.15; `backFacing` min 0.877 vs limit 0; offscreen margin 0.035 in the pre-check vs 0.02 at render. No A/V sync check, no mouth-moves check, no pixel check.

### Medium
- **A9 Blinks.** VERIFIED: riot in s04 shows 3 fully-closed drawings vs 29 half-lid drawings in 58 s. Gaussian 0.055 s wide sampled every 0.083 s; timing depends on key order of `profiles` (`v4/performance.js:15-18`).
- **A10 Unknown `do`/`face` silently ignored.** READ: `stare, count, thumbs, chin, lean, slouch` in Episode 4 and `laughing, smug, side_eye_r` in scripts do nothing (no else branch, no warning).
- **A11 Gestures repeat.** READ: right arm only, same shape; anticipation ≈ 0.7°; listener nods ≤ 2°.
- **A12 Squash, stretch and smear nearly absent.** READ: clamp 0.93–1.07; only breath and laugh use it; smear only for `wave`/`point`.
- **A13 Seek-safety couplings.** READ: head/spine scale is reset by the look module, not by the engine; `seats` WeakMap caches the first scale seen; wrist yaw leaks.
- **A14 Follow-through is a gated sine.** READ (`secondary.js:9-10`; `turn` always 0).
- **L4 Paper and brush are invisible.** READ: stroke alpha 0.028, paper amplitude 0.00012 (~0.03/255), UVs stretched per face.
- **L5 Ink is a uniform, aliased line.** READ: constant radius, one colour, non-MSAA id target; the paintings use heavy black ink.
- **L6 One hard toon step.** READ (`shaders.js:41`); `uShade` only 0.35 on set meshes.
- **L7 Transparent materials blend ids in the ink pass.** READ (not rendered).
- **L8 Lens flattening only runs in Episode 1.** READ (`flattenCamera`).
- **B4 Colour tags missing on the encode; ffmpeg stdin has no error handler.** READ.
- **B11 Unknown beat id silently gets the ending camera** (`episode.js:50`). READ.

### Low
- **A15** `mouthCorners` never read; jaw contour pokes past outline; falsy-zero `||`. **A16** NaN/crash edges (zero-length path, unknown actor id). **A17** seated feet hang above the floor (`library.js:36` claims otherwise). **L9** missing assets fail late (`story-props.js:14` root-absolute path). **L10** colourless materials skipped silently (`look.js:42`). **L11** render cache fingerprint is a fixed file list. **L12** four near-duplicate `look.js`. **D1** `episodes/ep04.json` pavilion path still points at the old folder.

## What was NOT confirmed
- A2: 53% of cues are shorter than one drawing (confirmed); 16% are never shown by v4's sampling (121 of 741 cues, 7 closed-lip A). v5 shows every A; 52 of 616 non-silent cues stay hidden because they are under ~40 ms.
- The audit's walk figure of "10–26 steps/s" is the *peak*; the *average* is 6.8–17.4. Both are too fast.
- L7 (blended ids on transparent materials) and the `uShade` strength were found by reading; no frame was rendered to show them.

## The old Blender problems you asked about
| Problem | In this pipeline |
|---|---|
| Animations do not play / seek wrong | Plays and seeks fine: 81 out-of-order seeks are bit-identical. Posing is a pure function of time. One weak spot (A13). |
| Sliding feet | Feet never slide on the path in the old check only because the check cannot fail (QA). Real problems are the end-of-walk teleport and pivot drag (A1, A8). |
| Floaty or stiff bodies | Yes: A5, no contact shadow (L2), no squash (A12). |
| Lip sync | Late, loses short cues (A2). |
| Blinks, face turns | Blinks inconsistent (A9); head snaps (A4). |
| IK | Works; reach clamp keeps legs straight (A5). Gait stance is the issue. |
| Camera | Fine; one-drawing late cut (B1); no lens flattening (L8). |
| Lighting and shadow mismatch with the paintings | Yes: L1–L3. |
| Cast looks pasted on | Yes: no shadow, no shared light, uniform ink (L1, L2, L5). |

## Fix log
See `HANDOFF.md` (batch 1: runtime + audit tools; batch 2: walk/stand/turn; batch 3: faces, speech, gaze, squash; batch 4: look; batch 5: render, QA, checker; batch 6: docs).
