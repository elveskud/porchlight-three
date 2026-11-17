import * as THREE from 'three';
import {seeded,surfaceHeight as groundHeight,signedShore,SHORE} from './landscape.js';
import {SITES,SHOTS} from './layout.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function occupied(x,z){if(x>40&&x<85&&z>-56&&z<-28)return true;if(SHOTS.some(s=>Math.hypot(x-s.position[0],z-s.position[2])<5.5))return true;return SITES.some(s=>Math.hypot(x-s.position[0],z-s.position[1])<8)||Math.abs(x-15)<9&&Math.abs(z+30)<9||x>4&&x<27&&z<-20&&z>-29;}
function pathClear(root,x,z,margin){let clear=true;root.traverse(o=>{if(!clear||!o.userData.walkable)return;const line=o.userData.centerline;for(const p of line)if(Math.hypot(x-p[0],z-p[1])<o.userData.width*.5+margin){clear=false;break;}});return clear;}
function instances(root,name,geometry,color,placements,cast=false){const m=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.94}),placements.length),dummy=new THREE.Object3D();m.name=name;root.add(m);for(let i=0;i<placements.length;i++){const p=placements[i];dummy.position.fromArray(p.position);dummy.rotation.set(0,p.rotation||0,0);dummy.scale.fromArray(p.scale||[1,1,1]);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);if(p.color)m.setColorAt(i,new THREE.Color(p.color));}m.castShadow=cast;m.receiveShadow=true;m.computeBoundingBox();m.computeBoundingSphere();return m;}
export function populateVegetation(k){
 const random=seeded(4917),trees=[],near=[],far=[];let attempts=0;
 while(near.length<1200&&attempts++<16000){const x=-86+random()*187,z=-82+random()*147,d=signedShore(x,z);if(d<7||occupied(x,z)||x>-24&&x<28&&z>-5&&z<25||x>8&&x<43&&z>5&&z<32||!pathClear(k.root,x,z,1.5))continue;const s=.7+random()*.85;near.push({x,z,s,rotation:random()*6.28,broad:random()>.72});}
 attempts=0;while(far.length<1700&&attempts++<15000){const x=-215+random()*430,z=-210+random()*410;if(Math.hypot(x,z+12)<85||occupied(x,z)||!pathClear(k.root,x,z,1.5))continue;const s=1.0+random()*1.45;far.push({x,z,s,rotation:random()*6.28,broad:random()>.78});}
 trees.push(...near,...far);
 // Curved tier silhouettes are fully volumetric, with no flat backdrop cards.
 const profile=[[.05,4.7],[.29,4.25],[.55,3.75],[.76,3.25],[.62,3.28],[.90,2.70],[1.1,2.2],[.91,2.22],[1.2,1.6],[1.28,1.3],[0,1.3]].reverse().map(([r,y])=>new THREE.Vector2(r,y));
 const firGeo=new THREE.LatheGeometry(profile,14),broadGeo=new THREE.SphereGeometry(1,14,10),trunkGeo=new THREE.CylinderGeometry(.105,.18,2.1,8);
 for(const [label,list,cast] of [['near',near,true],['far',far,false]]){
  const trunks=[],firs=[],broad=[];for(const t of list){const y=groundHeight(t.x,t.z),jitter=.95+random()*.08,color=new THREE.Color([0x426c49,0x5a814f,0x6c9159,0x507750][Math.floor(random()*4)]).multiplyScalar(jitter);
   trunks.push({position:[t.x,y+t.s, t.z],scale:[t.s,t.s,t.s],rotation:t.rotation});
   if(t.broad)broad.push({position:[t.x,y+2.7*t.s,t.z],scale:[1.35*t.s,1.40*t.s,1.13*t.s],rotation:t.rotation,color:color.getHex()});
   else firs.push({position:[t.x,y,t.z],scale:[t.s,t.s,t.s],rotation:t.rotation,color:color.getHex()});
  }
  instances(k.root,`${label} forest trunks`,trunkGeo,0x796047,trunks,cast);instances(k.root,`${label} fir canopies`,firGeo,0xffffff,firs,cast);instances(k.root,`${label} broadleaf canopies`,broadGeo,0xffffff,broad,cast);
 }
 const rocks=[];for(let i=0;i<100;i++){const a=random()*SHORE.length,[x,z]=SHORE[Math.floor(a)],d=V(x,0,z+13).normalize(),xx=x+d.x*(.7+random()*1.1),zz=z+d.z*(.7+random()*1.1);if(Math.abs(xx)<10&&zz>-5)continue;const s=.10+random()*.32;rocks.push({position:[xx,groundHeight(xx,zz)+s*.35,zz],scale:[s*1.4,s*.85,s],rotation:random()*6.28,color:[0x9da58f,0xb0ad93,0x879c91][i%3]});}instances(k.root,'shoreline scattered stones',new THREE.IcosahedronGeometry(1,1),0xffffff,rocks,true);
 const blades=[],seedheads=[];for(let i=0;i<350;i++){const [x,z]=SHORE[Math.floor(random()*SHORE.length)],out=V(x,0,z+13).normalize(),xx=x+out.x*(.4+random()*.6),zz=z+out.z*(.4+random()*.6);if(Math.abs(xx)<9&&zz>-6)continue;const y=groundHeight(xx,zz),h=.45+random()*.48;blades.push({position:[xx,y+h*.5,zz],scale:[1,h,1],rotation:0});seedheads.push({position:[xx,y+h+.055,zz],scale:[1,.8+random()*.5,1]});}
 instances(k.root,'shore reed stems',new THREE.CylinderGeometry(.012,.017,1,5),0x6c7845,blades);instances(k.root,'shore cattail seed heads',new THREE.CylinderGeometry(.038,.038,.18,7),0x89603e,seedheads);
 const grass=[];for(let i=0;i<3200;i++){const x=-72+random()*158,z=-52+random()*107,d=signedShore(x,z);if(d<5.5||d>23||occupied(x,z)||!pathClear(k.root,x,z,.15)||Math.abs(x+2)<18&&z<12&&z>-4)continue;const h=.08+random()*.17;grass.push({position:[x,groundHeight(x,z),z],scale:[.11+random()*.13,h,.11+random()*.13],rotation:random()*6.28,color:[0x78974e,0x91a35c,0xa0ad66][i%3]});}
 const tuft=new THREE.BufferGeometry();tuft.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,-.15,1,.1,.12,0,0,0,0,-.5,.1,.85,.1,0,0,.4],3));tuft.computeVertexNormals();const gm=instances(k.root,'summer grass tufts',tuft,0xffffff,grass);gm.material.side=THREE.DoubleSide;
 const shrubs=[];for(let i=0;i<450;i++){const x=-70+random()*145,z=-50+random()*95,d=signedShore(x,z);if(d<6||d>18||occupied(x,z)||x>-20&&x<25&&z>-5&&z<25||!pathClear(k.root,x,z,.8))continue;const s=.30+random()*.65;shrubs.push({position:[x,groundHeight(x,z)+s*.35,z],scale:[s,s*.65,s*.8],rotation:random()*6.28,color:[0x6c874c,0x839452,0x698a56][i%3]});}instances(k.root,'shore woodland shrubs',new THREE.IcosahedronGeometry(1,2),0xffffff,shrubs,true);
 k.root.userData.lakeWorld.treeCount=trees.length;k.root.userData.lakeWorld.grassClumps=grass.length;k.root.userData.lakeWorld.stones=rocks.length;k.root.userData.lakeWorld.reeds=blades.length;
 k.root.userData.lakeWorld.forest=trees.map(t=>[+t.x.toFixed(2),+t.z.toFixed(2),+t.s.toFixed(2)]);
}
