#!/usr/bin/env python3
"""Put the painting and your renders side by side in one picture for review: python3 tools/three-sets/compare.py <out.png> <painting.jpg> <render1.png> [render2.png ...]"""
import sys
from PIL import Image
out, paths = sys.argv[1], sys.argv[2:]
W, H = 640, 360
sheet = Image.new('RGB', (W * len(paths), H), (24, 24, 24))
for i, p in enumerate(paths):
    im = Image.open(p).convert('RGB'); im.thumbnail((W, H)); sheet.paste(im, (i * W, (H - im.height) // 2))
sheet.save(out); print('wrote', out)
