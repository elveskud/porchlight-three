# Card: add a character (visual + acting)
Characters share one rig. A new one = an existing rig, recoloured and dressed, plus a performance profile. **Do not edit the finished modules** (`animation/v3`, `v4`): register the new one from v5.

## Steps
1. Reference: the character sheet in `art/gemini/characters/NN_name.jpg` (user's picture). Pick the nearest existing actor as `base` (`bash` bear, `riot` fox, `pip` rabbit, `rocco` raccoon, `preston` peacock, `mayor` cat, `marlo` mouse, `hiker` human).
2. Create `comparisons/episodeNN/source/characters.js` (or any file the driver imports):
```js
import {registerCharacter} from '../../../art/three/animation/v5/cast.js';
import {box, ball} from './props.js';          // helpers: box(parent,name,color,[x,y,z],[sx,sy,sz]), ball(...)
registerCharacter('walt', {
  base: 'riot',
  profile: {amp: 0.6, delay: 0.25, tilt: 0.02, tempo: 0.9, breath: 1.2},   // amp 0.3 quiet .. 1.1 big gestures
  extend: (r) => { r.refined.body.material.color.set(0x7a8a5a); ball(r.head, 'cap', 0x44506a, [0, 1.12, 0], [.7, .4, .5]); },
});
```
   Look at `art/three/animation/v4/cast.js` `extend()` for how Preston, Marlo, the Mayor are dressed (flatShape, line, spectacles).
3. In the driver: `import './characters.js'` before `makeActor('walt')`; add the id to the actor list; place with `put('walt',[x,y,z],t,b)`.
4. Voice: `voice-new-character` card. Roster for the checker: `tools/check_scripts.py` `CHARACTERS`.
5. Look: `stills.cjs` at three times; the character must read as itself in the sheet's colours and keep the cast's outline style.

## Files to touch
New `characters.js` in the episode's `source/`; the driver; `tools/check_scripts.py` (`CHARACTERS`); never `v4/cast.js`.

## Do NOT read
`art/three/characters/cast.js` (the 30 KB base rig) unless a body part must change; `art/three/animation/v3/*`.

## Check
`node tools/three-sets/verify-episode04-v5.cjs` PASS; actor id is accepted by `validateTimeline` (a speaker with no actor throws a clear error).
