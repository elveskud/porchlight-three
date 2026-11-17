# INDEX: where everything is (one line each)

Porchlight = animated series (Riot 🦊, Rocco 🦝, Bash 🐻, Pip 🐰) in Maple Hollow, drawn in Three.js. Start with `AGENTS.md` (plain rules) or `CLAUDE.md`. Pick ONE task card in `docs/cards/` and read only that.

## Top-level docs
- `AGENTS.md` essential rules in plain steps (works with any model) · `CLAUDE.md` short Claude entry
- `DECISIONS.md` short binding summary + recent log · `docs/archive/DECISIONS_FULL.md` full history (do not delete)
- `HANDOFF.md` where we are and what is next · `ISSUES.md` pipeline audit: every bug, cause, fix, status
- `BIBLE.md` approved series bible (`docs/BIBLE_SUMMARY.md` = short) · `STORY_MAP.md` 40 episodes (`docs/STORY_MAP_SUMMARY.md` = short)
- `docs/VOICE_SHEET.md` the four friends' voices for drafting dialogue

## Cloud and local agents
- `docs/FRIEND_PROMPT_BUILD_ASSETS.md` prompt to build the 11 missing sets and 7 missing characters in the cloud · `art/three/sets/v5/index.js` and `art/three/animation/v5/characters/index.js` registries for them
- `docs/STAGING_SPEC.md` plan to make episodes buildable from a data file (not built yet)
- `tools/local-agent/` test a local Ollama model on real tasks (`agent.py`, `run_eval.py`, `tasks.json`, `make_scratch.py`)

## Cards (docs/cards/): one per task
- `render-episode` · `run-checks` · `voice-a-line` · `voice-new-character` · `add-a-set` · `add-a-character`
- `add-or-fix-a-move` · `fix-animation-problem` · `port-to-older-episode` · `setup-runtime`

## Writing
- `episodes/epNN.txt` approved scripts (40) + `epNN.json` · `scripts/epNN.md` readable versions
- `tools/check_scripts.py` script checker · `docs/WRITING_AN_EPISODE.md` script format · `pipeline/templates/` parser (shared)

## Animation (Three.js)
- `art/three/characters/cast.js` base rig · `art/three/animation/v3,v4` finished modules (Ep 1-4) · **`v5`** current
- `v5/locomotion.js` walk/run/stand/turn · `performance.js` faces, speech, blinks, gaze · `squash.js` · `secondary.js` · `cast.js` · `math.js`
- `pipeline/gait_plan.py` footstep planner (Python writes the plan, JS plays it)
- `art/three/illustrated/reference-v2` finished look (Ep 4 v4) · **`reference-v3`** current: `look.js`, `shaders.js`, `lighting.js` (per-set light)
- `art/three/sets/` 3D sets (`catalog.js` = 20 sets, `reference-v2/build.js`) · `art/gemini/sets/` set paintings (govern look)
- `docs/ANIMATION_CHECKLIST.md` animation rules · `art/three/animation/v3/IMPROVEMENTS.md` old 100-item register (some overstated, see ISSUES.md)

## Episodes
- `comparisons/episode04/` latest build: `source/episode-v5.js` (driver), `prepare.py`, `audio.py`, `render-v5.cjs`, `render-v5.html`
- `comparisons/episode04/source/` also: `sets-v5.js` (set dressing, seat heights), `crowd.js` (six relatives), `timeline-v5.json` (paths, `cuts`, `fastWindows`)
- `comparisons/episode04/assets/` voices (`vo/`), cues, `v5/` new audio; `v5/` film + checks; `BEFORE_AFTER.md`
- `comparisons/episode01..03/` older builds (leave alone); each has a README

## Voices, sound
- `voice/speak.py` voice settings (NEVER change per episode) · `voice/SETUP.md` install · `voice/refs/` base voices
- `pipeline/audio/sfxkit.py` generated sound · `pipeline/templates/mix.py` mixer · `tools/rhubarb/` lip-sync (Rosetta)

## Tools (tools/three-sets/)
- `preview.cjs` + `preview.html` see a SET or a CHARACTER from several cameras · `compare.py` painting next to renders · `lib.cjs` server + browser (Mac Chrome or Linux software GL) · `stills.cjs` PNG frames · `strip.cjs` contact strips · `probe.cjs` run JS in a page · `closeup.cjs` one actor close up or from the side
- `verify-motion.cjs` feet/pelvis/facing/twos · `verify-episode04-v5.cjs` seeks/mouths/footsteps/pictures · `verify-film.py` finished mp4
- `audit-ep4.cjs` before/after numbers · older `verify-episode0N*` = per-episode checks

## Other
- `art/refs`, `art/hd` (plates, no occluders), `art/parts`, `art/inserts` · `docs/gemini/` Gemini prompts · `docs/old-blender-skills/` history
- `tree.html`, `sets.html`, `lake 3d/`, `city set/`, `maple hollow tree.js/` standalone viewers · `package.json` Playwright (`npm install`)
- `.venv-mix/` Python venv for mixing (`setup-runtime` card) · `~/Desktop/Porchlight.nosync` + `~/Desktop/Blender` old archives (read only if asked)
