---
name: anim-comedy-timing
description: Physical comedy and comic timing for Porchlight - pauses, takes, reactions, running gags, silent beats, kind humor that laughs with the characters. Use when a joke does not land, a reaction is too fast or slow, or when writing and staging a funny moment.
---
# Comedy timing

Project rule: **laugh with, never at.** No cringe, sarcasm or romance. Funny comes from character and surprise, never from humiliation.

## The beat structure of a joke
1. **Setup**: clear and short. The audience must know what to expect.
2. **Pause** (the unspoken beat): 0.3-0.6 s of nothing. A silent beat (`NAME: ...`) is longer (about 36 frames in the old engine).
3. **Turn**: the line or the action that breaks the expectation.
4. **Reaction**: starts 8-14 frames **after** the punchline, not on it. Let the audience laugh first.
5. **Hold**: the face holds the thought for 8-14 frames. The hold is the joke.
6. **Release**: move on only when the laugh would fade. Never step on a laugh.

## Takes (`squash.js` already has them)
- Single take: head stretches (+16%) for 3 drawings, holds, squashes back (-6%). Triggered by `shocked` or `yelling` faces.
- Double take: look away about 10 frames, snap back in 4, bigger than the first.
- Slow burn: no movement, then the eyes move first, then the head, then the body (`anim-faces`).
- Keep takes **rare**. The third one in a scene is not funny.

## Physical timing
- **Rule of three**: twice at the same speed, the third one different (earlier, later, bigger, or missing).
- **Anticipation before the surprise**: a tiny wind-up tells the eye "now".
- **Contrast**: a still, calm character next to a chaotic one. Who reacts, who does not, is the joke.
- **Speed**: panic runs fast and silly (run cadence 4.7 steps/s, quick arms); deadpan is slow and still.
- **Over-correction**: a character stops too late, steps back, steps forward again. Use `overshoot`.
- **Prop gags**: a prop does the unexpected for one drawing only, in a clear silhouette. Cause, then effect, then the face.

## Characters, so the same joke is never told the same way
- **Riot** reacts fast and big, talks with his hands, plans out loud.
- **Rocco** slow, slouched, deadpan: the long pause is his.
- **Bash** is big and soft, warm; his reaction is physical and generous.
- **Pip** is quick, light and bouncy: smallest body, biggest reaction.
See `anim-acting` for signatures and `docs/VOICE_SHEET.md` for how they speak.

## Listeners
A listener reacts to the joke with their own face; the speaker does not look at the camera for approval. Never have two characters react in unison (`anim-crowd`: ripple).

## Kind, not mean
- The butt of the joke is the situation, never a person's body, accent, or fear.
- If someone is embarrassed, a friend steps in or laughs **with** them in the next beat.
- No sarcasm: a joke is never "you're stupid"; it is "oh no, we did that".
- Check against `BIBLE.md` and the secret rule: fans must not solve the secret before the finale.

## Check
Read the scene aloud with the pauses. Count the frames between punchline and reaction (8-14), and between reaction and next line. Take a strip at the take: stretch, hold, squash, in that order. If it does not make you smile in rough stills, change the timing, not the joke.
