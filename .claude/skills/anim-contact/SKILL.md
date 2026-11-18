---
name: anim-contact
description: Contact and attachment quality for Porchlight - planted feet that never slide, sitting and standing, hands on props, objects that stay in paws, nothing passing through furniture or other bodies. Use when feet slide, props float, limbs clip, or characters look pasted on the floor or seat.
---
# Contact (feet, seats, hands, props)

## Feet
- A planted foot is **locked in world space** from landing to takeoff. `verify-motion.cjs` fails a foot that moves more than 0.02 world units in one drawing (a leg is about 0.55 long).
- The foot plan comes from `pipeline/gait_plan.py` (Python writes the footsteps, JS plays them in `art/three/animation/v5/locomotion.js`: `footState`, `gait`, `solveLeg`, `applyGait`). Fix slides by fixing the plan (path length, speed), not by nudging feet in the driver.
- Standing: use `stand()` with `idleBalance()`. It plants both feet at rest spots and moves the pelvis over the support foot. Never animate the root to fake a weight shift, because that slides the feet.
- Ground height: pass a `ground(x, z)` function so feet follow steps, stoops and ramps. Heel lands first, toe leaves last (`roll` in `gait`).
- Contact shadow must exist under every standing foot (painted shadow in `reference-v3/look.js`). A shadow under a floating character is the fastest way to see a contact bug.

## Sitting and standing up
- Use `seatPose`, `settleSeat`, `risePose`, `crouchPose` (v5 re-exports the v4 ones). Seat heights are in `comparisons/episode04/source/sets-v5.js`.
- Sit: weight goes over the feet, hips drop back, hands touch the seat, then settle with overshoot. Never teleport the pelvis onto the seat.
- Stand: lean forward first, feet under the hips, push up, then straighten. The lean is the anticipation.
- The seat takes weight: cushion hollow under the sitter (`seatResponse` in the shared secondary module). Heavier characters sink more.
- Knees must clear the furniture. Check from the side with `closeup.cjs`.

## Hands and props
- A held prop is **parented to the paw**, never placed in world space. A prop that is "near the hand" will drift on a held drawing.
- Give the prop its own rest pose in the paw (grip point at the paw, not at the prop centre).
- A paw that reaches something (the porch light switch) must arrive on a drawing and then stay in contact for at least 2 drawings before it moves on. Anticipation, reach, contact, follow-through.
- Touching another character: both bodies react. The one touched moves a little (`anim-impact`), the toucher's hand rests on a real surface (shoulder, head), not in the air beside it.

## Clipping and collision
- Tail and ears: `followThrough(..., {colliders})` pushes the tail out of boxes (up to 4 attempts) and reports `tailCorrections`. Pass the furniture boxes for any seated actor.
- Two characters must not overlap. If paths cross, offset the paths in `prepare.py` or change who goes first.
- Arms against the body: keep a gap of at least a paw width unless it is a hug.

## Quick checks
1. `node tools/three-sets/verify-motion.cjs` (slides, pops, statue check).
2. `strip.cjs` around the contact moment: 16 drawings in a row. Look at the foot or paw only.
3. `closeup.cjs` from the side for sitting, hands and clipping.
