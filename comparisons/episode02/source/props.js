import * as THREE from 'three';
import {RoundedBoxGeometry} from '../../../art/three/vendor/addons/geometries/RoundedBoxGeometry.js';
const V=(...p)=>new THREE.Vector3(...p),rounded=new RoundedBoxGeometry(1,1,1,3,.06);
const m=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:1});
function box(p,n,c,pos,size){const o=new THREE.Mesh(rounded,m(c));o.name=n;o.position.set(...pos);o.scale.set(...size);p.add(o);return o;}
export function makeDie(parent,name,size=.22){
 const g=new THREE.Group();g.name=name;parent.add(g);box(g,'wooden die body',0xd9b77e,[0,0,0],[size,size,size]);
 const faces=[[0,0,1,0,0,1],[0,0,-1,0,Math.PI,6],[1,0,0,0,Math.PI/2,3],[-1,0,0,0,-Math.PI/2,4],[0,1,0,-Math.PI/2,0,5],[0,-1,0,Math.PI/2,0,2]];
 for(const [x,y,z,rx,ry,num] of faces){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#dcc18d';ctx.fillRect(0,0,128,128);ctx.strokeStyle=ctx.fillStyle='#4a4437';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';
  if(num===1){ctx.strokeRect(43,48,42,43);ctx.beginPath();ctx.moveTo(37,47);ctx.lineTo(64,28);ctx.lineTo(91,47);ctx.moveTo(48,97);ctx.lineTo(80,97);ctx.moveTo(52,25);ctx.quadraticCurveTo(64,5,76,25);ctx.moveTo(63,58);ctx.quadraticCurveTo(51,75,65,81);ctx.quadraticCurveTo(77,70,63,58);ctx.stroke();}
  else{const dots=num===2?[[.25,.25],[.75,.75]]:num===3?[[.25,.25],[.5,.5],[.75,.75]]:num===4?[[.25,.25],[.75,.25],[.25,.75],[.75,.75]]:num===5?[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]]:[[.25,.25],[.75,.25],[.25,.5],[.75,.5],[.25,.75],[.75,.75]];for(const [u,v] of dots){ctx.beginPath();ctx.arc(u*128,v*128,8,0,Math.PI*2);ctx.fill();}}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const face=new THREE.Mesh(new THREE.PlaneGeometry(size*.91,size*.91),new THREE.MeshBasicMaterial({map:tex}));face.name=num===1?'die face lantern mark':'die face pips '+num;face.position.set(x*size*.508,y*size*.508,z*size*.508);face.rotation.set(rx,ry,0);g.add(face);
 }return g;
}
export function prepareHall(root){
 const hall=root.getObjectByName('old festival hall'),solid=hall.getObjectByName('timber building');solid.visible=false;
 for(const [x,w] of [[-2.45,3.1],[2.45,3.1]])box(hall,'timber facade wing',0x8b7957,[x,1.8,2.44],[w,3.6,.14]);box(hall,'timber door header',0x8b7957,[0,3.28,2.44],[1.8,.64,.14]);
 for(const x of [-3.94,3.94])box(hall,'timber side wall',0x8b7957,[x,1.8,0],[.12,3.6,5]);box(hall,'timber back wall',0x4a4b42,[0,1.8,-2.44],[8,3.6,.12]);
 for(const o of [...hall.children])if(o.name==='weatherboard'&&o.position.y<2.95){o.visible=false;for(const x of [-2.45,2.45])box(hall,'split weatherboard',0x73634c,[x,o.position.y,2.51],[3.1,.024,.04]);}
 const entrance=hall.getObjectByName('entrance door');for(const n of ['door frame','doorway shadow'])entrance.getObjectByName(n).visible=false;
 for(const x of [-.86,.86])box(entrance,'door frame upright',0xc5b98f,[x,1.175,-.03],[.14,2.5,.12]);box(entrance,'door frame lintel',0xc5b98f,[0,2.42,-.03],[1.85,.14,.12]);
 box(hall,'dark interior beyond doorway',0x17222b,[0,1.6,.7],[1.8,3.0,.08]);box(hall,'dark interior floor',0x283536,[0,.38,1.5],[1.8,.1,2.5]);
 const steps=hall.children.filter(o=>o.name==='hall step');steps.forEach((o,i)=>{o.position.y=.055*(i+1);o.scale.y=.11*(i+1);});
 const hinge=hall.getObjectByName('hall door hinge');hinge.rotation.y=0;
 return {hall,hinge};
}
export function prepareDrawer(root){
 const desk=root.getObjectByName('writing desk');for(const o of desk.children)if(['drawer front','drawer pull'].includes(o.name))o.visible=false;
 // Make the upper drawer an actual moving assembly with an open tray.
 const block=desk.getObjectByName('desk drawers');block.visible=false;box(desk,'desk drawer cabinet side',0xa5895b,[.44,.48,0],[.08,.84,.9]);box(desk,'desk drawer cabinet side',0xa5895b,[1.06,.48,0],[.08,.84,.9]);
 for(const y of [.25,.5]){box(desk,'lower drawer front',0xb99a6b,[.75,y,.46],[.63,.2,.04]);box(desk,'drawer pull',0x6e6850,[.75,y,.50],[.12,.035,.04]);}
 const drawer=new THREE.Group();drawer.name='working upper drawer';drawer.position.set(.75,.75,.46);desk.add(drawer);box(drawer,'drawer front',0xb99a6b,[0,0,0],[.63,.20,.045]);box(drawer,'drawer pull',0x6e6850,[0,0,.04],[.12,.035,.04]);box(drawer,'drawer tray',0x8c6f48,[0,-.1,-.35],[.57,.04,.7]);for(const x of [-.28,.28])box(drawer,'drawer tray side',0xb99a6b,[x,-.025,-.35],[.035,.15,.7]);
 const sock=box(root,'safety sock',0x8b9b94,[2.35,.22,-1.7],[.35,.15,.5]);sock.rotation.y=-.25;sock.visible=false;
 const mint=box(root,'pocket mint',0xe7e1c4,[1.98,1.04,-2.4],[.12,.04,.08]);const keys=new THREE.Mesh(new THREE.TorusGeometry(.045,.008,6,20),m(0xb7a36e));keys.name='pocket keys';keys.rotation.x=Math.PI/2;keys.position.set(2.15,1.05,-2.44);root.add(keys);box(keys,'key',0xb7a36e,[.06,0,0],[.1,.015,.025]);
 return {desk,drawer,sock,mint,keys};
}
