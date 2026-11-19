# AGENTS.md — rules for any assistant (small local models too)

Project: **Porchlight**, an animated series (Riot 🦊, Rocco 🦝, Bash 🐻, Pip 🐰) in Maple Hollow, drawn with Three.js in the browser.
Project folder: `~/Desktop/Porchlight Three`. Paths below are relative to it. Run every command from it. **Never guess a file path: use list_dir.**

## STEP 1 — your first action (do this BEFORE anything else)
Open the one file for your task with read_file. Then follow it step by step.
| Task | First read_file |
|---|---|
| write or change dialogue or a script | `docs/VOICE_SHEET.md` |
| run the checks / a check says STOPPED or FAIL | `docs/cards/run-checks.md` |
| something looks wrong in the animation | `docs/cards/fix-animation-problem.md` |
| add a face, gesture or move | `docs/cards/add-or-fix-a-move.md` |
| render an episode / which command? | `docs/cards/render-episode.md` |
| new set · new character · new voice | `docs/cards/add-a-set.md` · `add-a-character.md` · `voice-new-character.md` |
| install tools · voice a line · older episode | `docs/cards/setup-runtime.md` · `voice-a-line.md` · `port-to-older-episode.md` |
| stage an episode from data | `docs/cards/stage-an-episode.md` |
| anything else | `INDEX.md` (one line per folder) |

## Script lines (exact format, learn this)
`NAME (face, move): words` — NAME in CAPITALS: RIOT, ROCCO, BASH, PIP. One line per row. Under 22 words. Example: `RIOT (hype, count): We make the park so terrible he gives up.`
Faces: happy hype cocky determined nervous scared embarrassed sad gloom soft sleepy shocked yelling suspicious deadpan laughing smug.
Moves: nod shrug point present hips wave laugh chuckle facepalm stare count thumbs chin lean slouch munch. Also `quietly`, `whispers`. Use only these. `...` alone = a silent beat.
Voices: **Riot** warm, fast, starts plans, "we", lists. **Rocco** deadpan, few words, eating, one flat remark that lands. **Bash** loud, competitive, dramatic about small losses, brave. **Pip** soft, careful, says the one true thing about a person. All four speak in a scene. Details: `docs/VOICE_SHEET.md`.

## Hard rules (never break these)
1. **Never** change voice settings in `voice/speak.py`. If asked to, say you cannot and why.
2. **Never** change the story, the bible, or the secret (`BIBLE.md`, `DECISIONS.md` section 2). Do not reveal what the game holds, who has the last lantern, or what the four seats mean.
3. **Never** run `git commit`, `git push`, post, or schedule anything unless the user asks.
4. **Never** edit or delete files in `~/Desktop/Porchlight.nosync` or `~/Desktop/Blender`.
5. **Do not edit finished modules**: `art/three/animation/v3`, `v4`, `art/three/illustrated/reference-v2` and older, `comparisons/episode01-03`. Change the current ones: `animation/v5`, `illustrated/reference-v3`.
6. Sound and music are generated. No licensed music, no recorded human voices.
7. Content: family-friendly. The four friends are all boys. No romance, no sarcasm, no cringe. Laugh **with**, never at. Spooky is fine, truly creepy is not.
8. Ask the user before any **look, story or cost** decision (numbered questions, options, a recommendation). Small technical choices: decide, then write one line in `DECISIONS.md` log.
9. Every decision goes into `DECISIONS.md` (log at the bottom) **immediately**. Every finished batch of fixes goes into `HANDOFF.md`.

## How to work (simple loop)
1. Look first (read_file, list_dir). Make **one small change** in **one file**.
2. Run the check the card names. Read the **one failing line**. A STOPPED line names the file and line: open that file at that line.
3. If a tool call fails, **do not repeat it**: change something (list_dir, read the card again).
4. Never loosen a check's limit to make it pass: fix the cause. Never say a check passed unless you ran it and saw PASS.
5. Look at the picture when the card says so: `node tools/three-sets/stills.cjs <page> <outDir> <seconds> <name>`.
6. Finish with a short plain summary: what you changed, what you checked, what is still wrong.

## Look in one paragraph
Painted storybook, not glossy 3D: flat painted sets, soft dark outlines, paper texture, **drawings held for 2 frames (12 fps)**, squash and stretch, exaggerated poses, small loose gestures. The paintings in `art/gemini/sets/` decide each set's layout, furniture, colour and light. Hold group shots through dialogue; cut only for a story reason (a few close-ups are wanted).

## Key facts
- Latest build and template: `comparisons/episode04/` (`source/episode-v5.js`). Voices of the friends: `docs/VOICE_SHEET.md`. Short story docs: `docs/BIBLE_SUMMARY.md`, `docs/STORY_MAP_SUMMARY.md`, `DECISIONS.md`.
- Do not read unless asked: `docs/archive/`, `BIBLE.md`, `STORY_MAP.md`, `ISSUES.md`. Tools need Node 20+, Playwright (`npm install`), system Chrome; sound mixing uses `.venv-mix/bin/python`.
