# Episode 3 — revised sets and calmer edit

[Watch the revised edition](index.html) · [Download MP4](episode03_3d_illustrated.mp4) · [Compare sets with pictures](references.html) · [Orbit the sets](source/render.html?inspect=1&time=6) · [First edition](../)

This edition addresses the user’s two review points: the sets need to follow the existing paintings, and the edit has too many cutaways.

Nine visible locations use the reusable `art/three/sets/reference-v1/build.js` and `art/three/illustrated/reference-v1/` modules. The set guide records each reference and the concrete layout, architectural, furnishing, color and lighting revisions. All scenery remains volumetric Three.js geometry; the reference pictures are only displayed in the comparison gallery.

The edit has 11 measured camera cuts versus 77 in the first edition, an 85.7% reduction. Dialogue scenes now use sustained group shots. Automatic camera changes for each speaker or pair are removed. The notebook insert remains because its writing and strikeout convey story information; the final essay has a slow continuous push that holds through the end of the scene. `edit-checks.json` measures the prior and revised camera cuts over every frame, including an explicit assertion that conversations contain no internal camera cuts.

The film retains the first edition’s current script, 44 original voice recordings, nine silent reactions, soundtrack and 181.666667-second timing. It is 1080p at 24 fps (4,360 encoded frames). Bash visibly takes the interview phone and walks to the mailbox within the held street shot, avoiding the previous position jump. No new story detail was added. The garage retains one sealed moving box.

## Reproduction

Use the same local Chrome / Python / FFmpeg / Playwright setup as the first edition. The completed original `../assets/` folder supplies the frozen voices and mastered audio; this revision does not regenerate them.

```sh
python3 comparisons/episode01/serve.py
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node tools/three-sets/verify-episode03-revised.cjs
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node tools/three-sets/verify-episode03-edit.cjs
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node comparisons/episode03/revised/source/render.cjs
python3 tools/three-sets/verify-episode03-revised-export.py
NODE_PATH=/private/tmp/porchlight-set-check/node_modules node tools/three-sets/verify-episode03-revised-player.cjs
```

Open `http://127.0.0.1:8766/comparisons/episode03/revised/`. `browser-checks.json` covers all frame transforms, speaker framing, face visibility, foot plants, repeatable seeks and story contacts. `edit-checks.json` records cut counts and modeled reference features. `export-checks.json` verifies the full encoded film, source fingerprint, exact script/voice provenance and audio equality with the first edition. `player-checks.json` verifies playback, seeking, restart and mobile layout. Desktop delivery is recorded in `delivery.json`.
