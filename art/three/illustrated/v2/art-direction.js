import * as THREE from 'three';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
import {drawnFir,drawnBroadleaf} from './shapes.js';
import {surfaceHeight,SHORE} from '../../sets/lake-world/landscape.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),round=new RoundedBoxGeometry(1,1,1,3,.065);
function mat(color){return new THREE.MeshStandardMaterial({color,roughness:1});}
function mesh(parent,name,geometry,color,p=[0,0,0],s=[1,1,1]){const m=new THREE.Mesh(geometry,mat(color));m.name=name;m.position.set(...p);m.scale.set(...s);parent.add(m);return m;}
const box=(p,n,c,pos,size)=>mesh(p,n,round,c,pos,size);
function curve(p,n,c,points,r=.012){return mesh(p,n,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>V(...a))),20,r,5,false),c);}
function leafGeometry(){const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.18,.18,-.17,.43,0,.64);s.bezierCurveTo(.16,.40,.19,.17,0,0);return new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:1,steps:1});}
const leaf=leafGeometry();
function botanical(plant,index){
 for(const o of plant.children)if(['leaf','stem'].includes(o.name))o.visible=false;
 for(let i=0;i<8;i++){
  const a=i*2.399+index*.7,h=.55+(i%4)*.15,x=Math.cos(a)*(.18+i*.016),z=Math.sin(a)*.20;
  curve(plant,'graceful plant stem',0x536b3e,[[0,.39,0],[x*.45,h*.8,z*.4],[x,h,z]],.009);
  const l=mesh(plant,'hand shaped leaf',leaf,[0x4c794b,0x6d9355,0x8caa61][i%3],[x,h-.12,z],[.8+(i%3)*.15,.8+(i%2)*.2,1]);l.rotation.set(-.15+Math.sin(a)*.25,a*.45,Math.cos(a)*.55);
  curve(l,'leaf midrib',0xb2bc77,[[0,.04,.043],[.012,.28,.045],[0,.57,.041]],.0035);
 }
}
function patch(root,x,z,rx,rz,color,seed){
 const shape=new THREE.Shape();for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,k=1+.10*Math.sin(a*3+seed);const px=x+Math.cos(a)*rx*k,pz=z+Math.sin(a)*rz*k;i?shape.lineTo(px,pz):shape.moveTo(px,pz);}shape.closePath();
 const g=new THREE.ShapeGeometry(shape),p=g.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getY(i);p.setXYZ(i,xx,surfaceHeight(xx,zz)+.022,zz);}g.computeVertexNormals();const m=mesh(root,'painted color patch',g,color);m.material.side=THREE.DoubleSide;return m;
}
function frame(root,x,y,z,w,h,index){const g=new THREE.Group();g.name='botanical wall art';g.position.set(x,y,z);root.add(g);box(g,'picture frame',0x795940,[0,0,0],[w+.1,h+.1,.06]);box(g,'picture paper',0xeee0b9,[0,0,.04],[w,h,.015]);
 for(let i=0;i<4;i++){const l=mesh(g,'botanical painting',leaf,[0xb9764d,0x6d8555,0xc8a367][(i+index)%3],[-w*.3+i*w*.2,-h*.3,.055],[w*.5,h*.65,.2]);l.rotation.z=(i%2?-.5:.4);}}
