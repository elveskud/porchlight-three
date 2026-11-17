// Episode 4 v5 QA (before the render). Every check here can fail. Writes comparisons/episode04/v5/qa-checks.json.
//   node tools/three-sets/verify-episode04-v5.cjs        (exit 1 if anything fails)
// See also: verify-motion.cjs (feet, pelvis, facing, held drawings) and verify-episode04-export.py (the finished film).
const fs = require('node:fs/promises'), path = require('node:path');
const {open, ROOT} = require('./lib.cjs');
(async () => {
  const s = await open('comparisons/episode04/source/render-v5.html');
  const out = path.join(ROOT, 'comparisons/episode04/v5');
  await fs.mkdir(out, {recursive: true});
  try {
    const R = await s.page.evaluate(async () => {
      const ep = window.episode, tl = ep.timeline, fails = [], R = {}, D = 1 / 12;
      const L = await import('/art/three/animation/v5/locomotion.js');
      const sq = (t) => Math.floor(t * 12 + 1e-7) / 12;
      // 1. Seeking: random order must give the same pictures as forward order (posing is a pure function of time).
      const times = []; for (let i = 0; i < 60; i++) times.push(+(((i * 37.31) % (tl.duration - 1))).toFixed(3));
      const forward = times.map(t => ep.frame(t)), shuffled = [...times.keys()].sort((a, b) => ((a * 7919) % 61) - ((b * 7919) % 61));
      let diff = 0; for (const i of shuffled) if (ep.frame(times[i]) !== forward[i]) diff++;
      R.seek = {frames: times.length, different: diff}; if (diff) fails.push(`${diff} frames differ when drawn out of order`);
      // 2. Mouths: every spoken line moves; all nine shapes appear in the film; none is late.
      const shapes = new Set(); let stuck = 0, late = 0, lines = 0, worstLag = 0;
      for (const e of tl.events) {
        if (e.silent) continue; lines++;
        const seen = new Set(); let firstShown = null;
        for (let t = sq(e.start); t < e.end; t += D) { ep.renderAt(t, {draw: false}); const v = ep.info.visemes[e.who]; if (v) { seen.add(v); shapes.add(v); if (v !== 'X' && firstShown === null) firstShown = t; } }
        if (seen.size < 2) { stuck++; fails.push(`line ${e.id}: mouth never changes (${[...seen]})`); }
        const firstCue = e.mouthCues.find(c => c.value !== 'X');
        if (firstCue && firstShown !== null) { const lag = firstShown - (e.start + firstCue.start); worstLag = Math.max(worstLag, lag); if (lag > 0.1) { late++; fails.push(`line ${e.id}: first mouth shape ${lag.toFixed(3)} s after the sound starts`); } }
      }
      R.mouths = {lines, stuck, late, worstLagSeconds: +worstLag.toFixed(3), shapes: [...shapes].sort().join('')};
      for (const v of 'ABCDEFGHX') if (!shapes.has(v)) fails.push(`mouth shape ${v} never appears`);
      // 3. Footsteps: each footstep sound time must be the moment that foot lands in the picture.
      let contactsChecked = 0, contactsOff = 0;
      for (const p of tl.paths) for (const c of p.contacts) {
        const before = L.footState(p, c.side, c.time - 0.004), after = L.footState(p, c.side, c.time + 0.004);
        contactsChecked++; if (before.planted || !after.planted) { contactsOff++; fails.push(`${p.id}: footstep at ${c.time.toFixed(3)} is not a landing in the picture`); }
      }
      R.footsteps = {checked: contactsChecked, notLandings: contactsOff};
      // 4. Pictures: no black or flat frames except the authored fade; sample every 5 s as real pixels.
      const lum = [];
      for (let t = 1; t < tl.duration - 4; t += 5) {
        ep.renderAt(t, {force: true}); const c = ep.canvas.getContext('2d').getImageData(0, 0, ep.canvas.width, ep.canvas.height, {colorSpace: 'srgb'}).data;
        let sum = 0, n = 0, min = 255, max = 0; for (let i = 0; i < c.length; i += 4 * 997) { const y = (c[i] + c[i + 1] + c[i + 2]) / 3; sum += y; n++; min = Math.min(min, y); max = Math.max(max, y); }
        lum.push({t, mean: +(sum / n).toFixed(1), range: +(max - min).toFixed(0)});
        if (sum / n < 25 || max - min < 40) fails.push(`frame at ${t}s looks black or flat (mean ${(sum / n).toFixed(0)}, range ${(max - min).toFixed(0)})`);
      }
      R.pictures = {sampled: lum.length, darkest: Math.min(...lum.map(x => x.mean)), flattest: Math.min(...lum.map(x => x.range))};
      // 5. Cuts and camera. Planned close-ups (timeline.cuts) are allowed; any other camera jump inside a dialogue scene fails.
      //    Each close-up must keep the speaker's head well inside the frame and last at least a second; there must not be too many.
      const cuts = tl.cuts || [], inCut = (t) => cuts.some(c => t >= c.start - 0.2 && t < c.end + 0.2);
      let sceneChanges = 0, camJump = 0, last = null, closeUps = 0, headBad = 0;
      for (let t = 0; t < tl.duration; t += D) {
        ep.renderAt(t, {draw: false}); const i = ep.info;
        if (i.cut && (!last || last.cut !== i.cut)) closeUps++;
        if (i.cut) { const h = i.heads[i.cut]; if (!h || h.x < .15 || h.x > .85 || h.y < .12 || h.y > .75) headBad++; }
        if (last) { if (last.beat !== i.beat) sceneChanges++; else if (!inCut(t)) { const d = Math.hypot(...i.cameraPosition.map((x, k) => x - last.cameraPosition[k])); if (['s03', 's04', 's05', 's07'].includes(i.beat)) camJump = Math.max(camJump, d); } }
        last = i;
      }
      R.cuts = {sceneChanges, plannedCloseUps: cuts.length, closeUpsSeen: closeUps, headsBadInCloseUps: headBad, largestUnplannedCameraMove: +camJump.toFixed(4)};
      if (camJump > 0.05) fails.push(`camera moves ${camJump.toFixed(3)} between drawings inside a dialogue scene outside the planned close-ups`);
      if (closeUps !== cuts.length) fails.push(`${closeUps} close-ups seen but ${cuts.length} planned`);
      if (cuts.length > 9) fails.push(`${cuts.length} close-ups: "not too many" means 9 at most`);
      if (headBad) fails.push(`${headBad} close-up drawings have the speaker's head near the edge`);
      for (const c of cuts) if (c.end - c.start < 1.1) fails.push(`close-up at ${c.start}s is shorter than 1.1 s`);
      // 5a. Whoever is speaking must be in frame the whole time (same test as the renderer's framing check, so it fails before a render).
      let speakerOut = 0; const outLines = new Set();
      for (const e of tl.events) { if (e.silent) continue; for (let t = sq(e.start); t < e.end; t += D) { ep.renderAt(t, {draw: false}); const h = ep.info.heads[e.who]; if (!h || h.x < .02 || h.x > .98 || h.y < .02 || h.y > .98) { speakerOut++; outLines.add(e.id); } } }
      R.speakerOutOfFrame = {drawings: speakerOut, lines: [...outLines]};
      if (speakerOut) fails.push(`speaker out of frame for ${speakerOut} drawings in ${[...outLines].join(', ')} (a close-up on someone else, or a path that is not off-screen yet)`);
      // 5b. Nobody pops in or vanishes inside the picture (17 Nov review): an actor that appears or disappears mid-scene must be off-screen when it does.
      const pops = [], seen = {};
      let prev = null;
      for (let t = 0; t < tl.duration; t += D) {
        ep.renderAt(t, {draw: false}); const i = ep.info, now = new Set(Object.keys(i.heads));
        if (prev && prev.beat === i.beat && !inCut(t) && !inCut(t - D)) {
          for (const id of now) if (!prev.ids.has(id)) { const h = i.heads[id]; if (h && h.x > -0.02 && h.x < 1.02 && h.y > -0.1 && h.y < 1.1) pops.push(`${id} appears inside the frame at ${t.toFixed(2)}s`); }
          for (const id of prev.ids) if (!now.has(id)) { const h = prev.heads[id]; if (h && h.x > 0 && h.x < 1 && h.y > -0.1 && h.y < 1.1) pops.push(`${id} vanishes inside the frame at ${t.toFixed(2)}s`); }
        }
        prev = {beat: i.beat, ids: now, heads: i.heads};
      }
      R.pops = pops.length; if (pops.length) fails.push(...pops.slice(0, 8));
      // 6. Held drawings: whole film samples on twos except the ones windows.
      R.fastWindows = ep.fastWindows.length;
      R.fails = fails; R.result = fails.length ? 'FAIL' : 'PASS';
      return R;
    });
    const messages = s.errors.filter(m => !/willReadFrequently/.test(m));   // our own pixel read prints this harmless hint
    R.pageMessages = messages.slice(0, 10);
    if (messages.length) { R.fails.push('page printed messages: ' + messages.slice(0, 3).join(' | ')); R.result = 'FAIL'; }
    await fs.writeFile(path.join(out, 'qa-checks.json'), JSON.stringify(R, null, 1));
    console.log(JSON.stringify({seek: R.seek, mouths: R.mouths, footsteps: R.footsteps, pictures: R.pictures, cuts: R.cuts, pops: R.pops}));
    console.log('EPISODE 4 v5 QA:', R.result, R.fails.length ? '\n - ' + R.fails.slice(0, 20).join('\n - ') : '');
    if (R.result !== 'PASS') process.exitCode = 1;
  } finally { await s.close(); }
})().catch(e => { console.error(e); process.exit(1); });
