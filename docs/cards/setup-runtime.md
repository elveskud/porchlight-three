# Card: set up the runtime (once per machine)
Goal: Chrome renders, ffmpeg encodes, Python mixes sound. Mac, Apple Silicon.
Needs: Node 20+, ffmpeg (with libx264), Google Chrome, Python 3.11+.

## Commands (project root: `~/Desktop/Porchlight Three`)
```sh
cd "$HOME/Desktop/Porchlight Three"
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install          # Playwright; it drives the Chrome you already have
python3 -m venv --system-site-packages .venv-mix        # needs numpy, scipy, Pillow in system Python
.venv-mix/bin/pip install pyloudnorm                    # loudness mastering for the mix
node -e "console.log(require('playwright').chromium.name())"      # prints: chromium
.venv-mix/bin/python -c "import pyloudnorm, numpy, scipy; print('mix ok')"
```
If Chrome is not at `/Applications/Google Chrome.app`, set `CHROME_PATH="/path/to/chrome"` before any node command.
Voices (Kokoro + Chatterbox) are NOT needed to render: finished lines are in `comparisons/episode0N/assets/vo/`. Only for new voices: `voice/SETUP.md`.

## Files to touch
- none (this card only installs). `package.json` and `.venv-mix/` are ignored by git.

## Do NOT read
- `node_modules/`, `.venv-mix/`, `DECISIONS_FULL.md`, any episode source.

## Troubleshooting
- `Cannot find module 'playwright'` → run the npm line again from the project root (not from a subfolder).
- `externally-managed-environment` → you tried `pip install` globally; use `.venv-mix/bin/pip`.
- Rhubarb (`tools/rhubarb/rhubarb`) is an x86 binary: `softwareupdate --install-rosetta` if lip sync generation fails.
