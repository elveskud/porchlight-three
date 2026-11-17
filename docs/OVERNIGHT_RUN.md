# Overnight run: Episodes 4–13 (planned 9 Nov 2026)

Read `CLAUDE.md` and `DECISIONS.md` first. The user has waived the approval gates for this run only, except Part A, which happens while they are still at the computer.

Pipeline path note: the shared Blender pipeline is at `~/Desktop/Blender` (a symlink to `Blender.nosync`), not `~/Desktop/Friendzy/Blender` as CLAUDE.md says. Episode 3 (`episodes/ep03.txt`) is the working example of a script-built episode with new sets and townsfolk; see the "9 Nov 2026: Episode 3 art" section of `DECISIONS.md` for how it was done.

## Part A: with the user (approval needed). **DONE 9 Nov:** characters and voices built and approved (see `DECISIONS.md`, "Ep 4-13 townsfolk"). Still to do: the new props (step 3).
1. Build the 10 new characters in code as additions to `Blender/characters/roster.py` (`PROFILES`, `animal=` spec, the same way as owl/gus/dot/brook): Preston, Marlo, the Mayor (cat), Walt, Big Hal, the hiker, Bash's mom, Pip's mom, Pip's dad, Bea. Their looks come from `art/gemini/characters/03–14_*.jpg`, the pose sheets `art/gemini/refs/poses_<name>.jpg` (`docs/gemini/GEMINI_CHARACTERS.md`) and `BIBLE.md`. Make one reference sheet (copy `tests/ep3_cast_sheet.py`) and show it.
2. Voices: for each character, 2–3 Kokoro samples with `voices/make_refs.py` (`ONLY=` filter). The user picks. Then add `CHARACTERS` entries in `voices/speak.py`. Never change the existing characters' settings.
3. Add the new names to `screenplay.py` `ROSTER`, and any new props (`backpack`, `photo`, `tape`, `crate`) to `PROPS`, `episode_script.CARRY` and `episode_scene.make_prop`.
4. Check that `art/gemini/sets/57_walt_dining_evening.jpg` and `58_walt_dining_storm.jpg` exist (`docs/gemini/GEMINI_WALT.md`). The browser is not used in this run.
5. Log every approval in `DECISIONS.md`.

## Part B: overnight (no approvals)
**Timing (measured 9 Nov):** the Episode 3 render took 52 minutes with `--jobs 6` (about 1060 s per minute of video, not the 165 s in `CLAUDE.md`). With voices and set work, plan on about 70–80 minutes per episode, so 6–7 episodes a night. Work in order (4, 5, 6...) and stop wherever the night ends. Don't skip QA to go faster.

Keep a progress log in `OVERNIGHT_LOG.md`: what is done, what was skipped and why, and the next step. If the session stops, a new one resumes from that log.

0. Run `caffeinate -dims &` so the Mac doesn't sleep. Run `python3 ~/Desktop/Blender/doctor.py`, which must print ALL GOOD.
1. Sets. Use the `new-set` skill for each set Episodes 4–13 need that isn't registered yet. The paintings already exist in `art/gemini/sets/`:
   - park (23)
   - walt_porch (24)
   - school_gym (25)
   - walt_garage (26)
   - archive (27)
   - gus_garage (28/29)
   - pip kitchen (22) if a script uses it

   For each one: upscale to 4K, register it in `locations.PLATE_SETS`, write the set JSON with spots, run `tools/occluders.py`, then look at its sheet.
2. Walt's house (Episode 5):
   - The hallway is `art/gemini/first-round/c6_walt_hallway.jpg` and grandpa's photo is `art/gemini/grandpa/photo_lantern.jpg`. Both are ready to use.
   - The dining room in `art/gemini/first-round/c5_walt_dining_REJECTED.jpg` is rejected: it's a mansion with spiral staircases, and storm only.
   - If `art/gemini/sets/57_walt_dining_evening.jpg` and `58_walt_dining_storm.jpg` exist, the user made them; use those.
   - The user makes the pictures (`docs/gemini/GEMINI_WALT.md`). Don't use the browser: it costs too many tokens.
   - If the files are missing, stage those scenes on `apartment` and log it.
3. For each episode from 4 to 13, in order:
   - `python3 tools/check_scripts.py`
   - `make.py episode --script episodes/epNN.txt --format horizontal --name epNN --check`, then fix the staging in the `.txt` so it passes. It now stops on dead holds, silent beats and away-facing seats; fix them by acting the moment out (rules at the end of `docs/WRITING_AN_EPISODE.md`), never by adding `quiet_ok` just to pass
   - run `voices/check_voices.py` with `voices/.asr-venv/bin/python` and replace the garbled lines
   - full render with `WHOLE_TWOS=1 NO_CACHE=1 ... --jobs 6 --reuse-voices` (the frame cache wasted 15 GB with 0 hits)
   - read `qa.txt` and log the result

   If an episode stays broken after 2 fix attempts, log it and move on.
4. **Disk space is tight** (about 26 GB free on 9 Nov). Check `df -h ~` before each episode, and stop if less than 10 GB is free. After an episode's render passes QA, delete everything in `Blender/videos/epNN/` except:
   - the final mp4s
   - `qa.txt`, `qa_sheet.png`, `stills_sheet.png`, `chapters.txt` and the thumbnail
   - `vo/` (small, and needed to re-render with `--reuse-voices`)

   This means deleting `scene.blend`, `stills/`, any `stills_run*/`, `frames/` and other intermediate files. Also delete the upscale and occluder scratch files once a set is done; keep the final plates in `art/hd/`. Never delete anything in `episodes/` or `art/gemini/`.
5. Don't change shared motion, audio or voice code for the existing cast, and don't change existing sets. Never commit, push or post.

## Part C: morning
Write `OVERNIGHT_REPORT.md`. For each episode: the mp4 path, length, QA flags, the stills sheet, anything skipped, and every invented choice the user should check.
