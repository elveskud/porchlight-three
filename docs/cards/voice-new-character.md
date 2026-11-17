# Card: give a new character a voice
Decision first: **play samples to the user and let them pick** (they picked every existing voice). Write the choice in `DECISIONS.md` log at once.

## Steps
1. Pick 3 Kokoro voices that fit (list in `voice/make_refs.py`: e.g. `am_*` boys/men, `af_*` girls/women, `bm_*`/`bf_*` British). Short reference passage in the character's personality (2 sentences).
2. Add an entry to `CAST` in `voice/make_refs.py`: `"name": ("kokoro_voice_id", speed, "reference passage")`.
3. Generate only the new reference (never regenerate the friends' refs):
```sh
cd "$HOME/Desktop/Porchlight Three/voice" && ONLY=name .venv/bin/python make_refs.py     # -> refs/name.wav
```
4. Add an entry to `CHARACTERS` in `voice/speak.py`: `"name": dict(pitch=0.0, exaggeration=0.5, cfg=0.5)` (pitch in semitones; exaggeration 0.25 calm .. 1.0 big; cfg lower = faster). Copy the closest existing character and nudge one number.
5. Add `"name": "Display Name"` to `CHARACTERS` in `tools/check_scripts.py`, so scripts with that speaker pass the checker. Write lines as `NAME (face): words`.
6. Voice 3 test lines (`voice-a-line` card), play them to the user, then `.asr-venv/bin/python check_voices.py <folder> --all`.
7. Performance profile (gesture size) is added with the character: see `add-a-character`.

## Files to touch
`voice/make_refs.py`, `voice/speak.py` (new entries only), `tools/check_scripts.py` (`CHARACTERS`), `DECISIONS.md`, `voice/refs/name.wav` (new).

## Do NOT read
Existing voice settings of other characters (do not change them), `voice/kokoro/*`, episode folders.
