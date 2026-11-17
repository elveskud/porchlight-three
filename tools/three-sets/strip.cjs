// Contact strip: n consecutive drawings (or any step) cropped and tiled into one PNG, to judge motion by eye.
// node tools/three-sets/strip.cjs <page> <out.png> <t0> <step> <n> <x,y,w,h> [cols=4] [scale=0.5]
// Example: node tools/three-sets/strip.cjs comparisons/episode04/source/render-v5.html /tmp/walk.png 0.15 0.0833 12 1000,380,920,420
const fs = require('node:fs/promises');
const {open} = require('./lib.cjs');
(async () => {
  const [pagePath, outFile, t0, step, n, crop, cols = '4', scale = '0.5'] = process.argv.slice(2);
  if (!crop) { console.error('usage: strip.cjs <page> <out.png> <t0> <step> <n> <x,y,w,h> [cols] [scale]'); process.exit(2); }
  const [cx, cy, cw, ch] = crop.split(',').map(Number), s = open(pagePath);
  const sess = await s;
  try {
    const b64 = await sess.page.evaluate(({t0, step, n, cx, cy, cw, ch, cols, scale}) => {
      const tw = Math.round(cw * scale), th = Math.round(ch * scale), rows = Math.ceil(n / cols);
      const sheet = document.createElement('canvas'); sheet.width = tw * cols; sheet.height = th * rows;
      const c = sheet.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, sheet.width, sheet.height);
      for (let i = 0; i < n; i++) {
        const t = t0 + i * step; episode.renderAt(t, {force: true});
        const x = (i % cols) * tw, y = Math.floor(i / cols) * th;
        c.drawImage(episode.canvas, cx, cy, cw, ch, x, y, tw, th);
        c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(t.toFixed(2), x + 4, y + 14);
      }
      return sheet.toDataURL('image/png').split(',')[1];
    }, {t0: +t0, step: +step, n: +n, cx, cy, cw, ch, cols: +cols, scale: +scale});
    await fs.writeFile(outFile, Buffer.from(b64, 'base64'));
    console.log('wrote', outFile);
    if (sess.errors.length) console.log('PAGE MESSAGES:', sess.errors.slice(0, 8));
  } finally { await sess.close(); }
})().catch(e => { console.error(e); process.exit(1); });
