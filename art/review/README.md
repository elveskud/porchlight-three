# Missing asset review

All 11 requested sets and seven characters are built. The 5 alternate paintings are selectable as normal set IDs (`gus_garage_night`, `motel_night`, `city_canal`, `memory_lake_storm`, `festival_stage_storm`). The car is provisional: **needs painting**.

Each folder contains actual illustrated-renderer PNGs, and `compare.png` puts the painting/sheet beside the first two views. Set cameras are saved in `cams.json`. PNG views are downsampled to 960×540 for GitHub review; full render resolution was 1920×1080. The car has no source image and therefore no comparison panel.

Reproduce in a complete checkout:

```sh
node tools/three-sets/preview.cjs set gus_garage art/review/gus_garage art/review/gus_garage/cams.json
node tools/three-sets/review-assets.cjs actor walt art/review/walt park
node tools/three-sets/verify-assets.cjs
node tools/three-sets/verify-motion.cjs
node tools/three-sets/verify-episode04-v5.cjs
python3 tools/check_scripts.py --no-md
```

For a sparse worktree only, `PORCHLIGHT_SOURCE=/path/to/complete/checkout` enables a read-only dependency fallback in `review-assets.cjs`; use `node -r ./tools/three-sets/review-fallback.cjs ...` for the checks. This does not alter any test limits or production code.

`docs/ASSET_NOTES.md` records painting observations, modelling assumptions and user review questions. The checker's existing Episode 1/2 continuity stops and eleven accepted short lengths remain unchanged.
