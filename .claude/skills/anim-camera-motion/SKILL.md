---
name: anim-camera-motion
description: Camera movement for Porchlight - push-ins, pans, drifts, close-up cuts, flatter lens, parallax and framing during motion, in the painted storybook look. Use when camera moves feel mechanical, shaky, too fast, pointless, or when planning how the camera moves inside a beat.
---
# Camera motion

`anim-staging` decides **which shot**. This skill is how the camera **moves**.

## How the camera works in the template build (`comparisons/episode04/source/episode-v5.js`)
- Each beat sets the camera: `setCamera(camera, [x,y,z], [tx,ty,tz], fov)`, then a few beats drift with time (for example `11.5 - l*.03`). Typical fov 37-50.
- Exterior shots get a **flatter lens**: `look.flatten(camera, target, 1.3)`: longer lens, camera farther back, same framing, which reads like a painted plate. Interiors skip it (the camera would back through the wall).
- **Close-up cuts** come from `timeline.cuts` (`prepare.py`): the camera moves to the speaker's head (+0.28 up), fov 30, distance `c.dist`, then the wide shot returns. A few motivated close-ups are wanted (user, 17 Nov), not many.
- Every camera value is a pure function of time (seek-safe). Never accumulate camera state between frames.

## Holds first
Hold group shots through dialogue (project rule). The default camera does almost nothing. Movement is a choice.

## Moves and numbers
| Move | When | Numbers |
|---|---|---|
| Slow push-in | quiet line, a thought, a secret | 3-8% closer over 4-10 s; or fov down about 2-4 |
| Slow pull-back | after a laugh, loneliness, ending | same speed as push-in |
| Drift | alive wide shot | about 0.03 units per second sideways, never more |
| Follow pan | a walk or a run | lead the actor slightly (a little space in the direction of travel); start after they start, stop after they stop |
| Reveal pan | new place | start on something small, end on the wide |
| Insert | a prop (the notice) | close, flat, 1.5-3 s, camera still |
| Snap-in | a shout | cut, not move |

## Rules
1. **Motivated**: follow action, reveal, or intensify feeling. No move for decoration.
2. **Ease in and out** (`ease`). A linear start looks like a machine. Painted look: moves can be held on twos like everything else (the camera also uses drawn times, not smooth 24 fps).
3. **Do not move and cut together.** Cut on a still camera or on action.
4. **No shake**, no handheld jitter. It breaks the painted storybook feel. A tiny slow drift is the only "alive" camera.
5. **Speed**: a pan across the frame in under 1.5 s smears; a push-in faster than 8% in 2 s feels like a snap. Fast moves are for jokes.
6. **Frame the action, not the middle**: leave room in front of looking characters (eyeline) and in front of walkers.
7. **Edges**: characters enter and exit from off-screen (a rule from the Ep 4 review). Check the edge before the move starts.
8. **Heads**: eyes about one third from the top in close shots. Never crop at joints.
9. **Parallax**: a move should show depth: near props and far trees shift at different rates. If everything slides together it feels flat (`anim-world`).

## Close-up cuts
Choose the line the audience feels, hold the face for the line and one beat after. Cut back on action or on a reaction. Keep the 180-degree side (`anim-staging`). The cut distance `dist` and fov 30 are the house numbers.

## Check
`stills.cjs` at 4-8 drawings apart inside the move. The move should look smooth on twos, the subject should not leave the safe area, and the headroom must hold across the move.
