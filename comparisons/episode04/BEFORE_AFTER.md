# Episode 4: before and after (17 Nov 2026)

**Before:** `Porchlight Episode 4 - Not For Sale - Illustrated 3D (Three.js).mp4` (v4, delivered 15 Nov, SHA-256 `8e986044…32bc`).
**After:** `Porchlight Episode 4 - Not For Sale - v5 (Three.js).mp4` on the Desktop (SHA-256 `4b32df92856011d5410609ee74a895d627180aa335089caa81ddd8eaf979bbe5`; source fingerprint `6f5466f76e464435…`).
Same script, same 54 voice recordings, same music and sets, same story. Same length: 194.33 s, 1080p, 24 fps, 4,664 frames, −14 LUFS. Picture comparison: `v5/before-after-sheet.jpg` (top v4, bottom v5, four moments).

## What you should see
- **Walks.** v4: feet scurried (peak 10–26 steps a second) and jumped at the end of every walk. v5: a planned walk or jog (4–5 steps a second when jogging), feet land together at the end, no pop.
- **Standing.** v4: statues (pelvis, feet and knees never moved). v5: slow weight shift, knees soft (bend 0.03 → 0.28–0.35 rad), hips and chest tilt against each other. Feet stay planted.
- **Faces.** Expressions blend in and out. Blinks are a clean three-drawing blink (see the strip method in `docs/cards/run-checks.md`). Eyes and head hold their last target and fade, with small eye darts. Head snaps: 375 → 103 per film; eye snaps: 333 → 75.
- **Mouths.** Every closed-lip M/B/P shape (`A`) now shows. v4 hid 6. The six bear relatives no longer talk with Bash's mouth (a v4 bug).
- **Look.** Per-set light and shadow from the paintings (the stoop sunset now has purple shadows, the lake night a cool moon), a flat contact shadow under every character, boiling dark outlines that change every drawing, paper grain, flatter lens on the outdoor shots.
- **Body.** Squash and stretch on stops, starts, takes and laughs; ears, tail and clothes drag when someone stops; drawings go to ones (24 a second) for the hammer, the reveal, the bee, the horn and the lamp click; the rest stays on twos.

## Numbers (same measuring script on both: `tools/three-sets/audit-ep4.cjs`)
| | v4 | v5 |
|---|---|---|
| steps a second, fastest walk | 26.3 | 5.4 (a jog) |
| pelvis jump at end of walk (units; leg is 0.55) | 0.08–0.25 | 0.001–0.03 |
| standing knee bend (rad) | 0.03 | 0.28 |
| standing pelvis sway (units) | 0 | 0.087 |
| one-drawing head snaps per film | 375 | 103 |
| one-drawing eye snaps per film | 333 | 75 |
| closed-lip mouth shapes hidden | 6 | 0 |
| scene starts one drawing late | 1 (s03 at 32.75 s) | 0 |
| relatives with Bash's mouth | 6 | 0 |

## Honest limits
- Walks are jogs because the old staging gives them 0.6–2 s for 3–10 units (decision question 1 in `HANDOFF.md`).
- Mouth shapes under about 40 ms (52 of 616 spoken cues) still cannot show on twos.
- Eyes and head still snap 103 times (mostly at a speaker change: a speaker change is one drawing on twos); smile pops 3.
- The ink boil and paper are tuned by eye on seven sets; thirteen lighting records are estimates (`lighting.js` says which).
- Seated characters still hang their feet above the floor.
- I judged pictures from stills and strips, not by watching the film in motion: please watch it.

## Checks on the finished film (all PASS)
`verify-film.py` (size, frame count, full decode, loudness −14.1 LUFS, BT.709, black only in the last fade, exactly half the frame pairs held), `verify-motion.cjs`, `verify-episode04-v5.cjs` (60 out-of-order seeks identical, nine mouth shapes, no mouth later than one drawing, 114 footsteps = landings).

## Revision 2 (after the user's review, 17 Nov)
File: `Porchlight Episode 4 - Not For Sale - v5 revised (Three.js).mp4` (SHA-256 `9a366d4cbb9b6af1ef2b6f09d50b7e154189638967890d3dda10ea2a945077cc`), 197.17 s, 4,732 frames. The first v5 stays on the Desktop to compare; v4 is untouched.
What changed, from the review notes (details in `ISSUES.md` "Review round 2"):
- **Backgrounds full:** the park has trees at every depth, bushes, flowers, a path, blanket, boat, ducks, birds; the camera is lower.
- **Title:** the whole lookout tower is in frame.
- **Seating:** legs fit the seat (sofa rescaled to the actors, beanbag rebuilt); seated characters turn slightly so the legs read.
- **Bash's mom:** round ears, tan muzzle, nose, bun and apron like the sheet.
- **Extras:** six individual relatives (own colours, sizes, hats, bows, glasses) framing the scene, each acting on its own cycle (waving, cheering with hops, laughing, whispering, pointing). They were still before.
- **Nobody pops in or vanishes inside the frame:** every entrance starts and every exit ends off-screen (0 found by the new check).
- **Faster joggers:** about 3.1 units a second, quicker steps. The hiker, Preston at the lake and Marlo at the notice walk.
- **Seven close-ups,** each held for a line and a beat and cut back before the next person speaks.
- **Ending:** the Friendzy logo (app icon) pops in small on black after the lamp click.
Checks on the finished film: all PASS (film, motion, QA with 60 out-of-order seeks, nine mouth shapes, 153 footsteps = landings, zero pop-ins, the speaker always in frame).
Not changed: voices, story, canon. Honest limits: the sofa is lower than in the painting; fullness is judged by eye; I looked at stills and strips, not the moving film.
