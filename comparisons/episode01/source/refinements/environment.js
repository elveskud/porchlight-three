import * as THREE from 'three';
import {RoundedBoxGeometry} from '../../../../art/three/vendor/addons/geometries/RoundedBoxGeometry.js';
import {paint,radial,skyTexture} from './surfaces.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp;
const unitRound=new RoundedBoxGeometry(1,1,1,3,.045),sphere=new THREE.SphereGeometry(1,18,12),shadowMap=radial('40,31,25');
function mat(c,extra={}){return new THREE.MeshStandardMaterial({color:c,roughness:.91,...extra});}
function object(parent,name,geo,color,p=[0,0,0],scale=[1,1,1],extra={}){const m=new THREE.Mesh(geo,mat(color,extra));m.name=name;m.position.set(...p);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const box=(p,n,c,pos,size)=>object(p,n,unitRound,c,pos,size);
const ball=(p,n,c,pos,size)=>object(p,n,sphere,c,pos,size);
function line(parent,name,points,color,r=.01){return object(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p))),20,r,5,false),color);}
function shadow(parent,p,w,d,opacity=.24){const s=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,opacity,depthWrite:false,toneMapped:false}));s.name='soft contact shadow';s.rotation.x=-Math.PI/2;s.position.set(...p);s.renderOrder=2;parent.add(s);return s;}
function treeShape(tree,index){
 const pine=tree.name==='fir tree',old=[];tree.traverse(o=>{if(o.name==='fir crown'||o.name==='leaf canopy')old.push(o);});old.forEach(o=>o.visible=false);
 if(pine){
  for(let tier=0;tier<3;tier++){
   const radius=1.08-tier*.20,height=1.5-tier*.15,points=[];
   for(let j=0;j<=12;j++){const u=j/12,r=radius*Math.pow(Math.sin(u*Math.PI*.52),.7)*(1+.055*Math.sin(j*2.7+index));points.push(new THREE.Vector2(r,height*(1-u)));}
   const geo=new THREE.LatheGeometry(points.reverse(),11);geo.computeVertexNormals();const crown=object(tree,'sculpted fir foliage',geo,[0x3c704c,0x578457,0x6c945d][(index+tier)%3],[.05*Math.sin(index+tier),1.10+tier*.61,0]);crown.rotation.y=index*.73+tier*.4;crown.scale.x=1+.09*Math.sin(index);crown.userData.wind=true;
  }
 }else{
  for(let i=0;i<7;i++){const a=i*2.399+index*.4,y=2.25+(i%3)*.33,c=object(tree,'sculpted broadleaf foliage',new THREE.IcosahedronGeometry(1,2),[0x63844d,0x759653,0x54784b][(index+i)%3],[Math.cos(a)*.62,y,Math.sin(a)*.45],[.87+(i%2)*.12,.78,.72]);c.rotation.y=a;c.userData.wind=true;}
 }
 const k=1+.08*Math.sin(index*2.6);tree.scale.multiplyScalar(k);tree.rotation.y+=Math.sin(index)*.3;
}
function personalize(root){
 const sofa=root.getObjectByName('orange sofa'),bean=root.getObjectByName('green beanbag'),coffee=root.getObjectByName('game coffee table');
 // Move cushion centers under the actual two seats; the broad middle cushion remains empty.
 const cushions=sofa.children.filter(o=>o.name==='sofa cushion');[-.85,.08,.82].forEach((x,i)=>cushions[i].position.x=x);
 for(const c of cushions)c.userData.originalY=c.position.y;
 for(const c of cushions){const seam=line(c,'cushion piping',[[-.45,.45,.45],[-.43,.46,-.42],[.42,.46,-.42],[.45,.45,.45]],0xe9b16c,.009);seam.castShadow=false;}
 line(bean,'beanbag stitched seam',[[-.8,.45,.35],[-.7,.85,-.2],[0,1.27,-.5],[.7,.85,-.2],[.85,.45,.35]],0x4b7a47,.012);
 // Small ordinary possessions; no new plot clues or invented app screens.
 const book=box(root,'half read physics book',0x567d88,[3.95,.10,.9],[.46,.10,.64]);book.rotation.y=.32;box(book,'book pages',0xe6ddc2,[0,.4,0],[.9,.18,.91]);
 const coasters=[[-1.3,.63,1.15],[.65,.63,.67]];for(const p of coasters)object(root,'woven coaster',new THREE.CylinderGeometry(.13,.13,.012,24),0x9b7854,p);
 object(root,'water cup',new THREE.CylinderGeometry(.09,.075,.21,18,1,true),0x98b6ab,[-1.3,.74,1.15]);
 const cards=new THREE.Group();cards.name='ordinary game cards';cards.position.set(-.5,.65,.6);cards.rotation.y=.22;root.add(cards);for(let i=0;i<4;i++)box(cards,'card stock',i===3?0x526f6c:0xe6dbc0,[i*.025,i*.013,0],[.24,.009,.36]);
 const folded=box(root,'folded sweater on sofa arm',0x718a83,[-3.97,1.14,-1.48],[.35,.09,.66]);folded.rotation.y=.13;
 root.traverse(o=>{if(o.name==='book'){o.rotation.z=Math.sin(o.position.x*22)*.045;o.position.z+=Math.sin(o.position.x*14)*.023;}});
 for(const [name,p,w,d] of [['sofa',[-2.2,.012,-1.6],4.1,1.9],['beanbag',[3.1,.012,-.3],2.8,2.7],['table',[-.5,.014,.85],3.5,2.0]])shadow(root,p,w,d,.35);
 // Curtains sit behind the mullions but in front of the deep window view.
 for(const side of [-1,1]){
  const curtain=box(root,'linen window curtain',0xb6b896,[1+side*1.65,2.3,-3.68],[.42,2.45,.07]);curtain.material.map=paint('cloth');
  for(let i=0;i<4;i++)line(curtain,'curtain fold',[[-.36+i*.23,-.48,.51],[-.38+i*.23,0,.53],[-.36+i*.23,.48,.51]],0xa5aa88,.01);
 }
 const fan=root.getObjectByName('ceiling fan');fan.userData.baseY=fan.rotation.y;
 return {cushions,bean,coffee,fan,cards};
}
function houses(root){let index=0;root.traverse(g=>{if(g.name!=='far shore cottage')return;const i=index++;
 const walls=g.getObjectByName('house walls');walls.material=walls.material.clone();walls.material.color.set([0xe4cc9d,0x9eafa3,0xc98871,0x8fa9b2,0xbab584][i%5]);g.scale.y*=.92+(i%4)*.06;g.rotation.y=(i%3-1)*.06;
 const old=g.getObjectByName('pitched roof');old.visible=false;const q=new THREE.Shape();q.moveTo(-1.15,0);q.lineTo(0,.77+(i%3)*.10);q.lineTo(1.15,0);q.closePath();const geo=new THREE.ExtrudeGeometry(q,{depth:2.1,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2});geo.translate(0,0,-1.05);object(g,'varied cottage gable',geo,[0x796d5a,0x655f5b,0x8d7660][i%3],[0,2,0]);
 box(g,'chimney',0x9c8069,[.64,2.65,-.25],[.23,.65,.25]);box(g,'window flower box',0x7e6a49,[.45,.60,1.03],[.65,.14,.22]);
 g.children.filter(o=>o.name==='window').forEach((w,j)=>{const glass=w.getObjectByName('glass');glass.material=glass.material.clone();glass.material.emissive.set(root.name.includes('night')?0xd0a668:0x38505b);glass.material.emissiveIntensity=root.name.includes('night')?.25+(i+j)%3*.18:.03;for(const side of [-1,1])box(w,'small interior curtain',0xc5b899,[side*.18,0,.085],[.065,.58,.012]);box(w,'interior window depth',0x273d4e,[0,0,-.04],[.46,.62,.06]);});
 });}
