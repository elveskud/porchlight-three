# Card: port the v5 fixes to Episode 1, 2 or 3 (a NEW edition; the old film stays)
Status: not done (user decision 17 Nov: Episode 4 first). Do this only when asked. Episodes 1–3 keep their old builds and hashes.

## Recipe (Episode 3 as the example)
1. `cp -R comparisons/episode03/source comparisons/episode03/source-v5` (new folder; leave the old one).
2. `prepare.py` (Ep 3 has its own): add the gait plan like `comparisons/episode04/source/prepare.py`:
   `sys.path.insert(0, ROOT/'pipeline'); import gait_plan` · for every path: `p['plan']=gait_plan.plan_path(start,end,length,leg)`, `p['contacts']=gait_plan.contacts(p['plan'])` · write `timeline-v5.json` and `assets/v5/cues.json` (footstep sounds from `contacts`).
3. Driver: copy `episode-v5.js` of Episode 4 as the pattern. Replace imports with `animation/v5/*` and `illustrated/reference-v3/*`. Keep the episode's own sets/props/cast code. Use `put()`, `along()`, `preTurn`, `stand`, `applyGait` as in Episode 4. Remove `HemisphereLight`/`AmbientLight` (the look ignores scene lights).
4. Light: each set the episode uses needs a record in `reference-v3/lighting.js` (most exist).
5. Render page + renderer: copy `render-v5.html` and `render-v5.cjs`, change the `comparisons/episode04` paths.
6. Run the card `run-checks` (motion, QA, film), then `render-episode`.
7. Episode 1 uses an older look (`comparisons/episode01/source/illustrated`): port it last; it needs the `reference-v3` look and reference sets.

## Files to touch
Only new files in `comparisons/episode0N/` (`source-v5/`, `v5/`, `assets/v5/`). Add the new film's hash to `DECISIONS.md` log.
## Do NOT read
Episode 4's `*-checks.json`, `ISSUES.md`, old verify scripts of that episode.
## Watch for
Voices missing for that episode (its manifest may point at the deleted Blender folder: `assets/vo/<id>.wav` is what `prepare.py` reads).
Characters from `v3/cast.js` (owl, gus, dot, brook) are in v4 `makeActor`, so they work in v5.
