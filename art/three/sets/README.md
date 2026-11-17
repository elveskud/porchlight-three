# Three.js sets — episodes 1–6

20 modeled set variants covering 16 locations. These are actual meshes: orbit around them, open the doors, switch practical lights, inspect stage marks, and export editable geometry. The paintings are comparison references, not the 3D scenery.

From the project root:

```sh
python3 tools/three-sets/serve.py
```

This opens `http://127.0.0.1:8765/sets.html`. Alternatively use any local HTTP server at the project root. Opening the HTML directly with `file://` will not load ES modules. The runtime is vendored Three.js 0.160.0 (MIT), so no network or npm installation is required to use the viewer.

- [Contact sheet](previews/contact-sheet.jpg)
- [Editable GLB files](exports/)
- [Machine-readable catalog, cameras, anchors, and source paintings](manifest.json)
- [Browser and export verification](verification.json)
- [Blender import verification](blender-verification.json)

## Coverage

| Episode | Sets |
|---|---|
| 1 — Porch Light On | Old hall interior, lake day/night, stoop sunset/night, apartment |
| 2 — Dare House | Lake day/night, old hall exterior with opening door, Bash’s bedroom |
| 3 — Summer Homework | Classroom, stoop sunset/night, Main Street, Brook’s porch, Pip’s bedroom, Pip’s single-box garage, night lake for the intro |
| 4 — Not For Sale | Park, apartment, lake day/night, stoop sunset, Main Street |
| 5 — Storm Night | Walt’s dinner room evening/storm, photo hallway, porch, lake storm/night, old hall interior, apartment |
| 6 — Town Meeting | Stoop sunset/night, school gym with meeting chairs, night lake for the intro |

The classroom and Walt’s hallway paintings live in `art/gemini/first-round/`, where they were moved during the art cleanup. The other references are in `art/gemini/sets/`. Walt’s hallway frames use the existing grandfather pictures. The storm lake uses the night lake painting as its reference, with storm lighting and modeled clouds.

## Assets and controls

`exports/<set_id>.glb` contains named mesh groups, materials, embedded picture/label textures, practical lights, the review camera, and named anchor nodes. Import in Blender using **File → Import → glTF 2.0**. Units are metres; geometry is editable. UI-only outline strokes and marker rings are omitted from exports. Camera presets and stage coordinates are also recorded in each GLB’s extras and `manifest.json`.

In the viewer, filter by episode or search, choose **Wide / Detail / Overhead**, **Compare painting**, or **Stage marks**. **Open door** rotates the relevant door hinges; **Practical lights** toggles the set’s local lamps. **Save PNG** captures the current camera. **Export GLB** exports the current door/light state. The scene redraws on changes rather than continuously redrawing static geometry.

These are interpretations from single pictures. Hidden surfaces, dimensions, furniture spacing, and world coordinates are inferred. Interiors use single-sided cutaway walls and no solid ceilings to allow inspection. Roofs remain modeled on porches/exterior buildings. This pack is ready for review and scene assembly; existing episode renders and the shared character/voice pipeline are unchanged. Characters, acting, weather animation, and episode integration are outside this set build.

## Source

- `catalog.js`: episode coverage, painting paths and lighting variants.
- `primitives.js`: named furniture, props and architecture.
- `exteriors.js`, `interiors.js`, `sky.js`: location models.
- `build.js`: build/dispose API, world-space stage anchors.
- `../../../sets.tree.js` and `../../../sets.html`: viewer (from this directory, the project root is three parents up).
- `../vendor/`: local Three.js runtime/addons and MIT license.

## Rebuild previews and GLBs

```sh
npm --prefix tools/three-sets install
npm --prefix tools/three-sets run verify
```

The verification script starts its own temporary localhost server, runs installed Google Chrome with Playwright, blocks external requests, rebuilds all previews/GLBs, and writes the catalog and QA report. Set `CHROME_PATH` to another Chromium executable if needed. It checks finite mesh geometry, script-specific props, all episode filters, camera presets, actual GLB downloads, reference loading, door/light/marker controls, camera orbit, PNG downloads, mobile layout, invalid links, and older painting-name URLs.

Browser previews have a warm renderer tone map and ink edge strokes. Blender’s own world lighting/color management can differ; set lighting there when assembling an episode.

## Expanded lake environment

The day, night and storm lake variants now include a continuous 640 m terrain, curved water/banks, about 2,900 modeled trees, park and woodland paths, the painted church, village and established town connections. The viewer adds Reverse / Park / Woods / Town / Far shore views and a whole-lake overhead. [Set guide and coverage limits](lake-world/README.md), [30-second moving tour](lake-world/lake-coverage.mp4), [new Episode 1 edition](../../../comparisons/episode01/refined/lake-expanded/index.html). Earlier pack-wide verification is supplemented by the new lake-specific browser/geometry/import reports in `lake-world/`.
