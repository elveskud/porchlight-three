# Card: voice a new line for an existing character
Voices are generated locally (Kokoro base voice → Chatterbox clone). **Never change a character's settings in `voice/speak.py`.** Needs the voice venv (`voice/SETUP.md`, ~2 GB, not installed by default).

## Commands
```sh
cd "$HOME/Desktop/Porchlight Three/voice"
# 1. job file: [[line_id, character, text], ...]  e.g. /tmp/job.json  ->  [["s03_07","riot","We make the park so terrible."]]
.venv/bin/python speak.py /tmp/job.json /tmp/vo          # -> /tmp/vo/<line_id>.wav
# 2. put the text beside the wav so the checker can listen:  /tmp/vo/<line_id>.txt  =  first line speaker, second line the text
.asr-venv/bin/python check_voices.py /tmp --all           # needs /tmp/vo/*.wav + .txt; flags garbled lines, retake those
# 3. mouth track (lip sync), x86 build runs via Rosetta:
../tools/rhubarb/rhubarb -q -f json --extendedShapes GHX -d /tmp/vo/<id>.dialogue.txt -o /tmp/vo/<id>.wav.rhubarb.json /tmp/vo/<id>.wav
```
Then copy `<id>.wav` and `<id>.wav.rhubarb.json` into `comparisons/episodeNN/assets/vo/` named by event id (`s03_07.wav`), and run `prepare.py` of that episode (it reads `assets/vo/<event id>.wav`).

## Files to touch
- `comparisons/episodeNN/assets/vo/<id>.wav` and `.rhubarb.json` (new files only).
- Nothing in `voice/speak.py`.

## Do NOT read
`voice/refs/*.wav`, `voice/kokoro/`, other episodes' `assets/vo/`, `speak.py` below the CHARACTERS table.

## Notes
- One-word lines often come out garbled; the check listens and you retake (same text → same take, change one word of punctuation).
- Whisper style: add `quiet: true` in the script line (the mixer applies it).
- The user hears samples first for anything new (see `voice-new-character`).
