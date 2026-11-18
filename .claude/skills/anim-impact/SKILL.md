---
name: anim-impact
description: Impact, squash and stretch, anticipation and recoil for Porchlight, tied to force and weight - landings, bumps, flops, stops, takes and punch lines. Use when hits feel soft or rubbery in the wrong way, nothing seems to have force, or squash looks inflated.
---
# Impact and squash and stretch

## What the engine does (`art/three/animation/v5/squash.js`)
`squashAt(who, t, {paths, events})` returns `{body, head}` fractions (+0.1 = 10% taller). `applyBodyScale()` applies them to the spine and head **with volume kept** (`xz = 1/sqrt(y)`). Limits are `MIN 0.80`, `MAX 1.24`. v4 was clamped to 0.93-1.07, which is why nothing visibly squashed. Current terms:
- Before moving off: crouch -6%, then stretch +4% into the first step.
- Arrival: -7% (walk) or -11% (run), springing back with `overshoot(sinceEnd, 0.15, 0.38)`.
- `punch`: +7% then -5%. Take (`shocked`, `yelling`): head +16% then -6%, body +5% then -3%. `nod`: small head dip. `laugh`: 3 bounces a second.
To add a new impact, add a **term**, do not change the others.

## The shape of every impact
1. **Anticipation** (6-10 drawings of weight going the other way). The harder the hit, the bigger and longer.
2. **Contact**: one exact drawing. Sound, dust and the painted shadow land on this drawing.
3. **Compression**: hold 1-2 drawings at the deepest squash (the eye needs to see it).
4. **Recoil**: spring back past neutral (`overshoot`), then settle.
Force sets size: tiny bump 2-4%, normal landing 6-8%, hard landing or flop 10-14%, cartoon take up to 16-24% (the clamp stops anything beyond).

## Weight (roster: Bash 1.35, Riot 1.0, Rocco 0.9, Pip 0.75)
- Bash: deeper squash, slower recovery (higher damping, longer peak time), the floor takes it (cushion hollow, a little dust). Pip: shallower, springs back fast.
- Multiply the squash term by weight and the recovery time by weight, not the other way round.

## Keep it solid
- **Volume**: when height drops, width grows. Check `r.motion.secondary.volume` stays near 1 (the function writes it).
- **Feet stay planted** during a squash: the pelvis drops, the feet do not slide (`anim-contact`).
- **Stretch only in motion**, squash only at rest or contact. Never both on the same drawing.
- Do not squash every beat. A few big ones beat many small ones. Kind comedy: the character is surprised, never beaten up.

## Painted accents that sell force (look is painted storybook)
- Dust puffs at feet on hops, takes and flops, coloured by the surface.
- Contact shadow grows and darkens just before landing, flattens on contact, then returns.
- Cushion hollow on sofas and beanbags; footprints on sand.
- A short held "smear" drawing (stretched along the motion) is allowed on a very fast move, for one drawing only.

## Hits between characters
Mover: anticipation, contact, stops short. Receiver: moves after contact (1 drawing later), more if lighter, with its own squash and secondary motion. Both should show weight difference: Bash bumping Pip moves Pip further than Bash.

## Check
`strip.cjs` around the contact drawing; `closeup.cjs` for the take. Look for: a clear deepest drawing, a spring past neutral, no width pop, shadow and sound on the contact drawing.
