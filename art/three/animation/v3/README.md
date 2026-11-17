# Reusable Three.js animation, version 3

[100-item implementation register](IMPROVEMENTS.md) · [Silent motion viewer](../../../../comparisons/episode03/source/render.html?library=1) · [Episode 3 production guide](../../../../comparisons/episode03/README.md)

The viewer contains 24 selectable actions across Riot, Rocco, Bash, Pip, Mr. Hoot, Gus, Dot and Mrs. Brook. Select an action and actor, press Play, or drag the time slider. These are editable examples outside story canon.

## Module responsibilities

| Module | Saved behavior |
|---|---|
| `cast.js` | Versioned rig construction, new cast details, absolute pose resets, jaw and facial deformations |
| `performance.js` | Character timing profiles, emotion persistence, anticipation, speech energy/visemes, blinks, gaze and drawing clock |
| `locomotion.js` | Distance-driven paths, ground samples, planted two-bone leg IK, sole roll, pivot, sit/rise/crouch |
| `interactions.js` | Grips, reaches, holding, transfer, two-handed notebook, knob/drawer following, cube-edge roll, prop lag |
| `secondary.js` | Volume-preserving breath/squash, ears/tails, clothing hems, sampled furniture collisions, cushion response, group reactions |
| `direction.js` | Deterministic framing, head envelopes, authored camera motion, projection and cut helpers |
| `library.js` | Seekable demonstration stage, props, controls and 24 authored example clips |

## Reuse contract

All poses start from rest and evaluate absolute scene time. Never integrate movement from a previous frame. Reset actor pose before solving legs or reaching; apply the illustrated look before secondary deformation. Interactive props reset canonical world scale when changing parents. Save time, distance, target and contact clocks with the episode timeline.

`gait(path,t,{run,ground})` uses the path’s points, start/end, stride and width. Supply a ground-height sampler for slopes. `applyGait` solves feet from that result. `pivotTurn` keeps the left foot fixed while rotating the body. `reachContact` targets a world-space paw position with a bounded analytic arm solve; stage props within reach. `seatResponse(mesh,weight)` compresses a cushion from a cached rest shape and returns exactly to rest at zero weight.

For sound, derive contact times from the same eased path distance; do not time footsteps from an unrelated loop. Regular drawings are held at 12 fps, with explicit 24 fps action windows, inside a 24 fps movie.

The current motion library uses Episode 3’s viewer/bootstrap and prop constructors; it is a project module, not an independently packaged npm library. Earlier episodes remain available with their own source versions. Technical reports are saved alongside Episode 3. The examples are ready for the user’s artistic review.
