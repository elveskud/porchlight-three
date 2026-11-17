# Porchlight — decisions (short version)

This is the **short, binding** summary. The full history (Blender era, every round, every review) is archived unchanged in
[`docs/archive/DECISIONS_FULL.md`](docs/archive/DECISIONS_FULL.md). Nothing was deleted. Add every new decision to the **Log** at the bottom, immediately.
Where two entries disagree, the newer one wins; Blender-era entries are history, not rules.

## 1. What Porchlight is (28 Oct 2026, user)
- A real animated series with its own characters, not an ad. Friendzy appears naturally, **never "download now"**; only real app features and real prompts.
- Title **Porchlight**, town **Maple Hollow** (a lake-and-forest American town of animals, always summer). 40 episodes, 3–4 min, landscape, Wed + Sat, 1920×1080.
- Tone: Gravity Falls mystery, Adventure Time heart, American Dad plans that escalate. **Laugh with, never at. No cringe, no sarcasm, no romance.**
  Spooky is fine, truly creepy is not. A small emotional moment in most episodes, allowed to land with no joke.
- Audience: teens and adults (Gen Z, millennials). Success = people waiting for episodes and having favourite characters.
- Each episode ends with the porch light clicking off, then a small Friendzy logo. Intro ~10 s with a theme tune. Music mostly lo-fi, all generated.
- Narrator: an older man, used as little as possible, not mysterious, not grandpa.

