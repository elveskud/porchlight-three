import * as THREE from 'three';
import {ease} from './performance.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const cache=new WeakMap();
export function pathInfo(path){if(cache.has(path))return cache.get(path);const points=path.points.map(p=>V(...p)),lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+points[i].distanceTo(points[i-1]));const info={points,lengths,length:lengths.at(-1)};cache.set(path,info);return info;}
export function atDistance(path,d){const a=pathInfo(path);d=clamp(d,0,a.length);let i=1;while(i<a.lengths.length-1&&a.lengths[i]<d)i++;const u=(d-a.lengths[i-1])/Math.max(.001,a.lengths[i]-a.lengths[i-1]),point=a.points[i-1].clone().lerp(a.points[i],u),tangent=a.points[i].clone().sub(a.points[i-1]).normalize();return {point,tangent};}
export function gait(path,t,{run=false,stride=path.stride||.31,ground=null}={}){
 const info=pathInfo(path),u=clamp((t-path.start)/(path.end-path.start),0,1),distance=info.length*ease(u),center=atDistance(path,distance),heading=atDistance(path,distance+.18).point.sub(atDistance(path,distance-.18).point).normalize(),yaw=Math.atan2(heading.x,heading.z),feet={};
 for(const [side,offset] of [['L',0],['R',.5]]){
  const x=distance/stride+offset,cycle=Math.floor(x),phase=x-cycle,stanceEnd=run?.48:.62,stance=phase<stanceEnd,anchor=(cycle-offset)*stride,sw=stance?0:ease((phase-stanceEnd)/(1-stanceEnd)),p=atDistance(path,anchor+sw*stride),right=V(p.tangent.z,0,-p.tangent.x),lateral=(side==='L'?-1:1)*(path.width||.155)*(path.who==='dot'?.78:1);p.point.addScaledVector(right,lateral);
  if(ground)p.point.y=ground(p.point.x,p.point.z);const lift=stance?0:Math.sin((phase-stanceEnd)/(1-stanceEnd)*Math.PI)*(run?.13:.075);p.point.y+=lift;feet[side]={target:p.point,stance,phase,roll:stance?(phase<.1?-.12*(1-phase/.1):phase>.48?.18*(phase-.48)/.14:0):-.12*Math.sin(sw*Math.PI)};
 }
 if(ground)center.point.y=ground(center.point.x,center.point.z);
 const moving=t>path.start&&t<path.end;return {id:path.id,position:center.point,yaw,distance,u,moving,feet,weight:.015*Math.sin(distance/stride*Math.PI*2),run};
}
export function solveLeg(r,key,target,roll=0){
 const leg=key==='L'?r.legL:r.legR,parent=r.pelvis;parent.updateWorldMatrix(true,true);const end=parent.worldToLocal(target.clone()),start=leg.hip.position.clone(),d=end.sub(start),a=.55,b=.42,len=clamp(d.length(),.15,a+b-.0001);d.normalize();const along=(a*a-b*b+len*len)/(2*len),height=Math.sqrt(Math.max(.000001,a*a-along*along)),bend=V(0,0,1);bend.addScaledVector(d,-bend.dot(d)).normalize();const knee=start.clone().addScaledVector(d,along).addScaledVector(bend,height),goal=start.clone().addScaledVector(d,len);
 leg.hip.quaternion.setFromUnitVectors(V(0,-1,0),knee.clone().sub(start).normalize());const lower=goal.sub(knee).applyQuaternion(leg.hip.quaternion.clone().invert()).normalize();leg.knee.quaternion.setFromUnitVectors(V(0,-1,0),lower);
 r.root.updateMatrixWorld(true);const q=leg.knee.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(r.root.getWorldQuaternion(new THREE.Quaternion()));leg.foot.quaternion.copy(q);leg.foot.rotateX(roll);r.root.updateMatrixWorld(true);
}
export function plantFeet(r,ground=()=>r.root.position.y,{weight=0}={}){r.root.updateMatrixWorld(true);const scale=r.root.getWorldScale(V()).y;for(const key of ['L','R']){const leg=key==='L'?r.legL:r.legR,p=leg.foot.getWorldPosition(V());p.y=ground(p.x,p.z)+.105*scale;solveLeg(r,key,p);}}
export function applyGait(r,sample,ground=()=>sample.position.y){
 r.root.position.copy(sample.position);r.root.rotation.y=sample.yaw;r.pelvis.position.y=(sample.run?.92:.995)+sample.weight;const phase=sample.distance/(.31*(r.root.userData.castId==='dot'?.78:1))*Math.PI*2;r.pelvis.position.x=.012*Math.sin(phase);r.pelvis.rotation.z=.012*Math.sin(phase);r.root.updateMatrixWorld(true);const scale=r.root.getWorldScale(V()).y;
 r.motion.contacts=[];for(const key of ['L','R']){const foot=sample.feet[key],target=foot.target.clone();target.y+=(.085*Math.sin(foot.roll)+Math.sqrt((.105*Math.cos(foot.roll))**2+(.235*Math.sin(foot.roll))**2))*scale;solveLeg(r,key,target,foot.roll);r.motion.contacts.push({side:key,stance:foot.stance,phase:foot.phase,target:target.toArray(),actual:(key==='L'?r.legL:r.legR).foot.getWorldPosition(V()).toArray()});}
 r.armL.sh.rotation.x=(sample.run?.45:.20)*Math.sin(phase);r.armR.sh.rotation.x=-(sample.run?.45:.20)*Math.sin(phase);if(sample.run){r.armL.el.rotation.x=r.armR.el.rotation.x=-1.0;r.head.rotation.x+=.07;}r.spine.rotation.x+=sample.run?.10:.025;
}
export function seatPose(p,weight){const w=ease(weight);p.lLf=p.lRf=Math.PI/2*w;p.lLk=p.lRk=Math.PI/2*w;p.torsoX+=.10*Math.sin(w*Math.PI);return w;}
export function settleSeat(r,w=1){r.pelvis.position.y*=1-w;r.tail.chain[0].rotation.z=r.root.userData.castId==='rocco'?-1.0:.85;}
export function risePose(p,u){const w=1-ease(u);seatPose(p,w);p.torsoX+=.20*Math.sin(Math.PI*clamp(u,0,1));p.aLf=p.aRf=.15*Math.sin(Math.PI*u);return w;}
export function crouchPose(p,u){const w=ease(u);p.lLf=p.lRf=1.1*w;p.lLk=p.lRk=2.1*w;p.torsoX=.70*w;p.headX=-.35*w;return w;}
export function pivotTurn(r,base,fromYaw,toYaw,u,ground=base.y){const w=.28*r.root.getWorldScale(V()).x,oldOffset=V(-w,0,0).applyAxisAngle(V(0,1,0),fromYaw),anchor=base.clone().add(oldOffset),yaw=THREE.MathUtils.lerp(fromYaw,toYaw,ease(u)),offset=V(-w,0,0).applyAxisAngle(V(0,1,0),yaw);r.root.position.copy(anchor).sub(offset);r.root.position.y=ground;r.root.rotation.y=yaw;r.pelvis.position.y=1.0;r.root.updateMatrixWorld(true);const scale=r.root.getWorldScale(V()).y,left=anchor.clone();left.y=ground+.105*scale;solveLeg(r,'L',left);const right=r.root.position.clone().add(V(w,0,0).applyAxisAngle(V(0,1,0),yaw));right.y=ground+.105*scale+.035*Math.sin(Math.PI*clamp(u,0,1));solveLeg(r,'R',right);r.motion.contacts=[{side:'L',stance:true,target:left.toArray(),actual:r.legL.foot.getWorldPosition(V()).toArray()},{side:'R',stance:false,target:right.toArray(),actual:r.legR.foot.getWorldPosition(V()).toArray()}];return r.root.position.clone();}
