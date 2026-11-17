# Episode 4 cast and motion additions

This version retains the earlier articulated cast, blended speech, acting profiles and deterministic posing, and adds five characters using these existing sheets:

| Actor ID | Reference | Modeled details |
|---|---|---|
| `preston` | `art/gemini/characters/06_preston.jpg` | Turquoise peacock, cream beak, crest, white suit/pink tie and layered volumetric eye feathers |
| `marlo` | `art/gemini/characters/07_marlo.jpg` | Gray mouse, round ears, dark suit/burgundy tie, thin tail and clipboard grip |
| `mayor` | `art/gemini/characters/05_mayor.jpg` | Gray cat, pointed ears, navy skirt suit, pearls and red/gold sash |
| `bashmom` | `art/gemini/characters/12_bashs_mom.jpg` | Warm brown bear, red dress, floral apron and wooden spoon |
| `hiker` | `art/gemini/characters/14_hiker.jpg` | Human face/beard, wool hat, red jacket, gloves, boots, green backpack and purple bedroll |

`makeActor(id)` produces a seekable articulated rig. `applyActor` resets leg, jaw and accessory state before posing. `performance.js` extends the character timing profiles. `locomotion.js` preserves world foot anchors and explicitly records gait cycles; it lowers the pelvis only as far as an analytic reach constraint requires for the current targets. The Episode 3 v3 files remain unchanged.

The episode’s six bear relatives reuse the bear rig with distinct shirt colors, sizes, positions and blink offsets. The opening lifeguard outfit and saved props are constructed by the Episode 4 adapter.

[Episode 4 production guide](../../../../comparisons/episode04/README.md) · [Orbit the scenes](../../../../comparisons/episode04/source/render.html?inspect=1&time=90)
