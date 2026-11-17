# Occlusion pipeline: automatic depth masks for set paintings

**Status: approved by the user on 8 Nov 2026 as the binding pipeline standard** (after the 60-second test,
`Blender/videos/occlusion_test/occlusion_test.mp4`). Every set painting, new and existing, follows it. What's done
and what's left is in "Making it binding" at the bottom. The shared Blender code changed in small ways (see
"Files"), and Lazare needs to review those.

## What it does

When a set painting is added, `tools/occluders.py`:
1. finds the static things in front of the ground the cast walks on (lamp posts, trees, poles, fences, building corners);
2. cuts each one out as its own transparent 4K layer;
3. paints a clean background plate with those things removed.

The renderer stacks the layers in depth order, so a character passes behind a post and comes out the other side
with no clipping, floating or second copy. It's a flat composite: every layer is the same 4K canvas and nothing
slides against anything else (no 2.5D parallax).

## Commands

```
# new painting -> 4K plate, layers, clean plate, set JSON entries, check sheet
Blender/voices/.venv/Scripts/python Porchlight/tools/occluders.py town_square_night --src Porchlight/art/gemini/first-round/a1_town_square_night.jpg --walk 462,498,540
# the test shot: stills first, then the full render (4 jobs, on twos)
FRAMES=120,600,1000 blender --background --python Porchlight/tools/occlusion_test.py -- Blender/videos/occlusion_test/stills
FRAME_RANGE=0-449 blender --background --python Porchlight/tools/occlusion_test.py -- Blender/videos/occlusion_test/frames
```
Environment as for every render: `PORCHLIGHT_DIR`, and for the first model download behind Avast,
`SSL_CERT_FILE=C:\Porchlight-work\apps\ca-bundle-with-avast.pem` and `HF_HUB_DISABLE_XET=1`. The tool runs on the
voice venv's existing torch (CUDA, RTX 3080) and installs nothing; the two models (~480 MB) are cached by Hugging Face.

## Step by step (the test set, `town_square_night`, from `art/gemini/first-round/a1_town_square_night.jpg`)

Times are on the RTX 3080; the whole pass takes 78 s. The full log is in `art/hd/occluders/town_square_night_log.txt`.

