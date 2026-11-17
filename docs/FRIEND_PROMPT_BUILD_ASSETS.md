# Prompt for the cloud agent: build every missing set and character

Paste everything below the line into Claude Code (web / cloud) with this repository (`porchlight-three`) open. Setup the agent should run first:
`npm install && npx playwright install --with-deps chromium` (the browser tools switch to software WebGL on Linux by themselves).

---

You are working in **Porchlight Three**, an animated series drawn with Three.js (a fox, a raccoon, a bear and a rabbit in a lake town). Read, in this order and nothing else until you need it: `AGENTS.md`, `INDEX.md`, then `docs/cards/add-a-set.md` and `docs/cards/add-a-character.md`. Obey the hard rules in `AGENTS.md`.

## Your job
Today only 12 of the 40 episodes can be built, because the other 28 need 11 sets and 7 characters that do not exist in 3D yet. **Build all of them**, so every episode can be built. The user will review the pictures and decide on look; you do the modelling.

## What is missing (most useful first: "episodes" = how many episodes need it)
### Sets (the painting in `art/gemini/sets/` is the law for layout, furniture, colour and light)
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

### Characters (the sheet in `art/gemini/characters/` is the law; `refs/poses_*.jpg` show poses)
| Character id | Episodes | Which | Reference |
|---|---|---|---|
| walt | 11 | 5, 7, 15, 19, 21, 23, 24, 25, 26, 39, 40 | `03_walt.jpg + art/gemini/refs/poses_walt.jpg (Riot's dad, a fox)` |
| hal | 8 | 6, 8, 15, 16, 21, 23, 32, 39 | `04_big_hal.jpg + refs/poses_big_hal.jpg (park ranger, a big bear)` |
| bea | 6 | 9, 15, 19, 22, 23, 37 | `13_bea.jpg + refs/poses_bea.jpg (Bash's littlest sister, a small bear)` |
| pipmom | 4 | 6, 12, 13, 33 | `10_pips_mom.jpg + refs/poses_pips_mom.jpg (a rabbit)` |
| pipdad | 2 | 13, 33 | `11_pips_dad.jpg + refs/poses_pips_dad.jpg (a rabbit)` |
| ledger | 2 | 29, 30 | `16_ms_ledger.jpg (city archivist)` |
| coach | 1 | 28 | `15_coach_reyes.jpg (city coach)` |

## How to build one set
1. Look at the painting. Write down, in `docs/ASSET_NOTES.md`: layout, furniture, wall and floor colours, light direction, shadow colour, lamps.
2. Create `art/three/sets/v5/<set_id>.js` exporting `build()` that returns a `THREE.Group`. Use the kit helpers (`createKit` in `art/three/sets/primitives.js`; see how `comparisons/episode04/source/sets-v5.js` and `art/three/sets/reference-v2/build.js` build the park and apartment). Scale: the cast is small, about 1.2 units tall (leg 0.54): seat tops about 0.35, doors about 1.6, ceilings about 3. Give each mesh a name and a colour. Dress it so it never feels empty (clutter, plants, props, small life).
3. Register it: one line in `art/three/sets/v5/index.js` (`REGISTRY`), one catalog entry in `art/three/sets/catalog.js` (copy a neighbour; `build: 'v5'`; point `reference` at the painting; list the episodes), and a lighting record in `art/three/illustrated/reference-v3/lighting.js` (copy the closest set; set `light`, `shadowMul`, `tint`, `pool`, `bg` from the painting).
4. **Look at it**: `node tools/three-sets/preview.cjs set <set_id> art/review/<set_id>` (three cameras). Fix the cameras if needed with a `cams.json`. Compare to the painting: `python3 tools/three-sets/compare.py art/review/<set_id>/compare.png art/gemini/sets/<painting>.jpg art/review/<set_id>/<set_id>-1.png art/review/<set_id>/<set_id>-2.png`. Open the picture and judge honestly: layout first, then colour, then light. Repeat until it matches.

## How to build one character
1. Look at the sheet. Choose the nearest existing rig as `base` (`bash` bear, `riot` fox, `pip` rabbit, `rocco` raccoon, `mayor` cat, `preston`, `marlo`, `hiker`). Recolour with `retint()` (see `art/three/animation/v5/cast.js`, where `makeMom` rebuilds Bash's mom from Bash's rig: the pattern to copy) and add parts (ears, hair, clothes, props).
2. Create `art/three/animation/v5/characters/<id>.js` exporting `register()` that calls `registerCharacter(...)` with a performance `profile` (`amp` 0.3 quiet to 1.1 big gestures; Walt: calm, Hal: slow and big, Bea: tiny and fast). Add the id to `CHARACTERS` in `characters/index.js`.
3. **Look at it**: `node tools/three-sets/preview.cjs actor <id> art/review/<id> <set id for lighting>` (front, three-quarter, side, back). Compare with the sheet using `compare.py`. The face must read as the character from the front; the silhouette from the side.
4. Do not do voices: the user handles them.

## Rules for the work
- Work on a branch named `assets/cloud-build`. One asset per commit with a clear message. Open a pull request at the end. **Do not merge it** and do not touch `main`.
- **Never edit** protected files (see `AGENTS.md` rule 5): `art/three/animation/v3` and `v4`, `art/three/illustrated/reference-v2` and older, `comparisons/episode01` to `03`, `voice/speak.py`, `BIBLE.md`, `STORY_MAP.md`. Add new files; the only existing files you may edit are `art/three/sets/catalog.js` (add entries), `art/three/illustrated/reference-v3/lighting.js` (add records), and the two `index.js` registries.
- Do not change the story or the secret. Family-friendly. The four friends are boys.
- After EACH asset, run the regression checks and make sure they still pass: `node tools/three-sets/verify-motion.cjs` and `node tools/three-sets/verify-episode04-v5.cjs`, and `python3 tools/check_scripts.py --no-md` (the set id must now count as existing). If software rendering is slow, run them every few assets instead, but always before the final commit.
- Commit the review pictures in `art/review/<asset>/` (they are small PNGs and the user will look at them on GitHub).
- If a painting is unclear or two readings are possible, pick the simpler one and write the question in `docs/ASSET_NOTES.md` instead of guessing a story detail. If you run low on time, stop after a finished asset, push, and list what is left in the PR description.
- Finish with the PR description: which assets are done, what looks weakest, what you want the user to decide.
