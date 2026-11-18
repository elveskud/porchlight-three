---
name: anim-secondary
description: Secondary motion for Porchlight - follow-through, overlapping action, springs and damping for ears, tails, clothing, hair, strings and loose props. Use when parts look stuck to the body, move all at once, or when adding any jiggle, swing or drag.
---
# Secondary motion (follow-through, overlap, springs)

Primary motion is what the body does. Secondary motion is what loose parts do **because** of it. It is what makes weight and speed readable.

## How the engine does it (`art/three/animation/v5/secondary.js`)
`followThrough(r, pose, t, {speedNow, speedBefore, seated, colliders})`
- `drag = clamp((speedBefore - speedNow) / 2.5, -1, 1)`: positive when slowing (a stop), negative when speeding up. The driver passes the speed `lag` seconds earlier, so the result stays a function of time only (seek-safe).
- Ears tilt by `drag * 0.22` and wobble with speed; the tail swings `drag * 0.35`, falling off along the chain (`exp(-i * 0.18)`), so the tip lags most.
- Clothing hems flap with speed and trail after a stop.
- Breathing is a tiny sine on the spine scale (0.35%).
If ears and tail look dead, the driver is not passing `speedBefore` (see the card `fix-animation-problem`).

## Rules that make it read
1. **Lag**: loose parts start late and stop late. Root of the part moves first, the tip last. Each joint down a chain lags about 1 drawing more.
2. **Overshoot**: after a stop, the part swings past, comes back, settles. Use `overshoot(age, peakTime, damping)` from `math.js`: `damping` 0.45 is a gentle bounce (about 20%), 0.3 a lively one (about 37%), 1 none.
3. **Different parts, different speeds**: ears are light and quick (peak 0.12-0.18 s), the tail is longer and slower (0.2-0.3 s), a floppy hem slower still. If everything swings together it looks like one block.
4. **Decay**: three visible swings at most, each smaller. A part that wobbles forever looks broken.
5. **Direction**: parts trail opposite to the acceleration. Body goes right fast, ears and tail trail left. When it stops, they carry on right.
6. **Amount**: bigger and lighter things move more. Pip's ears move more than Bash's. Fur and cloth that are too busy compete with the face.
7. **Held poses**: on a held drawing, secondary motion may keep moving (held on twos). That keeps a hold alive without changing the pose.

## Springs, closed form
For something that must react to a hit at `t0` with strength `k`: `offset = k * (1 - overshoot(t - t0, peak, damping))`. This starts at `k`, swings through zero, and settles. Add it to the rest rotation of the part. Never integrate a spring per frame.

## Chains (tail, strings, scarves)
- Phase offset per link: `sin(t * w - i * 0.5)`; amplitude falls off per link, or grows toward the tip for whips.
- Idle: slow low-amplitude sway (`moving * 0.03 * sin(t * 4.5 - i * 0.6)`) so even a standing tail is alive.
- Seated: pin the first tail bone (it is set in code per character), let the rest follow.

## Faces count too
Eyes and brows overlap the head turn: eyes lead by 2-3 drawings, head follows, ears last. Blinks hide pose changes (`anim-faces`).

## Check
`strip.cjs` on a stop or turn: ears and tail must be at different phases, and settle within about 0.7 s. If they are in sync, change the peak time of one.