| # | Pass | What happens | Result on the test set |
|---|---|---|---|
| 0 | Plate | The upload is scaled to 3840x2160 (Lanczos) and saved as the set plate | a1.jpg 1024x572 -> 4K. Soft: an AI upscale would be better for real use |
| 1 | Depth | **Depth Anything V2 Small** gives relative depth for every pixel (1 = nearest) | 2 s |
| 2 | Segmentation | **Segment Anything (ViT-B)**, automatic: a 32x32 grid of point prompts, 3 outlines each; keep confident (IoU > 0.86) and stable (> 0.9) ones; drop near-duplicates | 694 outlines -> 123 segments, 59 s |
| 2b | Thin posts | A grid point rarely lands on an 8 px pole, so poles are found in the depth (a run of pixels nearer than both sides, 9+ px tall) and SAM is prompted with 6 points along each | 2 lamp posts added |
| 3 | Occluder test | A segment is an occluder if it **stands up** (its top is about as near as its bottom, unlike ground, which gets further away going up) and **sticks out** (nearer than what's around its top). Parts of one object are merged, and a piece resting on another joins it (a lamp head on its pole, leaves on the trunk) | 16 of 125 segments -> 6 objects |
| 4 | Base line | Where each occluder meets the ground (its lowest row). A character is behind it when their feet are higher up the painting than that line. The layer's depth (z) sits between the walk lines it separates | lamp posts 484 / 490 -> z 4.75; tree 504 and building corner 524 -> z 6.25; two far treetops -> z 2.0 |
| 5 | Layers | Each occluder is cut from the 4K plate: SAM's outline scaled up and grown 2 px (SAM stops just short of the painted ink line), with a 1 px soft edge. Edge pixels take the object's own colours, so a character behind it gets a post-coloured edge, never a fringe of the wall behind the post | 6 RGBA layers in `art/hd/fronts/town_square_night_auto_NN.png` |
| 6 | Clean plate | Under the solid part of every layer: painted out with a smooth push-pull fill from the pixels around it. Under the soft edges: **unmixed** (painting minus layer, divided by what the layer leaves visible), so layers over plate add back up to the painting exactly. The tool checks this every run | `art/hd/sets/town_square_night_clean.png`, 32% filled. Layers over plate vs painting: mean error 0.01/255, 0.000% of pixels off by more than 8 (the first version, with the edge pulled inside and no unmixing, left ~2% off: a thin ring around each post) |
| 7 | Spec | The set JSON gets `"fronts"` entries (`"auto": true`, `z`, `base_px`, `bbox`), `"clean"` and `"walk_lines"`. Hand-cut fronts already there are kept unless `--replace` | `art/hd/sets/town_square_night.json` |

Check sheet for every run, `art/hd/occluders/<plate>_sheet.jpg`, has four panels:
- the painting;
- the depth map;
- each occluder in colour, with its base line, depth and the walk lines;
- the clean plate.

## Layer stack (render order, back to front)

| z | Layer | Test set |
|---|---|---|
| -9.5 | Clean plate (or the original plate when a set has no `"clean"`) | town_square_night_clean |
| 2.0 | Occluders behind every walk line (far treetops; painted, so they look the same as the plate) | auto_05, auto_06 |
| 4.0 | Cast on the back walk line (462) | Riot |
| 4.75 | Occluders between back and middle lines | lamp posts auto_03, auto_04 |
| 5.5 | Cast on the middle walk line (498) | Pip |
| 6.25 | Occluders between middle and front lines | tree auto_02, building corner auto_01 |
| 7.0 | Cast on the front walk line (540) | Bash |
| 9.2 | Occluders in front of every walk line | none on this set |

Each character's own parts span about +-0.5 around its line's z, and the layers sit 0.75 apart, so a part never
crosses a layer.

## Blender setup

The stack isn't built in Blender's node compositor. Each layer is an image plane in the one orthographic scene
(`toon.img`, Workbench renderer, flat shading), placed at its z above. The orthographic camera looks straight down
the z axis, so z only decides what covers what, never size or position. The result is the same as an "alpha over"
chain in the compositor, done in one render pass with no extra passes to keep in sync.

What the loader does (`locations.plate`):
- it uses the clean plate when the set JSON names one;
- it loads every entry in `"fronts"`, both hand-cut and auto, at its z.

The episode renderer picks this up with no other change.

## The test shot

`Blender/videos/occlusion_test/occlusion_test.mp4`: 60 s, 1920x1080, 30 fps (drawn on twos), one fixed wide shot
with no cuts and no camera moves. A small label at the top left names the walk line in use.

| Time | What to look at |
|---|---|
| 0:01-0:05 | Riot (back line) walks in and stops **behind** the left lamp post: the pole crosses his body; he waves behind it |
| 0:05-0:17 | Riot walks to centre, then stops **behind** the right lamp post, then walks off **behind** the building corner |
| 0:17-0:22 | Pip (middle line) steps out from **behind** the tree trunk and stops **in front of** the left lamp post, then hops |
| 0:24-0:36 | Pip walks **in front of** the right lamp post, hops, then walks off **behind** the building corner |
| 0:36-0:47 | Bash (front line) walks in **in front of** the building corner and lamp post; waves and cheers. Riot crosses the whole set again on the back line, **behind** everything, and passes behind Bash |
| 0:47-0:56 | Bash walks off left, **in front of** the left lamp post and the tree |
| 0:56-1:00 | Empty set: clean plate + layers, which should look exactly like the original painting |

## Known limits (honest list)

1. **The clean plate is a smooth fill, not a repaint.** It sits only under the solid part of a layer, so on screen
   it never shows. If an occluder ever needs to move or disappear, that hole needs a real inpaint
   (LaMa locally, or a Gemini repaint).
2. **Detection isn't perfect; the check sheet must be looked at for every set.** On the test set it missed the
   low shrubs beside the right lamp post (they stay painted on the plate, so a character on the back line walks in
   front of them). It also picked up two far treetops; those are harmless at z 2.0, since they cover nothing.
3. **Depth comes in bands between walk lines.** Characters have to use the set's walk lines (`"walk_lines"` in the
   set JSON). A walk can't change depth (already a pipeline rule: `walk_to` only moves sideways).
