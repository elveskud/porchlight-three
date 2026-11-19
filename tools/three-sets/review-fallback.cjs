// Optional read-only overlay for browser checks in sparse asset worktrees.
// PORCHLIGHT_SOURCE=/path/to/full/checkout node -r ./tools/three-sets/review-fallback.cjs tools/three-sets/verify-motion.cjs
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),source=process.env.PORCHLIGHT_SOURCE;
if(source){const read=fs.readFile.bind(fs);fs.readFile=async function(file,...args){try{return await read(file,...args);}catch(e){const abs=typeof file==='string'?path.resolve(file):'';if(abs===path.join(root,'favicon.ico')&&e.code==='ENOENT')return Buffer.alloc(0);if(e.code!=='ENOENT'||!abs.startsWith(root+path.sep))throw e;return read(path.join(source,path.relative(root,abs)),...args);}};}
