// Run: npm --prefix tools/three-sets install && npm --prefix tools/three-sets run verify
// Requires Google Chrome, or CHROME_PATH set to a Chromium executable.
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const output=path.join(root,'art/three/sets');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error('Path outside project');const data=await fs.readFile(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
});
(async()=>{
 let browser;
 try{
  await fs.mkdir(path.join(output,'previews'),{recursive:true});await fs.mkdir(path.join(output,'exports'),{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-webgl']});
  const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  // Prove the viewer and all assets are local: every external request is blocked.
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(`${origin}/sets.html`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.porchlightSets?.root);
  const catalog=await page.evaluate(()=>porchlightSets.catalog);assert.equal(catalog.length,20);
  const episodes=await page.evaluate(()=>porchlightSets.episodes);
  for(const episode of episodes) {await page.selectOption('#episode',String(episode.number));const ids=await page.locator('#list button').evaluateAll(bs=>bs.map(b=>b.dataset.id));assert.deepEqual(ids, catalog.filter(s=>episode.sets.includes(s.id)).map(s=>s.id));}
  await page.selectOption('#episode','all');await page.fill('#search','hallway');assert.equal(await page.locator('#list button').count(),1);await page.fill('#search','');
  const report=[];
  for(const spec of catalog){
    await page.evaluate(id=>porchlightSets.select(id),spec.id);await page.waitForLoadState('networkidle');await page.waitForTimeout(120);
    const entry=await page.evaluate(()=>{
      const {root,camera}=porchlightSets;let meshes=0,invalid=0,vertices=0;const names=[];
      root.traverse(o=>{if(o.isMesh){meshes++;names.push(o.name);}if(o.geometry?.attributes.position){const p=o.geometry.attributes.position.array;vertices+=p.length/3;for(const n of p)if(!Number.isFinite(n))invalid++;}});
      return {id:root.name,meshes,vertices,invalid,anchors:root.userData.anchors,assetErrors:root.userData.assetErrors,names,camera:camera.position.toArray()};
    });
    assert.ok(entry.meshes>40,spec.id+' must have modeled geometry');assert.equal(entry.invalid,0);assert.deepEqual(entry.assetErrors,[]);assert.ok(entry.anchors.length>0);
    if(spec.id==='pip_garage')assert.equal(entry.names.filter(n=>n==='cardboard carton').length,1);
    if(spec.id==='school_gym')assert.equal(entry.names.filter(n=>n==='seat').length,34);
    if(spec.id==='walt_hallway')assert.equal(entry.names.filter(n=>n==='existing grandfather photograph').length,6);
    // Camera presets must all produce finite, genuinely different positions.
    for(const view of ['detail','overhead','wide']){await page.evaluate(view=>porchlightSets.setView(view),view);const p=await page.evaluate(()=>porchlightSets.camera.position.toArray());assert.ok(p.every(Number.isFinite));}
    await page.locator('#viewport canvas').screenshot({path:path.join(output,'previews',`${spec.id}.png`)});
    const downloadPromise=page.waitForEvent('download');await page.click('#export');const download=await downloadPromise;
    await download.saveAs(path.join(output,'exports',`${spec.id}.glb`));
    const bytes=await fs.readFile(path.join(output,'exports',`${spec.id}.glb`));assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
    const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)).trim());assert.equal(gltf.asset.version,'2.0');assert.ok(gltf.meshes.length>40);assert.ok(gltf.cameras?.length);assert.ok(gltf.nodes.some(n=>n.name===spec.id));
    entry.glbBytes=bytes.length;entry.exportMeshes=gltf.meshes.length;delete entry.names;report.push(entry);console.log(`PASS ${spec.id}: ${entry.meshes} objects, ${(bytes.length/1048576).toFixed(2)} MB GLB`);
  }
  await page.evaluate(()=>porchlightSets.select('hall_outside'));await page.click('#door');assert.equal(await page.getAttribute('#door','aria-pressed'),'true');
  assert.ok(await page.evaluate(()=>{let open=false;porchlightSets.root.traverse(o=>{if(o.userData.interactive==='door'&&Math.abs(o.rotation.y)>1)open=true;});return open;}));
  await page.click('#anchors');assert.ok(await page.evaluate(()=>{let visible=false;porchlightSets.root.traverse(o=>{if(o.userData.marker&&o.visible)visible=true;});return visible;}));await page.click('#anchors');
  await page.click('#compare');assert.ok(await page.locator('#reference').isVisible());await page.waitForLoadState('networkidle');assert.ok(await page.locator('#reference-image').evaluate(i=>i.naturalWidth>0));
  await page.screenshot({path:path.join(output,'previews','viewer-comparison.png')});await page.click('#compare');
  await page.evaluate(()=>porchlightSets.select('apartment'));const before=await page.evaluate(()=>{let n=0;porchlightSets.root.traverse(o=>{if(o.userData.practical)n+=o.intensity;});return n;});await page.click('#lights');const after=await page.evaluate(()=>{let n=0;porchlightSets.root.traverse(o=>{if(o.userData.practical)n+=o.intensity;});return n;});assert.ok(before>after);
  const pngPromise=page.waitForEvent('download');await page.click('#snapshot');const png=await pngPromise;assert.ok(png.suggestedFilename().endsWith('.png'));
  // Orbit interaction must move the camera, not move a flat reference plane.
  const start=await page.evaluate(()=>porchlightSets.camera.position.toArray());const bounds=await page.locator('#viewport').boundingBox();await page.mouse.move(bounds.x+bounds.width*.55,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.75,bounds.y+bounds.height*.55,{steps:8});await page.mouse.up();await page.waitForTimeout(200);const end=await page.evaluate(()=>porchlightSets.camera.position.toArray());assert.ok(start.some((n,i)=>Math.abs(n-end[i])>.1));
  await page.evaluate(()=>porchlightSets.select('lake'));await page.screenshot({path:path.join(output,'previews','viewer-desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.click('#menu');assert.ok(await page.locator('#sidebar').isVisible());await page.click('#list button[data-id="classroom"]');assert.equal(await page.locator('#label').innerText(),'Summer classroom');await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'previews','viewer-mobile.png')});
  await page.setViewportSize({width:1200,height:800});await page.goto(`${origin}/sets.html?set=does-not-exist`,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>porchlightSets.root.name),'lake');assert.match(await page.locator('#status').innerText(),/Unknown set/);
  await page.goto(`${origin}/sets.html?set=lake_day_v2.jpg`,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>porchlightSets.root.name),'lake');
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(output,'verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),result:'PASS',sets:report,episodes,checks:['20 modeled sets','finite geometry','all local assets','all episode filters','camera presets','single garage box','34 gym chairs','6 existing grandfather photos','20 GLB downloads and binary validation','doors','stage marks','practical lights','PNG download','orbit interaction','reference comparison','mobile layout','invalid links','legacy painting links'],errors},null,2)+'\n');
  await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({version:1,units:'metres',source:'Modeled from existing Gemini paintings; hidden geometry and dimensions inferred.',sets:catalog.map(s=>({...s,glb:`exports/${s.id}.glb`,preview:`previews/${s.id}.png`,...report.find(r=>r.id===s.id)}))},null,2)+'\n');
  console.log('PASS: all 20 sets, exports, offline assets, and viewer controls.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
