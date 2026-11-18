---
name: anim-props-and-fx
description: Props and effects for Porchlight in the painted style - dust, splashes and ripples, glints, flashlight beams, fireflies, light switches, set life like swaying plants and twinkling bulbs. Use when adding or fixing a visual effect, a moving prop, or set atmosphere.
---
# Props and effects (painted style)

## What exists
Per `docs/ANIMATION_TODO.md` (done items): dust at the feet on hops, takes and cheers (coloured by the surface); footprints on sand; cushion hollows; the bobbing duck with ripple rings; water glints; twinkling bulbs; fireflies; swaying plants; whistle and phone glints; brass porch light glowing with the lamp; flashlight beam and spot following a path; leaf-shadow "dapple". Not done yet: leaves reacting when brushed, lake reflections, fan, clouds.
Helpers: `art/three/illustrated/reference-v3/look.js` (accents, contact shadows), `comparisons/episode04/source/props.js` (`box`, `ball`, `line`), `settleObject`, `transfer`, `rollingCube` in `art/three/animation/v3/interactions.js`.

## Rules
1. **Pure functions of time**, quantised to the drawing (`sampleClock`). Never use random per frame; use `hash01(name, n)` for seeded variation.
2. **Painted, not simulated**: simple flat shapes with ink and the set's light. No glossy particles, no bloom, no real-time smoke (`anim-ink-and-paper`).
3. **Fast in, slow out**: effects pop on the contact drawing, expand quickly, then fade slowly. A puff expands for 3-4 drawings and lives for 8-12.
4. **Cause first, effect after**: switch moves, then light turns on, then the sound (the porch light clicking off ends every episode, so give that moment the best timing: a held beat, the click, the dark, then the next shot).
5. **Light effects light things**: a flashlight cone lights what it touches in dark sets; a lamp's glow pool follows `pool` in `lighting.js`. Emissive names in `look.js` (`moon`, `star`, `bulb`, `fairy light`, `distant flashlight`) are not shaded.
6. **Surface colours**: dust takes the floor colour (sand, wood, stone, grass). Splashes take the water colour with white tips.
7. **Keep life quiet**: set life should never be louder than the acting. Small amplitude, slow periods (2-6 s), different phase per object.
8. **Hierarchy**: contact shadow, then dust, then ripples, then glints. Add only what the shot needs.

## Recipes (numbers to start from)
| Effect | Shape | Timing |
|---|---|---|
| Dust puff | 3-5 small flat ovals | out 3-4 drawings, fade 8-12, rise slightly |
| Landing | contact shadow grows before, flattens on contact | 2 drawings before contact |
| Ripples | 2-3 expanding rings, ink thin | radius up 0.6 per second, fade over 1.2 s |
| Glint | small star shape | 2 drawings on, 2 off, only when the angle is right |
| Fireflies | small warm dots with slow wandering sine | period 3-7 s each, blink 0.4 s |
| Plant sway | rotate leaves/branches about the base | period 3-5 s, amplitude 2-4 degrees, phase per plant |
| Light switch | toggle moves 1 drawing | light changes on the next drawing; click sound on the same one |
| Footprints | flat oval at each landing | stay for the shot; fade only if long |

## Props that move
- Parent to hands (`hold`), tables or the world; never leave them floating.
- Falling or thrown: `anim-physics`; bounce settles with `settleObject` (height 0.04, damping 8, frequency 15 by default).
- A prop used by two people: both hands touch for 2 drawings (`anim-hands`).

## Check
Stills of every drawing around the effect: it starts on the right drawing, uses the set's colours and light, and disappears cleanly. Compare with the painting (`compare.py`) when a set's light matters.
