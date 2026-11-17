// Preview a set or a character, from one or more cameras, and save PNGs: the way to SEE what you built.
//   node tools/three-sets/preview.cjs set <setId> <outDir> [cams.json]
//   node tools/three-sets/preview.cjs actor <actorId> <outDir> [lightingSetId] [poseJson]
// Default cameras: sets get three views (wide front, left, right); actors get front, three-quarter and side, all head to toe.
// Compare the set pictures with the painting named in art/three/sets/catalog.js (art/gemini/sets/...).
const fs = require('node:fs/promises'), path = require('node:path');
const {open} = require('./lib.cjs');
(async () => {
  const [kind, id, outDir, extra, pose] = process.argv.slice(2);
  if (!kind || !id || !outDir) { console.error('usage: preview.cjs set <setId> <outDir> [cams.json] | actor <actorId> <outDir> [lightingSetId] [poseJson]'); process.exit(2); }
  let cams, query;
  if (kind === 'set') {
    cams = extra ? JSON.parse(await fs.readFile(extra, 'utf8')) : [{pos: [0, 3.2, 12], target: [0, 1.6, 0], fov: 50}, {pos: [-7, 3, 9], target: [0, 1.5, 0], fov: 50}, {pos: [7, 3, 9], target: [0, 1.5, 0], fov: 50}];
    query = `?set=${encodeURIComponent(id)}&cams=${encodeURIComponent(JSON.stringify(cams))}`;
  } else {
    cams = [{pos: [0, 1.0, 5.2], target: [0, .75, 0], fov: 38}, {pos: [3.6, 1.0, 3.8], target: [0, .75, 0], fov: 38}, {pos: [5.2, 1.0, 0], target: [0, .75, 0], fov: 38}, {pos: [0, 1.0, -5.2], target: [0, .75, 0], fov: 38}];
    query = `?actor=${encodeURIComponent(id)}&light=${encodeURIComponent(extra || 'park')}&pose=${encodeURIComponent(pose || '{}')}&cams=${encodeURIComponent(JSON.stringify(cams))}`;
  }
  await fs.mkdir(outDir, {recursive: true});
  const s = await open('tools/three-sets/preview.html', {query});
  try {
    const images = await s.page.evaluate(() => window.__images);
    for (let i = 0; i < images.length; i++) { const f = path.join(outDir, `${id}-${i + 1}.png`); await fs.writeFile(f, Buffer.from(images[i], 'base64')); console.log('wrote', f); }
    if (s.errors.length) console.log('PAGE MESSAGES:', s.errors.slice(0, 6));
  } finally { await s.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
