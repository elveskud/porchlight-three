# Card: add a set (a new location)
Rule: **the painting in `art/gemini/sets/` governs layout, furniture, colour and light.** The set is modeled 3D (no painted backdrop cards, user decision 17 Nov).

## Steps
1. Get the painting: prompt from `docs/gemini/SET_PROMPT_TEMPLATE.md` (style reference: `art/gemini/sets/lake_day_v2.jpg`). The user generates it; results go in `art/gemini/new/`, then move the chosen one to `art/gemini/sets/<name>.jpg`.
2. Look at the painting. Write down: key light side, shadow colour, lamp pools, wall/floor colours, furniture list.
3. Model it: add a builder in `art/three/sets/exteriors.js` or `interiors.js` (use `primitives.js` helpers: box, ball, `photo`), or a new file `art/three/sets/reference-v3/build.js` that copies `reference-v2/build.js` pattern. Each mesh needs a name and colour; give set meshes `userData.referenceColor = hex` (see `comparisons/episode04/source/sets.js` line ~22) so the look keeps your colours.
4. Register it in `art/three/sets/catalog.js`: `set('id','Name','build','mood','file.jpg',[episodes],'note')`.
5. **Light record** in `art/three/illustrated/reference-v3/lighting.js`: copy the closest set; set `light` (direction toward the sun/lamp), `shadowMul` (cool grey-blue day, purple sunset, warm brown indoors, deep blue night), `tint`, `pool`, `bg`. Unknown ids print a warning and use day light.
6. In the episode driver (`comparisons/episodeNN/source/episode-v5.js`): add the id to the `modeled` list, set the camera in the beat branch.
7. Look at it: `node tools/three-sets/stills.cjs comparisons/episode04/source/render-v5.html /tmp/s <time> name`, compare with the painting side by side. Fix layout first, colour second, light third.
8. `python3 tools/check_scripts.py` — the set id now counts as existing (read from `catalog.js`).

## Fullness and seating (user review, 17 Nov)
- A set must never look empty: trees at several depths, bushes, flowers, a path, small life (ducks, birds). See `comparisons/episode04/source/sets-v5.js` `dressPark`.
- Furniture is built for the actors' size: a seat top about 0.3-0.4 (leg length 0.54). Place seated actors with `put(id,[x,seatTop+0.04,z],t,b,{seat:1,floor:0})`: `seatedLegs()` fits the legs. Check from the side: `node tools/three-sets/closeup.cjs <page> <t> <actor> out.png 4 38 .45 1.45`.

## Files to touch
`art/three/sets/catalog.js`, `art/three/sets/<builder>.js`, `reference-v3/lighting.js`, the episode's `source/episode-v5.js` and `sets.js`.

## Do NOT read
`art/three/sets/reference-v1/*`, `lake-world/*` (unless the set is a lake), `art/hd/*` (old plates), `docs/OCCLUSION_PIPELINE.md` (history).

## Check
Painting and render match in layout and light; no generic warm tint; cast has a contact shadow; `verify-episode04-v5.cjs` still PASS (pictures not black).
