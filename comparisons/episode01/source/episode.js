import * as THREE from 'three';
import {makeCharacter,CAST,ANIMS,neutral,applyPose} from '../../../art/three/characters/cast.js';
import {buildSet} from '../../../art/three/sets/build.js';
import {SETS} from '../../../art/three/sets/catalog.js';
import {makeFlatActor} from './flat-cast.js';
const params=new URLSearchParams(location.search),mode=params.get('mode')==='25d'?'25d':'3d';
const timeline=await fetch('./timeline.json').then(r=>r.json()),paintings=await fetch('./paintings.json').then(r=>r.json());
const W=1920,H=1080,scale=.56,clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp;
const font=new FontFace('Porchlight','url(./Boogaloo-Regular.ttf)');await font.load();document.fonts.add(font);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=mode==='3d';renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,16/9,.1,600);
const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
const ambient=new THREE.HemisphereLight(0xffefd4,0x7b9273,1.6),fill=new THREE.AmbientLight(0xffffff,.45),key=new THREE.DirectionalLight(0xffedcc,2.5);key.position.set(-6,12,10);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.normalBias=.025;Object.assign(key.shadow.camera,{left:-18,right:18,top:18,bottom:-12,near:1,far:65});scene.add(ambient,fill,key);
const modeled={},actors={},flatActors={},layered={},assetErrors=[];
const loader=new THREE.TextureLoader();async function texture(path){const t=await loader.loadAsync('../../../'+path).catch(e=>{assetErrors.push(path);throw e;});t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const simple=color=>new THREE.MeshStandardMaterial({color,roughness:.9});
function mesh(parent,name,geo,color,p){const m=new THREE.Mesh(geo,simple(color));m.name=name;m.position.set(...p);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(parent,name,color,p,size){const m=mesh(parent,name,new THREE.SphereGeometry(1,16,12),color,p);m.scale.set(...size);return m;}
function createFrog(parent,p){const g=new THREE.Group();g.position.set(...p);parent.add(g);ball(g,'Lord Puddles',0x77984e,[0,.10,0],[.17,.11,.18]);ball(g,'frog head',0x92ad66,[0,.17,.10],[.14,.09,.12]);for(const x of [-.09,.09]){ball(g,'frog eye',0xf0e8bf,[x,.25,.13],[.045,.045,.035]);ball(g,'frog pupil',0x263a24,[x,.25,.159],[.02,.025,.01]);}return g;}
function guardRig(){const base=CAST.find(s=>s.name==='Riot'),rig=makeCharacter({...base,hoodie:0xd9413f,hoodieDark:0xb52d36,cuff:base.fur,stripe:0xd9413f});
 for(const a of [rig.armL,rig.armR])a.sh.traverse(o=>{if(o.isMesh&&o.material?.color&&o.material.color.getHex()!==0x1b1210)o.material.color.set(base.fur);});
 rig.spine.children.forEach(o=>{if(o.isMesh&&o.position.y>1.1&&o.position.z<0)o.visible=false;if(o.isMesh&&o.geometry.type==='BoxGeometry')o.visible=false;});
 mesh(rig.head,'lifeguard visor',new THREE.BoxGeometry(.80,.05,.26),0xd9413f,[0,1.08,.38]);
 for(const x of [-.28,.28])mesh(rig.pelvis,'red shorts',new THREE.BoxGeometry(.32,.28,.28),0xd9413f,[x,-.06,0]);
 const whistle=ball(rig.spine,'whistle',0xe0e1db,[0,.80,.30],[.07,.05,.025]);return rig;
}
if(mode==='3d'){
 for(const id of ['hall','lake','lake_night','stoop_sunset','stoop_night','apartment']){const g=buildSet(SETS.find(s=>s.id===id));g.visible=false;modeled[id]=g;scene.add(g);g.traverse(o=>{if(o.name.includes('anchor marker'))o.visible=false;});}
 for(const id of ['stoop_sunset','stoop_night']){let i=0;modeled[id].traverse(o=>{if(o.name==='broad stoop step'){o.scale.y=.2*(i+1);o.position.y=.1*(i+1);i++;}});}
 const room=modeled.apartment.getObjectByName('room shell');room.getObjectByName('floor slab').scale.z=16;room.getObjectByName('floor slab').position.z=2;for(const name of ['left wall','right wall'])room.getObjectByName(name).scale.x=2;mesh(room,'room ceiling',new THREE.BoxGeometry(11,.08,14),0xd8c39c,[0,4.24,2]);
 const tower=modeled.lake.getObjectByName('lifeguard lookout');tower.children.forEach(o=>{if(o.name.includes('canopy'))o.position.y+=1.2;});for(const x of [-1.1,1.1])for(const z of [-.8,.8])mesh(tower,'canopy extension',new THREE.BoxGeometry(.14,1.4,.14),0xa8844a,[x,4.2,z]);
 for(const s of CAST){const r=makeCharacter(s);r.root.scale.multiplyScalar(scale);r.root.visible=false;scene.add(r.root);actors[s.name.toLowerCase()]=r;}
 const phone=new THREE.Group();phone.name='Riot phone';phone.position.set(0,-.55,.13);actors.riot.armR.el.add(phone);mesh(phone,'phone body',new THREE.BoxGeometry(.18,.28,.035),0x252a2d,[0,0,0]);mesh(phone,'phone screen',new THREE.BoxGeometry(.145,.21,.01),0x5d8e90,[0,0,.024]);actors.riot.phone=phone;
 actors.guard=guardRig();actors.guard.root.scale.multiplyScalar(scale);actors.guard.root.visible=false;scene.add(actors.guard.root);
}else{
 renderer.toneMapping=THREE.NoToneMapping;camera.near=.1;camera.far=100;const BG=-4.5,CZ=30;
 for(const [id,spec] of Object.entries(paintings)){
  const g=new THREE.Group();g.visible=false;scene.add(g);const addPlane=async(path,z)=>{const k=(CZ-z)/(CZ-BG),tex=await texture(path);const m=new THREE.Mesh(new THREE.PlaneGeometry(16*k,9*k),new THREE.MeshBasicMaterial({map:tex,transparent:z!==BG,alphaTest:.008,depthWrite:true,toneMapped:false}));m.position.z=z;m.renderOrder=z;g.add(m);};
  await addPlane(spec.image,BG);for(const f of spec.fronts)await addPlane(f.path,Math.min(5.3,Math.max(-.2,f.depth*.45)));layered[id]=g;
 }
 for(const who of ['bash','pip','riot','rocco','guard']){const a=makeFlatActor(who==='guard'?'riot':who,who==='guard');a.root.visible=false;scene.add(a.root);flatActors[who]=a;}
}
const flatCritters={};if(mode==='25d'){
 for(const key of ['duck','frog','blink']){const path='art/parts/critters/puddles_and_duck_'+({duck:'05',frog:'03',blink:'07'}[key])+'.png',tex=await texture(path),m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.005,depthWrite:false,toneMapped:false}));m.visible=false;m.renderOrder=20;scene.add(m);flatCritters[key]=m;}
}
const duck=new THREE.Group(),frogSun=mode==='3d'?createFrog(modeled.stoop_sunset,[3.53,1.1,.65]):null,frogNight=mode==='3d'?createFrog(modeled.stoop_night,[3.53,1.1,.65]):null;
let flashlight=null,flashTarget=null,paw=null,mysteryPiece=null,hillGlow=null,duckBase=null;
if(mode==='3d'){
 modeled.lake.add(duck);duck.position.set(1.8,.05,-5);ball(duck,'duck body',0xf3efe0,[0,.17,0],[.33,.20,.23]);ball(duck,'duck neck',0xf5f0e2,[0,.42,.06],[.10,.24,.11]);ball(duck,'duck head',0xf5f0e2,[0,.63,.08],[.15,.14,.14]);mesh(duck,'duck beak',new THREE.ConeGeometry(.075,.24,6).rotateX(Math.PI/2),0xd69c45,[0,.62,.30]);for(const x of [-.10,.10])ball(duck,'duck eye',0x252c24,[x,.67,.17],[.023,.026,.023]);
 const hall=modeled.hall;paw=new THREE.Group();hall.add(paw);mesh(paw,'anonymous sleeve',new THREE.CylinderGeometry(.11,.12,.7,12).rotateZ(Math.PI/2),0x373943,[.35,0,0]);ball(paw,'anonymous paw',0xc99b66,[0,0,0],[.14,.09,.12]);for(const z of [-.08,0,.08])ball(paw,'paw digit',0xc99b66,[-.09,-.02,z],[.055,.06,.04]);mysteryPiece=mesh(hall,'small game piece',new THREE.CylinderGeometry(.07,.085,.07,12),0xb29363,[.05,1.28,-.4]);
 flashlight=new THREE.SpotLight(0xffe5b2,35,18,.38,.55,1);flashlight.position.set(-3,3,3);flashTarget=new THREE.Object3D();hall.add(flashlight,flashTarget);flashlight.target=flashTarget;
 hillGlow=ball(modeled.lake_night,'distant flashlight',0xffedc1,[15.4,6.3,-28.3],[.075,.065,.03]);hillGlow.material=new THREE.MeshBasicMaterial({color:0xffedc1});
}
function appearance(id){const night=id==='hall'||id==='lake_night'||id==='stoop_night',room=id==='apartment';scene.background=new THREE.Color(night?0x1e344e:room?0xb7aa8b:id==='stoop_sunset'?0xeab679:0xb6dce4);ambient.intensity=id==='hall'?.38:night?.95:room?1.45:1.8;fill.intensity=id==='hall'?.1:night?.4:.45;key.intensity=id==='hall'?.12:night?1:room?1.8:2.5;key.color.set(night?0xa4bfd8:0xffe6bd);ambient.color.set(night?0xa2bfd7:0xffefdc);}
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
function pointAt(r,target){const pos=r.spine.worldToLocal(target.clone());const side=pos.x>=0?1:-1,a=side>0?r.armR:r.armL,d=pos.sub(a.sh.position).normalize();a.sh.quaternion.setFromUnitVectors(vec(0,-1,0),d);a.el.rotation.set(0,0,0);}
function eventAt(t){return timeline.events.find(e=>t>=e.start&&t<e.end);}
function expression(p,event,who,t){if(event){if(event.face==='nervous'){p.brow=-.22;p.browY=.035;p.sweat=.5;}if(['yelling','shocked'].includes(event.face)){p.brow=.2;p.browY=event.face==='shocked'?.1:0;}if(event.face==='suspicious'||event.face?.startsWith('side_eye')){p.lids=.25;p.brow=.12;p.lookX=.5;}if(event.quiet){p.brow=-.08;p.lids=.12;p.aLo=p.aRo=.08;}}
 const blink=Math.pow(Math.max(0,Math.sin(t*1.73+who.length*.7)),40);return blink*.96;}
