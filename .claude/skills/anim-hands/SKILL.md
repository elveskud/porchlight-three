---
name: anim-hands
description: Paws and hands for Porchlight - gestures, grips, pointing, waving, reaching, holding and handing over props, switches, doors and the phone. Use when hands look dead, grip wrong, props float, a reach misses, or a gesture is flat.
---
# Hands and paws

## Tools that exist
- **Gestures** (`art/three/animation/v5/performance.js`, the `ACTIONS` set): gloom, present, point, hips, nod, nervous, laugh, chuckle, wave, shrug, facepalm, munch, stare, count, thumbs, chin, lean, slouch. Hand shapes there: `open`, `relax`, `point`, `grip`. Arms use `aLo/aRo` (out), `aLf/aRf` (forward), `aLb/aRb` (bend), `aRw` (wrist wave).
- **Interactions** (`art/three/animation/v3/interactions.js`, still the one to use): `shapeHand(r, side, kind, amount)`, `reachContact`, `hold`, `twoHanded`, `transfer`, `placeOnSurface`, `knock`, `followHinge`, `pickupArc`, `adjustGrip`, `heldLag`, `reachable`, `cameraAwareHands`.
- **Grips** (`grips` table): phone, pencil, cup, notebook, clipboard, door, open. Each is `{curl, thumb, wrist}`. Add a kind by adding a row, not a function.

## Rules that make hands read
1. **Fingers lag, one after another.** `shapeHand` delays each finger by 0.035 s. Keep it. A hand that closes in one drawing looks like a switch.
2. **Anticipate every gesture.** Wind up (hand goes back or down) 4-6 drawings, gesture, overshoot, settle (`overshoot()`). Gestures use either hand; do not always use the right.
3. **Different hands, different jobs.** One busy, one relaxed. Both doing the same thing = twinning (`anim-acting`).
4. **The wrist leads, the fingers follow**, the fingertips settle last. A pointing finger reaches full point after the arm stops.
5. **Show the silhouette.** An open hand against the body disappears. Hold gestures away from the torso, hand against background (`cameraAwareHands` widens the hand toward the camera by up to 7%).
6. **Rest hands are alive.** Relaxed hands are never fully open or fully closed; curl 0.1-0.3, tiny drift.
7. **Gestures land on the stressed word**, hold about 0.3 s, then drop before the line ends. A gesture held through a whole line looks stuck.

## Reaching, touching, pressing
1. Check `reachable(r, side, target)` first. If false, move the actor or change the pose, not the arm length (reach limit is about 1.035 x body scale).
2. Anticipation, reach (`reachContact` with `amount` 0 to 1), **contact for at least 2 drawings**, release, return.
3. The body helps: a reach for something far leans the torso and shifts weight (`anim-body`, `anim-contact`).
4. Eyes go to the target 2-3 drawings before the hand (`anim-faces`).
5. Pressing a switch: the paw touches, the switch moves on the next drawing, then the light/sound. Cause before effect, in that order.
6. Knocking: use `knock` (3 taps, hand moves in and out about 0.09).

## Holding props
- Always `hold()` (parent to the wrist). Never put a held prop in world space.
- Choose the grip kind first. `adjustGrip` makes a small re-grip (a tiny open and close with a thumb shift) at moments when a held thing gets re-settled: use it during a long hold.
- `heldLag` swings a prop slightly against acceleration (limit 0.018 for a cup, 0.06 for others). Cups and liquids must not slosh much.
- Two hands: `twoHanded`, width about 0.52.
- Handing over: `transfer` (arc 0.10) or `placeOnSurface` (small settle bounce at the end); both hands touch the object for 2 drawings.
- Eating (chips): `munch`; hand to mouth with a pause at the mouth, not a constant speed.

## Phone
Thumb moves, wrist tilts, eyes flick between phone and the person. Riot reads cards off his phone: head tips down, eyes lead, phone stays still and the thumb works. Screen is not shown unless the story needs it.

## Check
`closeup.cjs` on the hand; `strip.cjs` across the reach. Look for: finger lag, a contact hold, no floating prop, a different pose for each hand.
