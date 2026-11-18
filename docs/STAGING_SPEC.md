# Staging as data: the plan (problem 2). Status: implemented on staging/data-driver (18 Nov 2026)

**Goal.** A small model (or a person) builds an episode by filling in ONE data file from the script, not by writing Three.js. Today the staging of Episode 4 lives in `comparisons/episode04/source/episode-v5.js` (19 KB, one-line functions) and `prepare.py` (hard-coded beat offsets, paths, cuts). Every new episode means rewriting both.

## What moves into data (`comparisons/episodeNN/staging.json`)
Per beat (ids `s01`, `s02`, ... as in `episodes/epNN.json`):
```json
{
  "episode": 34,
  "beats": {
    "s03": {
      "set": "apartment",
      "firstLineAt": 0.6,
      "camera": {"pos": [0.3, 2.35, 6.6], "target": [0, 1.55, -1], "fov": 45, "flatten": false},
      "actors": {
        "riot":  {"at": [0.3, 0, 1.7]},
        "bash":  {"seat": "sofa_left"},
        "pip":   {"seat": "sofa_right"},
        "rocco": {"seat": "beanbag"}
      },
      "enter": [{"who": "preston", "side": "right", "to": [3.1, 0, 2.3], "arriveBeforeLine": "s03_03", "gap": 0.2, "pace": 3.1}],
      "exit":  [{"who": "marlo", "side": "right", "from": [-3.15, 0.16, 5.5], "leaveAfterLine": "s03_20"}],
      "crowd": "family",
      "closeUps": [{"line": "s03_16", "to": "s03_17", "who": "rocco"}],
      "hooks": ["props.s03"]
    }
  }
}
```
- **Seats and spots have names** per set, stored once in `art/three/sets/spots.json` (e.g. `apartment.sofa_left = {pos, yaw, floor}`), so nobody computes heights or leg angles: the driver calls `seatedLegs()` from the named seat.
- **Entrances and exits say a side, not coordinates.** A tool measures where the frame edge is for that beat's camera (`tools/three-sets/edges.cjs`, the code from the Episode 4 measurement) and starts or ends the path off-screen at the right pace. The QA already fails on pop-ins.
- **Close-ups name lines, not times.** `prepare` already snaps them to the drawing grid and to the neighbouring speakers (see `cut()` in `comparisons/episode04/source/prepare.py`).
- **Crowds are presets** (`crowd.js`: the family; add more presets as needed).
- **Anything odd stays code**: `hooks` names a function in the episode's own `props.js` (the Episode 4 easel, hammer, bee, notice board). The data format must not try to describe props actions; that is what makes it small.

## The shared pieces to build
1. `art/three/episode/driver-v5.js`: the generic version of `drawWorld`, `put`, `along`, cuts, overlay, logo, `renderAt` (copy the structure of `episode-v5.js`; it is already generic apart from the per-beat branches).
2. `pipeline/prepare_episode.py`: voices from `assets/vo/<line id>.wav` + Rhubarb cues, the gait plans (`pipeline/gait_plan.py`), cuts, fast windows, audio cues; reads `staging.json`.
3. `tools/validate_staging.py`: checks every name (set, seat, actor, line id, prop hook), that entrances come from a side, that a seated actor has a seat, that close-ups end before the next speaker. **Messages must say what to change** (the local-model test showed small models fix what the message tells them).
4. `docs/cards/stage-an-episode.md`: the card for the model: copy `staging.json` of Episode 4, edit per beat, run the validator, run the QA, render.

## Proof it works (acceptance, in this order)
1. Re-express **Episode 4** in `staging.json` + `props.js`; render 20 sample frames with the new driver and compare to the delivered v5 film. They must be identical (or differ only where noted).
2. Build **Episode 34** ("The Perfect Day": all sets and characters already exist) through it: voices (see `voice/SETUP.md`, about 40 s a line), audio, the three checks, render. The user reviews the pictures.
3. **Local model test**: give Qwen3 14B (`tools/local-agent/`) `episodes/ep35.json` ("Last Turn", also needs nothing new) plus the card, and see whether it produces a `staging.json` that passes the validator and renders. Fix the card where it stumbles.

## Rough size
Driver + prepare + validator + Episode 4 port with the frame-identical check: one long session (about 40-60 steps). Episode 34 with voices and render: about 20 more. Start it in a FRESH session (this conversation is very long, so each step costs more).

## Already in place (do not rebuild)
Footstep planner (`pipeline/gait_plan.py`), seat fitting (`seatedLegs`), cuts and QA (`tools/three-sets/verify-*.cjs`), preview tools, voices (old environment linked), task cards, the missing sets and characters (being built by the friend's cloud agent on branch `assets/cloud-build`, see `docs/FRIEND_PROMPT_BUILD_ASSETS.md`).

## Implementation details (18 Nov 2026)
- `staging.json` remains the authored input; preparation emits `source/staging-compiled.json` with resolved entrance path names and `timeline-data.json`. The generic page reads those outputs.
- `motion` stores legacy measured paths as beat/line clock anchors for exact Episode 4 parity. New episodes use `enter` and `exit` side declarations; the compiler projects the head beyond the camera edge. `edges.cjs` independently measures the actual browser camera.
- `spots.json` distinguishes `kind: seat` and `kind: spot`. Existing Episode 4 park/stoop seats retain their legacy leg pose (no floor field) to preserve pixels; new fitted seats specify floor.
- `moveAliases` maps old script action vocabulary to supported moves or null when episode hooks draw the action; the original cue is retained as `scriptAction`, without changing dialogue or source scripts.
- `actions.lampOn` is optional; Episode 4 has no value and keeps its existing lighting. An active set may expose a deterministic `userData.update(t)` callback (for scrolling car scenery).
- Generated silent placeholders require the explicit flag on every preparation. WAV hashes distinguish them from replacement real recordings; synthetic mouth tracks are marked in the manifest.
- `verify-episode-v5.cjs` keeps all original QA assertions with page/output arguments. `verify-motion-data.cjs` keeps the motion limits and selects a real ten-second standing beat, reporting idle QA inapplicable if every actor is seated.
- The stage card invokes generic preparation, generated audio mixing, motion/scene QA and the full renderer; baseline drivers and renderers remain untouched.
