import * as THREE from 'three';
import {RoundedBoxGeometry} from '../../../vendor/addons/geometries/RoundedBoxGeometry.js';
const sphere=new THREE.SphereGeometry(1,20,14),cube=new RoundedBoxGeometry(1,1,1,3,.045);
export function mesh(parent,name,geo,color,p=[0,0,0],s=[1,1,1]){const o=new THREE.Mesh(geo,new THREE.MeshToonMaterial({color}));o.name=name;o.position.set(...p);o.scale.set(...s);parent.add(o);return o;}
export const ball=(p,n,c,pos,s)=>mesh(p,n,sphere,c,pos,s);
export const box=(p,n,c,pos,s)=>mesh(p,n,cube,c,pos,s);
export function line(parent,name,pts,color,r=.012){return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),20,r,6,false),color);}
export function shape(parent,name,pts,color,z=.31,depth=.04){const q=new THREE.Shape();pts.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.closePath();return mesh(parent,name,new THREE.ExtrudeGeometry(q,{depth,bevelEnabled:true,bevelSize:.01,bevelThickness:.005,bevelSegments:2}),color,[0,0,z]);}
export function colour(o,color){if(!o?.isMesh||!o.material?.color||o.material.side===THREE.BackSide)return;o.material=o.material.clone();o.material.color.setHex(color);}
export function hide(r,pattern){r.root.traverse(o=>{if(pattern.test(o.name))o.visible=false;});}
export function shirt(r,color,dark=color){
 for(const o of r.spine.children)if(o.isMesh){if(!o.name&&o.position.z>.25)o.visible=false;else if(o===r.refined.body||!o.name)colour(o,color);}
 r.root.traverse(o=>{if(/tailored torso|sleeve|soft elbow seam|cuff|hem fabric|hem rib|hoodie/.test(o.name))colour(o,/seam|rib|fold/.test(o.name)?dark:color);});
 for(const arm of [r.armL,r.armR])arm.sh.traverse(o=>{let p=o;while(p){if(p===r.hands.L.wrist||p===r.hands.R.wrist)return;p=p.parent;}colour(o,color);if(o.isMesh&&!o.name&&o.geometry?.type==='BoxGeometry'&&o.position.z>.1)o.visible=false;});
 hide(r,/pocket opening|drawstring|zipper|hood opening|stripe/);
}
export function trousers(r,color,width=1.65){r.pelvis.traverse(o=>{
 if(o.name==='continuous leg')colour(o,color);
 if(o.name!=='continuous leg'&&o.name!=='leg outline')return;
 o.geometry=o.geometry.clone();const a=o.geometry.attributes.position;let centre=0;for(let i=0;i<a.count;i++)centre+=a.getX(i);centre/=a.count;
 for(let i=0;i<a.count;i++)a.setX(i,centre+(a.getX(i)-centre)*width);a.needsUpdate=true;o.geometry.computeVertexNormals();
 });}
export function glasses(r,color=0x65706a,radius=.19,y=.57){for(const side of [-1,1]){mesh(r.head,'round spectacles',new THREE.TorusGeometry(radius,.013,6,36),color,[side*.29,y,.455],[1,1,.6]);line(r.head,'spectacle temple',[[side*.47,y,.45],[side*.68,y,.13]],color,.009);}line(r.head,'spectacle bridge',[[-.1,y,.46],[0,y+.025,.47],[.1,y,.46]],color,.009);}
export function collar(r,color=0xe9e5d6){for(const side of [-1,1])shape(r.spine,'shirt collar',[[side*.03,1.2],[side*.32,1.18],[side*.18,.99]],color,.33,.025);}
export function buttons(r,color=0x414b40){for(const y of [.35,.62,.88])ball(r.spine,'shirt button',color,[0,y,.344],[.025,.025,.016]);}
