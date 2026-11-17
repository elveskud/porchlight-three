// Close-up still of one actor (or any point) at a time: to judge faces, seating and costumes.
// node tools/three-sets/closeup.cjs <page> <t> <actorId|x,y,z> <out.png> [distance=3.2] [fov=32] [height=0.6] [side=0]
//   height: look-at point above the actor's root, in world units. side: rotate the camera around the actor (radians).
const fs = require('node:fs/promises');
const {open} = require('./lib.cjs');
(async () => {
  const [pagePath, t, who, out, dist = '3.2', fov = '32', height = '0.6', side = '0'] = process.argv.slice(2);
  if (!out) { console.error('usage: closeup.cjs <page> <t> <actor|x,y,z> <out.png> [distance] [fov] [height] [side]'); process.exit(2); }
  const s = await open(pagePath);
  try {
    const b64 = await s.page.evaluate(({t, who, dist, fov, height, side}) => {
      const ep = window.episode; ep.renderAt(+t, {draw: false});
      const THREE_V = ep.camera.position.constructor;
      let target;
      if (who.includes(',')) target = new THREE_V(...who.split(',').map(Number));
      else { const r = ep.actors[who]; if (!r || !r.root.visible) throw new Error(who + ' not visible at ' + t); target = r.root.getWorldPosition(new THREE_V()); target.y += +height; }
      const dir = ep.camera.position.clone().sub(target); dir.y = 0.15 * dir.length(); dir.normalize();
      const a = +side, c = Math.cos(a), sn = Math.sin(a), d2 = dir.clone(); d2.x = dir.x * c + dir.z * sn; d2.z = -dir.x * sn + dir.z * c;
      ep.camera.position.copy(target).addScaledVector(d2, +dist); ep.camera.fov = +fov; ep.camera.lookAt(target); ep.camera.updateProjectionMatrix(); ep.camera.updateMatrixWorld(true);
      ep.look.render(ep.camera); const c2 = ep.canvas.getContext('2d'); c2.clearRect(0, 0, ep.canvas.width, ep.canvas.height); c2.drawImage(ep.renderer.domElement, 0, 0);
      return ep.canvas.toDataURL('image/png').split(',')[1];
    }, {t, who, dist, fov, height, side});
    await fs.writeFile(out, Buffer.from(b64, 'base64')); console.log('wrote', out);
    if (s.errors.length) console.log('PAGE MESSAGES:', s.errors.slice(0, 5));
  } finally { await s.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