function apartmentDetails(root){
 const sofa=root.getObjectByName('orange sofa');
 if(sofa){for(const [x,c,r] of [[.85,0xe6c78e,-.13],[-1.0,0x9ba681,.12]]){const cushion=box(sofa,'soft decorative cushion',c,[x,1.03,-.23],[.51,.48,.21]);cushion.rotation.z=r;}
  const cols=12,rows=18,pos=[],uv=[],idx=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const u=x/cols,v=y/rows;pos.push(-1.48+u*.56,1.2-v*.72+.10*Math.cos(v*Math.PI),.14+v*.42+.022*Math.sin(u*Math.PI*6));uv.push(u,v);}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const cloth=mesh(sofa,'draped woven throw',g,0x7b927f);cloth.material.side=THREE.DoubleSide;
  for(let i=0;i<5;i++)curve(sofa,'cloth fold',0x586f60,[[-1.43+i*.1,1.28,.15],[-1.43+i*.1,1.02,.35],[-1.43+i*.1,.65,.55]],.006);
 }
 frame(root,3.0,2.7,-3.78,.7,.95,0);frame(root,4.1,2.8,-3.78,.7,1.15,1);
 const shelf=root.getObjectByName('left wall shelves');if(shelf){mesh(shelf,'ceramic shelf vase',new THREE.LatheGeometry([[0,0],[.10,0],[.14,.13],[.08,.25],[.06,.32]].map(p=>new THREE.Vector2(...p)),16),0xc89b77,[.25,.77,.05]);box(shelf,'small framed picture',0x7d674f,[-.28,.96,.06],[.30,.35,.05]);box(shelf,'picture paper',0xd1bb85,[-.28,.96,.10],[.23,.28,.01]);}
}
function sweep(root,points,width,color){
 const path=new THREE.CatmullRomCurve3(points.map(p=>V(p[0],0,p[1]))),pos=[],uv=[],idx=[];for(let i=0;i<=80;i++){const u=i/80,p=path.getPoint(u),t=path.getTangent(u),n=V(-t.z,0,t.x).normalize();for(const side of [-1,1]){const x=p.x+n.x*width*.5*side,z=p.z+n.z*width*.5*side;pos.push(x,surfaceHeight(x,z)+.028,z);uv.push(side>0?1:0,u);}if(i<80){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=mesh(root,'painted color patch shoreline sweep',g,color);m.material.side=THREE.DoubleSide;return m;
}
export function installArtDirection(modeled){
 const audit={version:2,forestGroups:0,forestOpenings:0,shorelineSweeps:0,paintedPatches:0,foregroundGroups:0,plants:0,softArchitecture:0,apartmentDetails:false};
 for(const [id,root] of Object.entries(modeled)){
  const objects=[];root.traverse(o=>objects.push(o));
  if(root.userData.lakeWorld){
   const cache=new Map();const matrix=new THREE.Matrix4(),p=V(),q=new THREE.Quaternion(),s=V();
   for(const o of objects)if(o.isInstancedMesh&&/forest trunks|fir canopies|broadleaf canopies/.test(o.name)){
    for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);matrix.decompose(p,q,s);const key=p.x.toFixed(2)+'/'+p.z.toFixed(2);let setting=cache.get(key);if(!setting){const rhythm=Math.sin(p.x*.19)+Math.cos(p.z*.14)+Math.sin((p.x-p.z)*.10);const open=rhythm<-.72;setting={open,scale:.78+.24*(.5+.5*Math.sin(p.x*.31+p.z*.23)),group:Math.floor((Math.sin(p.x*.1)+1)*1.49)};cache.set(key,setting);if(open)audit.forestOpenings++;else audit.forestGroups++;}
     const ground=surfaceHeight(p.x,p.z);p.y=ground+(p.y-ground)*setting.scale;s.multiplyScalar(setting.open?.001:setting.scale);matrix.compose(p,q,s);o.setMatrixAt(i,matrix);
     if(o.instanceColor){const c=new THREE.Color([0x3b7754,0x538754,0x739853][setting.group]);o.setColorAt(i,c);}
    }o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();
   }
   sweep(root,SHORE.filter(([x,z])=>z>-7&&x>-26&&x<23).map(([x,z])=>[x,z+.55]),.32,0xf1d18a);sweep(root,[[-12,6.4],[-10,4.9],[-8.4,3.2],[-6.3,2],[-6.2,.65]],.52,0xf1cf87);audit.shorelineSweeps+=2;
   for(const [x,z,rx,rz,c] of [[-12,3,4,1.1,0xf6c967],[-6,3.8,3,1.1,0xeac16b],[5,3.5,4,1.4,0xe1bc65],[11,2.4,3,.8,0xf6cf79],[-17,-1.4,2.6,1.0,0xe5bd67],[-10,6,4,1.5,0xa8b76a],[7,6.5,5,1.2,0xacc477]]){patch(root,x,z,rx,rz,c,x);audit.paintedPatches++;}
   for(const [x,z,scale] of [[-12,5.3,1.3],[11,4.7,1.1],[-18,1,1.4]]){const g=new THREE.Group();g.name='foreground botanical framing';g.position.set(x,surfaceHeight(x,z),z);g.scale.setScalar(scale);root.add(g);botanical(g,1);for(let i=0;i<3;i++)mesh(g,'rounded framing stone',new THREE.IcosahedronGeometry(1,2),[0x99a18a,0xb5ac8d,0x83968a][i],[.3+i*.4,.13+i*.03,.2],[.4,.22,.29]);audit.foregroundGroups++;}
  }
  let plantIndex=0;for(const o of objects){
   if(o.name==='potted plant'){botanical(o,plantIndex++);audit.plants++;}
   if(o.isMesh&&/gable roof|varied cottage gable|modeled gable roof|pitched roof|canopy|porch post|house walls|timber building/.test(o.name)&&!o.isInstancedMesh){const geo=o.geometry.clone(),p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x+.012*Math.sin(y*3+z),y+.012*Math.sin(x*2.1+z),z);}geo.computeVertexNormals();o.geometry=geo;audit.softArchitecture++;}
  }
  if(id==='apartment'){apartmentDetails(root);audit.apartmentDetails=true;}
  if(id==='hall_outside'){
   const fir=drawnFir();let index=0;for(const [cx,cz,count] of [[-15,-11,7],[-7,-18,5],[10,-15,6],[18,-7,6]])for(let i=0;i<count;i++){const x=cx+Math.cos(i*2.4)*3.4,z=cz+Math.sin(i*2.4)*2.2,scale=1.0+(i%3)*.25;mesh(root,'far fir canopies',fir,[0x3e7254,0x618451,0x769557][i%3],[x,0,z],[scale,scale,scale]);mesh(root,'background forest trunks',new THREE.CylinderGeometry(.1,.15,2.1,8),0x795c42,[x,scale,z],[scale,scale,scale]);index++;}
   for(const x of [-6.5,6.2]){const g=new THREE.Group();g.name='foreground botanical framing';g.position.set(x,0,6);g.scale.setScalar(1.3);root.add(g);botanical(g,1);audit.foregroundGroups++;}
   for(const [x,z,s] of [[-3,3,1.2],[4,2,1.0],[-5,8,.8]]){const g=new THREE.Group();g.name='framing stone group';root.add(g);mesh(g,'rounded framing stone',new THREE.IcosahedronGeometry(1,2),0x9a9d7c,[x,.18,z],[s,.32,s*.7]);}
   audit.forestGroups+=index;
  }
  if(id==='bash_home'){const shell=root.getObjectByName('room shell'),floor=shell.getObjectByName('floor slab');floor.scale.z*=2;floor.position.z=2;for(const name of ['back wall','left wall','right wall']){const wall=shell.getObjectByName(name);wall.scale.y*=1.5;wall.position.y=3;if(name!=='back wall'){wall.scale.x*=2;wall.position.z=2;}}frame(root,-.9,2.9,-3.81,.6,.85,1);box(root,'bedside slippers',0xb49366,[-3.7,.08,.5],[.34,.14,.55]);box(root,'bedside slippers',0xb49366,[-3.2,.08,.55],[.34,.14,.55]);}
  root.userData.artDirection=audit;root.updateMatrixWorld(true);
 }
 return {audit};
}
