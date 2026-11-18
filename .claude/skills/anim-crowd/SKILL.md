---
name: anim-crowd
description: Extras, crowds and background characters for Porchlight - families, relatives, groups at the lake or park - with individual timing, life without stealing focus, and no twinning. Use when background people look like clones, stand like statues, or distract from the main acting.
---
# Crowd and extras

## How Ep 4 does it (`comparisons/episode04/source/crowd.js`)
- Six relatives, each an individual: own size (0.62-1.10), hoodie colours via `retint`, an accessory (cap, bow, pigtails, glasses, bun, tuft, moustache), a home position in a loose group beside the tables, **not** inside them.
- Each one acts on **their own cycle** (`crowdActs(p, k, t, small)`): wave, cheer with a hop, laugh, whisper to a neighbour, point. They face the speaker (`yaw = clamp(-pos[0]*.05, -.4, .4)`). All pure functions of time.
- Same rig as the cast (`makeActor('bash')` re-tinted), so squash, secondary motion and feet planting work.

## Rules
1. **No two people alike**: different size, colour, timing and action. Offsets of different seconds, different periods (3.8-6.8 s works for idle). Seed variation with `hash01(id, n)`.
2. **Focus first**: background motion is quieter than the main acting. Smaller amplitude, fewer gestures, slower cycles. React **after** the main character, never before.
3. **Always doing something small**: shift weight, glance, scratch, whisper. A statue crowd is dead (the user said the extras "don't move much").
4. **Reactions as a wave**: when something big happens, the crowd reacts in a ripple from the nearest to the farthest, 0.1-0.4 s apart, not at once. Not everybody reacts equally (`groupReaction` in the shared secondary module).
5. **Faces turn toward the point of interest** with different delays; some look at the speaker, some at each other.
6. **Size and depth**: nearer = bigger and lower, further = smaller and higher (`anim-staging`). Kids are about 0.62-0.66, adults 0.92-1.10.
7. **Silhouette variety**: mix tall and short, hats and no hats, wide and narrow, so the group reads as people at a glance.
8. **Edges of frame**: crowd members enter and leave off-screen only. Nobody pops in the middle (Ep 4 review).
9. **Hops and cheers** use `anim-physics` (same `g` as the main cast, lighter people hop higher) and land with `anim-impact`.
10. **Kind**: laugh with, never at. Extras are never the butt of a joke.

## Adding or changing a crowd member
1. Add a row to `KIN`: `id`, `size`, `hoodie [main, dark]`, `extra(r)`, `home [x, y, z]`.
2. Give them an action cycle with its own period in `crowdActs`.
3. Check overlap with set pieces and with each other (`closeup.cjs`, `preview.cjs`).
4. Cheap crowd for very far shots: fewer drawings (use the fast/slow windows) rather than fewer people.

## Check
Stills at three different times: positions differ, no two have the same pose at the same time, nobody is clipped by a table, and the main character still wins the eye.
