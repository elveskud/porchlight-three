# Expanded lake environment

The lake now extends beyond the original painting frame: continuous terrain, curved banks, full shore paths, parkland behind the camera, wooded banks, far-shore village and church, established home exteriors and an approach toward town. This is modeled geometry throughout, including the surroundings visible in reverse views.

- [Explore the lake](../../../../sets.html?set=lake)
- [Reverse view](../../../../sets.html?set=lake&view=reverse)
- [30-second moving set tour](lake-coverage.mp4)
- [Episode 1 with the expanded lake](../../../../comparisons/episode01/refined/lake-expanded/index.html)
- [Camera and lighting review images](reviews/)
- Editable [day](../exports/lake.glb), [night](../exports/lake_night.glb), [storm](../exports/lake_storm.glb) GLBs.

Serve the project root with `python3 comparisons/episode01/serve.py`; the viewer is at `http://127.0.0.1:8766/sets.html?set=lake`. Everything is local, including Three.js.

## What changed

- Replaced the isolated rectangular water/base with a closed curved lake and a continuous 640 × 640 metre terrain mesh, with denser geometry near the shore.
- Built about 2,900 full 3D trees with efficient GPU instancing, plus stones, cattails, grass and shrubs. Camera and building clearances keep the dialogue stage and wider views open.
- Added a continuous bank and walking loop, beach access, park paths, wooded west-bank trail, old-hall approach and eastern connection toward town.
- Added the church visible in the painting, ordinary park seating/picnic furniture, the sourced snack shack, a lakeside interpretation of Brook’s house, the apartment exterior and background homes. No optional atlas draft sites or erected festival stage were added.
- Modeled side/back elevations, downhill building foundations and doorsteps, surroundings behind the original camera, a creek and encircling wooded ridges. Sky details extend around the environment.
- Preserved the tower, dock, canoe, main cast stage coordinates, and the old hall at its existing position. Terrain has an exact flat stage and a plateau under the hall. No dialogue/timing changes.
- Added **Reverse / Park / Woods / Town / Far shore** cameras alongside Wide, Detail and whole-lake Overhead.
- Episode integration keeps the refined cast, animated water highlights/duck movement and the hall-window clue. Far-plane/fog settings now accommodate the enlarged surroundings.

## Geography and limits

The painting controls the familiar beach composition. The bible and proposed town atlas inform the connections: park behind the beach, woods to the west, hall on the north bank, town to the east. These production coordinates compress and stage those relationships; they are **not a metre-for-metre copy of the atlas** and do not change its proposed master plan. Hidden geometry and exact positions remain inferred.

The terrain spans ±320 metres. The authored camera area is approximately X −90…110, Z −95…70 metres; the eight presets and seven moving tour shots are checked within it. More distant trees/ridges finish the horizon. This is a larger bounded set, not an infinite world or complete new town interior pack. Open lawns are intentional public space and camera/acting clearances.

The packet includes instanced forests through the standard `EXT_mesh_gpu_instancing` glTF extension. Verified in Blender 5.2.2: all three files import with editable mesh objects, preserving the landscape and forest placement.

## Source and rebuilding

- `layout.js`: shoreline control points, stage/coverage bounds, sourced sites, camera presets and tour shots.
- `landscape.js`: continuous terrain, exact rendered-surface sampling, water/banks and grounded paths.
- `population.js`: deterministic instance placement, vegetation, tree/building/camera clearances.
- `places.js`: contextual buildings, park and ordinary beach amenities.
- `index.js`: shared assembly, used by the existing `exteriors.js` lake builder.
- `tour.html`: seekable Three.js tour renderer; `lakeTour.renderAt(seconds)` and `lakeTour.frame(seconds)`.

With the project's Playwright tooling installed:

```sh
NODE_PATH="$PWD/tools/three-sets/node_modules" node tools/three-sets/verify-lake-world.cjs
NODE_PATH="$PWD/tools/three-sets/node_modules" node tools/three-sets/verify-lake-geometry.cjs
NODE_PATH="$PWD/tools/three-sets/node_modules" node tools/three-sets/render-lake-tour.cjs
```

The local preview server must be running on port 8766. `verify-lake-world.cjs` rebuilds the three GLBs and screenshots. All other first-six set locations keep their existing geometry. Earlier rendered films remain available; the updated episode is a separate file.

## Verification

- `verification.json`: three lighting variants, finite geometry and instances, eight camera views per variant, stage mark continuity, instanced GLB exports, offline loading and mobile layout.
- `geometry-checks.json`: terrain contact against actual ray intersections, dry walking paths, camera ground clearance and unchanged acting ground.
- `blender-verification.json`: all three GLBs imported into Blender; over 8,000 editable mesh objects each; no invalid vertices.
- `tour-render.json`: 30-second Full HD/24 fps Three.js set tour.
- The episode’s new `lake-expanded/` folder contains all-frame framing/transform checks, explicit scenery sightline checks for the lake dialogue and final media QA.
