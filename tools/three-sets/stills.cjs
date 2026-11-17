// Render PNG stills of an episode at given times.
// node tools/three-sets/stills.cjs <page> <outDir> <t1,t2,...> [prefix]
// page example: comparisons/episode04/source/render.html
const fs = require('node:fs/promises'), path = require('node:path');
const {open} = require('./lib.cjs');
(async () => {
  const [pagePath, outDir, times, prefix = 'still'] = process.argv.slice(2);
  if (!pagePath || !outDir || !times) { console.error('usage: stills.cjs <page> <outDir> <t1,t2,...> [prefix]'); process.exit(2); }
  await fs.mkdir(outDir, {recursive: true});
  const s = await open(pagePath);
  try {
    for (const t of times.split(',').map(Number)) {
      const b64 = await s.page.evaluate(t => { episode.renderAt(t, {force: true}); return episode.canvas.toDataURL('image/png').split(',')[1]; }, t);
      const f = path.join(outDir, `${prefix}-${String(t).replace('.', '_')}.png`);
      await fs.writeFile(f, Buffer.from(b64, 'base64'));
      console.log('wrote', f);
    }
    if (s.errors.length) console.log('PAGE MESSAGES:', s.errors.slice(0, 10));
    if (s.misses.length) console.log('404s:', s.misses.slice(0, 10));
  } finally { await s.close(); }
})().catch(e => { console.error(e); process.exit(1); });
