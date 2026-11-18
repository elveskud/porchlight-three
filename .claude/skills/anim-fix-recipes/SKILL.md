---
name: anim-fix-recipes
description: Symptom to cause to fix lookup for Porchlight animation problems - floaty, foot slide, pops, jitter, stiff, rubbery, dead pose, pasted-on, twinning, late mouths. Use as the first stop when something looks wrong and you need the cheapest fix.
---
# Fix recipes (look the symptom up, change one thing)

Start with the numbers (`anim-measure`), then this table. Fix the **cheapest layer first**: script, then episode JSON, then v5 code. Never edit v3, v4 or reference-v2. The older file table is the card `docs/cards/fix-animation-problem.md`.

| Symptom | Likely cause | Fix | Skill |
|---|---|---|---|
| **Floaty** jump or fall | Too long in the air; no ease at apex; landing without squash | Use one parabola `g = 8h/T^2`; shorten `T`; add anticipation and landing squash; sound on contact drawing | `anim-physics`, `anim-impact` |
| **Weightless** character | Same timing for everyone; no crouch; no settle | Scale timing and squash by weight (Bash 1.35, Pip 0.75); add anticipation and `overshoot` | `anim-physics` |
| **Foot slides** | Path too short or too fast for its steps; pelvis moved instead of weight shift | Fix the path in `prepare.py`; use `stand()` for rest; run `verify-motion.cjs` | `anim-contact` |
| **Scurrying** | Speed above the walk range with small steps | Lengthen the path or time (about 1-2.5 units/s is a walk) | `anim-locomotion` |
| **Gliding** | Steps too few for the speed | Raise cadence or step in `gait_plan.py` constants (one at a time) | `anim-locomotion` |
| **Pop** at the end of a walk | Facing turn or mean drop | Check `preTurn`, `yawAt`, `PRE_TURN`, `TURN_TIME`, `applyGait` | `anim-locomotion` |
| **Pop** at a pose change | Assigned instead of blended | Blend with `ease`/`mix`; change on a blink | `anim-faces` |
| **Statue** while standing | `idleBalance` amplitude too small, or root not using `stand()` | Raise `energy`; use `stand()` with `idle` | `anim-locomotion` |
| **Jitter** on a hold | Noise from per-frame values or time with no quantising | Quantise to the drawing (`Math.floor(t * 12) / 12`) and keep motion slow | `anim-timing` |
| **Everything swings together** | Secondary parts share peak time | Give ears, tail and hem different peak times and phase per joint | `anim-secondary` |
| **Ears and tail dead** | Driver not passing `speedBefore` | Pass the speed from `lag` seconds earlier to `followThrough` | `anim-secondary` |
| **Rubbery in a bad way** | Squash with no anticipation or deep recovery on light things | Add a term, keep volume, shorten recovery for light characters | `anim-impact` |
| **Nothing has force** | Impact without contact drawing, dust or sound; no receiver reaction | Add a contact drawing, a held compression drawing, dust, shadow, receiver recoil | `anim-impact` |
| **Prop floats / drifts** | Not parented to the paw | Parent it to the hand with a grip offset | `anim-contact` |
| **Limb inside furniture** | Pose ignores set geometry | Use seat poses, tail colliders, move the path | `anim-contact` |
| **Twinning** | Same timing and gesture across characters | Offset starts 0.2-0.5 s, different gesture each | `anim-acting` |
| **Late or wrong mouth** | Cue shorter than a drawing, lead too small | See `speechShape` in `v5/performance.js` | `anim-faces` |
| **Dead pose** (all weight even, arms down) | No line of action or asymmetry | Lean, one arm busy, weight to one leg | `anim-body` |
| **Pasted on the set** | Wrong light record or no contact shadow | Fix the set's light in `reference-v3/lighting.js`; contact shadow in `look.js` | `anim-world` |

## Method for every fix
1. See it: `strip.cjs` on the moment.
2. Change one thing; keep the old value in your notes.
3. Re-run `verify-motion.cjs` and the episode check; look at the strip again.
4. One line in `HANDOFF.md`. Never run a full render to judge a fix: stills of the affected drawings only.
