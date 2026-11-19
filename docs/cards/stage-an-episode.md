# Card: stage an episode with one data file
Run from the project root. Do not change dialogue, canon, voice settings or finished modules.
Read only this card, `episodes/epNN.txt`, `art/three/sets/spots.json`, and the example `comparisons/episode34/staging.json`.
The compiler parses the text when `episodes/epNN.json` does not exist.
Read the whole script in numbered ranges if output is truncated; list every beat and its location before editing.

1. Run `python3 tools/init_staging.py N` to create `comparisons/episodeNN/staging.json` from the script. It refuses to overwrite an existing file.
2. Set `episode` to N. Include exactly the script's beat ids (`s01`, `s02`, etc.; the intro is a beat).
3. Set each beat's `set` to its script location. List speaking actors in `actors`.
4. Give standing actors `{"at":[x,y,z]}`; seated actors `{"seat":"name"}` from that set in `spots.json`.
5. Give every beat `camera:{"pos":[x,y,z],"target":[x,y,z],"fov":45,"flatten":false}`. Hold group shots through dialogue.
6. Entrances use `enter:[{"who":"riot","side":"right","to":[x,y,z],"arriveBeforeLine":"s01_00","pace":2.1}]`.
7. Exits use `exit:[{"who":"riot","side":"right","from":[x,y,z],"leaveAfterLine":"s01_04"}]`.
8. Use `firstLineAt` (seconds) to allow arrival before dialogue; `tail` allows time to leave after it.
9. A few motivated cuts: `closeUps:[{"line":"s03_06","to":"s03_07","who":"riot"}]`; omit `to` for one line.
10. Line ids are beat id + zero-based line index, including silent lines. Cuts must last at least 1.1 s and end before another speaker.
11. Keep the starter's shared `hookModule`. For story props use `hookModule:"./props.js"` and only that episode's hooks; never edit dialogue.
12. A props module exports `hookNames`, `actions` (functions keyed by those names), and optional `setup`, `beforeFrame`, `afterAttention`, `prepareSets`.
13. Each hook receives `{t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,camera}`. Ask for help with unusual props; don't invent story details.
14. If QA names an unsupported script action, add top-level `moveAliases`, e.g. `{"cheer":"wave","shake":"shrug"}`; null requires a hook that draws that action. Never rewrite dialogue to fix a rig cue.
15. Keep `preloadSets` from the example if reusing its accepted set-dressing module. For a new hook module, copy its `prepareSets` export too.
16. Remove copied `duration` from dialogue beats; preparation must fit every spoken line. Only the silent intro has a fixed duration.
17. Match each script location exactly; give actors distinct positions. Do not reuse the lake camera for a hall or room.
18. Keep the example's `ending` object, including its camera and set, for the lamp and logo ending.
19. If `edit_file` cannot match text, read the exact range or rewrite the complete JSON with `write_file`; do not repeat the failed edit.

Replace `35` below with N; all commands must succeed:
```sh
python3 tools/validate_staging.py comparisons/episode35/staging.json
python3 pipeline/prepare_episode.py comparisons/episode35/staging.json --placeholder-voices
python3 tools/validate_staging.py comparisons/episode35/staging.json --timeline comparisons/episode35/source/timeline-data.json
.venv-mix/bin/python pipeline/mix_episode.py comparisons/episode35
node tools/three-sets/verify-motion-data.cjs comparisons/episode35/render-data.html comparisons/episode35/data-motion-checks.json
node tools/three-sets/verify-episode-v5.cjs comparisons/episode35/render-data.html comparisons/episode35/data-qa
node tools/three-sets/stills.cjs comparisons/episode35/render-data.html art/review/ep35 1 scene
node tools/three-sets/render-episode.cjs 35
```
The compiler creates the page and `source/staging-compiled.json`; do not edit generated files.
If there is a FAIL, change exactly the named field, then prepare and check again. Never loosen a QA limit.
Use `node tools/three-sets/edges.cjs <page> <beat> <z>` to verify the measured left/right frame edges.
Open review stills at one time per scene and each close-up midpoint. Check furniture, framing, entrances and props.
`--placeholder-voices` makes SILENT WAVs and synthetic mouth cues with a loud warning. They are review media, never final voices.
For real voices, follow `voice/SETUP.md`, replace WAVs and Rhubarb JSON in `assets/vo/`, then prepare without that flag.
The compiler identifies placeholders by their WAV hash; replacing the WAV with a real recording clears synthetic status.
The film is `comparisons/episode35/data-render/episode35_data.mp4`; its render checks must say PASS.
Do not edit Episode 4's baseline driver/render files, animation v3/v4, reference-v2 or older, Episodes 1–3, voice/speak.py, BIBLE.md or STORY_MAP.md.
Log technical decisions in `DECISIONS.md` immediately and finished fixes in `HANDOFF.md`.
