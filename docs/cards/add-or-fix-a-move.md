# Card: add or fix a move (a gesture, face, or action) — acting only
Faces and actions live in ONE file: `art/three/animation/v5/performance.js`. Scripts write them as `NAME (face, move): line`.

## Add a face
In `FACES` (top of the faces section) add `name: {brow: .1, browY: 0, headX: 0, headZ: 0, lids: 0, squint: 0, smile: 1, earL: 0, earR: 0, lookX: 0, tension: 0}`. Channels add up, scaled by strength; `smile` blends toward its value. Unknown face names print one warning.
## Add an action
1. Add the name to the `ACTIONS` set.
2. In `poseAt`, add a block after the others: `if (act === 'name') { p.aRf = mix(p.aRf, .8, g); p.aRb = mix(p.aRb, 1.2, g); p.handR = 'point'; }`
   - `g` = strength with a small overshoot (use for arms); `hold` = smooth in/out (use for body, head, face); `age` = seconds since the line began (use `S(age*9)` for wobble; keep wobble under 3 cycles/s so it reads on twos).
   - Channels: `aLf aRf` arm forward, `aLo aRo` arm out, `aLb aRb` elbow bend, `aLw aRw` wrist, `torsoX/Y/Z`, `headX/Y/Z`, `handL/handR` ('relax','open','point','grip'), `smile`, `lids`, `squint`.
   - Use `mix(current, target, g)`, never assign: assigning makes a pop.
3. Squash on the hit: `art/three/animation/v5/squash.js` `squashAt` (add a term keyed on `e.do`).
## Fix timing
- Fast moves (under 0.25 s) read better on ones: add the window to `fastWindows` in `comparisons/episodeNN/source/prepare.py` (`fast += [(t0, t1)]`), then re-run prepare.
## Test (30 seconds)
```sh
node tools/three-sets/strip.cjs comparisons/episode04/source/render-v5.html /tmp/move.png <t0> 0.0833 16 <x,y,w,h> 4 0.5   # 16 drawings of the line
node tools/three-sets/verify-motion.cjs && node tools/three-sets/verify-episode04-v5.cjs
```
Look at the strip: anticipation (small move back), the hit, overshoot, settle. Body asymmetric, weight on one side.

## Files to touch
`art/three/animation/v5/performance.js`, `squash.js`; `prepare.py` (fast windows). The checker picks up new faces/actions by itself (`tools/check_scripts.py` reads `FACES`/`ACTIONS`).
## Do NOT read
`v3/*`, `v4/*`, `characters/cast.js`, `look.js`.
