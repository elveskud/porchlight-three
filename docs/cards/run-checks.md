# Card: run the checks
## Scripts (text)
```sh
python3 tools/check_scripts.py              # all 40: parse, speakers, cues, faces, sets, sfx, lengths, one-word lines. Writes scripts/epNN.md
python3 tools/check_scripts.py 4 --no-md    # one episode, don't write the readable file
python3 tools/check_scripts.py 4 --verbose  # list every warning
```
**If an episode says `STOPPED in episodes/epNN.txt: script line N: ...`:** open `episodes/epNN.txt` at line N, fix that line (the message lists the allowed faces and moves), and run the same command again. Fix the script, never the checker.
Reads: PASS line per episode, `-` lines are problems, `[N one-word lines, M group laughs]` are warnings only.
Length band 175–240 s (estimate at 3.1 words/s). `ep01`/`ep02` stop on "walked off, no enter": add an `enter` or remove the character from the next beat's cast.

## Animation and picture (Episode 4 v5)
```sh
node tools/three-sets/verify-motion.cjs        # planted-foot slide, pelvis and facing jumps, steps per second, idle sway, held drawings
node tools/three-sets/verify-episode04-v5.cjs  # 60 out-of-order seeks, all nine mouth shapes, no late mouth, footsteps = landings, no black frames, no camera jumps in dialogue
python3 tools/three-sets/verify-film.py <film.mp4> <timeline-v5.json> <audio.wav> [report.json]   # size, frames, decode, loudness, colour, black, twos
```
Each prints `PASS` or `FAIL` with the reason. Limits are at the top of each file; do not loosen a limit to make it pass: fix the cause.

## Look at it
```sh
node tools/three-sets/stills.cjs comparisons/episode04/source/render-v5.html /tmp/s 12,40.75 name      # PNG frames
node tools/three-sets/strip.cjs comparisons/episode04/source/render-v5.html /tmp/strip.png 0.0 0.0833 16 1000,380,920,420 4 0.5   # 16 drawings in a row
node tools/three-sets/probe.cjs comparisons/episode04/source/render-v5.html "return episode.timeline.beats.length"  # run any JS in the page
```
Then open the PNG and look. Numbers pass; eyes decide.

## Do NOT read
`comparisons/*/*-checks.json` (old, many cannot fail), `verify-episode0[1-3]*` (old builds), `pipeline/templates/*` (shared parser).