## 2. Cast and canon (never change without the user)
- **Riot** 🦊 20, lifeguard, the heart, funny but not a stage hog. **Rocco** 🦝 20, deadpan, snacks, notices everything. **Bash** 🐻 17, competitive, brave, loses a lot. **Pip** 🐰 17, quiet, sharp about people. All four are boys; the group never falls apart.
- Side cast: Mrs. Brook 🐢, Gus 🐐 (radio), Dot 🐰 (8), Big Hal 🐻, the Mayor 🐈, Preston 🦚, Marlo 🐭, Walt 🦊 (Riot's dad), the owl teacher Mr. Hoot, Pip's parents, Bash's family, Lord Puddles the frog, the hiker (human).
- Secrets per boy are in `BIBLE.md` (summary in `docs/BIBLE_SUMMARY.md`). The porch light is Riot and Rocco's stoop light, taken from grandpa's house.
- **The secret (hidden from fans until the finale):** a storm on **12 August** stopped the festival game *Lamplight* before the last lantern went up; the unfinished round holds the town in one endless summer; it needs four players (eye=Rocco, key=Riot, footprint=Bash, ear=Pip); Mrs. Brook kept the last lantern out of fear of letting go. Theme: *"You can keep a memory. You can't keep a moment."* Memories are never presented as bad. Friendzy is never magic.
- Clue tiers: eps 1–19 odd summer, grandpa/game/storm matter; 20–35 the round holds the summer, needs several players, something is missing; 36–40 everything. The haunted house, Preston and the hiker are decoys that still contribute. Rocco's hunches are jokes; Dot is never right in time.
- Season 2 cliffhanger (confirmed 2 Nov): a postcard "Saw the lantern. Knew you'd manage. Don't wait up." with a smudged postmark.

## 3. Process (user's approval gates)
1. **Decide** with the user (numbered questions, options, a recommendation) → write it in this file at once. "You decide" = decide and say what you picked.
2. Bible → story map → scripts in batches (all 40 drafts exist; **waiting on the user's review**, arcs 3–8, the "Working picks", and the premiere date).
3. Episode JSON from each approved script → check → build in illustrated Three.js → read the QA yourself and fix → the user reviews the finished video.
4. **No stills-approval step for episodes** (9 Nov). Never post, schedule, commit or push unless asked.
5. Rejected, do not pitch again: Shorts-as-episodes, vlog style, mockumentary, Gemini cut-out cast, a fan submission page, polls steering the story, series hints in Shorts, holiday episodes, romance, the group falling apart.

## 4. Look and animation (Three.js, binding)
- **Pictures in `art/gemini/sets` govern set layout, furniture, colour and light.** No generic warm palette over every room (14 Nov). `lake_day_v2` is the style reference.
- **The code-drawn cast is the cast.** Gemini paints sets only. Gemini cut-out casts were rejected (29 Oct).
- **Hold group shots through dialogue.** No automatic per-speaker cutaways; insert or change camera only for a clear story purpose (revised Ep 3, 14 Nov).
- Drawings are **held on twos (12 fps)**; fast actions may go to 24 fps (user approved whole twos 10 Nov).
- **Modeled 3D only (17 Nov, user):** no painted backdrop cards and no occluder tool. The 2D feel comes from shaders (ink, boil, paper, painted shadows), lens flattening, timing and acting. `docs/OCCLUSION_PIPELINE.md` is history.
- Style blend for motion and acting: Gravity Falls (painted, expressive, mystery), Bob's Burgers (small loose gestures), Adventure Time (rubbery squash and stretch). Inspiration only: never copy their characters or scenes.
- Reuse and extend versioned modules (`art/three/animation/v3,v4,v5`, `illustrated/v2,reference-v2,reference-v3`); **do not rewrite finished ones.** Current: **v5 + reference-v3**.

## 5. Voices, sound, music
- 100% generated: Kokoro base voice per character, cloned and acted by Chatterbox. **Settings live in `voice/speak.py`; never change them per episode.** Base voices picked by the user are in `voice/refs/`.
- New characters need a base voice (`voice/make_refs.py` + an entry in `speak.py`); play samples to the user first; run `voice/check_voices.py` after voicing.
- All SFX and music synthesized (`sfxkit.py`). No licensed music, no recorded human voices. Mastered to −14 LUFS.

## 6. Resolution and delivery
- Video 1920×1080 (no 4K). Episodes render scene by scene, then merge. Movies are not kept in the repo; deliver a copy to the Desktop and record its hash.

## 7. Script rules in force (17 Nov 2026)
- The checker (`tools/check_scripts.py`) keeps: syntax, speakers in the cast, known cues, enters/exits and walk-off continuity, one-word-line and group-laugh **warnings**, lines over 22 words, `next:` and number, length band 175–240 s (estimate at 3.1 words/s), real Friendzy prompts (when the app folder is present), valid sfx/faces/sets.
- **Dropped (Blender-only, user decision 17 Nov):** dead-hold (>2.5 s) and silent-hold limits, `--fit` hold padding, overlapping-seat and 80×40 painting-pixel spot rules, "away" seats, the occluder-pass warning, `reach_px`, the Blender shot/mood/fx/weather vocabularies, `director.py` auto cutaways, `pipeline/templates/WRITING.md` (it is about 12–16 s Friendzy shorts).
- Open for the user: Episodes 1 and 2 still stop on the walk-off continuity rule (a character leaves and is in the next beat with no `enter`); 11 of the 38 scripts that fully check (eps 6, 13, 15, 22, 26–29, 35–37) are 159–172 s at the realistic speaking rate, under the 3–4 min target.

## Log (newest last; add here first, then do the work)
- **14–15 Nov 2026** (user): Three.js sets, cast and Episodes 1–4 authorised; reference fidelity and calm group shots became binding (see §4). Episode 4 delivered. Details: archive.
- **17 Nov 2026** — pipeline audit, 2D look, cheap-to-run (user). Goal: find and fix every bug in the Three.js pipeline, push the look toward hand-drawn 2D, make the project cheap to run and usable by a small local model. Test bed Episode 4; fixes in new versioned modules (`animation/v5`, `illustrated/reference-v3`).
- **17 Nov — Look (user): modeled 3D only.** No painted cards, no occluder tool. This replaces the old CLAUDE.md line that said the occlusion standard still applied; it agrees with the 13 Nov decision for full 3D sets.
- **17 Nov — Script rules (user): drop the Blender-only rules** (listed in §7). Real checker bugs fixed: sfx names from the mixer table, faces from v5, sets from the catalog, words/s 2.6→3.1, absolute `[fx]` paths reported, Friendzy prompts skipped with a notice when the app folder is absent, `features` stubbed (never copied).
- **17 Nov — Scope (user): new v5 modules, Episode 4 re-rendered, Episodes 1–3 untouched.** The port recipe is `docs/cards/port-to-older-episode.md`.
- **17 Nov — Technical (Claude, small, logged):** root `package.json` + `npm install` for Playwright (it only lived in `/private/tmp`); `.venv-mix/` for `pyloudnorm`; v5 files sit next to v4 (`timeline-v5.json`, `assets/v5/`, `episode-v5.js`, `render-v5.cjs`) so the delivered v4 build is never overwritten; `prepare.py` now reads the frozen `assets/vo/<id>.wav` (the manifest pointed at the deleted Blender folder); footstep planner `pipeline/gait_plan.py` (walk ≤ 3.5 steps/s, otherwise a run cycle; step ≤ 0.65 leg walking, ≤ 1.0 running); 11 of 12 Episode 4 paths are faster than a walk, so most entrances are drawn as a jog (staging, not engine: slow them in `prepare.py` if wanted); `ep04.txt/json` pavilion path made relative; `render-v5.cjs` replaces `render.cjs` for v5 (epsilon on frame boundaries, checks on cached scenes, no mux on failure, whole-tree cache hash, BT.709 tags).
- **Unchanged, always:** voice settings, story canon, the bible, the secret. No commit or push unless asked.
- **17 Nov — Delivered:** `~/Desktop/Porchlight Episode 4 - Not For Sale - v5 (Three.js).mp4` (SHA-256 `4b32df92856011d5410609ee74a895d627180aa335089caa81ddd8eaf979bbe5`) plus `Porchlight Episode 4 - v4 vs v5 sheet.jpg`. v4 film and files untouched. Before/after: `comparisons/episode04/BEFORE_AFTER.md`. Open questions are in `HANDOFF.md`.
- **17 Nov — Review of Episode 4 v5 (user):** (1) Joggers can go faster. (2) Do NOT port to Episodes 1 and 2. (3) Accept the short scripts as they are. (4) Idle acting and ink are fine. Notes to fix, then re-render only what is wrong: backgrounds must always feel full (first scene looked empty); title sequence: the lookout tower roof is off; the living room: seated characters are wrong (Pip's and Bash's legs go through the couch, Rocco's body is hidden); Bash's mom looks wrong; the extras need a better look and more movement; characters must not appear or vanish in the middle of the frame (enter and exit from off-screen); add some close-up cuts, not too many (**this overrides "no cutaways" for Ep 4: a few motivated close-ups are wanted**); add the Friendzy logo at the end.
- **17 Nov — Technical (Claude, review round 2):** all entrances start and exits end off-screen (edges measured per scene); runs about 3.1 units a second, planner run cadence 4.7 steps a second, forced `gait: 'walk'` for the hiker, Preston at the lake and Marlo's notice walk (step at most 0.66 leg); pelvis drop capped at 0.12 rig units; sofa rescaled to the actors (seat 0.34), beanbag rebuilt, `seatedLegs()` fits legs to any seat; Bash's mom rebuilt from Bash's rig; relatives are six individuals in `crowd.js`; the park and the title camera in `sets-v5.js` and `episode-v5.js`; seven close-ups from `timeline.cuts` (`prepare.py`); ending uses the Friendzy logo (`art/inserts/friendzy-logo.png`, copied read-only from `~/Desktop/Friendzy/Friendzy/Assets.xcassets/AppIcon.appiconset/1528a01b-6704-40f9-86b2-ed364e164cf4.png`); film is now about 197 s (ending 0.7 s longer so the logo can hold; scene starts shifted by up to 1.5 s for the slower hiker and the longer opening runs).
- **17 Nov — Delivered (revision 2):** `~/Desktop/Porchlight Episode 4 - Not For Sale - v5 revised (Three.js).mp4` (SHA-256 `9a366d4cbb9b6af1ef2b6f09d50b7e154189638967890d3dda10ea2a945077cc`). The first v5 file stays on the Desktop; v4 untouched. See `comparisons/episode04/BEFORE_AFTER.md` Revision 2.
