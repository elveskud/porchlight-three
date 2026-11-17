# Episode 1 — both styles in Three.js

Open [the synchronized player](index.html) through a local web server, or open either MP4 directly.

- [Full 3D movie](episode01_3d.mp4): modeled sets, volumetric articulated cast, shadows and practical lighting.
- [2.5D movie](episode01_25d.mp4): painted background and foreground planes, articulated flat vector puppets and camera parallax.

Both are new **Three.js 0.160.0** renders, 1920×1080, 134.5 seconds, 3,228 frames at 24 fps. Drawings are held at 12 fps. They use the same 41 existing dialogue lines, soundtrack, scene timing and captions. These are style studies with simplified acting and mouth shapes; they are not a change to the series’ approved production style.

The old Blender film remains in `animation25d/episode01/`. Its rendered images are not used here. Only its existing audio, timing and local Rhubarb mouth cues are reused. FFmpeg encodes frames and attaches that soundtrack; all new scene pictures are rendered by Three.js in Chrome, with canvas text overlays.

## View locally

From the project root:

```sh
python3 comparisons/episode01/serve.py
```

Visit `http://127.0.0.1:8766/comparisons/episode01/`.

The server opens the player automatically and supports byte ranges so scene seeking works immediately. Pass `--no-open` to keep the browser closed, or `--port 8767` to change the port.

## Source and reproducibility

`source/episode.js` builds both versions and exposes deterministic `episode.renderAt(seconds)` and `episode.frame(seconds)` APIs. `source/flat-cast.js` constructs the flat puppets. The 3D cast is shared with `tree.html` via `art/three/characters/cast.js`; modeled sets are in `art/three/sets/`. Episode-specific seating, costumes, ceilings, canopy height and staging changes are isolated in the episode source.

`source/timeline.json` normalizes the original 30 fps authored cues to seconds and includes all 41 local mouth tracks. `source/paintings.json` lists the reused local art layers. Three.js, paintings, critters, font and audio are local; rendering makes no external requests.

Requires Node, Playwright, FFmpeg on PATH, and Chrome. Existing tooling pins Playwright in `tools/three-sets/package.json`:

```sh
npm install --prefix tools/three-sets
NODE_PATH="$PWD/tools/three-sets/node_modules" node comparisons/episode01/source/render.cjs
```

The renderer defaults to Chrome on macOS with Metal WebGL. Override the executable with `CHROME_PATH` if needed; other GPU configurations have not been tested. Pass `--3d` or `--25d` to render only one style. Twelve intermediate scene clips per style are cached by the source fingerprint. Delete their `.mp4.json` sidecars to force regeneration after changing referenced image/audio/font assets, which are not included in that fingerprint.

Preview any exact frame at `source/render.html?mode=3d&time=63.8` or `?mode=25d&time=63.8`. This deterministic render page displays one frame; use the player for playback with audio.

## Verification

- `framing-checks.json`: speaking head centers checked on every rendered speaking frame.
- `3d-render.json` / `25d-render.json`: engine, source fingerprint, timing, browser errors and individual speaking-frame records.
- `export-checks.json`: FFprobe metadata, full decode checks, identical encoded audio hashes.
- `player-checks.json`: chapter seeking, synchronized playback, controls, mobile layout and shared cast viewer smoke check.
- `reviews/final-*-sheet.jpg`: frames sampled from the encoded movies for visual review.

The head-center test checks camera placement; sampled visual review additionally checks seating, overlays, scene framing, the opening, game prompts and closing light.
