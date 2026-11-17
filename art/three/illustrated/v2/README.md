# Reusable illustrated Three.js art pass, version 2

This directory is the reusable implementation of the 20 illustrated-rendering treatments plus the ten further approved art-direction improvements. [Item register](TREATMENTS.md). [Episode 2 integration and production records](../../../../comparisons/episode02/README.md).

Build the volumetric sets and articulated cast first, add scene props, call `installArtDirection(modeled)` from `art-direction.js`, then `createIllustratedLook({scene,renderer,actors,modeled})` from `look.js`. The look converts existing scene meshes and any newly installed dressing once at construction time. Build new props before this conversion, so they receive the same shaders and ID attributes.

For each deterministic frame, reset the look’s actor scales, apply character poses/actions, update world matrices, call `look.update(time, locationId, beat, event, positionedActors)`, and draw through `look.render(camera)`. Keep framing and captions at the episode-adapter level. `performance.js` provides reusable expression/gesture/blink/listening helpers without the Episode 1 timestamp-specific reactions.

Materials use native Three.js custom shaders and require this drawing pipeline to reproduce the ink/color finish. Geometry and rigs remain actual 3D; this is not a baked backdrop or a movie-only effect. The runtime and RoundedBoxGeometry addon are the local pinned Three.js r160 files.

`art-direction.js` handles scenery/furniture/plant dressing, `palette.js` maps semantic colors, `shapes.js` provides volumetric foliage and deterministic brush maps, and `shaders.js` defines color/ID/composite passes. `palette-evidence.json` retains the original painting samples; the version-2 palette is an authored refinement of those colors, not a new exact sampled match.

Earlier modules under `comparisons/episode01/source/illustrated/` and earlier movies are preserved. Future episodes can import this directory and reuse the same cast/set builders, then supply new staging, props and a script-specific timeline.
