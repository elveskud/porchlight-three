# Prompt for the cloud agent: two independent jobs

**PART A** builds every missing set and character. **PART B** makes episodes buildable from a data file ("staging as data"). They do not depend on each other: run them in **two separate cloud sessions** (recommended, each on its own branch and pull request), or one after the other. Paste the common context plus the part you want into Claude Code (web / cloud) with this repository (`porchlight-three`) open. Setup the agent should run first:
`npm install && npx playwright install --with-deps chromium` (the browser tools switch to software WebGL on Linux by themselves).

---

## Common context (paste with either part)
You are working in **Porchlight Three**, an animated series drawn with Three.js (a fox, a raccoon, a bear and a rabbit in a lake town). Read, in this order and nothing else until you need it: `AGENTS.md`, `INDEX.md`, then `docs/cards/add-a-set.md` and `docs/cards/add-a-character.md`. Obey the hard rules in `AGENTS.md`.

## PART A: your job
Today only 12 of the 40 episodes can be built, because the other 28 need 11 sets and 7 characters that do not exist in 3D yet. **Build all of them**, so every episode can be built. The user will review the pictures and decide on look; you do the modelling.

### What is missing (most useful first: "episodes" = how many episodes need it)
#### Sets (the painting in `art/gemini/sets/` is the law for layout, furniture, colour and light)
| Set id | Episodes | Which | Reference painting(s) |
|---|---|---|---|
| gus_garage | 5 | 12, 21, 22, 36, 39 | `28_gus_garage_day.jpg, 29_gus_garage_night.jpg` |
| city_street | 3 | 27, 29, 30 | `33_city_street_winter.jpg, 34_city_canal_bench.jpg` |
| motel | 3 | 27, 28, 29 | `35_motel_room_day.jpg, 36_motel_room_night.jpg` |
| walt_garage | 2 | 7, 26 | `26_walt_garage_day.jpg` |
| town_line | 2 | 18, 26 | `30_town_line.jpg` |
| memory_lake | 2 | 20, 40 | `31_memory_lake_dusk.jpg, 32_memory_lake_storm.jpg (reuse the lake world: art/three/sets/lake-world)` |
| car | 2 | 26, 30 | `NONE: no painting exists. Build a simple plausible car interior (two front seats, dashboard, windscreen, road scrolling outside) and mark it "needs painting" in docs/ASSET_NOTES.md` |
| city_archive | 2 | 29, 30 | `38_city_archive.jpg` |
| festival_stage | 2 | 39, 40 | `39_festival_stage_dusk.jpg, 40_festival_stage_storm.jpg` |
| archive | 1 | 8 | `27_archive_basement.jpg` |
| city_pool | 1 | 28 | `37_city_pool.jpg` |

#### Characters (the sheet in `art/gemini/characters/` is the law; `refs/poses_*.jpg` show poses)
| Character id | Episodes | Which | Reference |
|---|---|---|---|
| walt | 11 | 5, 7, 15, 19, 21, 23, 24, 25, 26, 39, 40 | `03_walt.jpg + art/gemini/refs/poses_walt.jpg (Riot's dad, a fox)` |
| hal | 8 | 6, 8, 15, 16, 21, 23, 32, 39 | `04_big_hal.jpg + refs/poses_big_hal.jpg (park ranger, a big bear)` |
| bea | 6 | 9, 15, 19, 22, 23, 37 | `13_bea.jpg + refs/poses_bea.jpg (Bash's littlest sister, a small bear)` |
| pipmom | 4 | 6, 12, 13, 33 | `10_pips_mom.jpg + refs/poses_pips_mom.jpg (a rabbit)` |
| pipdad | 2 | 13, 33 | `11_pips_dad.jpg + refs/poses_pips_dad.jpg (a rabbit)` |
| ledger | 2 | 29, 30 | `16_ms_ledger.jpg (city archivist)` |
| coach | 1 | 28 | `15_coach_reyes.jpg (city coach)` |