4. **`motion.walk()` lifts a walker 1.5 nearer while walking** ("passes in front" of the others). In a depth stack
   that pops the walker over any layer less than 1.5 in front. The test drops that lift in its own script; the
   shared fix belongs in `motion.py` (Lazare). This already affects the lake tower: Riot on the `tower` spot
   (z 1.0) walking would pass in front of the railing (z 2.0).
5. **Episodes with `"act": "auto"` turn on parallax for foreground fronts** (`PARALLAX_FRONTS`, z >= 8.5 slides
   1.15x). The flat standard means switching that off.
6. **The existing six sets were hand-cut over several review rounds** (cattails from the day plate, the open
   railing, sofa fronts). Re-cutting them automatically could bring back problems already fixed. My
   recommendation: run the tool on them with `--no-spec` and compare the sheets, keeping the hand cut wherever it's better.

## Making it binding (approved 8 Nov 2026)

- [x] A step in "adding a set" (`docs/ANIMATION_CHECKLIST.md`, Part 0 "Pipeline and process"; `CLAUDE.md`): every new
      painting goes through `occluders.py`, and its check sheet is looked at before the set is used.
- [x] `make.py --check` warns when a painted set has had no occluder pass (no `"clean"` in its JSON) and hasn't
      been reviewed and kept hand-cut (`"occluders": "hand"`). (`episode_script.check_occluders`)
- [x] Walks never pop over a front layer: `motion.walk(..., lift=1.5)` is now a parameter (same default, so the
      Shorts don't change); on painted sets `episode_scene.walk_lift` caps it 0.6 below the nearest front layer in
      front of the walker. Shared motion code: Lazare to review.
- [x] Flat layers: `episode_scene.py` sets `PARALLAX_FRONTS` and `PARALLAX_LAYERS` to False (foreground plants no
      longer slide in `"act"` episodes; no set uses depth layers yet).
- [ ] Existing sets: comparison sheets made with `occluders.py <plate> --walk ... --review` (writes only
      `art/hd/occluders/<plate>_review.jpg`). Decide set by set: run the full pass, or keep the hand cut and mark
      the JSON `"occluders": "hand"`.
- [ ] "Automatically on upload": no upload hook exists; for now it's the checklist step plus the `--check` warning.
      A Claude Code hook on new files in `art/gemini/new/` can be added if wanted.

## Files

New:
- `Porchlight/tools/occluders.py` (the pass);
- `Porchlight/tools/occlusion_test.py` (the test shot);
- `Porchlight/art/hd/sets/town_square_night{.png,_clean.png,.json}`;
- `Porchlight/art/hd/fronts/town_square_night_auto_01..06.png`;
- `Porchlight/art/hd/occluders/` (sheet, log, depth map).

Changed:
- `Blender/characters/locations.py` (shared), two changes:
  - a `town_square` entry in `PLATE_SETS`;
  - `plate()` uses `"clean"` when the set JSON names one.
- `Blender/characters/motion.py` (shared): `walk()` takes `lift` (default 1.5, unchanged).
- `Blender/templates/episode_scene.py`: flat layers; `walk_lift()` for every walk on, off and `walk_to`.
- `Blender/templates/episode_script.py`: `check_occluders()` warning.
- `Porchlight/tools/fronts.py`: skips `"auto"` fronts.

Backups of both are in the session scratchpad (`orig13`).
