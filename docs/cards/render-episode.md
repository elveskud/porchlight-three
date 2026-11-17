# Card: render an episode (Episode 4, version 5 — the template for the others)
Time: about 4 minutes render + 1 minute checks. Needs `setup-runtime`.

## Commands (run in order from the project root)
```sh
python3 comparisons/episode04/source/prepare.py              # script + frozen voices -> source/timeline-v5.json, assets/v5/cues.json (+ footstep plan)
.venv-mix/bin/python comparisons/episode04/source/audio.py v5 # sound mix -> assets/v5/audio.wav (-14 LUFS)
node tools/three-sets/verify-motion.cjs                       # feet, pelvis, facing, held drawings. Must say PASS
node tools/three-sets/verify-episode04-v5.cjs                 # seeks, mouths, footsteps, pictures, cuts. Must say PASS
node comparisons/episode04/source/render-v5.cjs               # draws every frame, encodes, muxes -> comparisons/episode04/v5/episode04_v5.mp4
python3 tools/three-sets/verify-film.py comparisons/episode04/v5/episode04_v5.mp4 comparisons/episode04/source/timeline-v5.json comparisons/episode04/assets/v5/audio.wav comparisons/episode04/v5/export-checks.json
```
One scene only (fast look): `SCENE_ONLY=s03 node comparisons/episode04/source/render-v5.cjs`. One picture: `node tools/three-sets/stills.cjs comparisons/episode04/source/render-v5.html /tmp/stills 40.75 name`.
Deliver: copy the mp4 to `~/Desktop/` with a clear name, `shasum -a 256` it, write the hash in `DECISIONS.md` log.

## Rules a new episode must follow (user review, 17 Nov)
- **Nobody appears or vanishes inside the frame.** Entrances start and exits end off-screen (measure the edge per camera, see the comment above the paths in `prepare.py`). The QA fails otherwise.
- Close-ups: a few, listed in `cuts` in `prepare.py` (at most 9). The ending shows the Friendzy logo (`art/inserts/friendzy-logo.png`).
- Relatives and extras: `source/crowd.js` (individual looks, each acts on its own cycle).

## Files to touch
- A new episode: copy `comparisons/episode04/source/` to `comparisons/episode0N/source/` and edit `prepare.py` (beats, paths, camera in `episode-v5.js`), `sets.js`, `story-props.js`. Never edit another episode's folder.
- Script text only in `episodes/epNN.txt`, then `python3 tools/check_scripts.py N`.

## Do NOT read
- `comparisons/*/3d-render.json`, `*-checks.json`, `assets/cues.json`, `timeline*.json` (huge data), `art/three/sets/*` unless a set is wrong, `tools/rhubarb/`.

## If a check fails
Read only the one failure line. Open `docs/cards/fix-animation-problem.md`. The renderer refuses to write a film when a speaking head is too near the edge (`framing-checks.json`) or the browser prints an error.
Cached scenes are reused only if every input is unchanged (hash of the whole `art/three` tree, script, voices, audio).
