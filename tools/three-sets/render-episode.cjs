// Episode 4 v5 renderer: Three.js/Chrome draws every picture, FFmpeg encodes and muxes the generated soundtrack.
// Run from anywhere:  node comparisons/episode04/source/render-v5.cjs
// Env: SCENE_ONLY=s03 (render one scene), CHROME_PATH, PORCHLIGHT_RENDER_OUT, PORCHLIGHT_RENDER_NAME
//
// Fixes over render.cjs (v4): frame boundaries use an epsilon (no scene starts a drawing late); the framing check
// runs for cached scenes too; nothing is muxed if a check fails; the cache fingerprint covers every input
// (script, voices, cues, audio, the whole art/three tree); the encode is tagged BT.709; ffmpeg errors are reported
// instead of crashing with EPIPE; browser errors stop the run at the scene that caused them.
const fs = require('node:fs/promises'), sync = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {spawn} = require('node:child_process'), {once} = require('node:events');
const {chromium} = require('playwright');
const {startServer, launchOptions, ROOT} = require('./lib.cjs');
const episode=Number(process.argv[2]);if(!Number.isInteger(episode)||episode<1||episode>40)throw Error('Use: render-episode.cjs <episode number>');
const slug='episode'+String(episode).padStart(2,'0'), EP=path.join(ROOT,'comparisons',slug),SRC=path.join(EP,'source');
const out = process.env.PORCHLIGHT_RENDER_OUT ? path.resolve(process.env.PORCHLIGHT_RENDER_OUT) : path.join(EP, 'data-render');
const timeline = JSON.parse(sync.readFileSync(path.join(SRC, 'timeline-data.json')));
const FPS = 24, EPS = 1e-6, total = Math.round(timeline.duration * FPS);
const frameOf = (seconds) => Math.ceil(seconds * FPS - EPS);       // 784.0000000000001 must stay 784
const scenes = [...timeline.beats.map(b => ({id: b.id, start: frameOf(b.start), end: frameOf(b.end)})), {id: 'ending', start: frameOf(timeline.end_start), end: total}]
  .filter(s => !process.env.SCENE_ONLY || s.id === process.env.SCENE_ONLY);
const HEAD_MARGIN = 0.02;      // a speaking head must be this far inside the picture

async function filesIn(dir, keep = () => true) {
  const found = [];
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') found.push(...await filesIn(full, keep)); } else if (keep(full)) found.push(full);
  }
  return found.sort();
}
/** Hash of every file that can change a picture or the sound. A scene clip is reused only if this is unchanged. */
async function fingerprint() {
  const hash = crypto.createHash('sha256');
  const episodeFiles=(await fs.readdir(EP,{withFileTypes:true})).filter(e=>e.isFile()&&/\.(js|html|json)$/.test(e.name)).map(e=>path.join(EP,e.name));
  const files = [...episodeFiles,
    ...await filesIn(path.join(ROOT, 'art/three')), ...await filesIn(SRC, f => /\.(js|py|html|cjs|json)$/.test(f) && !/timeline\.json$/.test(f)),
    ...await filesIn(path.join(ROOT, 'comparisons/episode01/source/refinements')), path.join(ROOT, 'comparisons/episode01/source/Boogaloo-Regular.ttf'),
    ...await filesIn(path.join(EP, 'assets/vo'), f => f.endsWith('.wav')), path.join(EP, 'assets/data/audio.wav'), path.join(EP, 'assets/data/cues.json'),
    path.join(EP, 'assets/data/voice-manifest.json'), path.join(ROOT,'episodes/ep'+String(episode).padStart(2,'0')+'.json'), path.join(ROOT, 'art/inserts/pavilion.png'),
  ];
  for (const f of files) { hash.update(path.relative(ROOT, f)); hash.update(await fs.readFile(f)); }
  return hash.digest('hex');
}
const headFails = (records) => records.filter(r => !r.head || r.head.x < HEAD_MARGIN || r.head.x > 1 - HEAD_MARGIN || r.head.y < HEAD_MARGIN || r.head.y > 1 - HEAD_MARGIN);

