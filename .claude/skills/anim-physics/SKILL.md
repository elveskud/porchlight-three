---
name: anim-physics
description: Believable gravity, arcs, hops, jumps, throws, falls and weight for Porchlight, written as seek-safe closed-form motion. Use when anything leaves the ground, flies, drops, or feels floaty or weightless.
---
# Physics that reads (seek-safe)

**Rule zero: every motion is a pure function of time.** The renderer jumps to any frame, so never integrate frame by frame or keep state between frames. Use closed forms of `age = t - start` (like `overshoot()` in `art/three/animation/v5/math.js`). Drawings are held on twos (12 per second), so the physics must read at 12 drawings a second.

## Pick the arc by hang time, not by gravity
Choose how long it is in the air (`T`, seconds) and how high it goes (`h`, world units). Then `g = 8h / T^2`, and height at age `a` is `y = 4h * (a/T) * (1 - a/T)` for `0 <= a <= T`. This is one parabola and needs no units to be right.
- Small friend hop: `T` 0.45-0.55 s, `h` 0.10-0.18 (leg is about 0.55 long, so a hop is a fraction of a leg).
- Big jump or startle: `T` 0.6-0.8 s, `h` 0.25-0.40.
- Falls under gravity only: `y = y0 - 0.5*g*a^2`; time to fall `sqrt(2*d/g)`. Use the same `g` as the hops in that scene.

## Weight changes the numbers (roster weight: Bash 1.35, Riot 1.0, Rocco 0.9, Pip 0.75)
| | light (Pip) | heavy (Bash) |
|---|---|---|
| hang time | longer, floats up | shorter, same `h` is hard work |
| height | higher for same effort | lower |
| crouch before | short, quick | deep, slow |
| landing squash | small, springs back fast | deep, slower recovery (see `anim-impact`) |
Never give Pip Bash's timing. Same `g` for everyone in a scene; the character's effort changes `h` and the crouch.

## Phases of any jump (spend frames where the eye looks)
1. **Anticipation**: crouch 0.15-0.25 s, body down 6-10%, arms back.
2. **Launch**: stretch up 6-12% over 1-2 drawings. Feet leave on the same drawing the stretch peaks.
3. **Apex**: slowest part. Hang a drawing or two longer here (ease out of the parabola naturally gives this). Pose changes happen at apex, not on the way up or down.
4. **Fall**: accelerating. No slow-down before the ground.
5. **Landing**: contact on one exact drawing, then squash (`anim-impact`), then settle with `overshoot()`.
Arms and ears lead by 1 drawing on the way up and drag 1-2 drawings on the way down (`anim-secondary`).

## Thrown or dropped props
- A thrown thing moves in a straight line horizontally at constant speed and follows the parabola vertically. Put the sound and any dust on the landing drawing.
- Spin: constant angular speed, ends flat when it lands. Do not let it spin faster as it falls.
- Hits and bounces: each bounce keeps about 50-60% of the previous height and 70-75% of the previous hang time. Stop after 3 bounces and settle.
- Light things (paper, a leaf) fall slower with sideways drift: sine sway on x with a slow period (about 1 s), never a straight drop.

## Energy and momentum
- Anything fast stops late: a run does not end in one drawing (`gait_plan.py` plans the stop; the body leans into it and drags ears and tail).
- A heavy hit pushes the lighter one further and faster. Bash bumping Pip: Pip moves about 1.8x as far.
- Pushing, pulling, carrying: the body leans into the force, feet planted wider, move is slower for heavy loads.

## Hooks in this codebase
- Hop height reaches the actor as an added root height; `stand(r, () => pos[1] + hop, ...)` in `comparisons/episode04/source/episode-v5.js` keeps feet on the ground while airborne. Feet leaving the ground must come from the root, not from a leg stretch.
- If a new jump needs engine code, copy the pattern in the template driver and add it in `v5` (never edit v3 or v4).
