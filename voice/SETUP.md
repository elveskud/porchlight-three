# Voice pipeline setup (not installed in this copy)

The scripts and base voices are here; the Python environment and models were left behind (about 2 GB). Existing voiced lines for episodes 1–4 are already in `comparisons/episode0N/assets/vo/`, so nothing needs installing until you voice a new episode or character.

## Install (Apple Silicon Mac)
1. `cd voice && python3 -m venv .venv && source .venv/bin/activate`
2. `pip install "setuptools<81" torch torchaudio chatterbox-tts kokoro-onnx soundfile numpy` (the Chatterbox watermarker imports `pkg_resources`)
3. Kokoro models (`kokoro-v1.0.onnx`, `voices-v1.0.bin`) go in `voice/kokoro/`. Download from the kokoro-onnx project releases.
4. Faster-whisper for the check: `python3 -m venv .asr-venv && .asr-venv/bin/pip install faster-whisper`.
5. Rhubarb is in `tools/rhubarb/` (x86 build; needs Rosetta: `softwareupdate --install-rosetta`).

## Files
- `speak.py`: per-character pitch/exaggeration (never change per episode); clones `refs/<who>.wav`.
- `make_refs.py`: creates a base voice with Kokoro (Kokoro ids per character are in `DECISIONS.md`).
- `check_voices.py`: listens to the finished lines and flags garbled ones.
- `refs/`: the 19 base voices.

Caveat: the scripts were written for the old layout and may expect `Blender/` paths when run end to end; fix on first use and note it in `HANDOFF.md`.
