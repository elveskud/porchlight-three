---
name: anim-ink-and-paper
description: Keeping the painted storybook look while things move - drawings held on twos, ink boil, static paper, painted shadows, flat sets, forbidden effects. Use when motion looks too smooth or too CG, the ink or paper looks wrong, or before adding any effect to a shot.
---
# Ink and paper in motion

## The look (project rule)
Modeled 3D with a painted-storybook 2D feel: **held on twos, ink boil, paper, painted shadows, squash and stretch.** The pictures in `art/gemini/sets` govern layout, colour and light. **No occluder or painted-card pipeline** (user, 17 Nov).

## What makes it (the code)
- **Twos**: `sampleClock(t, windows)` in the driver holds each drawing: 12 drawings a second, 24 inside `fastWindows` (fast action). Every animated value is read at the drawing's start time, so two 24 fps frames that share a drawing must be identical. `verify-motion.cjs` checks this.
- **Ink boil**: `post.uniforms.uSeed = floor(t*12) % 3` in `reference-v3/look.js`: three different hand-drawn line wobbles that cycle each drawing. `uBoil` (1.1) is the wobble amount. Lines are thicker on actors (radius 1.1 to 2.4 px) than sets.
- **Paper**: `uPaper` (0.05), screen-locked grain and fibres, the same on every drawing. It does not move with the camera.
- **Painted shadows**: per-set `shadowMul` and `tint` in `reference-v3/lighting.js` (cool grey-blue in daylight, purple at sunset, warm brown indoors, deep blue at night). Contact shadows under actors.
- **Flat lens** on exteriors (`look.flatten`) so a wide shot reads as a painted plate.

## Rules for motion in this look
1. **Hold, do not smooth.** Never "improve" motion by putting it on ones. Smooth glide is the CG look. Big moves on twos, only the fastest action on the 24 fps windows.
2. **Strong poses on the held drawings.** Each drawing must read as a picture. The silhouette test matters more here than in smooth 3D.
3. **Squash and stretch are the heart** (`anim-impact`). Rubbery timing on the hits that matter; keep volume.
4. **Boil, do not shake.** The line wobble lives in the ink pass. Do not add camera shake or vertex jitter to get "hand-made". Do not change `uSeed` cycling.
5. **Paper stays still** on screen. If paper grain slides with a camera pan, it is wrong.
6. **Flat colour and painted light.** No glossy highlights, no real-time soft shadows, no bloom, no film grain on top. Light comes from the set record, not the engine default.
7. **Effects are painted too**: dust puffs, splashes, glints are simple shapes with the same ink and flat shading (`anim-props-and-fx`).
8. **Backgrounds feel full** (Ep 4 review): a painted set with life (plants sway, water shimmers, lights twinkle) but all on twos.
9. **Never rewrite finished modules.** The look is `reference-v3` (current) over `reference-v2` (finished builds). Change numbers at the top of `main()` in the screen pass only, one at a time.

## Common failures
| Symptom | Cause | Fix |
|---|---|---|
| Looks like plain 3D | too many ones, glossy materials, no boil | check twos, check `uBoil`, flat materials |
| Lines crawl too much | boil too strong | lower `uBoil` slightly |
| Lines vanish on actors | radius too small at that resolution | actor radius in the screen pass |
| Paper looks like a filter | too strong or moving | `uPaper` lower, keep static |
| Cast looks pasted on | wrong light record or no contact shadow | `lighting.js`, `look.js` (`anim-world`) |
| Motion feels digital | smooth ease everywhere | add holds, pops to key poses, anticipation |

## Check
`stills.cjs` on three adjacent drawings: ink lines differ slightly between them, the paper is identical, the picture holds for two frames. Compare with the set painting using `compare.py`.