function mouth(e,t){if(!e)return 0;const local=t-e.start,q=e.mouthCues.find(c=>local>=c.start&&local<c.end);return ({X:0,A:.06,B:.25,C:.58,D:.9,E:.47,F:.33,G:.18,H:.28})[q?.value]||0;}
function basePose(who,t,event){const p=neutral();ANIMS.idle(t+who.length,p);p.tailWag*=.5;
 const active=event?.who===who?event:null;let anim=active?.do||'idle';if(anim==='thumbs')anim='present';if(anim==='fan'||anim==='munch'||anim==='stare')anim='idle';if(!ANIMS[anim])anim=active?.face==='nervous'?'nervous':active?.face==='laughing'?'laugh':active?.face==='cocky'?'cocky':'idle';
 if(active){const a=neutral();ANIMS[anim](t-active.start+.25,a);const w=Math.min(1,(t-active.start)*5,Math.max(.15,(active.end-t)*5));for(const k of Object.keys(p))p[k]=mix(p[k],a[k],clamp(w,0,1));if(active.do==='fan'){p.aRo=.4;p.aRf=.8;p.aRb=1.1;p.aRw=.4*Math.sin(t*12);}if(active.do==='munch'){p.aLf=.6;p.aLb=1.5;}p.mouth=mouth(active,t);}
 else p.mouth=0;expression(p,active,who,t);return p;
}
let activeId=null,lastInfo=null;
function place3(who,pos,yaw,p,t,{seat=false,stair=false,guard=false,point=null}={}){const r=guard?actors.guard:actors[who];r.root.visible=true;r.root.position.set(...pos);r.root.rotation.set(0,yaw,0);if(seat){p.lLf=p.lRf=Math.PI/2;p.lLk=p.lRk=stair?.6:Math.PI/2;p.air=0;}applyPose(r,p,t,expression(p,null,who,t));if(seat)r.pelvis.position.y=0;r.root.updateMatrixWorld(true);if(point){pointAt(r,point);r.root.updateMatrixWorld(true);}return r;}
const flatXY=(px,py,z)=>{const k=(30-z)/34.5;return vec((px/1024-.5)*16*k,(.5-py/572)*9*k,z);};
function placeFlat(who,pix,height,p,t,{seat=false,guard=false,point=null}={}){const a=guard?flatActors.guard:flatActors[who],z=activeId==='stoop_sunset'?6:2.5,v=flatXY(pix[0],pix[1],z),k=(30-z)/34.5;const s=height/572*9*k/a.height;a.root.visible=true;a.root.position.copy(v);a.root.scale.setScalar(s);a.apply(p,t,{seated:seat,point});return a;}
function camera3(position,target,fov=38){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();}
function cameraFlat(x=512,y=286,zoom=1,t=0){const target=flatXY(x,y,-.5);zoom*=1.045;camera.position.set(target.x+Math.sin(t*.45)*.10,target.y+Math.sin(t*.31)*.035,30);camera.rotation.set(0,0,0);camera.fov=2*Math.atan(9/(2*34.5*zoom))*180/Math.PI;camera.updateProjectionMatrix();}
function stateAt(t){const beat=timeline.beats.find(b=>t>=b.start&&t<b.end);return {beat:beat||{id:'ending',location:'stoop_night',start:timeline.end_start,end:timeline.duration},event:eventAt(t)};}
function renderWorld(t){const {beat:b,event:e}=stateAt(t),id=b.location,l=t-b.start;
 if(activeId!==id){Object.entries(mode==='3d'?modeled:layered).forEach(([k,g])=>g.visible=k===id);activeId=id;if(mode==='3d')appearance(id);}
 Object.values(mode==='3d'?actors:flatActors).forEach(a=>a.root.visible=false);Object.values(flatCritters).forEach(m=>m.visible=false);if(mode==='3d')actors.riot.phone.visible=id==='apartment';
 const pointWindow=(b.id==='mlt1'&&t>=65.1&&t<66.2)||(b.id==='mlt2'&&t>=87.4&&t<88.3),roccoAccuses=b.id==='mlt2'&&t>=88.3&&t<89.1;
 const positioned={};
 if(mode==='3d'){
  if(b.id==='cold'){
   const enter=clamp((l-1.45)/1.1,0,1),exit=clamp((l-4.4)/1,0,1);paw.position.set(mix(2.5,.1,enter)+exit*2.5,1.38,-.4);paw.visible=l>1.4&&l<5.6;mysteryPiece.visible=l>2.75;flashlight.intensity=l<6.1?35:0;flashTarget.position.set(Math.sin(l*1.4)*1.8,1.2,-.4+Math.cos(l)*.8);camera3([3.5,2.5,4.8],[0,1.2,-.5],40);
  }else if(b.id==='intro'){camera3([4+Math.sin(l*.15)*.5,4.2,17-l*.08],[0,2,-11],42);hillGlow.visible=false;
  }else if(b.id==='tower'||b.id==='rematch'){
   const rp=basePose('riot',t,e),rc=basePose('rocco',t,e);positioned.riot=place3('riot',[-6.2,2.45,-.65],.18,rp,t,{guard:true});
   if(!e||e.who!=='rocco'){rc.lids=.72;rc.headX=.1;}positioned.rocco=place3('rocco',[-3,-.05,1],-.05,rc,t);
   if(b.id==='rematch')for(const [who,x,z,delay] of [['bash',0,1.6,0],['pip',1.6,1.0,.35]]){const age=Math.max(0,l-delay),u=clamp(age/3.8,0,1),p=basePose(who,t,e);let px,pz;if(u<.75){px=mix(-11,x,u/.75);pz=3.4;}else{px=x;pz=mix(3.4,z,(u-.75)/.25);}if(u<1){const walk=neutral();ANIMS.walk(t,walk);p.lLf=walk.lLf;p.lRf=walk.lRf;p.lLk=walk.lLk;p.lRk=walk.lRk;p.aLf=walk.aLf;p.aRf=walk.aRf;}positioned[who]=place3(who,[px,-.05,pz],u<1?.65:who==='bash'?-.10:-.2,p,t);}
   duck.position.y=.05+Math.sin(t*2)*.025;duck.rotation.y=t>21?Math.PI*.8:Math.sin(t*.7)*.05;
   camera3([1,4.1,14],[-3,2.2,-1.3],42);
  }else if(['mlt1','mlt2','score'].includes(b.id)){
   for(const [who,pos,yaw,seat] of [['bash',[-3.05,.815,-1.23],.08,true],['pip',[-1.55,.815,-1.23],-.04,true],['rocco',[3.1,.87,.25],-.08,true],['riot',[1.45,0,1.8],-.08,false]]){const p=basePose(who,t,e);if(who==='rocco'&&b.id==='mlt1'&&(!e||e.who!=='rocco')){p.lids=.85;p.headX=.12;p.torsoX=-.16;}if(who==='rocco'&&roccoAccuses){p.lids=.25;}if(pointWindow&&who==='rocco'){p.aRo=.8;p.aRf=.2;p.aRb=1.5;p.aRw=1.1;}positioned[who]=place3(who,pos,yaw,p,t,{seat});}
   if(pointWindow)for(const who of ['bash','pip','riot'])pointAt(positioned[who],positioned.rocco.head.getWorldPosition(new THREE.Vector3()));
   if(roccoAccuses)pointAt(positioned.rocco,positioned.riot.head.getWorldPosition(new THREE.Vector3()));
   camera3([2.4,2.6,7],[-.35,1.5,-.65],38);
  }else if(b.id==='light'||b.id==='night'||b.id==='alone'){
   const seat=b.id==='alone',p=basePose('riot',t,e);positioned.riot=place3('riot',[2,seat?.4:.2,seat?-.05:.42],-.08,p,t,{seat,stair:seat});
   if(b.id==='night'&&l<3.3){const u=clamp((l-.5)/2.8,0,1),p=basePose('rocco',t,e);if(u>.05){const w=neutral();ANIMS.walk(t,w);p.lLf=w.lLf;p.lRf=w.lRf;p.lLk=w.lLk;p.lRk=w.lRk;}positioned.rocco=place3('rocco',[mix(.8,7,u),mix(.2,0,u),mix(.8,2,u)],u>.05?1.0:-.1,p,t);}
   camera3([-1.5,2.5,7.8],[2,1.45,-.5],38);
   if(b.id==='alone')camera3([-.3,2.1,4.6],[2,1.3,-.05],38);
   if(e?.look?.includes('up')){const r=positioned.riot;r.head.rotation.x=-.14;r.head.rotation.y=.18;}
   for(const g of [modeled.stoop_sunset,modeled.stoop_night])g.traverse(o=>{if(o.userData.practical)o.intensity=b.id==='light'&&l<.6?0:o.userData.savedIntensity??(o.userData.savedIntensity=o.intensity||18);});
  }else if(b.id==='hill'){
   hillGlow.visible=l>.5&&l<3.6;hillGlow.position.x=15.15+.16*Math.sin(l*1.7);camera3([6,5.2,12-l*.12],[6,3.6,-21],37);
  }else{
   camera3([2.5,2.6,1.8],[3.25,2.55,-.65],37);modeled.stoop_night.traverse(o=>{if(o.userData.practical)o.intensity=t<132.1?18:0;});
  }
  // Line-specific close-ups are reframed around the actual modeled actor, never a screen-space crop.
  if(e&&e.camera?.startsWith('close:')&&positioned[e.who]){const r=positioned[e.who],h=r.head.localToWorld(vec(0,.67,.35));camera3([h.x+.5,h.y+.3,h.z+4],[h.x,h.y,h.z],37);}
  if(e&&e.camera?.startsWith('two:')&&positioned.bash&&positioned.pip){const a=positioned.bash.head.getWorldPosition(new THREE.Vector3()),c=positioned.pip.head.getWorldPosition(new THREE.Vector3()),v=a.add(c).multiplyScalar(.5);camera3([v.x+.2,v.y+.5,v.z+5.2],[v.x,v.y+.25,v.z],37);}
 }else{
  if(b.id==='cold'){cameraFlat(512,310,1.1,t);
  }else if(b.id==='intro'||b.id==='hill'){cameraFlat(b.id==='hill'?640:512,b.id==='hill'?220:286,b.id==='hill'?1.12:1,t);
  }else if(b.id==='tower'||b.id==='rematch'){
   positioned.riot=placeFlat('riot',[96,263],112,basePose('riot',t,e),t,{guard:true});const rp=basePose('rocco',t,e);if(!e||e.who!=='rocco')rp.lids=.72;positioned.rocco=placeFlat('rocco',[760,530],165,rp,t);
   if(b.id==='rematch')for(const [who,x,y,h,delay] of [['bash',320,505,168,0],['pip',465,502,192,.35]]){const u=clamp((l-delay)/3.8,0,1),p=basePose(who,t,e);if(u<1){const walk=neutral();ANIMS.walk(t,walk);p.lLf=walk.lLf;p.lRf=walk.lRf;p.lLk=walk.lLk;p.lRk=walk.lRk;}positioned[who]=placeFlat(who,[mix(-110,x,u),y],h,p,t);}
   cameraFlat(512,286,1,t);
  }else if(['mlt1','mlt2','score'].includes(b.id)){
   for(const [who,pix,height,seat] of [['bash',[190,402],160,true],['pip',[333,422],200,true],['rocco',[830,438],180,true],['riot',[620,520],210,false]]){const p=basePose(who,t,e);if(who==='rocco'&&b.id==='mlt1'&&(!e||e.who!=='rocco'))p.lids=.85;positioned[who]=placeFlat(who,pix,height,p,t,{seat,point:pointWindow&&who!=='rocco'?1:roccoAccuses&&who==='rocco'?-1:null});}
   cameraFlat(512,286,1,t);
  }else if(b.id==='light'||b.id==='night'||b.id==='alone'){
   const seat=b.id==='alone';positioned.riot=placeFlat('riot',seat?[800,448]:[810,528],215,basePose('riot',t,e),t,{seat});
   if(b.id==='night'&&l<3.3){const u=clamp((l-.5)/2.8,0,1),p=basePose('rocco',t,e);if(u>0){const walk=neutral();ANIMS.walk(t,walk);p.lLf=walk.lLf;p.lRf=walk.lRf;}positioned.rocco=placeFlat('rocco',[mix(660,1170,u),535],192,p,t);}
   cameraFlat(b.id==='alone'?780:670,b.id==='alone'?330:330,b.id==='alone'?1.30:1.12,t);
  }else cameraFlat(945,185,2.6,t);
  if(e?.camera?.startsWith('close:')&&positioned[e.who]){const a=positioned[e.who],v=a.faceAnchor.getWorldPosition(new THREE.Vector3());camera.position.x=v.x;camera.position.y=v.y-.2;camera.fov=2*Math.atan(9/(2*34.5*1.7))*180/Math.PI;camera.updateProjectionMatrix();}
 }
 if(mode==='25d'){
   const halfY=34.5*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),halfX=halfY*16/9,maxX=Math.max(0,8-halfX-.018),maxY=Math.max(0,4.5-halfY-.018);camera.position.x=clamp(camera.position.x,-maxX,maxX);camera.position.y=clamp(camera.position.y,-maxY,maxY);
   if(id==='lake'){const d=flatCritters.duck;d.visible=true;d.position.copy(flatXY(535,413,2.0));const k=28/34.5;d.scale.set(.8*k,.75*k,1);d.rotation.z=Math.sin(t)*.025;}
   if(id.startsWith('stoop')){const f=flatCritters[Math.sin(t*1.3)>.97?'blink':'frog'];f.visible=true;f.position.copy(flatXY(905,319,3.2));f.scale.set(.55,.49,1);}
 }
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const heads={};for(const [who,a] of Object.entries(positioned)){const v=mode==='3d'?a.head.localToWorld(vec(0,.65,.36)):a.faceAnchor.getWorldPosition(new THREE.Vector3());v.project(camera);heads[who]={x:(v.x+1)/2,y:(1-v.y)/2,z:v.z};}
 lastInfo={time:t,beat:b.id,location:id,speaker:e?.who||null,line:e?.id||null,heads};return {beat:b,event:e,local:l};
}
function text(str,x,y,size=48,color='#fff7dc',align='left',stroke=5){ctx.font=`${size}px Porchlight`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';if(stroke){ctx.lineWidth=stroke;ctx.strokeStyle='#201f25';ctx.strokeText(str,x,y);}ctx.fillStyle=color;ctx.fillText(str,x,y);}
function roundRect(x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
function wrap(str,width,size){ctx.font=`${size}px Porchlight`;const lines=[];let line='';for(const word of str.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
function overlay(t,b,e,l){
 if(b.id==='cold'){ctx.fillStyle='#06080d';ctx.fillRect(0,0,W,66);ctx.fillRect(0,H-66,W,66);text('Maple Hollow. Late.',65,112,42,'#eedb96');if(mode==='25d'){
  const x=650+Math.sin(l*1.3)*170,y=610+Math.cos(l)*50,glow=ctx.createRadialGradient(x,y,0,x,y,230);glow.addColorStop(0,'rgba(255,238,178,.28)');glow.addColorStop(1,'rgba(255,238,178,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  if(l>1.6&&l<4.8){const u=Math.min(1,(l-1.6)/.7),px=mix(1450,1050,u);roundRect(px,560,270,70,25,'#353641');roundRect(px-60,570,100,65,30,'#c69a66');}
  if(l>2.8){ctx.fillStyle='#b4935d';ctx.beginPath();ctx.ellipse(1025,670,15,9,0,0,Math.PI*2);ctx.fill();}
 }if(l>6.1){ctx.fillStyle=`rgba(0,0,0,${clamp((l-6.1)/.7,0,1)})`;ctx.fillRect(0,0,W,H);}}
 if(b.id==='intro'){
  const fade=Math.min(1,l/1.0,(b.end-t)/.5);ctx.globalAlpha=Math.max(0,fade);text('PORCHLIGHT',W/2,H*.42,140,'#f4d891','center',10);text('MAPLE HOLLOW',W/2,H*.53,32,'#faf1d6','center',4);if(l>6){text('EPISODE 01',W/2,H*.69,28,'#ecdcaa','center',3);text('Porch Light On',W/2,H*.76,54,'#fff7e2','center',4);}ctx.globalAlpha=1;
 }
 if(b.id==='light'&&l>1.1){const x=100,y=120;roundRect(x,y,660,340,26,'rgba(31,43,37,.86)');text('GAME NIGHT',x+30,y+42,28,'#f3cf74');const chats=[['Riot',"LIGHT’S ON"],['Bash','omw. rematch.'],['Pip','bringing snacks'],['Rocco','i live here']];chats.slice(0,Math.min(4,1+Math.floor((l-1.1)/.65))).forEach(([name,message],i)=>{text(name+':',x+30,y+103+i*58,28,'#e7bd65');text(message,x+145,y+103+i*58,31,'#f4efe0','left',2);});}
 if(b.game){const start=b.game.card_in/30,end=b.game.card_out/30;if(t>=start&&t<end){const alpha=Math.min(1,(t-start)*6,(end-t)*6);ctx.globalAlpha=Math.max(0,alpha);const x=1170,y=74,w=670,h=285;roundRect(x+6,y+9,w,h,30,'rgba(0,0,0,.3)');roundRect(x,y,w,h,30,'#fbf6e8');roundRect(x,y,w,58,20,'#d7ad3a');text('MOST LIKELY TO',x+w/2,y+31,30,'#fff8e3','center',0);const lines=wrap(b.game.prompt,w-70,37);lines.forEach((line,i)=>text(line,x+w/2,y+108+i*45,37,'#2d382b','center',0));text('FRIENDZY',x+w/2,y+h-25,19,'#b2a17c','center',0);ctx.globalAlpha=1;}}
 if(b.id==='night'&&l<2.2&&l>.3)text('Later that night.',70,88,42,'#f4dd97');
 if(b.id==='hill'&&mode==='25d'&&l>.5&&l<3.6){const v=flatXY(915+Math.sin(l)*4,122,-4.4).project(camera),x=(v.x+1)*W/2,y=(1-v.y)*H/2,g=ctx.createRadialGradient(x,y,0,x,y,16);g.addColorStop(0,'rgba(255,241,184,.95)');g.addColorStop(1,'rgba(255,241,184,0)');ctx.fillStyle=g;ctx.fillRect(x-16,y-16,32,32);}
 if(e&&e.caption!==false){const words=e.text.replace(/\.\.\./g,'…').split(/\s+/),u=clamp((t-e.start)/(e.end-e.start),0,.999),i=Math.floor(u*words.length),first=Math.floor(i/4)*4,shown=words.slice(first,first+4).join(' ').toUpperCase();text(shown,W/2,H-80,54,'#fff8e8','center',7);}
 if(b.id==='ending'){
  if(t>132.1){ctx.fillStyle=`rgba(0,0,0,${clamp((t-132.1)/.5,0,1)})`;ctx.fillRect(0,0,W,H);}if(t>133.05)text('Friendzy',W/2,H*.59,43,'#ddd9c9','center',0);
 }
}
function renderAt(time){const t=clamp(time,0,timeline.duration-1/24),{beat,event,local}=renderWorld(t);renderer.render(scene,camera);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);overlay(t,beat,event,local);return lastInfo;}
// The preview uses the same deterministic renderer as the encoded films.
renderer.domElement.style.display='none';document.body.append(canvas);
window.episode={mode,timeline,renderAt,get info(){return lastInfo;},canvas,renderer,scene,camera,actors,flatActors,modeled,layered,assetErrors,frame(time){renderAt(time);return canvas.toDataURL('image/jpeg',.95).split(',')[1];}};
renderAt(Number(params.get('time')||0));window.__ready=true;
