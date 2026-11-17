#!/usr/bin/env python3
"""Make a throwaway copy of the project for the local model to work in: python3 tools/local-agent/make_scratch.py <dest>
Leaves out the big stuff (movies, wavs, painted plates, git). node_modules is linked, so Playwright still works."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dest = os.path.abspath(sys.argv[1]); os.makedirs(dest, exist_ok=True)
ex = ['*.mp4', '*.wav', '*.mp3', 'scenes/', 'art/hd/', 'art/parts/', 'art/refs/', 'art/gemini/', 'node_modules/', '.venv-mix/', '.git/', 'voice/.venv/', 'tools/rhubarb/', '__pycache__/', '*.jpg', 'docs/archive/', 'graphify-out/']
subprocess.run(['rsync', '-a', '--delete'] + [f'--exclude={e}' for e in ex] + [ROOT + '/', dest + '/'], check=True)
for link in ('node_modules', '.venv-mix'):
    src = os.path.join(ROOT, link); dst = os.path.join(dest, link)
    if os.path.exists(src) and not os.path.lexists(dst): os.symlink(src, dst)
os.makedirs(os.path.join(dest, 'comparisons/episode04/assets/v5'), exist_ok=True)
print(dest, subprocess.run(['du', '-sh', dest], capture_output=True, text=True).stdout.split()[0])
