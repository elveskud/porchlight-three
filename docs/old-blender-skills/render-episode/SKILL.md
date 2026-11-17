---
name: render-episode
description: Make stills or the final video of a Porchlight episode safely, with the approval gates. Use when the user asks to render, preview, make stills, or finish an episode.
---
# Rendering an episode

Order is fixed (user, 12 Nov 2026: scene by scene, then merge; never the whole video and then partial re-renders): doctor, `--check` (must pass), voices + every scene drawn one at a time at final quality, the user reviews the scene clips, only flagged scenes are drawn again, merge + your own QA read. Never post, schedule, commit or push unless asked.

1. `python3 ~/Desktop/Blender/doctor.py` must end with ALL GOOD (each BAD line prints its fix).
2. Check: `python3 make.py episode --script <ep>.txt --format horizontal --name epNN --check` (from `~/Desktop/Blender/templates`) must say OK. `STOP anim` lines (a still stretch over 8 s) must be fixed in the script first; read the `WARN anim` lines too.
3. Draw the scenes (voices + one scene after another, no waiting between them):
   `WHOLE_TWOS=1 NO_CACHE=1 python3 make.py episode --script <ep>.txt --format horizontal --name epNN --jobs 6 --scenes all` (add `--reuse-voices` on reruns)
   Each scene lands as `../videos/epNN/scenes/NN_<id>_<chapter>.mp4` (full quality, its own sound) and the run prints `SCENE ready: <path>`: send each clip to the user as it lands (watch the log with Monitor for `SCENE ready`). The check gate still runs before each scene is drawn, and frames are still checked as they land.
   The run hears every voice line right after voicing and retakes garbled ones by itself (`voice_check.txt`).
4. The user reviews the clips. For each flagged scene: fix the script, `--check`, then redraw only what changed: `--scenes stale` (or `--scenes s03,s05`). A fix that only shifts later scenes in time does not make them stale. `python3 scenes.py status ../videos/epNN` lists every scene as ok / stale / missing.
5. Merge when every scene is ok: the same command with `--merge` instead of `--scenes` (with `--reuse-voices`). It joins the drawn frames (nothing redrawn), bakes the episode once for scene.blend and the motion log, encodes and runs the full QA. It stops and names the scenes to redraw if any is stale.
6. Read `../videos/epNN/qa.txt`: length 120-240 s, -14 LUFS, no black gaps, no dead air over 1.2 s, faces not dark or under captions, and the `anim:` lines. Then `animqa.txt` (every flagged moment) and `problem_reel.mp4` (skill `anim-review`): fix real problems by redrawing those scenes and merging again, name deliberate ones. Report the mp4 path and anything still open.
7. The old one-pass whole render (no `--scenes`/`--merge`) still works and `RESUME=1` still finishes it after a crash, but use the scene flow for episodes.

Outputs in `Blender/videos/epNN/`: `scenes/` (each scene's frames + clip + stamp), mp4 (+ silent), `qa.txt`, `qa_sheet.png`, `animqa.txt`, `problem_reel.mp4`, `voice_check.txt`, `stills_sheet.png`, `shots.txt`, `chapters.txt`, the 1280x720 thumbnail.
After changing shared pipeline code: `python3 ~/Desktop/Blender/tools/regress.py` must say every frame matches.
Cloud sessions have no real voices or paintings: renders there only prove code, never judge the look there.
