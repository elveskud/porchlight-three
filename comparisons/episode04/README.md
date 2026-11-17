# Episode 4 — Not For Sale

[Watch the episode](index.html) · [Download MP4](episode04_3d_illustrated.mp4) · [Reference pictures and episode sets](references.html) · [Explore the 3D sets](source/render.html?inspect=1&time=90)

This is the full illustrated Three.js production of the current `episodes/ep04.json`. Preston unveils his pavilion plan, the friends attempt Operation Unbuyable, Bash’s family turns up for a picnic, the hiker asks about November, Preston has a quiet moment at the lake, Riot and Rocco share the stoop, and Marlo pins the park-sale notice over the older lantern-mark poster. The porch lamp clicks off before the Friendzy closing mark.

## Direction carried forward

Set pictures govern the locations, furnishings and colors. The park uses the broad lakeside lawn, large branching oak, benches, picnic tables, woodland and water from `23_park_day.jpg`. The apartment retains its orange sofa, green beanbag, game table, plants, shelves, string lights and night window. The street and stoop use the revised reference geometry from Episode 3, isolated in a new version for this episode. Scene geography and unseen surfaces remain modeled interpretations.

The main conversations hold in group shots. There are no automatic speaker/pair cutaways. One motivated close insert lets the viewer read the final notice and see the old poster underneath. The actual edit count and all-frame framing checks are recorded in `browser-checks.json`.

## Reusable additions

- `art/three/animation/v4/` adds Preston, Marlo, the Mayor, Bash’s mom and the human hiker from their existing character sheets. It preserves the earlier main cast and speech/acting system. Adaptive pelvis height keeps the new character proportions within leg IK reach during planted turns; stance cycles are recorded explicitly.
- `art/three/sets/reference-v2/` and `art/three/illustrated/reference-v2/` preserve reference-specific surfaces, night lighting, the expanded lake and the earlier revised street/stoop geometry. This version also supports the patterned apron and real scene paper textures.
- `source/sets.js` builds the park’s oak, woodland, picnic furniture and lake surroundings, plus the apartment’s radio and complete room shell.
- `source/story-props.js` saves the long car, covered pavilion easel, clipboard, serving spoon, sandwich, hammer, warning sign, old-sandwich bucket and subtle green haze, passing bee and layered notice board. The existing `art/inserts/pavilion.png` is used on an actual 3D easel board; it is not scenery behind the actors.
- Six individually staged bear relatives fill the picnic. Riot wears his lifeguard outfit in the opening. Characters walk into/out of the held shots and Marlo steps aside after pinning the notice.

Earlier episode films and versioned modules remain intact. These are project modules with the existing local Three.js import map, not a standalone animation package.

## Voices and audio

All 54 spoken lines exactly reuse existing local WAV recordings, matched by text and speaker. Thirteen silent reactions bring the timeline to 67 events. `assets/voice-manifest.json` freezes source paths, SHA-256 values and the current script hash. Existing Rhubarb mouth tracks were reused; the missing short Riot cue was generated next to the frozen copy without changing its voice file.

`source/audio.py` reads and executes the existing shared generated-audio mixer without modifying it, adding project-local synthesized car-horn and low humming sounds. The original voice settings are unchanged. Music and SFX are synthesized locally; no licensed music or recorded-human sound library is used. Voice, path-derived footsteps, reveal/hammer/pin timing, horn and lamp click share the picture clock. The stereo soundtrack is mastered to −14 LUFS.

The finished movie is 194.333333 seconds (3:14.3), 1920 × 1080 at 24 fps, with 4,664 encoded frames. Whole drawings are held at 12 fps for the illustrated style. Three.js/Chrome draws every picture; FFmpeg encodes and muxes the result.

## Reproduce

From the project root, using local Python, FFmpeg, Chrome and Node/Playwright:

```sh
python3 comparisons/episode01/serve.py
python3 comparisons/episode04/source/prepare.py
python3 comparisons/episode04/source/audio.py
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node tools/three-sets/verify-episode04.cjs
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node comparisons/episode04/source/render.cjs
python3 tools/three-sets/verify-episode04-export.py
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node tools/three-sets/verify-episode04-player.cjs
```

The player is at `http://127.0.0.1:8766/comparisons/episode04/`. The render page accepts `?time=SECONDS` and `?inspect=1&time=SECONDS`. Reports record all-frame transforms, speaker framing/facing, face occlusion, nine mouth shapes, repeatable seeks, foot anchors, crowd/prop/notice/lamp actions, current dialogue and voice hashes, mastered sound parity, complete movie decoding, render source/scene hashes and playback. The final encoded contact sheet is `reviews/final-contact-sheet.jpg`; Desktop delivery is recorded in `delivery.json`.

Final verification: 10 cuts, with no cuts inside the main dialogue scenes. All six report groups passed, and all nine cached scene hashes match the delivered source fingerprint. Desktop delivery and checksum are recorded in `delivery.json`.
