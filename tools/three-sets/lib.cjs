// Shared helper for audits, stills and checks: static server + system Chrome via Playwright.
// Run scripts from anywhere; paths resolve from the project root. Env: CHROME_PATH to override Chrome.
const fs = require('node:fs/promises'), path = require('node:path'), http = require('node:http');
const ROOT = path.resolve(__dirname, '../..');
const MIME = {'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.css':'text/css','.wav':'audio/wav','.mp4':'video/mp4'};
const MAC = process.platform === 'darwin';
const CHROME = process.env.CHROME_PATH || (MAC ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);   // undefined = Playwright's own Chromium (npx playwright install chromium)
/** Browser launch options that work on a Mac (Chrome + Metal) and on Linux or a cloud sandbox (software WebGL: slower, same pictures). */
function launchOptions() {
  const args = MAC ? ['--use-angle=metal', '--enable-webgl'] : ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox'];
  return {headless: true, args, ...(CHROME ? {executablePath: CHROME} : {})};
}

function startServer(root = ROOT) {
  const server = http.createServer(async (req, res) => {
    try {
      const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!file.startsWith(root + path.sep)) throw Error('Invalid path');
      const data = await fs.readFile(file);
      res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'});
      res.end(data);
    } catch (e) { res.writeHead(404); res.end('Not found'); server.misses.push(req.url); }
  });
  server.misses = [];
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({server, origin: `http://127.0.0.1:${server.address().port}`})));
}

async function open(pagePath, {width = 1920, height = 1080, query = ''} = {}) {
  const {chromium} = require('playwright');
  const {server, origin} = await startServer();
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.goto(`${origin}/${pagePath}${query}`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => window.__ready, {timeout: 90000});
  const close = async () => { await browser.close(); await new Promise(r => server.close(r)); };
  return {page, errors, misses: server.misses, close, origin};
}

module.exports = {ROOT, open, startServer, CHROME, launchOptions};
