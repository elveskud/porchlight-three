# Episode 2 — Dare House

A complete full-3D illustrated Three.js edition, built from the current `episodes/ep02.json` and existing local character voice recordings. The episode includes the invisible-door dare, walk to the hall, Bash’s approach, the door opening inward, a rolling wooden die, the staggered escape, the quiet lake conversation, and the lantern-mark die/drawer ending in Bash’s room. It closes with the porch light and Friendzy mark.

- [Watch the full episode](index.html)
- [Download MP4](episode02_3d_illustrated.mp4)
- [Orbit the scenes](source/render.html?inspect=1&time=2), including the upgraded apartment
- [Apartment before / after](reviews/apartment-before-after.jpg)
- [All 10 approved art improvements](../../art/three/illustrated/v2/TREATMENTS.md)
- [Final encoded-film review](reviews/final-contact-sheet.jpg)

## Reusable assets

The first-six set builders remain in `art/three/sets/`, and the articulated cast is reused from the Episode 1 refinement. The new reusable art pass is isolated in `art/three/illustrated/v2/`. It retains the earlier 20 illustrated treatments and adds all ten approved art-direction changes. Earlier delivered movies and their source style modules are preserved.

`source/episode.js` stages this episode using those assets. `source/props.js` builds the cut-through doorway, corrected porch stairs, lantern-mark die and working drawer. Dialogue cameras use a moderate 1.35× paired distance/focal-length adjustment; insert and establishing cameras retain their authored clearances. The apartment improvements are available in the explorer even though Episode 2’s story does not visit that room.

## Dialogue and audio

`source/prepare.py` reads the current episode script, matches text and speaker against saved local WAVs, copies 54 existing recordings with their mouth tracks to `assets/vo/`, and writes a new deterministic timeline. Three silent reactions bring the timeline to 57 events. The older Episode 2 cues predate the separate door beat and explicit laugh recordings; they were not used as the final timing source.

`assets/voice-manifest.json` records every recording’s source and SHA-256. No character voice settings or dialogue were changed. The shared local `Blender/templates/mix.py` and generated `audio/sfxkit.py` create the new music/SFX mix from `assets/cues.json`, mastered to −14 LUFS. These shared files were only read/executed, not edited. The film’s pictures are all rendered by Three.js; FFmpeg encodes and muxes them.

Timing: 157.5 seconds, 1920 × 1080, 24 fps, 3,780 encoded frames from 1,890 drawings held at 12 fps. The door creak, die impacts, pauses and running exits use the same authored clock as the picture. Physical motion is authored rather than a general physics simulation.

## Reproduce

Run commands from the project root. Node/Playwright, Google Chrome, Python, FFmpeg and the existing local generated-audio environment are required to rebuild. The finished film and saved scene viewer play with local project assets.

```sh
python3 comparisons/episode01/serve.py
python3 comparisons/episode02/source/prepare.py
python3 pipeline/templates/mix.py comparisons/episode02/assets
node comparisons/episode02/source/render.cjs
node tools/three-sets/verify-episode02.cjs
python3 tools/three-sets/verify-episode02-export.py
node tools/three-sets/verify-episode02-player.cjs
```

Open `http://127.0.0.1:8766/comparisons/episode02/`. The render page supports `?time=SECONDS` for exact-frame inspection and `?inspect=1&time=SECONDS` for orbit. The source fingerprint covers the adapter, style modules, shared cast/set builders, timeline and mixed audio. Scene clips are cached by that fingerprint. The reports alongside this guide record browser, story-action, audio, source, export and player checks.
