import * as THREE from 'three';
import {profiles,pulse,ease} from './performance.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
export function volumeScale(squash){const y=clamp(1+squash,.93,1.07),xz=1/Math.sqrt(y);return V(xz,y,xz);}
export function followThrough(r,p,t,{moving=false,velocity=0,turn=0,seated=false,colliders=[]}={}){
 const id=r.root.userData.castId,c=profiles[id],breath=.0035*Math.sin(t*c.breath),laugh=(p.laugh||0)*.016*Math.sin(t*11),bounce=moving?.006*Math.sin(t*9):0,s=volumeScale(breath+laugh+bounce);r.spine.scale.multiply(s);
 r.head.scale.x*=1/Math.max(.94,Math.cos(r.head.rotation.y));
 // Deterministic delayed responses, derived from the authored motion rather than frame history.
 r.ears.forEach((ear,i)=>{ear.rotation.x+=clamp(turn*.05,-.04,.04)+velocity*.004*Math.sin(t*7-i*.5);ear.rotation.z+=.025*(p.laugh||0)*Math.sin(t*11-i*.3);});
 r.tail.chain.forEach((bone,i)=>{bone.rotation.z+=clamp(turn*.08,-.15,.15)*Math.exp(-i*.18)+velocity*.018*Math.sin(t*4.5-i*.6);});
 if(seated)r.tail.chain[0].rotation.z=id==='rocco'?-1.0:.85;
 const corrections=[];if(colliders.length&&r.tail.chain.length>1){for(let attempt=0;attempt<4;attempt++){r.root.updateMatrixWorld(true);let collision=false;for(const bone of r.tail.chain.slice(1)){const point=bone.getWorldPosition(V());if(colliders.some(box=>box.containsPoint(point))){collision=true;break;}}if(!collision)break;r.tail.chain[0].rotation.z+=id==='rocco'?-.15:.15;corrections.push('tail');}}
 for(const {o,base} of r.motion.clothing){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2],hem=Math.max(0,1-(y+.5));a.setXYZ(i,x,y,z+.0035*hem*Math.sin(t*3.1+x*5)*Math.min(1,.15+velocity));}a.needsUpdate=true;}
 r.motion.secondary={volume:s.x*s.y*s.z,tailCorrections:corrections.length};r.root.updateMatrixWorld(true);
}
export function orientSmears(look,r,event,t){for(const accent of look.accents||[]){if(accent.r!==r)continue;const age=event?t-event.start:0;accent.g.rotation.z=event?.do==='wave'?.30*Math.sin(age*8):event?.do==='point'?-.45:0;if(accent.smear.visible)accent.smear.scale.x=.75+.20*Math.abs(Math.sin(age*8));}}
export function groupReaction(p,index,t,at,{strength=.10,kind='surprise'}={}){const age=t-at-index*.11,w=pulse(age,.22,.16)*strength;if(kind==='surprise'){p.headX-=w;p.browY+=w*.4;p.aRo+=w*2;}else{p.headX+=w;p.headZ+=w*.3;}return p;}
export function stagedDiscovery(rigs,target,t,at){Object.values(rigs).forEach((r,i)=>{const w=ease((t-at-i*.10)/.28),d=target.clone().sub(r.head.getWorldPosition(V()));r.face.pupils.forEach(p=>p.position.x=clamp(d.x*.02,-.04,.04)*w);r.head.rotation.y+=clamp(d.x*.04,-.20,.20)*w;});}

// A weight-driven cushion has no integration history: release returns exactly to its rest shape.
const seats=new WeakMap();
export function seatResponse(mesh,weight,{compression=.12}={}){
 if(!seats.has(mesh)){mesh.geometry.computeBoundingBox();seats.set(mesh,{scale:mesh.scale.clone(),y:mesh.position.y,height:mesh.geometry.boundingBox.max.y-mesh.geometry.boundingBox.min.y});}
 const base=seats.get(mesh),w=ease(clamp(weight,0,1)),depth=compression*w;
 mesh.scale.copy(base.scale);mesh.scale.y*=1-depth;mesh.scale.x*=1+depth*.18;mesh.scale.z*=1+depth*.12;mesh.position.y=base.y-base.height*base.scale.y*depth*.5;
 return depth;
}
