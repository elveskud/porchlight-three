# CLAUDE.md — Porchlight Three

Porchlight is an animated story series starring the Friendzy cast (Riot 🦊, Rocco 🦝, Bash 🐻, Pip 🐰) in Maple Hollow. This folder is the **fresh Three.js-only copy** (started 17 Nov 2026) of the old `~/Desktop/Porchlight.nosync` project, with no Blender. **Read `DECISIONS.md`, then `HANDOFF.md`, before doing anything.** The old folders (`~/Desktop/Porchlight.nosync`, `~/Desktop/Blender`) are untouched archives; read from them only if the user asks.

## Where things are
| What | Where |
|---|---|
| Decisions (source of truth; Blender-era entries are history) | `DECISIONS.md` |
| Series bible (approved) / all 40 episodes | `BIBLE.md` / `STORY_MAP.md` |
| Episode scripts (`epNN.txt`), JSON, readable versions | `episodes/`, `scripts/` |
| Script checker (rebuilds `scripts/`) | `python3 tools/check_scripts.py [--fit] [--no-md]`; parser in `pipeline/templates/` |
| Script format and fields | `docs/WRITING_AN_EPISODE.md`, `docs/ANIMATION_TODO.md` |
| Animation rules and per-episode checklist | `docs/ANIMATION_CHECKLIST.md` |
| Gemini set-painting prompts | `docs/gemini/` (results go in `art/gemini/new/`) |
| Voices (Kokoro + Chatterbox) | `voice/` (`SETUP.md` to install); base voices in `voice/refs/` |
| Sound effects and mix | `pipeline/audio/sfxkit.py`, `pipeline/templates/mix.py` |
| Lip sync | `tools/rhubarb/` (runs via Rosetta on Apple Silicon) |
| Three.js cast and reusable modules | `art/three/` (`characters/`, `animation/v3,v4`, `illustrated/v2`, `sets/`, `vendor/three`) |
| Episode builds 1–4 (source, voices, cues; movies not copied) | `comparisons/episode0N/` (README in each) |
| Town atlas / city plan | `maple hollow tree.js/PLAN.md` |
| Standalone cast viewer / 3D sets viewer | `tree.html`, `sets.html` |
| Old Blender-era skills (reference only) | `docs/old-blender-skills/` |

## Process (user's approval gates)
1. **Decide** with the user (numbered questions with options and a recommendation) → write it into `DECISIONS.md` immediately.
2. Bible → story map → scripts in batches of 5 → user approves each.
3. Episode JSON from each approved script; run the check; build in illustrated Three.js following `comparisons/episode04/README.md` (the latest and best reference).
4. No stills-approval step for episodes (user, 9 Nov 2026). Read the QA output yourself and fix what's broken before handing over; the user reviews the finished video.
5. Never post, schedule, commit or push unless asked.

## Three.js direction (binding)
- Sets must follow the existing pictures in layout, architecture, furnishings, colour and lighting; no generic warm palette over every room (14 Nov).
- Hold group shots through dialogue. No automatic per-speaker cutaways; use an insert or camera change only for a clear story purpose (see revised Episode 3).
- The code-drawn cast is the cast. Gemini paints the sets only, in the cast's style (`lake_day_v2` is the style reference). Gemini cut-out casts were rejected.
- Reuse existing modules (`art/three/animation/v3`, `v4`, `illustrated/v2`, `reference-v2`) and add new ones; do not rewrite finished ones.
- The occlusion standard still applies to set paintings: read `docs/OCCLUSION_PIPELINE.md` (note its tool, `tools/occluders.py`, was not copied; fetch it from the old folder if needed).

## Voices, sound, music
- 100% generated: Kokoro base voice per character, cloned and acted by Chatterbox. Settings live in `voice/speak.py`; **never change them per episode.** Existing recordings are in each episode's `assets/vo/`.
- New characters need a base voice (`voice/make_refs.py` + an entry in `speak.py`); play samples to the user first. Run `voice/check_voices.py` after voicing.
- All SFX and music are synthesized (`sfxkit.py`). No licensed music, no recorded human voices.
- The porch light clicking off plus a small Friendzy logo ends each episode.

## Writing rules
Laugh with, never at. Riot drives scenes but isn't a stage hog. Family-friendly for teens and adults: no cringe, no sarcasm, no romance; the four friends are all boys; spooky is fine, truly creepy is not. Friendzy appears naturally, never "download now"; real app prompts only (the Friendzy app is in `~/Desktop/Friendzy/`). Fans must not be able to solve the secret before the finale. Grab attention in the first seconds.

## Working with this user
Lives in Tbilisi (UTC+4); targets EU and US. Likes rounds of numbered questions with concrete options and a recommendation. When they say "you decide", decide and say what you picked. Plain, short language; they often dictate, so read generously and confirm anything ambiguous. Every decision goes into `DECISIONS.md` right away.
