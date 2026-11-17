# Porchlight

An animated story series set in Maple Hollow, a lake-and-forest town where summer never ends. Riot, Rocco, Bash and Pip (the Friendzy cast) are the main characters. 40 episodes of 3–4 minutes, landscape, released Wednesday and Saturday.

This is **Porchlight Three**: the fresh, Three.js-only copy (17 Nov 2026). Start with `HANDOFF.md`.

## What's here
The top level holds only the five documents you read most. Everything else is in a folder.

| Where | What it is |
|---|---|
| `DECISIONS.md` | Every decision made with the user. Read this first. |
| `BIBLE.md` | The series bible: world, cast, the secret and its rules, tone. |
| `STORY_MAP.md` | All 40 episodes, arc by arc. |
| `CLAUDE.md` | How to work on this project (for Claude sessions). |
| `docs/` | How-to guides: `ANIMATION_CHECKLIST.md` (rules, known problems, per-episode checklist), `ANIMATION_TODO.md` (every episode JSON field), `ANIMATION_WINS.md`, `WRITING_AN_EPISODE.md` (the script format), `OCCLUSION_PIPELINE.md` (read before adding a set), `FRIEND_GUIDE.md`, `INSTALL_UPDATE.md`, `OVERNIGHT_RUN.md`. |
| `docs/gemini/` | Everything for Gemini: `GEMINI_PROMPTS.md` (set paintings), `GEMINI_BATCH.md` (numbered prompts still to make), `GEMINI_CHARACTERS.md`, `GEMINI_REDO.md`, `GEMINI_WALT.md`, and `pose_prompts/` (one file per townsfolk character). |
| `episodes/` | Episode scripts (`epNN.txt`) and the renderer's JSON (`epNN.json`). |
| `scripts/` | Readable versions of the scripts (`epNN.md`), rebuilt by `tools/check_scripts.py`. |
| `art/` | All pictures. `hd/` = 4K sets, fronts and occluders the pipeline renders with; `gemini/` = Gemini originals (`sets/` approved set paintings, `first-round/` the first 11 paintings from 29 Oct with names, one folder per character sheet for `tools/cut.py`, `refs/` pose and walk guides, `new/` drop folder for new results); `parts/` = cut-out pieces and critters; `inserts/` = on-screen inserts; `refs/` = reference sheets (`cast-for-gemini/`, `side-views/`, `walk-sheets/`, `riot-parts/`, townsfolk line-up, Bash poses). The pipeline reads `art/hd/sets/`, `art/gemini/sets/` and `art/parts/` by path: don't rename them. |
| `tools/` | Script checker, Rhubarb lip sync, Three.js set tools. |
| `voice/`, `pipeline/` | Voice pipeline code and base voices; script parser, sound effects and mixer. |
| `comparisons/` | Episode 1–4 Three.js builds (source, voices, cues). |

## What lives elsewhere
- **Old project and Blender pipeline (archive, untouched):** `~/Desktop/Porchlight.nosync` and `~/Desktop/Blender`.
- **The Friendzy app (real prompts, features):** `~/Desktop/Friendzy/`.

## Rules for working on it
- See `CLAUDE.md`. English, family-friendly, no cringe, no sarcasm. Illustrated Three.js is the production route; voices, sounds and music are generated.
- Nothing is posted, scheduled, committed or pushed without the user asking.

<!-- MAPLE_HOLLOW_GENERATED_DOCS -->

## Maple Hollow spatial town

The town has 66 sourced locations: 39 exterior places and 27 interior rooms. Each has a collection, named anchor, and wide/close camera presets. Furnished spaces provide 71 seat anchors with separate furniture fronts and backs. The orange apartment sofa, green beanbag, blue entrance door, brick stoop, lake lookout, hall, bedrooms and other details use the existing set pictures as references. Characters remain flat cutouts in real world positions.

