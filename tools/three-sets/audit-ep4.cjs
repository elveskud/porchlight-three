// Measure animation problems on a rendered Episode page (no drawing; reads actor rigs).
// node tools/three-sets/audit-ep4.cjs [page] [out.json]
// Default page is the v4 build. Run again on the v5 page to compare numbers.
const fs = require('node:fs/promises');
const {open} = require('./lib.cjs');
(async () => {
  const pagePath = process.argv[2] || 'comparisons/episode04/source/render.html';
  const outFile = process.argv[3];
  const s = await open(pagePath);
  try {
    const result = await s.page.evaluate(() => {
      const ep = window.episode, tl = ep.timeline, R = {};
      const D = 1 / 12;                                   // one drawing
      const at = (t) => { ep.renderAt(t, {draw: false}); };
      const rig = (id) => ep.actors[id];
      const wp = (o) => o.getWorldPosition(new ep.camera.position.constructor());
      const maxAbs = (a) => a.reduce((m, x) => Math.max(m, Math.abs(x)), 0);

      // A3/A4: smile, lids and head-yaw jumps between consecutive drawings (whole film, riot + rocco + bash + pip)
      // Scene cuts are skipped (a different pose after a cut is not a pop). We report the biggest one-drawing change
      // and how many one-drawing changes are "pops": smile > 0.6, lids > 0.1, head turn > 0.15 rad, pupil > 0.03.
      const jumps = {smile: 0, lids: 0, headYaw: 0, pupilX: 0}, pops = {smile: 0, lids: 0, headYaw: 0, pupilX: 0}, POP = {smile: .6, lids: .1, headYaw: .15, pupilX: .03}; const where = {};
      for (const who of ['riot', 'rocco', 'bash', 'pip']) {
        let prev = null;
        for (let t = 0; t < tl.duration; t += D) {
          at(t);
          const r = rig(who); if (!r.root.visible) { prev = null; continue; }
          const p = r.motion.lastPose, cur = {beat: ep.info.beat, smile: p.smile, lids: p.lids, headYaw: r.head.rotation.y, pupilX: r.face.pupils[0].position.x};
          if (prev && prev.beat === cur.beat) for (const k of Object.keys(jumps)) { const d = Math.abs(cur[k] - prev[k]); if (d > POP[k]) pops[k]++; if (d > jumps[k]) { jumps[k] = d; where[k] = {who, t: +t.toFixed(3)}; } }
          prev = cur;
        }
      }
      R.popsPerFilm = pops;
      R.maxJumpPerDrawing = jumps; R.maxJumpWhere = where;

      // A5: standing idle range of motion (bash standing in s05 is visible; use riot in s03 standing)
      const idle = (who, t0, t1) => {
        const ch = {pelvisY: [], pelvisX: [], spineRotZ: [], headRotY: [], kneeBend: [], footX: []};
        for (let t = t0; t < t1; t += D) {
          at(t); const r = rig(who);
          ch.pelvisY.push(r.pelvis.position.y); ch.pelvisX.push(r.pelvis.position.x); ch.spineRotZ.push(r.spine.rotation.z);
          ch.headRotY.push(r.head.rotation.y); ch.kneeBend.push(r.legL.knee.quaternion.angleTo(new r.legL.knee.quaternion.constructor()));
          ch.footX.push(r.legL.foot.getWorldPosition(new ep.camera.position.constructor()).x);
        }
        return Object.fromEntries(Object.entries(ch).map(([k, a]) => [k, +(Math.max(...a) - Math.min(...a)).toFixed(4)]));
      };
      R.idleRangeRiotS04 = idle('riot', tl.beats[3].start + 20, tl.beats[3].start + 30);
      R.idleKneeBendRiotS04 = (() => { at(tl.beats[3].start + 25); const r = rig('riot'); return +r.legL.knee.quaternion.angleTo(new r.legL.knee.quaternion.constructor()).toFixed(4); })();

      // A6: foot / pelvis pop across the end of each path (one drawing before vs after end)
      R.pathEndPop = tl.paths.map((path) => {
        const who = path.who, snap = (t) => { at(t); const r = rig(who); return {pelvisY: r.pelvis.position.y, L: r.legL.foot.getWorldPosition(new ep.camera.position.constructor()).toArray(), R: r.legR.foot.getWorldPosition(new ep.camera.position.constructor()).toArray()}; };
        const a = snap(path.end - 0.001 * 0), b = snap(path.end + D + 0.0001);
        const dist = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
        return {id: path.id, pelvisJump: +Math.abs(a.pelvisY - b.pelvisY).toFixed(3), footJumpL: +dist(a.L, b.L).toFixed(3), footJumpR: +dist(a.R, b.R).toFixed(3)};
      });

      // A9: blink drawings for riot over s04 (58 s): count drawings with closure>=.88 (fully closed) and 0.3..0.88 (partial)
      const blink = {closed: 0, partial: 0, drawings: 0}; const s04 = tl.beats[3];
      for (let t = s04.start; t < s04.end; t += D) { at(t); const r = rig('riot'); const sy = r.face.eyes[0].scale.y; blink.drawings++; if (sy <= .2) blink.closed++; else if (sy < .8) blink.partial++; }
      R.blinkRiotS04 = blink;

      // A2: of the speech drawings, how often is the viseme shown 'X' while a loud cue is active (late)
      let spoken = 0, closedWhileLoud = 0; const ev = tl.events.filter(e => !e.silent);
      for (const e of ev) for (let t = e.start; t < e.end; t += D) { const age = t - e.start, cue = e.mouthCues.find(c => age >= c.start && age < c.end); if (cue && cue.value !== 'X') spoken++; }
      R.speechDrawings = spoken;
      return R;
    });
    result.pageMessages = s.errors.slice(0, 10);
    const text = JSON.stringify(result, null, 1);
    if (outFile) await fs.writeFile(outFile, text); else console.log(text);
  } finally { await s.close(); }
})().catch(e => { console.error(e); process.exit(1); });