### How to build one set
1. Look at the painting. Write down, in `docs/ASSET_NOTES.md`: layout, furniture, wall and floor colours, light direction, shadow colour, lamps.
2. Create `art/three/sets/v5/<set_id>.js` exporting `build()` that returns a `THREE.Group`. Use the kit helpers (`createKit` in `art/three/sets/primitives.js`; see how `comparisons/episode04/source/sets-v5.js` and `art/three/sets/reference-v2/build.js` build the park and apartment). Scale: the cast is small, about 1.2 units tall (leg 0.54): seat tops about 0.35, doors about 1.6, ceilings about 3. Give each mesh a name and a colour. Dress it so it never feels empty (clutter, plants, props, small life).
3. Register it: one line in `art/three/sets/v5/index.js` (`REGISTRY`), one catalog entry in `art/three/sets/catalog.js` (copy a neighbour; `build: 'v5'`; point `reference` at the painting; list the episodes), and a lighting record in `art/three/illustrated/reference-v3/lighting.js` (copy the closest set; set `light`, `shadowMul`, `tint`, `pool`, `bg` from the painting).
4. **Look at it**: `node tools/three-sets/preview.cjs set <set_id> art/review/<set_id>` (three cameras). Fix the cameras if needed with a `cams.json`. Compare to the painting: `python3 tools/three-sets/compare.py art/review/<set_id>/compare.png art/gemini/sets/<painting>.jpg art/review/<set_id>/<set_id>-1.png art/review/<set_id>/<set_id>-2.png`. Open the picture and judge honestly: layout first, then colour, then light. Repeat until it matches.

### How to build one character
1. Look at the sheet. Choose the nearest existing rig as `base` (`bash` bear, `riot` fox, `pip` rabbit, `rocco` raccoon, `mayor` cat, `preston`, `marlo`, `hiker`). Recolour with `retint()` (see `art/three/animation/v5/cast.js`, where `makeMom` rebuilds Bash's mom from Bash's rig: the pattern to copy) and add parts (ears, hair, clothes, props).
2. Create `art/three/animation/v5/characters/<id>.js` exporting `register()` that calls `registerCharacter(...)` with a performance `profile` (`amp` 0.3 quiet to 1.1 big gestures; Walt: calm, Hal: slow and big, Bea: tiny and fast). Add the id to `CHARACTERS` in `characters/index.js`.
3. **Look at it**: `node tools/three-sets/preview.cjs actor <id> art/review/<id> <set id for lighting>` (front, three-quarter, side, back). Compare with the sheet using `compare.py`. The face must read as the character from the front; the silhouette from the side.
4. Do not do voices: the user handles them.

### Rules for Part A
- Work on a branch named `assets/cloud-build`. One asset per commit with a clear message. Open a pull request at the end. **Do not merge it** and do not touch `main`.
- **Never edit** protected files (see `AGENTS.md` rule 5): `art/three/animation/v3` and `v4`, `art/three/illustrated/reference-v2` and older, `comparisons/episode01` to `03`, `voice/speak.py`, `BIBLE.md`, `STORY_MAP.md`. Add new files; the only existing files you may edit are `art/three/sets/catalog.js` (add entries), `art/three/illustrated/reference-v3/lighting.js` (add records), and the two `index.js` registries.
- Do not change the story or the secret. Family-friendly. The four friends are boys.
- After EACH asset, run the regression checks and make sure they still pass: `node tools/three-sets/verify-motion.cjs` and `node tools/three-sets/verify-episode04-v5.cjs`, and `python3 tools/check_scripts.py --no-md` (the set id must now count as existing). If software rendering is slow, run them every few assets instead, but always before the final commit.
- Commit the review pictures in `art/review/<asset>/` (they are small PNGs and the user will look at them on GitHub).
- If a painting is unclear or two readings are possible, pick the simpler one and write the question in `docs/ASSET_NOTES.md` instead of guessing a story detail. If you run low on time, stop after a finished asset, push, and list what is left in the PR description.
- Finish with the PR description: which assets are done, what looks weakest, what you want the user to decide.

---

## PART B: staging as data (separate branch `staging/data-driver`, separate pull request)

**Goal.** Today, to build an episode someone must hand-write about 30 KB of dense Three.js plus Python staging. Make it so an episode is built by filling in ONE data file from the script. Then a small local model (a 14B model on a laptop) can do it. **Read `docs/STAGING_SPEC.md` first: it is the full design** (the data format, what stays as code, the shared pieces, the acceptance tests). The Episode 4 build is the reference: `comparisons/episode04/source/` (`episode-v5.js` the driver, `prepare.py` the staging and timing, `crowd.js`, `sets-v5.js`, `story-props.js`). Also read `docs/cards/render-episode.md` and `ISSUES.md` (repo root) section "Review round 2" (the rules a build must follow: nobody pops in or out inside the frame, the speaker always in frame, close-ups end before the next speaker, seats must fit the actors).

