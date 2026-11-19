# Staging as data — acceptance evidence (19 Nov 2026)

The shared v5 driver reads one authored staging file. Preparation emits a timeline and compiled staging; special prop choreography stays in hooks. Original Episode 4 drivers/renderers, finished animation modules, dialogue and voice settings are unchanged.

| Check | Result | Evidence |
|---|---|---|
| Episode 4 old/new canvas PNGs, same browser/GPU | PASS: 20/20 identical | episode04/data-frame-comparison.json |
| Episode 4 motion and full QA | PASS: 60 seeks, 54 voices, 153 landings, 7 cuts, no pops | episode04/data-motion-checks.json; episode04/data-qa/qa-checks.json |
| Episode 34 placeholder build | PASS: 231.583 s, 49 events, 48 spoken lines, one entrance, three authored cuts | episode34/staging.json; episode34/data-qa/qa-checks.json |
| Episode 34 motion and film | PASS: 5558 frames, 1920×1080/24 fps, -14.62 LUFS, -3.02 dBTP | episode34/data-motion-checks.json; episode34/data-render/export-checks.json |
| Episode 35 manual card dry run | PASS: 163.917 s, 43 spoken lines, motion, QA, render and export checks | episode35/staging.json; episode35/data-qa/; episode35/data-render/export-checks.json |
| Invalid staging cases and starter structure | PASS: 13 tests | python3 tools/test_validate_staging.py |

Review frames: `../art/review/ep34/contact-sheet.jpg` (one per scene and all three cuts), and `../art/review/ep35/contact-sheet.jpg`. Desktop delivery paths and SHA-256 hashes are in `staging-delivery.json`. Films and generated silent WAVs stay out of Git; preparation and mixing regenerate them.

The Episode 34 hooks reset held-prop parents/transforms for seek determinism. The lake group faces the reverse camera; the silent cannonball shot shows the leap and water landing. Pip moves next to Riot across the final beat cut. The legacy actions are explicitly aliased or handled by hooks, without changing scripts.

The edge tool uses the actual camera and a head point at y=1.1 on a 0.25-unit search grid. Recorded Episode 4 edges are in `episode04/data-edges.json`; s06/s08 match the supplied +x references, s05 is 11.25 (~11.3), and s04 measures -11.75/12.0 rather than the older approximate -11.3/12.3. The measured projection is retained rather than changing thresholds to match approximate coordinates.

The first Qwen3 14B free-form authoring attempt failed substantive review despite passing the earlier validator: wrong sets, overlapping positions, omitted ending and dialogue clipped by copied durations. The tightened validator rejects these. An edit-based repair stalled and was stopped. Both failed attempts are saved under `episode35/local-model/`; neither is represented as a passing autonomous demo. The card now starts with a non-overwriting, script-derived initializer so a small model can work from correct beats/sets/cast instead of rewriting large JSON. The starter-based Qwen run executed initializer, validation, placeholder preparation and timeline validation successfully with no direct JSON edits. Its browser output passes full QA and motion; 11/11 sampled PNG frames equal the independently verified manual Episode 35 page. Evidence: `episode35/local-model/starter-review.json`, `starter-frame-comparison.json`, `starter-qa.json` and `starter-motion.json`. This proves the starter workflow for this case, not unrestricted autonomous staging.

The car and supporting cast are delivered separately in the unmerged asset PR. These builds use existing sets/cast and do not depend on that PR. This is placeholder review media: real voices and final visual approval remain with the user.
