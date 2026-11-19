// Asset review runner. Reads unchanged dependencies from a fallback source tree when a sparse worktree omits them.
// node tools/three-sets/review-assets.cjs set|actor id output [lighting-or-camera-json]
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const{chromium}=require('playwright');const{launchOptions}=require('./lib.cjs');
const ROOT=path.resolve(__dirname,'../..'),FALLBACK=process.env.PORCHLIGHT_SOURCE||ROOT;
(async()=>{const[kind,id,out,extra]=process.argv.slice(2);if(!['set','actor'].includes(kind)||!id||!out)throw Error('Use set|actor id output [lighting-or-camera-json]');
 const mime={'.js':'application/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
 const server=http.createServer(async(req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);if(rel.split('/').includes('..')){res.writeHead(403);return res.end();}try{let data;try{data=await fs.readFile(path.join(ROOT,rel));}catch{data=await fs.readFile(path.join(FALLBACK,rel));}res.writeHead(200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream'});res.end(data);}catch(e){res.writeHead(404);res.end('Missing '+rel);}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch(launchOptions());
 try{const p=await b.newPage({viewport:{width:1920,height:1080}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>399&&!r.url().endsWith('/favicon.ico'))errors.push(`HTTP ${r.status()} ${r.url()}`);});
 const cams=kind==='actor'?[{pos:[0,1.3,6.4],target:[0,1.2,0],fov:42},{pos:[4.5,1.3,4.5],target:[0,1.2,0],fov:42},{pos:[6.4,1.3,0],target:[0,1.2,0],fov:42},{pos:[0,1.3,-6.4],target:[0,1.2,0],fov:42}]:extra?JSON.parse(await fs.readFile(extra,'utf8')):[{pos:[0,2.8,9.8],target:[0,1.35,-1],fov:50},{pos:[-3.2,2.4,7],target:[0,1.25,-1],fov:55},{pos:[3.2,2.4,7],target:[0,1.25,-1],fov:55}];
 const q=new URLSearchParams({[kind]:id,cams:JSON.stringify(cams),...(kind==='actor'?{light:extra||'park'}:{})});await p.goto(`http://127.0.0.1:${server.address().port}/tools/three-sets/preview.html?${q}`,{waitUntil:'networkidle'});
 try{await p.waitForFunction(()=>window.__ready,null,{timeout:90000});}catch(e){throw Error(errors.join('\n')||e.message);}if(errors.length)throw Error(errors.join('\n'));
 await fs.mkdir(out,{recursive:true});const imgs=await p.evaluate(()=>window.__images);for(let i=0;i<imgs.length;i++)await fs.writeFile(path.join(out,`${id}-${i+1}.png`),Buffer.from(imgs[i],'base64'));console.log(`PASS ${id}: ${imgs.length} review views, no browser errors`);
 }finally{await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
