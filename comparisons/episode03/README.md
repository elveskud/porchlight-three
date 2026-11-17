# Episode 3 — Summer Homework

The complete illustrated full-3D Three.js edition of the current `episodes/ep03.json`. A classroom assignment leads to interviews with Gus, Dot and Mrs. Brook, Pip’s notebook, the friends’ shared summer essay and the quiet garage ending. The garage retains exactly one sealed moving box; no new story clue or dialogue was added.

- [Watch the episode](index.html) · [Download MP4](episode03_3d_illustrated.mp4)
- [Explore the scenes](source/render.html?inspect=1&time=6)
- [Play the 24 reusable motion examples](source/render.html?library=1)
- [All 100 animation improvements](../../art/three/animation/v3/IMPROVEMENTS.md)
- [Final encoded-film contact sheet](reviews/final-contact-sheet.jpg)

## Saved production assets

The versioned animation system lives in `art/three/animation/v3/`; the adapted illustrated look lives in `art/three/illustrated/v3/`. Both retain the existing modeled cast proportions, articulated 3D bodies and set builders. New owl, Gus, Dot and Brook models use the existing character sheets recorded in `browser-checks.json`. The earlier Episode 1 and 2 films and source versions are preserved.

`source/episode.js` contains the shot staging, prop contacts, eyes, acting and absolute time-based action clocks. `source/props.js` provides the readable notebook, writing pencil, tea cup, interview phone, clipboard, supported seating, wider steps, extended room shells and garage switch. `source/timeline.json` freezes all event, camera and movement timing.

The 100-item register maps every approved improvement to code and an application. Episode 3 uses the actions its story needs. Door, drawer, knocking, running, pickup, transfer and other absent actions have silent seekable examples rather than extra story scenes. The library has 24 actions selectable across eight actors. Technical validation is complete; artistic approval remains with the user.

## Picture and sound

181.666667 seconds (3:01.7), 1920 × 1080, 24 fps, 4,360 encoded frames from 2201 sampled drawings. Normal action holds whole drawings at 12 fps; marked fast actions use 24 fps. Pictures are drawn by Three.js in local Chrome. FFmpeg encodes the images and muxes sound.

`source/prepare.py` exactly matches the current dialogue against 44 existing local recordings, including the recap, in the `ep03` and `ep03_tail` voice folders. Nine silent reactions bring the timeline to 53 events. The frozen local WAVs and Rhubarb tracks are in `assets/vo/`; source paths and SHA-256 values are in `assets/voice-manifest.json`. Speech uses sound cues plus sampled recording energy. Voices and their generation settings were retained.

Music and SFX are locally generated using the existing shared `Blender/templates/mix.py` and `audio/sfxkit.py`, read and executed without modification. The soundtrack is mastered to −14 LUFS. Footsteps use the same path distance and easing as foot plants. Notebook and light clicks use the picture’s interaction clock.

The motion is authored procedural animation with analytic IK and sampled collision checks. Ground-aware gait is available and tested on a slope; this episode uses flat stage heights. The system is not a general rigid-body or cloth physics simulator.

## Reproduce and verify

From the project root, with Python, FFmpeg, Chrome and Node/Playwright available:

```sh
python3 comparisons/episode01/serve.py
python3 comparisons/episode03/source/prepare.py
python3 pipeline/templates/mix.py comparisons/episode03/assets
node tools/three-sets/verify-episode03.cjs
node tools/three-sets/verify-motion-v3.cjs
node comparisons/episode03/source/render.cjs
python3 tools/three-sets/verify-episode03-export.py
node tools/three-sets/verify-episode03-player.cjs
```

On this machine, prefix Node commands with `NODE_PATH=/private/tmp/porchlight-set-check/node_modules`. The server uses port 8766; visit `http://127.0.0.1:8766/comparisons/episode03/`. The render page accepts `?time=SECONDS`, `?inspect=1&time=SECONDS` and `?library=1&clip=walk&actor=pip`.

`browser-checks.json` covers every output frame, all speaking face rays, 61 out-of-order image seeks and the notebook/switch/garage/ending actions. `motion-checks.json` covers 960 motion samples, terrain, cushion release, die edges, door/drawer contacts and the library controls. `export-checks.json` covers complete MP4 decoding, exact script and original voice hashes, mastered soundtrack parity and source fingerprint. `player-checks.json` covers playback, seeking, restart and mobile layout. Render scene caches are bound to the dependency SHA-256 in `3d-render.json`.

Desktop delivery and verified SHA-256 are recorded in `delivery.json`. The six-scene explorer controls and orbit gesture passed `explorer-checks.json`. The final black interval is the authored closing fade, as recorded in delivery QA.
