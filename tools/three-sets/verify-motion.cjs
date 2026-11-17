// Motion QA that can fail. Walks every drawing around every path and checks:
//  - planted feet do not slide (world units; the leg is ~0.55 long)
//  - the pelvis and facing do not jump between drawings
//  - cadence stays natural (steps per second between landings)
//  - standing actors really move (weight shift): pelvis height range over 10 s
//  - 24 fps frame pairs on twos are identical (held drawings)
// node tools/three-sets/verify-motion.cjs [page] [out.json]     exit code 1 if anything fails
const fs = require('node:fs/promises');
const {open} = require('./lib.cjs');
// plantedSlide: a planted foot may move 1.5% of a leg per drawing (IK clamp at full reach). pelvisJump covers run bob + the first step.
// yawJump 1.2 rad per drawing = a deliberate half-turn in 0.4 s. maxStepsPerSecond: 5.6 is a fast run (4 cycles of 12 fps drawings).
const LIMITS = {plantedSlide: 0.02, pelvisJump: 0.15, yawJump: 1.2, maxStepsPerSecond: 5.6, minIdleRangeY: 0.008, minIdleRangeX: 0.02};   // 17 Nov: slide 0.015->0.02 and pelvis 0.14->0.15 after capping the pelvis drop (a foot may stop ~3% of a leg short for one drawing instead of the body ducking)
(async () => {
  const pagePath = process.argv[2] || 'comparisons/episode04/source/render-v5.html', outFile = process.argv[3];
  const s = await open(pagePath);
  try {
    const result = await s.page.evaluate((LIMITS) => {
      const ep = window.episode, tl = ep.timeline, fails = [], report = {limits: LIMITS, paths: []};
      const D = 1 / 12, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
      const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
      for (const path of tl.paths) {
        const r = ep.actors[path.who]; let prev = null, worst = {slide: 0, pelvis: 0, yaw: 0}, drawings = 0;
        for (let t = path.start - 0.4; t <= path.end + 0.8; t += D) {
          ep.renderAt(t, {draw: false});
          if (!r.root.visible) { prev = null; continue; }
          const cur = {pelvisY: r.pelvis.position.y, rootY: r.root.rotation.y, contacts: r.motion.contacts.map(c => ({side: c.side, dist: c.dist, stance: c.stance, p: c.actual})), t};
          if (prev) {
            worst.pelvis = Math.max(worst.pelvis, Math.abs(cur.pelvisY - prev.pelvisY));
            worst.yaw = Math.max(worst.yaw, Math.abs(wrap(cur.rootY - prev.rootY)));
            for (const c of cur.contacts) {
              const o = prev.contacts.find(x => x.side === c.side);
              if (o && o.stance && c.stance && o.dist === c.dist) worst.slide = Math.max(worst.slide, Math.hypot(c.p[0] - o.p[0], c.p[1] - o.p[1], c.p[2] - o.p[2]));
            }
          }
          prev = cur; drawings++;
        }
        const gaps = path.plan.steps.map((st, i, a) => i ? st.land - a[i - 1].land : null).slice(2, -1).filter(Boolean);
        const peak = gaps.length ? 1 / Math.min(...gaps) : 0;
        const row = {id: path.id, mode: path.plan.mode, drawings, worstSlide: +worst.slide.toFixed(4), worstPelvisJump: +worst.pelvis.toFixed(4), worstYawJump: +worst.yaw.toFixed(3), peakStepsPerSecond: +peak.toFixed(2)};
        report.paths.push(row);
        if (worst.slide > LIMITS.plantedSlide) fails.push(`${path.id}: planted foot slid ${worst.slide.toFixed(4)} in one drawing`);
        if (worst.pelvis > LIMITS.pelvisJump) fails.push(`${path.id}: pelvis jumped ${worst.pelvis.toFixed(3)} in one drawing`);
        if (worst.yaw > LIMITS.yawJump) fails.push(`${path.id}: facing jumped ${worst.yaw.toFixed(2)} rad in one drawing`);
        if (peak > LIMITS.maxStepsPerSecond) fails.push(`${path.id}: ${peak.toFixed(1)} steps/s`);
      }
      // Standing actors must move: riot in s04, 10 s.
      const b = tl.beats.find(b => b.id === 's04'); let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9, slide = 0, prevFoot = null;
      for (let t = b.start + 20; t < b.start + 30; t += D) {
        ep.renderAt(t, {draw: false}); const r = ep.actors.riot;
        minY = Math.min(minY, r.pelvis.position.y); maxY = Math.max(maxY, r.pelvis.position.y); minX = Math.min(minX, r.pelvis.position.x); maxX = Math.max(maxX, r.pelvis.position.x);
        const f = r.motion.contacts.map(c => c.actual); if (prevFoot) f.forEach((p, i) => { slide = Math.max(slide, Math.hypot(p[0] - prevFoot[i][0], p[1] - prevFoot[i][1], p[2] - prevFoot[i][2])); }); prevFoot = f;
      }
      report.idle = {rangeY: +(maxY - minY).toFixed(4), rangeX: +(maxX - minX).toFixed(4), plantedSlide: +slide.toFixed(5)};
      if (maxY - minY < LIMITS.minIdleRangeY) fails.push(`standing pelvis height range ${(maxY - minY).toFixed(4)} (statue)`);
      if (maxX - minX < LIMITS.minIdleRangeX) fails.push(`standing pelvis sway range ${(maxX - minX).toFixed(4)} (statue)`);
      if (slide > LIMITS.plantedSlide) fails.push(`standing feet slid ${slide.toFixed(4)}`);
      // Twos: two 24 fps frames that share a drawing must be identical pictures.
      let pairs = 0, same = 0;
      for (const t of [12.0, 44.5, 90.25, 150.1, 170.9]) { const a = ep.frame(t), a2 = ep.frame(t + 1 / 24 - 1e-4), tq = Math.floor(t * 12 + 1e-7) / 12; if (Math.floor((t + 1 / 24 - 1e-4) * 12 + 1e-7) / 12 === tq) { pairs++; if (a === a2) same++; } }
      report.twos = {pairs, identical: same};
      if (same !== pairs) fails.push(`held drawings differ: ${same}/${pairs} pairs identical`);
      report.fails = fails; report.result = fails.length ? 'FAIL' : 'PASS';
      return report;
    }, LIMITS);
    result.pageMessages = s.errors.slice(0, 10);
    const text = JSON.stringify(result, null, 1);
    if (outFile) await fs.writeFile(outFile, text); else console.log(text);
    console.log('MOTION CHECK:', result.result, result.fails.length ? '\n - ' + result.fails.join('\n - ') : '');
    if (result.result !== 'PASS') process.exitCode = 1;
  } finally { await s.close(); }
})().catch(e => { console.error(e); process.exit(1); });
