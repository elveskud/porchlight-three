# Handoff — where we are (17 Nov 2026, end of the audit session)

Read order: `AGENTS.md` → `INDEX.md` → one card in `docs/cards/`. Short decisions: `DECISIONS.md`. Bugs and what was fixed: `ISSUES.md`. Before/after of Episode 4: `comparisons/episode04/BEFORE_AFTER.md`.

## State of the series
- Concept, `BIBLE.md` and arcs 1–2 approved; all 40 draft scripts exist in `episodes/epNN.txt` (readable in `scripts/`).
- **Waiting on the user:** review of the 40 drafts, arcs 3–8 and the "Working picks" in `STORY_MAP.md`, the premiere date, and the new questions below.
- Three.js builds: Episodes 1–3 (old modules, untouched), **Episode 4 in two editions**: v4 (delivered 15 Nov) and **v5** (this session, `comparisons/episode04/v5/`). Movies are not in git (`*.mp4` ignored); the v5 film was copied to the Desktop.

## This session (batches, in order)
1. **Runtime and audit tools.** Root `package.json` (Playwright, uses system Chrome; `npm install`), `.venv-mix` (pyloudnorm), `tools/three-sets/{lib,stills,strip,probe}.cjs`, `audit-ep4.cjs`. `ISSUES.md` written from measurements.
2. **Walk, stand, turn.** `pipeline/gait_plan.py` (footstep planner) + `art/three/animation/v5/locomotion.js`; `prepare.py` writes the plan and the real footstep times; weight-shifting stand, stepping turn, pre-roll turn before a walk.
3. **Acting.** `v5/performance.js` (speech over the drawing, blinks, blended faces, held gaze, gestures with wind-up, new moves), `squash.js`, `secondary.js`, `cast.js` (rest feet, `registerCharacter`, `validateTimeline`).
4. **Look.** `art/three/illustrated/reference-v3/` (per-set `lighting.js` for all 20 sets, two painted shadow bands, contact shadows, boiling coloured ink, paper, lens flattening, no ink blending on transparent things).
5. **Build and QA.** `episode-v5.js` + `render-v5.html/.cjs` (epsilon boundaries, checks on cached scenes, no film on failure, whole-tree cache hash, BT.709), `verify-motion.cjs`, `verify-episode04-v5.cjs`, `verify-film.py`. `prepare.py` now reads the frozen `assets/vo/<id>.wav`; v5 files sit beside v4 (`timeline-v5.json`, `assets/v5/`) so v4 is untouched.
6. **Script checker.** Blender-only rules dropped (user decision), real bugs fixed (`tools/check_scripts.py` header lists both). 38 of 40 scripts now check fully.
7. **Cheap to run.** `INDEX.md`, `AGENTS.md`, 10 cards, `docs/VOICE_SHEET.md`, short `DECISIONS.md` (full text archived in `docs/archive/DECISIONS_FULL.md`), `docs/BIBLE_SUMMARY.md`, `docs/STORY_MAP_SUMMARY.md`, short `CLAUDE.md`.

## Files copied from the old folders
- Two, read-only. (1) The Friendzy logo for the ending: `~/Desktop/Friendzy/Friendzy/Assets.xcassets/AppIcon.appiconset/1528a01b-6704-40f9-86b2-ed364e164cf4.png` → `art/inserts/friendzy-logo.png` (1024x1024, the app icon the old pipeline used after the lamp click). (2) For the before/after: `~/Desktop/Porchlight.nosync/comparisons/episode04/episode04_3d_illustrated.mp4` → session scratchpad (SHA-256 `8e986044…32bc`, same as `delivery.json`). Nothing was written to, moved or deleted in `~/Desktop/Porchlight.nosync` or `~/Desktop/Blender`. No other file was needed.
- Not copied (and not needed): GLBs, `art/hd/occluders`, `tools/occluders.py`, Episode 1 refined/illustrated, movies, the voice `.venv`.

## Answered by the user (17 Nov, after watching v5)
1. Jog speed: faster (done). 2. Episodes 1 and 2: do not touch. 3. Short scripts: accepted. 4. Porting to Episodes 1-3: not asked again; card `port-to-older-episode.md` stays ready. 5. Idle acting and ink: fine. Plus the review notes (backgrounds, title tower, seating, Bash's mom, extras, mid-frame pops, close-ups, logo): all done, see `ISSUES.md` "Review round 2".
## Open for the user
- Is the close-up count right (7)? More or fewer is one list in `prepare.py` (`cuts`).
- The sofa is lower than in the painting because the actors are small; say if you prefer the painting's height with dangling legs.
- Episodes 1 and 2 still stop on the walk-off continuity rule in the checker (you said not to touch them: they are simply left).

## Next (17 Nov, user)
1. Friend builds the 11 missing sets and 7 characters in the cloud from `docs/FRIEND_PROMPT_BUILD_ASSETS.md` (branch `assets/cloud-build`; the user reviews `art/review/`).
2. Then: **staging as data** — the full plan is `docs/STAGING_SPEC.md` (start it in a fresh session; about one long session). Voices are DONE: the old environment is linked in place and verified identical (`voice/SETUP.md`).
3. Local model test: `tools/local-agent/` (Qwen3 14B in Ollama). Round 1 showed the cards need the first action, the format and the voices inline: `AGENTS.md` was rewritten for that; the checker now names the file on STOPPED.

## Known loose ends
- Voice scripts were not re-run (no Kokoro/Chatterbox venv here); every Episode 4 line is an existing recording.
- `voice/SETUP.md` caveat: scripts may expect old `Blender/` paths on a full run.
- Old checks (`verify-episode04*.cjs`, `*-checks.json`) remain for history; they point at v4 and many cannot fail (see `ISSUES.md`). `render.cjs` (v4) is unchanged.
- Hardcoded absolute paths remain only in historical manifests (`*-render.json`, `voice-manifest.json`, `audio-provenance.json`) and old decisions.
- Not fixed (see `ISSUES.md`): seated feet hang above the floor, `mouthCorners`, jaw contour, four `look.js` copies.
- Docs in `docs/` and `comparisons/*/README.md` still mention Blender (history). `docs/OCCLUSION_PIPELINE.md` is history now.

## Recommended next
1. User compares `Porchlight Episode 4 - Not For Sale - v5 (Three.js).mp4` with the v4 film; decide the questions above.
2. Then port to Episodes 1–3, or start Episode 5 on the v5 template (card `render-episode`).
3. Voicing new lines needs `voice/SETUP.md` (about 2 GB).
