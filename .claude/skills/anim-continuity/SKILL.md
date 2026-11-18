---
name: anim-continuity
description: Continuity across cuts, scenes and episodes for Porchlight - positions, facing, poses, props, costumes, light and time of day staying consistent, plus the series rules that carry over. Use when reviewing a cut, adding a scene, porting a shot, or when something "jumps" between shots.
---
# Continuity

## What must carry across a cut
| Thing | Rule |
|---|---|
| **Screen side** | Same character on the same side of the frame within a scene (180-degree rule, `anim-staging`). |
| **Position in the set** | Seats, spots, and distances stay the same. Seat heights live in `comparisons/episode04/source/sets-v5.js`; reuse them. |
| **Facing and eyelines** | If Riot looks right at Bash, Bash looks left at Riot in the reverse shot. |
| **Pose** | A character cut to from another angle is mid-action, not reset to idle. Cut on action. Same gesture hand, same prop in the same hand. |
| **Props** | What is in a paw stays in that paw until it is put down on screen. Phone, chips, flashlight, cup. |
| **Costume** | Hoodie colours, caps and accessories do not change; retints belong to the actor (`retint`). |
| **Light** | The same set record in `reference-v3/lighting.js`; time of day, pools and shadows match in every shot of a scene. |
| **Time and weather** | Day, sunset and night are separate sets (`stoop_sunset`, `stoop_night`, `lake_night`). Do not mix them inside a scene. |
| **Sound** | Footsteps by surface, room tone per place (a sound note for the sound pass; not changed here). |

## Between scenes
- **Entrances and exits** from off-screen only. If a character leaves screen right, they enter the next place from the left (or arrive already in it with a time cut).
- A new place gets an **establishing shot** (`anim-staging`). Keep the first scene full of life (Ep 4 review: backgrounds must always feel full).
- **Match cuts** when someone carries over: same pose, new place.
- **Time jumps** are marked by light and an establishing shot, not by a caption.

## Across episodes (series continuity)
- **Reuse versioned modules**; do not rewrite finished ones. Current: `art/three/animation/v5`, `art/three/illustrated/reference-v3`, template `comparisons/episode04/source/episode-v5.js`. Older builds (Eps 1-3) stay as they are; the user said **do NOT port Ep 4 changes to Episodes 1 and 2** (17 Nov).
- **Characters are the code-drawn cast.** Same rig, same proportions, same weight values (Bash 1.35, Riot 1.0, Rocco 0.9, Pip 0.75), same signature acting.
- **Series rules** (from `CLAUDE.md`): all four friends are boys; laugh with, never at; Friendzy natural and real; fans must not solve the secret before the finale; the **porch light clicking off ends every episode**; voices never change per episode.
- Facts from earlier episodes live in `BIBLE.md`, `STORY_MAP.md` and `DECISIONS.md`. Check them before using a name, place or fact.

## Common continuity errors
| Error | Cause | Fix |
|---|---|---|
| Character jumps seat on a cut | each shot sets its own position | one position record per scene |
| Prop changes hand | each shot sets it separately | decide hand once per scene |
| Different light in a reverse shot | wrong set record | same `light` key for the whole scene |
| Eyeline wrong | look target missing or flipped | use `to` / `look` in the script |
| Facing jumps | turn starts too late | `preTurn` and `yawAt` (`anim-locomotion`) |
| Character pops on screen | entrance not from off-screen | change the path start in `prepare.py` |

## Check
Put two adjacent shots side by side (`stills.cjs` at the cut time minus and plus one drawing). Same side, same pose family, same prop, same light, same place. Fix by data first (script or episode JSON), engine last (`anim-fix-recipes`).
