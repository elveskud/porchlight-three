import * as THREE from 'three';
import {createKit} from '../art/three/sets/primitives.js';
import {buildSet,disposeSet} from '../art/three/sets/build.js';
import {SETS} from '../art/three/sets/catalog.js';

// Reuse the actual first-six set geometry for the matching town silhouettes.
// The detached fragments retain their named door pivots, materials and porch details.
export function buildLandmark(site,parent) {
 const reuse={apt:['stoop_sunset','brick apartment facade'],hall:['hall_outside','old festival hall'],tower:['lake','lifeguard lookout'],brook:['brook_porch','Mrs. Brook’s porch'],walt:['walt_porch','Walt’s porch']};
 if(reuse[site.id]) {
  const [id,name]=reuse[site.id],source=buildSet(SETS.find(s=>s.id===id)),piece=source.getObjectByName(name);
  if(piece){piece.removeFromParent();piece.traverse(o=>{if(o.material)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();});piece.position.set(0,0,0);piece.scale.multiplyScalar(.04);parent.add(piece);piece.traverse(o=>{if(o.isPointLight){o.distance*=.04;o.intensity*=.0016;}});disposeSet(source);
    if(site.id==='walt'||site.id==='brook'){const body=new THREE.Mesh(new THREE.BoxGeometry(.44,.22,.34),new THREE.MeshStandardMaterial({color:site.id==='brook'?0xb9c6ac:0xbab187,roughness:.9}));body.name='house behind porch';body.position.set(site.id==='brook'?.4:0,.11,site.id==='brook'?0:-.26);parent.add(body);}
    return true;}
 }
 const k=createKit(parent,'day');const {group,mesh,box,sphere,cylinder,beam,torus,window,door,bench,tree,table,plant,label}=k;
 const g=group(site.name);g.scale.setScalar(.02);
 function roof(w,d,h,color=0x6f6657) {
  const sh=new THREE.Shape();sh.moveTo(-d/2,0);sh.lineTo(0,3);sh.lineTo(d/2,0);sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-w/2,h,0);mesh('pitched roof',geo,color,[0,0,0],null,g);
 }
 function house() {
  const colors={bash:0xc6b68e,pip:0xc5c8aa,grandpa:0xbcb19a};
  box('house walls',colors[site.id]||0xd1c19b,[0,2.8,0],[13,5.6,11],g);roof(14,12,5.6);
  door([1,0,5.6],g,0x456a74,1.5,3);
  for(const x of [-4,4])window([x,3.2,5.6],1.7,2,g);
  box('front porch',0xaf9367,[0,.3,7],[13.5,.6,3],g);
  for(const x of [-6,6])box('porch post',0xe0d8bf,[x,2.7,8],[.18,4.8,.18],g);
  box('porch canopy',0x7c7d6b,[0,5.2,7],[14,.15,3.5],g);bench([-3,.6,6.8],0,g);plant([5,.6,7],2,false,g);
  if(site.id==='pip') {box('attached garage',0xa5b1a3,[10,2.2,-.5],[7,4.4,10],g);box('garage door',0x839b9a,[10,2,4.55],[5.8,4,.1],g);}
 }
 if(site.model==='familyHouse'){house();return true;}
 if(site.id==='stage'){
  box('festival stage platform',0xa68351,[0,.6,0],[17,1.2,9],g);for(const x of [-8,8])box('bunting pole',0x7f7051,[x,4,-3],[.15,8,.15],g);
  beam('bunting string',0x746849,[-8,7.5,-3],[8,7.5,-3],.035,g);for(let i=0;i<11;i++)mesh('festival pennant',new THREE.ConeGeometry(.5,1,3),[0xb7624e,0xdbbd72,0x719c9b][i%3],[-7+i*1.4,6.9,-3],null,g,{rotation:[0,0,Math.PI]});return true;
 }
 if(site.id==='townline') {for(const x of [-2.5,2.5])box('signpost',0x756b4c,[x,2,0],[.18,4,.18],g);box('town boundary sign',0xe2d6ad,[0,4,0],[6.5,2,.15],g);label('Maple Hollow sign','MAPLE HOLLOW',[0,4,.1],6.2,1.7,undefined,undefined,g);return true;}
 if(site.id==='square'){
  cylinder('bandstand base',0xd8cfad,[0,.2,0],6,.4,g);for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder('bandstand post',0xddd8bb,[Math.cos(a)*5,2.5,Math.sin(a)*5],.1,5,g);}mesh('bandstand roof',new THREE.ConeGeometry(7,3,8),0x729288,[0,6,0],null,g);return true;
 }
 if(site.id==='school') {
  box('brick classroom wing',0xb77f60,[-3,3.5,0],[35,7,15],g);box('gymnasium wing',0xb7aa79,[14,4.5,-6],[17,9,23],g);
  box('school roof',0x727963,[-3,7.15,0],[36,.3,16],g);box('gym roof',0x7c806b,[14,9.15,-6],[18,.3,24],g);
  for(let x=-17;x<12;x+=4)window([x,4,7.6],2.4,2.8,g);door([0,0,7.6],g,0x526f6b,2.2,3.8);return true;
 }
 if(site.id==='mayor') {
  box('town hall',0xd8cfab,[0,4,0],[23,8,14],g);roof(24,15,8,0x747b6c);box('clock tower',0xc3b993,[0,11,0],[5,8,5],g);
  mesh('clock tower roof',new THREE.ConeGeometry(4.3,4,4),0x6c7468,[0,17,0],null,g,{rotation:[0,Math.PI/4,0]});
  cylinder('town clock',0xeee6c9,[0,12.8,2.56],1.6,.12,g).rotation.x=Math.PI/2;beam('clock hand',0x47574a,[0,12.8,2.65],[0,13.9,2.65],.06,g);beam('clock hand',0x47574a,[0,12.8,2.65],[-.8,12.4,2.65],.07,g);
  door([0,0,7.1],g,0x59776b,2,3.8);for(const x of [-8,8])window([x,4.5,7.1],3,3,g);return true;
 }
 if(site.id==='garage') {
  box('radio workshop',0xc8b990,[0,3.3,0],[22,6.6,15],g);box('flat workshop roof',0x747b6d,[0,6.8,0],[23,.4,16],g);
  box('garage opening',0x526b69,[-3,2.5,7.6],[11,5,.12],g);door([8,0,7.6],g,0x7e8e6c,1.8,3.5);
  beam('radio aerial',0x4e5b52,[7,7,-3],[7,19,-3],.1,g);for(const y of [11,15,18])beam('aerial arm',0x4e5b52,[4,y,-3],[10,y,-3],.06,g);return true;
 }
 if(site.id==='park') {
  box('park lawn',0x9fba74,[0,.1,0],[83,.2,54],g,{ink:false});tree([10,0,-4],5,false,g);for(const p of [[15,0,10],[-8,0,-12]])bench(p,0,g);for(const x of [-22,-36])table([x,0,5],5,2.2,1.5,g);return true;
 }
 if(site.id==='dock'||site.id==='marina') {
  const count=site.id==='marina'?3:1;for(let j=0;j<count;j++)for(let i=0;i<15;i++)box('dock plank',0xb2935d,[j*8,i*.0+.25,-i*.9],[3.3,.25,.8],g);
  return true;
 }
 if(site.id==='snack') {
  box('snack shelter',0xc7ab78,[0,2,0],[8,4,6],g);roof(9,7,4,0x9c6e4e);box('serving hatch',0x44655d,[0,2.4,3.1],[5,1.8,.1],g);box('hatch counter',0x866f4f,[0,1.45,3.6],[5.5,.15,1.3],g);return true;
 }
 if(site.id==='rock') {sphere('large lakeside rock',0x929e94,[0,2,0],[4,3,3],g);return true;}
 if(['beach','forest','trails','mainstreet','roadout'].includes(site.id))return true;
 if(site.id==='shops') {
  for(let i=0;i<3;i++){const shop=group('small shop',[-15+i*15,0,0],g);box('shop walls',[0xb9c2a0,0xc9a8ac,0xccbd92][i],[0,3.5,0],[14,7,12],shop);window([-2,3,6.1],6,3,shop);door([4.5,0,6.1],shop,0x608574,1.3,3);for(let j=0;j<8;j++)box('striped awning',j%2?0xe8d99e:0x7f9b72,[-6.5+j*1.8,5,7],[1.7,.2,2],shop);}
  return true;
 }
 if(site.id==='notice') {for(const x of [-1.2,1.2])box('board post',0x806c47,[x,1.2,0],[.15,2.4,.15],g);box('notice board',0x896a43,[0,2.1,0],[3.4,1.8,.15],g);label('meeting notice','TOWN MEETING',[0,2.1,.09],3,1.4,undefined,undefined,g);return true;}
 return false;
}
