# New set: Gemini prompt template

Attach: `~/Desktop/Friendzy/Blender/characters/refs/lineup.png` (image 1) and `art/gemini/sets/lake_day_v2.jpg` (image 2, the approved style).
Fill in the brackets. One chat per set; then ask for the other times of day in the same chat.

```
Image 1 shows the characters of a 2D cartoon series. Image 2 is an approved background from the same series.
Draw a NEW background in EXACTLY the style of image 2: bold clean black outlines the same thickness as in
image 2 and the characters; flat solid colours with ONE simple darker shadow tone per colour, hard-edged;
simple rounded shapes; no painterly brush texture, no sketchy lines, no scratches.
NO characters, NO animals, NO people, NO text, NO fireflies, NO light beams, NO glowing particles.
Wide 16:9, as large as you can make it.

Set: [WHAT AND WHERE, e.g. "the school classroom in a small lake town"], seen straight on, [TIME OF DAY].
In it: [THE OBJECTS THAT MATTER, left to right].
The lower middle of the picture is open floor or ground where up to four characters will stand, kept simple.
[ANY FURNITURE CHARACTERS SIT ON] stands with its front clearly drawn, so characters can sit in it.
```

Other times of day (same chat):
```
Repaint exactly the same picture, same composition, every object in the same place, at [TIME]: [LIGHT].
Still no fireflies, light beams or glowing particles.
```

Why "no fireflies, beams or particles": they're animated in Blender; painted ones would sit frozen next to the moving ones.

After saving: upscale (`tools/realesrgan`), add `art/hd/sets/<name>.json` (spots, fronts, lamps, life), run `tools/fronts.py`, add the set to `PLATE_SETS` in `locations.py`, then a stills check.