- [Location list and evidence summary](maple_hollow_discovery.md); [machine-readable catalog](maple_hollow_locations.json).
- [Build, camera, shot-list, cache and verification instructions](animation25d/README.md#maple-hollow-town).
- [Town overview](animation25d/output/maple_hollow/town_overview.png), [editable town](animation25d/output/maple_hollow/maple_hollow.blend), [Bash walkthrough MP4](animation25d/output/maple_hollow/bash_walk_and_sit.mp4).

Discovery reads project text, the reading-script PDF when PDFKit is available, filenames, and ZIP text/member names. Historical archives are kept separate. Binary artwork is indexed by filename; selected existing set pictures were also inspected visually for modeling. Generated town files cannot establish their own canon. Evidence-search rules and unknown scene headers produce the catalog; this is not an OCR or general language extraction service.

To add a location, mention it in its script/art brief, add its search rule and staging settings in `animation25d/config.py`, then run `python3 animation25d/discover_locations.py` and rebuild. Unknown episode scene headers are retained automatically with a provisional room type/layout. To rename one, keep its ID stable, update the display name/source and alias in that config, then regenerate. Change the ID only when also updating shot references. Do not hand-edit generated JSON.

## Please confirm

These defaults allow work to proceed; they are not approved story geography:

- All world coordinates, distances, building sizes, unspecified doors/windows, furniture positions, and camera routes are **guessed**. No surveyed floor plan was found.
- Hall front/back room division and connecting passages between family rooms are **guessed**.
- The city uses a separate staging area; the memory lake uses the present lake's position. Travel distances and period-specific scenery are **guessed**.
- Unspecified church, shop, ranger-station and grandfather-house shapes are generic **guesses**. No new business or street names were invented.
- Roof and wall cutaways are production choices for cameras.
- Bash's bathroom/hallway, Pip's new bedroom, town hall, motel shower and pool corridor are marked **implied**, with evidence in the catalog. Extended family occupancy beyond explicit home labels remains **implied**.

No additional artwork is required to run the demo. For a final production match, supply approved side/rear building views, floor plans and furniture dimensions, plus artwork for the generic locations above. Back-facing walking poses would support shots from behind the cast. Confirm official names only if those places should have names beyond their sourced descriptive labels. Four cast members reuse the existing code cutouts and seated artwork; no new 3D character models were made.


## Three.js set collection — episodes 1–6

The first six episodes now have 16 full 3D locations across 20 lighting variants, modeled from the existing Gemini paintings. Run `python3 tools/three-sets/serve.py` to open the local viewer, then filter by episode, orbit through each location, compare its source painting, open doors, and export editable geometry. Three.js is bundled locally; the viewer works offline.

- [Set guide and coverage](art/three/sets/README.md)
- [All 20 sets on one contact sheet](art/three/sets/previews/contact-sheet.jpg)
- [Editable GLB assets](art/three/sets/exports/)
- [Browser verification](art/three/sets/verification.json) and [Blender import verification](art/three/sets/blender-verification.json)

Hidden geometry and dimensions are inferred from single pictures. This is a standalone set collection for review and scene assembly.


## Maple Hollow Three.js town master plan

Claude’s town draft is completed as a navigable atlas with 35 mapped sites and all 66 discovered story locations accounted for: 50 local rooms/places, 15 off-town locations and the mobile car interior. The map retains the lake and street grid, adds the missing family homes, connects roads and trails, reserves landmark plots, and links every first-six episode set variant. Eight draft additions remain optional and hidden by default.

Run `python3 tools/three-sets/serve.py --page town`, then use the 3D or north-up plan view, room/episode search, district filters, route planner and day/night controls.

- [Full plan and site register](<maple hollow tree.js/PLAN.md>)
- [Town overview](<maple hollow tree.js/output/town-overview.png>)
- [Printable master-plan PDF](<maple hollow tree.js/output/master-plan.pdf>)
- [Editable town GLB](<maple hollow tree.js/output/maple-hollow.glb>)
- [Complete plan JSON](<maple hollow tree.js/output/master-plan.json>)
- [Browser verification](<maple hollow tree.js/output/verification.json>) and [Blender verification](<maple hollow tree.js/output/blender-verification.json>)

Coordinates, dimensions and walk estimates remain proposed staging choices. Existing Blender room coordinates and episode files are unchanged.


The standalone [Three.js character viewer](tree.html) now follows the reference lineup with slimmer modeled heads/clothing, corrected silhouettes and glasses, longer legs and smooth skinned tails. See the [character guide](art/three/characters/README.md) and [before/after comparison](art/three/characters/previews/comparison.jpg). All 16 existing animation states passed the rig checks.

## Episode 1 — 3D and 2.5D in Three.js

Both complete styles are now rendered in Three.js with the same 41 dialogue lines and soundtrack. Open the [synchronized comparison player](comparisons/episode01/index.html), [3D MP4](comparisons/episode01/episode01_3d.mp4), or [2.5D MP4](comparisons/episode01/episode01_25d.mp4). Each is 134.5 seconds, 1080p, 24 fps. [Source and verification](comparisons/episode01/README.md).

The [refined 3D edition](comparisons/episode01/refined/index.html) applies the 50 approved character, acting, set and lighting improvements. It includes a synchronized original/refined player, [full change register](comparisons/episode01/refined/REFINEMENTS.md) and [reproducible source guide](comparisons/episode01/refined/README.md). Inspect its cast at `tree.html?refined=1`.

The [expanded lake set](art/three/sets/lake-world/README.md) now supports wider, reverse and side shots with a complete shoreline, park, wooded banks and town surroundings. Watch the [30-second environment tour](art/three/sets/lake-world/lake-coverage.mp4), explore the [reverse view](sets.html?set=lake&view=reverse), or compare the [new episode edition](comparisons/episode01/refined/lake-expanded/index.html).

The [illustrated 3D edition](comparisons/episode01/illustrated/index.html) applies all 20 approved treatments to bring the full 3D scene closer to the paintings: flatter perspective, drawn faces, matte two-tone fills, stable ink, illustrated foliage/water and controlled animation accents. [Full treatment register](comparisons/episode01/illustrated/TREATMENTS.md), [render guide](comparisons/episode01/illustrated/README.md) and an orbitable 3D scene are included.

## Episode 2 — Dare House, illustrated Three.js

[Watch Episode 2](comparisons/episode02/index.html) or [open the full MP4](comparisons/episode02/episode02_3d_illustrated.mp4). The reusable [second illustrated art pass](art/three/illustrated/v2/TREATMENTS.md) adds the ten approved art-direction improvements. The episode includes the current script’s door, die, escape and bedroom actions, 54 reused local voice recordings, and a navigable scene explorer that also shows the upgraded apartment. [Production records and reproduction](comparisons/episode02/README.md).


## Episode 3 — Summer Homework, illustrated Three.js

[Watch Episode 3](comparisons/episode03/index.html) or [open the full MP4](comparisons/episode03/episode03_3d_illustrated.mp4). The 3:01.7 episode uses all eight characters, 44 original local voice recordings, readable notebook inserts and the one-box garage ending. The reusable [100-item animation register](art/three/animation/v3/IMPROVEMENTS.md) links each improvement to its implementation. [Explore 24 motion examples](comparisons/episode03/source/render.html?library=1), switch between eight actors and scrub any action. [Production records and reproduction](comparisons/episode03/README.md).

The [revised Episode 3 edition](comparisons/episode03/revised/) rebuilds nine visible locations from their existing pictures, preserves reference-specific colors and reduces the edit from 77 to 11 camera cuts. [Compare the pictures and revised sets](comparisons/episode03/revised/references.html). Dialogue stays in group shots; Bash takes the phone and walks to the mailbox within the held street shot. The first edition remains available.


## Episode 4 — Not For Sale, illustrated Three.js

[Watch Episode 4](comparisons/episode04/) or [open the MP4](comparisons/episode04/episode04_3d_illustrated.mp4). The 3:14.3 episode retains the current script and 54 original local voice recordings, introduces Preston, Marlo, the Mayor, Bash’s mom and the hiker, and carries forward the reference-led sets and calmer edit. The main conversations hold in group shots. [Reference pictures](comparisons/episode04/references.html), [production guide](comparisons/episode04/README.md) and saved verification reports are included.
