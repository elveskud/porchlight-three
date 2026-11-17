// Run a JavaScript expression inside an episode page and print the JSON result. For debugging and one-off measurements.
// node tools/three-sets/probe.cjs <page> '<expression using window.episode>'
// The expression may be an async function body: use `return` and `await`.
const {open} = require('./lib.cjs');
(async () => {
  const [pagePath, code] = process.argv.slice(2);
  if (!code) { console.error("usage: probe.cjs <page> '<js body, use return>'"); process.exit(2); }
  const s = await open(pagePath);
  try {
    const out = await s.page.evaluate(`(async()=>{${code}})()`);
    console.log(JSON.stringify(out, null, 1));
    if (s.errors.length) console.log('PAGE MESSAGES:', s.errors.slice(0, 8));
  } finally { await s.close(); }
})().catch(e => { console.error(e); process.exit(1); });