**Build, in this order**
1. `art/three/episode/driver-v5.js`: the generic driver (the structure of `episode-v5.js` with the per-beat branches replaced by reading `staging.json`; keep cuts, off-screen entrances, seat fitting, crowd presets, overlay and the Friendzy logo ending). Per-episode oddities (props actions) go through `hooks` into the episode's own `props.js`; do not try to describe props in data.
2. `art/three/sets/spots.json`: named seats and spots per existing set (apartment: sofa_left, sofa_right, beanbag; stoop; lake; park benches; and so on), measured from the existing sets, with `pos`, `yaw`, `floor`. Use `seatedLegs()` in `art/three/animation/v5/locomotion.js`.
3. `tools/three-sets/edges.cjs`: given a beat's camera, return the x where an actor at a given depth is off-screen (method: render the beat at its start time so the camera is set, then step an actor's head point `(x, 1.1, z)` outward along the walking direction in 0.25 steps and project it with `new THREE.Vector3(x,1.1,z).project(camera)`; the first x where `abs(ndc.x) > 1.12` is off-screen. Use `tools/three-sets/lib.cjs` `open()` and `episode.renderAt(t,{draw:false})` as `tools/three-sets/probe.cjs` does. Episode 4's measured edges, for checking your tool: scene s04 left -11.3 and right 12.3 at depth z 2.3; s05 right 11.3 at z 3.6; s06 +x 7 at z 2.4; s08 +x 1 at z 5.5).
4. `pipeline/prepare_episode.py`: generic version of `comparisons/episode04/source/prepare.py` driven by `staging.json` and `episodes/epNN.json`: voices from `assets/vo/<line id>.wav` with Rhubarb cues, gait plans (`pipeline/gait_plan.py`), cuts snapped to the drawing grid and the neighbouring speakers, fast windows, audio cues. **Add `--placeholder-voices`**: when a line has no recording, make a silent WAV of the right length (words / 3.1 per second + 0.3 s) with simple synthetic mouth cues, and print a loud warning. The cloud cannot generate real voices (they need an Apple GPU); the user will generate them later with `voice/SETUP.md`.
5. `tools/validate_staging.py`: checks every name (set, seat, actor, line id, hook), that entrances and exits name a side, that seated actors have a seat, that close-ups name lines and are at least 1.1 s, that the beat ids match the script. **Every error message must say exactly what to change** (a small model fixes what the message tells it).
6. `docs/cards/stage-an-episode.md` (under 60 lines, self-contained: exact commands, files to touch, files NOT to read), and add it to `AGENTS.md` first-action table and `INDEX.md`.

**Acceptance (all must hold; put the evidence in the PR description)**
1. **Episode 4 regression.** Re-express Episode 4 as `comparisons/episode04/staging.json` + `props.js` + the generic driver. Do NOT delete or edit the existing `episode-v5.js`/`render-v5.cjs`: they are the baseline. In the same environment render 20 sample frames with the OLD driver and with the NEW driver (`node tools/three-sets/stills.cjs <page> <dir> <times>`; the delivered mp4 is not in the repo, so compare old against new yourself). They must be pixel-identical; list any difference and why. Also `verify-motion.cjs` and `verify-episode04-v5.cjs` pass on the new page.
2. **Episode 34** ("The Perfect Day", `episodes/ep34.txt`; every set and character it uses already exists): build it end to end with `--placeholder-voices`. Its checks pass (motion, QA), the speaker is always in frame, no pop-ins, close-ups valid. Commit review stills in `art/review/ep34/` (one per scene plus each close-up).
3. **Validator tests:** a small `tools/test_validate_staging.py` that feeds deliberately wrong staging (unknown seat, missing line id, entrance without a side, close-up that overlaps the next speaker, seated actor with no seat) and asserts each gives the clear message.
4. The card exists and a person following only the card can stage Episode 35 ("Last Turn", also needs nothing new): do this as a dry run and fix the card where you stumble.

**Rules for Part B.** Branch `staging/data-driver`; commit after each of the six steps; open a pull request; do not merge. Same protected files as Part A (never edit animation v3/v4, `reference-v2` and older, `comparisons/episode01-03`, `voice/speak.py`, `BIBLE.md`, `STORY_MAP.md`; do not edit Episode 4's existing driver files, only add). Do not change the story. If something in the spec is wrong or impossible, change it in `docs/STAGING_SPEC.md` and say why in the PR. If you run out of time, stop after a finished step, push, and list what is left in the PR description.