export function refineEnvironment({scene,modeled,renderer,ambient,fill,key}){
 renderer.toneMappingExposure=.94;renderer.shadowMap.type=THREE.PCFSoftShadowMap;key.shadow.mapSize.set(2048,2048);key.shadow.radius=3.5;key.shadow.bias=-.00022;key.shadow.normalBias=.015;
 const bounce=new THREE.DirectionalLight(0xb6d6df,.35);bounce.position.set(7,6,4);scene.add(bounce);
 const rim=new THREE.DirectionalLight(0xf4c98a,.45);rim.position.set(-5,5,-7);scene.add(rim);
 const waterTime={value:0},curvedWater=[],wind=[],water=[],reflections=[],glows=[],clouds=[],contacts=[],backgrounds={},dynamics={};
 let treeIndex=0;
 for(const [id,root] of Object.entries(modeled)){
  backgrounds[id]=skyTexture(id==='hall'||id.includes('night'),id.includes('sunset'));
  const all=[];root.traverse(o=>all.push(o));
  for(const o of all){
   if(o.name.endsWith('· outline')){o.visible=false;continue;}
   if(o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.min(...o.scale.toArray().map(Math.abs))>.04){const {width,height,depth}=o.geometry.parameters;o.scale.multiply(new THREE.Vector3(width,height,depth));o.geometry=unitRound;}
   if(o.material?.isMeshStandardMaterial){o.material=o.material.clone();const n=o.name.toLowerCase();o.material.roughness=.91;
    const kind=/sofa|cushion|beanbag|curtain|rug|cloth|throw|pillow/.test(n)?'cloth':/wood|plank|table|shelf|bookcase|door|roof|dock|ladder/.test(n)?'wood':'plaster';
    if(!/water|glass|bulb|star|moon|snack|stem|cattail/.test(n)){o.material.map=paint(kind);o.material.needsUpdate=true;}
   }
   if(o.name==='fir tree'||o.name==='summer tree'){treeShape(o,treeIndex++);wind.push({o,z:o.rotation.z,x:o.rotation.x});}
   if(o.name==='reed bed'||o.name==='potted plant'||o.name==='paper chimes'){wind.push({o,z:o.rotation.z,x:o.rotation.x});}
   if(o.name==='lake water'){
    const geo=new THREE.PlaneGeometry(o.scale.x,o.scale.z,90,44);geo.rotateX(-Math.PI/2);o.geometry=geo;o.userData.originalY=o.position.y;o.scale.set(1,1,1);o.material=mat(id.includes('night')?0x345b73:0x559eaf,{roughness:.43,metalness:.13});water.push(o);
   }
   if(o.name==='curved lake water'){curvedWater.push(o);o.material.onBeforeCompile=shader=>{shader.uniforms.lakeTime=waterTime;shader.vertexShader='varying vec3 lakeSurfacePosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','lakeSurfacePosition=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>');shader.fragmentShader='uniform float lakeTime;\nvarying vec3 lakeSurfacePosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple=sin(lakeSurfacePosition.x*2.1+lakeTime*.8)*sin(lakeSurfacePosition.z*1.8-lakeTime*.65);diffuseColor.rgb+=ripple*.012;');};o.material.customProgramCacheKey=()=>"lake-world-ripples-v1";}
   if(o.name==='water reflection'||o.name==='lake surface glint'){o.material=mat(id.includes('night')?0xb4c6c0:0xe0e8cc,{transparent:true,opacity:.45,roughness:.4});reflections.push({o,x:o.position.x,z:o.position.z});}
   if(o.name==='summer cloud'){clouds.push({o,x:o.position.x});o.children.forEach(c=>{c.material=mat(id.includes('sunset')?0xf6d6ab:0xf4edda,{roughness:1});});}
   if(o.userData.practical){o.userData.baseIntensity=o.intensity;o.distance=id.startsWith('stoop')?6:8;o.decay=2;}
   if(o.name==='fairy light bulb'){o.material=mat(0xf6d999,{emissive:0xf6c87d,emissiveIntensity:.65});}
   if(o.name==='lantern glass'){
    o.material.transparent=true;o.material.opacity=.38;o.material.depthWrite=false;o.material.roughness=.48;const bp=o.position.clone();const bulb=ball(o.parent,'lantern warm bulb',0xe7c47f,[bp.x,bp.y,bp.z],[.055,.115,.055]);bulb.material.emissive.set(0xffd487);bulb.material.emissiveIntensity=1.5;bulb.castShadow=false;o.userData.bulb=bulb;for(const dx of [-.12,.12])for(const dz of [-.12,.12])box(o.parent,'lantern corner frame',0x34383a,[bp.x+dx,bp.y,bp.z+dz],[.018,.37,.018]);box(o.parent,'lantern bottom frame',0x34383a,[bp.x,bp.y-.19,bp.z],[.27,.025,.27]);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:radial(),transparent:true,opacity:id.includes('night')?.6:.12,depthWrite:false,blending:THREE.AdditiveBlending}));glow.name='warm lantern halo';glow.position.copy(o.position);glow.scale.set(1.3,1.5,1);o.parent.add(glow);glows.push({o:glow,id,porch:o.parent.name==='brick apartment facade'});
   }
  }
  let seed=837;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};root.traverse(o=>{if(o.name==='star'&&!root.userData.lakeWorld)o.position.set(-48+random()*96,8+random()*22,-54);});
  houses(root);
  if(id==='apartment')dynamics.apartment=personalize(root);
  if(id.startsWith('stoop')){
   const facade=root.getObjectByName('brick apartment facade');
   box(facade,'door threshold',0x856c4d,[0,.61,1.15],[1.5,.07,.25]);
   const step=facade.children.filter(o=>o.name==='broad stoop step');step.forEach((s,i)=>{s.material.color.set(0xae9271);s.scale.z=.60;line(s,'worn step nose',[[-.48,.50,.45],[0,.50,.50],[.48,.50,.45]],0xbfa481,.009);});
   // A broad pool of practical light, attached to the actual stoop rather than the camera.
   const pool=shadow(root,[2,.016,.32],5.4,4.0,.36);pool.name='porch lamp pool';pool.material.map=radial();pool.material.blending=THREE.AdditiveBlending;glows.push({o:pool,id,porch:true});
   shadow(root,[2,.018,.5],3.6,1.8,.18);
  }
  if(id==='lake'||id==='lake_night'){
   // An irregular damp-sand ribbon gives the water a natural edge.
   if(!root.userData.lakeWorld){const sh=new THREE.Shape();sh.moveTo(-25,2.15);for(let x=-25;x<=25;x+=1)sh.lineTo(x,2.15+.16*Math.sin(x*.8));for(let x=25;x>=-25;x-=1)sh.lineTo(x,1.45+.14*Math.sin(x*.8+.5));sh.closePath();const strip=object(root,'damp shoreline',new THREE.ShapeGeometry(sh),id.includes('night')?0x7b8372:0xbcb58a,[0,.009,0]);strip.rotation.x=-Math.PI/2;strip.material.map=paint('sand');}
   for(let i=0;i<30;i++){const x=-12+i*.79,z=1.7+Math.sin(i*2.2)*.5;if(x>-4&&x<4)continue;const stone=ball(root,'small shore pebble',[0xa5ad98,0xb8b89d,0x8e9e92][i%3],[x,.035,z],[.055+(i%3)*.018,.04,.08]);stone.rotation.y=i;}
   const tower=root.getObjectByName('lifeguard lookout');
   const rescue=box(tower,'red rescue float',0xd75c45,[-.85,2.67,-.60],[.24,.13,.72]);rescue.rotation.y=.35;line(tower,'rescue float cord',[[-.9,2.65,-.65],[-.6,2.5,-.6],[-.3,2.65,-.65]],0xe9d7a9,.012);
   for(const p of [[-8,.02,2],[7,.02,2.5]])shadow(root,p,1.3,.9,.12);
  }
 }
 for(let i=0;i<10;i++){const s=shadow(scene,[0,.017,0],.6,.45,.32);s.visible=false;contacts.push(s);}
 // Reusable concentric wake rings stay in the lake plane.
 const wakes=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.35,.36,48),new THREE.MeshBasicMaterial({color:0xd5e0c7,transparent:true,opacity:.20,depthWrite:false}));m.rotation.x=-Math.PI/2;m.name='duck wake';modeled.lake.add(m);wakes.push(m);}
 const audit={treeCount:treeIndex,paintedMaterials:true,waterSurfaces:water.length+curvedWater.length,windGroups:wind.length,glows:glows.length,contacts:contacts.length};
 function update(t,id,b,actors,duck,frogs){
  waterTime.value=t;
  const night=id==='hall'||id.includes('night'),inside=id==='apartment';
  scene.background=inside?new THREE.Color(0xa99e85):backgrounds[id];scene.fog=inside||id==='hall'?null:new THREE.Fog(night?0x405365:0xc1d2c0,modeled[id].userData.lakeWorld?72:26,modeled[id].userData.lakeWorld?310:95);
  ambient.intensity=id==='hall'?.28:night?.63:inside?.95:1.03;fill.intensity=id==='hall'?.07:inside?.30:night?.15:.16;key.intensity=id==='hall'?.08:night?.52:inside?.85:1.65;key.color.set(night?0xb3c7dc:inside?0xffe0af:0xfff1d8);ambient.color.set(night?0xb7cddd:0xffefdd);bounce.intensity=night?.22:inside?.22:.40;rim.intensity=night?.17:inside?.22:.28;
  for(const {o,z,x} of wind){o.rotation.z=z+.012*Math.sin(t*1.35+o.position.x);o.rotation.x=x+.008*Math.sin(t*.9+o.position.z);}
  for(const o of water){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,.012*Math.sin(x*1.4+t*1.05)+.008*Math.cos(z*1.8-t*.8));}p.needsUpdate=true;/* broad near-flat waves need no per-frame normals */}
  for(const {o,x,z} of reflections){o.position.x=x+.10*Math.sin(t*.8+z);o.scale.x=.88+.13*Math.sin(t*1.2+x);}
  for(const {o,x} of clouds)o.position.x=x+.5*Math.sin(t*.025+x);
  const app=dynamics.apartment;app.fan.rotation.y=t*.8;const sit=clamp((t-53.5)/.7,0,1);app.cushions.forEach((c,i)=>{const weight=i===1?0:sit;c.scale.y=.25*(1-.14*weight);c.position.y=c.userData.originalY-.018*weight;});
  app.bean.children.filter(o=>o.name==='beanbag seat').forEach(o=>{o.scale.y=.6*(1-.12*sit);o.scale.x=1.2*(1+.04*sit);});
  modeled[id].traverse(o=>{if(o.userData.practical){const lit=o.parent.name!=='brick apartment facade'||(id==='stoop_sunset'?t>=49.35:id==='stoop_night'?t<132.1:true);o.intensity=lit?o.userData.baseIntensity*(id==='apartment'?.65:1):0;}});
  for(const {o,id:owner,porch} of glows){const lit=!porch||(owner==='stoop_sunset'?t>=49.35:owner==='stoop_night'?t<132.1:true);o.visible=lit;}
  if(id.startsWith('stoop'))modeled[id].traverse(o=>{if(o.name==='lantern glass'){const lit=o.parent.name!=='brick apartment facade'||(id==='stoop_sunset'?t>=49.35:t<132.1);o.material.emissiveIntensity=lit?.65:0;if(o.userData.bulb)o.userData.bulb.material.emissiveIntensity=lit?1.5:0;}});
  contacts.forEach(o=>o.visible=false);let n=0;
  for(const a of Object.values(actors))if(a.root.visible&&a.pelvis.position.y>.5){for(const leg of [a.legL,a.legR]){if(n>=contacts.length)break;const f=leg.foot.getWorldPosition(V()),s=contacts[n++];s.visible=true;s.position.set(f.x,a.root.position.y+.018,f.z);s.material.opacity=.30;}}
  if(id==='lake'){
   const angle=.18*Math.sin(t*.44)+(t>21?.8:0);duck.position.x=1.65+.35*Math.sin(t*.25);duck.position.z=-5+.16*Math.cos(t*.35);duck.rotation.y=angle;
   const head=duck.getObjectByName('duck head');head.rotation.y=.15*Math.sin(t*1.3);head.position.y=.63+.025*Math.sin(t*2.1);
   wakes.forEach((o,i)=>{const u=(t*.35+i/4)%1;o.position.set(duck.position.x-.2,0.048,duck.position.z+.18);o.scale.setScalar(.5+u*1.7);o.material.opacity=(1-u)*.18;});
  }
  frogs.filter(Boolean).forEach(f=>{const blink=Math.pow(Math.max(0,Math.sin(t*.9+1.4)),44);f.children.filter(o=>o.name==='frog eye'||o.name==='frog pupil').forEach(o=>o.scale.y=(o.name==='frog eye'?.045:.025)*Math.max(.1,1-blink));f.rotation.y=.05*Math.sin(t*.6);});
 }
 return {update,audit,dynamics};
}
