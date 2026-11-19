// node tools/three-sets/edges.cjs <page> <beat> <z> [left|right|both]
// Return world x where the actor's head is safely beyond the beat's actual camera.
const {open}=require('./lib.cjs');
(async()=>{
 const [page,beat,zText,side='both']=process.argv.slice(2),z=Number(zText);
 if(!page||!beat||!Number.isFinite(z)||!['left','right','both'].includes(side))throw Error('Use: edges.cjs <page> <beat id> <depth z> [left|right|both]');
 const s=await open(page);
 try{
 const result=await s.page.evaluate(async({beat,z,side})=>{
  const THREE=await import('/art/three/vendor/three.module.js'),b=episode.timeline.beats.find(b=>b.id===beat);
  if(!b)throw Error(`Unknown beat ${beat}: choose a beat id in the timeline`);
  episode.renderAt(b.start,{draw:false});const camera=episode.camera;camera.updateMatrixWorld(true);
  const target=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);const right=new THREE.Vector3().crossVectors(target,camera.up).normalize();
  const measure=sign=>{
   const direction=sign*(right.x>=0?1:-1),head=new THREE.Vector3(camera.position.x,1.1,z);let n=0;
   // Start at the camera centre projected onto this depth, then search screen-side along world x.
   head.x=camera.position.x+target.x*(z-camera.position.z)/target.z;
   for(;n<1600;n++,head.x+=direction*.25){const ndc=head.clone().project(camera);if(sign*ndc.x>1.12)return {x:+head.x.toFixed(4),ndcX:+ndc.x.toFixed(4),steps:n,worldDirection:direction};}
   throw Error(`No ${sign<0?'left':'right'} edge at z=${z}: rotate the camera so x-axis travel crosses the frame`);
  };
  return {beat,z,time:b.start,...(side!=='right'?{left:measure(-1)}:{}),...(side!=='left'?{right:measure(1)}:{})};
 },{beat,z,side});
 if(s.errors.length)throw Error(s.errors.join('\n'));console.log(JSON.stringify(result,null,2));
 }finally{await s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