(async () => {
  const {server, origin} = await startServer();
  let browser;
  const failures = [];
  try {
    const hash = await fingerprint();
    browser = await chromium.launch(launchOptions());
    const dir = path.join(out, 'scenes'); await fs.mkdir(dir, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
    await page.goto(`${origin}/comparisons/${slug}/render-data.html`, {waitUntil: 'networkidle'});
    await page.waitForFunction(() => window.__ready, {timeout: 90000});
    if (errors.length) throw Error('browser errors at load: ' + errors.join('; '));
    const speech = [], files = [], started = Date.now();
    let done = 0;
    for (const scene of scenes) {
      const index = scene.id === 'ending' ? timeline.beats.length : timeline.beats.findIndex(b => b.id === scene.id);
      const file = path.join(dir, `${String(index).padStart(2, '0')}-${scene.id}.mp4`), metaFile = file + '.json';
      files.push(file);
      let cached = null;
      try { const info = JSON.parse(await fs.readFile(metaFile)); if (info.hash === hash && info.frames === scene.end - scene.start && (await fs.stat(file)).size > 1000) cached = info; } catch {}
      if (cached) {                                    // a cached scene still gets its framing check
        speech.push(...cached.speech); failures.push(...headFails(cached.speech));
        done += scene.end - scene.start; console.log('REUSE', scene.id, Math.round(done / total * 100) + '%'); continue;
      }
      const log = sync.openSync(file + '.log', 'w');
      const encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'warning', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0',
        '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-movflags', '+faststart', '-y', file], {stdio: ['pipe', 'ignore', log]});
      let encoderError = null;
      encoder.stdin.on('error', e => { encoderError = e; });
      const exit = new Promise((resolve, reject) => { encoder.on('error', reject); encoder.on('close', c => c === 0 ? resolve() : reject(Error(`ffmpeg exited ${c} for ${scene.id}; see ${file}.log`))); });
      exit.catch(() => {});
      const sceneSpeech = [];
      for (let frame = scene.start; frame < scene.end; frame++) {
        const t = frame / FPS;
        const data = await page.evaluate(t => ({image: episode.frame(t), info: episode.info}), t);
        if (encoderError) throw Error('encoder pipe failed: ' + encoderError.message);
        if (!encoder.stdin.write(Buffer.from(data.image, 'base64'))) await once(encoder.stdin, 'drain');
        if (data.info.speaker && !data.info.silent && !data.info.voiceover) {
          const record = {frame, time: t, line: data.info.line, speaker: data.info.speaker, head: data.info.heads[data.info.speaker]};
          sceneSpeech.push(record); speech.push(record);
        }
        if (errors.length) throw Error(`browser errors in ${scene.id} at t=${t}: ${errors.join('; ')}`);
        if (++done % 240 === 0) console.log(Math.round(done / total * 100) + '%', `${((Date.now() - started) / 1000).toFixed(0)}s elapsed`);
      }
      encoder.stdin.end(); await exit; sync.closeSync(log);
      failures.push(...headFails(sceneSpeech));
      await fs.writeFile(metaFile, JSON.stringify({hash, scene: scene.id, start: scene.start / FPS, end: scene.end / FPS, frames: scene.end - scene.start, renderer: 'Three.js', version: 'v5', speech: sceneSpeech}, null, 2));
      console.log('SCENE DONE', scene.id, Math.round(done / total * 100) + '%');
    }
    const result = failures.length ? 'REVIEW' : 'PASS', tag = process.env.SCENE_ONLY ? 'preview-' : '';
    await fs.writeFile(path.join(out, `${tag}framing-checks.json`), JSON.stringify({result, margin: HEAD_MARGIN, speakingFrames: speech.length, offscreenSpeakingHeads: failures}, null, 2));
    if (failures.length) throw Error(`${failures.length} speaking frames have the speaker's head too near the edge (see framing-checks.json). No film was written.`);
    if (process.env.SCENE_ONLY) { console.log('Scene preview done:', files[0]); return; }
    const list = path.join(dir, 'concat.txt');
    await fs.writeFile(list, files.map(f => `file '${f.replaceAll("'", "'\\''")}'`).join('\n') + '\n');
    const output = path.join(out, process.env.PORCHLIGHT_RENDER_NAME || slug+'_data.mp4');
    await new Promise((resolve, reject) => {
      const mux = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(EP, 'assets/data/audio.wav'), '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'copy', '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0', '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-t', String(timeline.duration), '-movflags', '+faststart', '-y', output], {stdio: ['ignore', 'ignore', 'inherit']});
      mux.on('error', reject); mux.on('close', c => c === 0 ? resolve() : reject(Error('mux failed ' + c)));
    });
    const style = await page.evaluate(() => episode.illustrated.audit);
    await fs.writeFile(path.join(out, 'v5-render.json'), JSON.stringify({renderer: 'Three.js', version: 'v5', style, sourceHash: hash, duration: timeline.duration, resolution: [1920, 1080], fps: FPS, drawingFps: 12, expectedFrames: total,
      speakingFrameChecks: speech.length, elapsedSeconds: (Date.now() - started) / 1000, output: path.relative(ROOT, output)}, null, 2));
    console.log('FILM COMPLETE', output);
  } finally { await browser?.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e.message || e); process.exitCode = 1; });
