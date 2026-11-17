# Handoff — where we are (17 Nov 2026)

## Why this folder exists
A refresh: the old Porchlight project carried a 2.6 GB git history, a Blender pipeline, a Blender 2.5D branch and about 1 GB of render output. This copy keeps what is needed to continue in Three.js.

## State of the series
- Concept, `BIBLE.md` and arc 1 of `STORY_MAP.md` approved; all 40 draft scripts exist in `episodes/epNN.txt` (readable in `scripts/`).
- **Waiting on the user:** review of the 40 draft scripts, arcs 3–8, the "Working picks" at the end of `STORY_MAP.md`, and the premiere date (see `DECISIONS.md`).
- Three.js episodes built so far (movies are NOT in this copy; source, voices, cues are): 1 (full 3D + 2.5D comparison, refined, illustrated), 2, 3 (plus a calmer revised edit), 4 "Not For Sale".
- Latest and best reference build: `comparisons/episode04/` with `art/three/animation/v4/` and `art/three/illustrated/reference-v2/`.

## Not carried over (still in the old folders)
- All Blender code, characters, templates and `videos/`; `animation25d/`; `tests/`; `archive/`; `tree_renders/`; `.git` history.
- The movies (`comparisons/**/*.mp4`, scene clips, review frames) and `art/three/sets/exports` GLBs: rebuildable from source or found in `~/Desktop/Porchlight.nosync`.
- `tools/occluders.py`, `cut.py`, `fronts.py`: needed only to add new painted sets; copy from the old `tools/` when the first new set is made.
- The voice `.venv` and Kokoro models: see `voice/SETUP.md`.

## Known loose ends
- Run `tools/check_scripts.py`: many drafts still stop on hold/overlap rules from the old Blender checker; some of those rules may not apply to Three.js. Decide with the user.
- Hardcoded absolute paths remain only in historical manifests (`*-render.json`, `voice-manifest.json`, `audio-provenance.json`) and in `DECISIONS.md` entries. `tools/three-sets/verify-refined-player.cjs` has a default output path to adjust.
- Docs in `docs/` and `comparisons/*/README.md` still mention Blender in places (history).
- Voice scripts have not been re-run from this location yet.
- `episodes/ep04.txt`/`.json` use an absolute path for the pavilion insert image; updated to this folder in the `.txt` only (the `.json` still points at the old folder).
- `comparisons/episode0{2,3,4}/source/prepare.py` read voices from `assets/vo/` (or `VO_SOURCE=`); not re-run here.
