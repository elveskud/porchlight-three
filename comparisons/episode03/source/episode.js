import * as THREE from 'three';
import {makeActor,applyActor,neutral} from '../../../art/three/animation/v3/cast.js';
import {poseAt,blinkAt,attention,lookAtObject,ease,sampleClock} from '../../../art/three/animation/v3/performance.js';
import {gait,applyGait,plantFeet,seatPose,settleSeat,risePose,solveLeg,pivotTurn} from '../../../art/three/animation/v3/locomotion.js';
import {hold,reachContact,twoHanded,shapeHand,carryOrientation,transfer,cameraAwareHands} from '../../../art/three/animation/v3/interactions.js';
import {followThrough,orientSmears,groupReaction,seatResponse} from '../../../art/three/animation/v3/secondary.js';
import {setCamera,frameActors,authoredMove,flatten,projectedHead} from '../../../art/three/animation/v3/direction.js';
import {createIllustratedLook} from '../../../art/three/illustrated/v3/look.js';
import {installArtDirection} from '../../../art/three/illustrated/v3/art-direction.js';
import {refineEnvironment} from '../../episode01/source/refinements/environment.js';
import {buildSet} from '../../../art/three/sets/build.js';
import {SETS} from '../../../art/three/sets/catalog.js';
import {box,ball,line,makeNotebook,makePhone,makeClipboard,makePencil,makeCup,prepareSets} from './props.js';
const params=new URLSearchParams(location.search),timeline=await fetch('./timeline.json').then(r=>r.json()),W=1920,H=1080,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp;
const font=new FontFace('Porchlight','url(../../episode01/source/Boogaloo-Regular.ttf)');await font.load();document.fonts.add(font);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,16/9,.1,600),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
const ambient=new THREE.HemisphereLight(0xffefd4,0x7b9273,1.6),fill=new THREE.AmbientLight(0xffffff,.45),key=new THREE.DirectionalLight(0xffedcc,2.5);scene.add(ambient,fill,key);
const modeled={},actors={};for(const id of ['classroom','lake','lake_night','stoop_sunset','stoop_night','main_street','brook_porch','pip_home','pip_garage','apartment','hall_outside']){const root=buildSet(SETS.find(s=>s.id===id));root.visible=false;modeled[id]=root;scene.add(root);root.traverse(o=>{if(o.userData.marker)o.visible=false;});}
for(const id of ['riot','rocco','bash','pip','owl','gus','dot','brook']){const r=makeActor(id);r.root.visible=false;actors[id]=r;scene.add(r.root);}
const environment=refineEnvironment({scene,modeled,renderer,ambient,fill,key}),dressing=prepareSets(modeled),art=installArtDirection(modeled);
const notebook=makeNotebook(scene),phone=makePhone(scene),clipboard=makeClipboard(scene),pencil=makePencil(scene),bashPencil=makePencil(scene),cup=makeCup(scene);for(const g of [notebook.g,phone,clipboard,pencil,bashPencil,cup]){g.scale.setScalar(.56);g.visible=false;}
const colliders={};for(const [id,root] of Object.entries(modeled)){root.updateMatrixWorld(true);colliders[id]=[];root.traverse(o=>{if(o.isMesh&&/broad stoop step|door landing|sofa base|writing desk|student chair seat|rocking chair/.test(o.name))colliders[id].push(new THREE.Box3().setFromObject(o));});}
const library=params.has('library')?await import('../../../art/three/animation/v3/library.js').then(m=>m.createMotionLibrary({scene,actors,modeled})):null;
const beanSeat=dressing.bean.getObjectByName('beanbag seat');seatResponse(beanSeat,0,{compression:.08});
const baseProps=[notebook.g,phone,clipboard,pencil,bashPencil,cup],look=createIllustratedLook({scene,renderer,actors,modeled});
const B=Object.fromEntries(timeline.beats.map(b=>[b.id,b])),paths=Object.fromEntries(timeline.paths.map(p=>[p.id,p])),eventAt=t=>timeline.events.find(e=>t>=e.start&&t<e.end);
const wind=[];for(const root of Object.values(modeled))root.traverse(o=>{if(['summer cloud','paper chimes','ceiling fan'].includes(o.name))wind.push({o,x:o.position.x,y:o.rotation.y,z:o.rotation.z});});
let lastInfo=null,lastRendered=null,lastJPEGTime=null,lastJPEG=null,positioned={},states={},contactErrors=[];
function put(who,position,t,event,b,{yaw=0,seat=0,rise=null,path=null,sleep=false,ground=position[1]}={}){
 const r=actors[who],p=poseAt(who,t,timeline,b);r.root.visible=true;r.root.position.fromArray(position);r.root.rotation.set(0,yaw,0);
 if(sleep){p.lids=.98;p.headX=.22;p.headZ=.10;p.mouthHeight=0;p.viseme='X';}
 const w=rise===null?seatPose(p,seat):risePose(p,rise);if(rise!==null)r.root.position.y=mix(position[1],ground,ease(rise));if(b.id==='s07'&&who==='bash'){const praise=timeline.events.find(e=>e.id==='s07_06');if(t>praise.end){p.headX+=.11*ease((t-praise.end)/.5);p.handL=p.handR='relax';}}
 if(event?.face==='shocked'&&event.who!==who)groupReaction(p,Object.keys(positioned).length,t,event.start,{strength:.025});
 applyActor(r,p,t,blinkAt(who,t,timeline));if(w)settleSeat(r,w);
 let motion=null;if(path&&t>=path.start&&t<=path.end){motion=gait(path,t);applyGait(r,motion);}else if(!w)plantFeet(r,()=>ground);
 positioned[who]=r;states[who]={pose:p,seated:w>0,motion};return r;
}
function holdPhone(r,side='R'){phone.visible=true;hold(phone,r,side,'phone',{offset:V(0,-.07,.11),rotation:V(-.12,0,0)});}
function readBook(r,t,{writing=false}={}){
 notebook.g.visible=true;if(notebook.g.parent!==scene)scene.add(notebook.g);notebook.g.scale.setScalar(.56);const center=r.spine.localToWorld(V(0,.47,.65));const errors=twoHanded(notebook.g,r,{target:center,width:.52,t});contactErrors.push({who:r.root.userData.castId,kind:'notebook-two-hand',...errors});
 if(writing){pencil.visible=true;hold(pencil,r,'R','pencil',{offset:V(0,-.09,.06),rotation:V(.6,0,-.3)});const target=notebook.g.localToWorld(V(.12,.10,.04+.035*Math.sin(t*12)));reachContact(r,'R',target,{kind:'pencil'});}
 lookAtObject(r,notebook.g.getWorldPosition(V()),.6);
}
function drawWorld(t){
 seatResponse(beanSeat,1,{compression:.08});look.resetActors();positioned={};states={};contactErrors=[];Object.values(actors).forEach(r=>r.root.visible=false);baseProps.forEach(g=>g.visible=false);
 let beat=timeline.beats.find(b=>t>=b.start&&t<b.end)||{id:'ending',location:'stoop_night',start:timeline.end_start,end:timeline.duration};const b={...beat,lightOff:beat.location.startsWith('stoop')?timeline.actions.lampOff:beat.lightOff},id=b.location,l=t-b.start,e=eventAt(t);Object.entries(modeled).forEach(([k,g])=>g.visible=k===id);
 // Absolute reset of every interactive prop keeps out-of-order seeking deterministic.
 dressing.toggle.rotation.x=id==='pip_garage'&&t>=B.s08.lightOff?.30:-.30;notebook.draw(id==='pip_home'?ease(l/5.8):1,id==='pip_home'?ease((l-7.3)/1.3):0);
 const door=modeled.hall_outside.getObjectByName('hall door hinge');door.rotation.y=b.id==='recap'?.55:0;
 let fixedCamera=false;
 if(b.id==='recap'){setCamera(camera,[5.8,3.3,10.2],[0,2,1],40);fixedCamera=true;
 }else if(b.id==='s01'){
  put('owl',[0,0,-2.6],t,e,b);put('bash',[-1.5,.58,1.9],t,e,b,{yaw:Math.PI,seat:1});put('pip',[1.5,.58,1.9],t,e,b,{yaw:Math.PI,seat:1});
  clipboard.visible=true;hold(clipboard,actors.owl,'L','clipboard',{offset:V(0,-.16,.08),rotation:V(-.10,0,0)});reachContact(actors.owl,'L',actors.owl.spine.localToWorld(V(-.35,.56,.57)),{kind:'clipboard'});
  if(e?.who==='owl'){setCamera(camera,[-.7,2.4,2.2],[0,1.45,-2.6],36);}else if(e){setCamera(camera,[0,2.25,-1.7],[0,1.5,1.9],46);}else{setCamera(camera,[-6.4,4.3,8.8],[0,1.6,-.4],43);}fixedCamera=true;
 }else if(b.id==='s02'){
  setCamera(camera,[4+Math.sin(l*.15)*.4,4.2,17-l*.08],[0,2,-11],42);fixedCamera=true;
 }else if(b.id==='s03'){
  put('bash',[.2,.50,-.05],t,e,b,{seat:1});put('pip',[1.25,.20,1.30],t,e,b);put('riot',[2.65,.20,1.25],t,e,b);put('rocco',[4.35,.65,1.35],t,e,b,{seat:1});
  if(e?.who==='rocco'){const r=actors.rocco;r.head.rotation.x+=.06;}
  setCamera(camera,[-1.2,2.55,8.0],[2.1,1.4,.2],40);
  if(e&&e.shot==='two')frameActors(camera,[positioned[e.who],positioned[e.to]||actors.riot],{padding:1.2});
 }else if(b.id==='s04'){
  const mailboxPhase=t>timeline.events.find(e=>e.id==='s04_01').end+1.1;
  put('riot',[-1.1,.05,2.2],t,e,b);put('gus',[2.6,.05,.80],t,e,b);put('pip',[.25,.05,3.0],t,e,b);put('rocco',[-4.8,.89,1.0],t,e,b,{seat:1,sleep:true});put('bash',mailboxPhase?[-3.2,.05,-2.7]:[-2.3,.05,2.4],t,e,b,{yaw:mailboxPhase?-1.0:0});
  const enter=paths['dot-enter'],exit=paths['dot-exit'];if(t>=enter.start){let p=[1.6,.05,2.6],path=t<enter.end?enter:t>=exit.start&&t<=exit.end?exit:null;if(path||t<exit.end)put('dot',p,t,e,b,{path,ground:.05});}
  if(mailboxPhase){holdPhone(actors.bash);const target=actors.bash.spine.localToWorld(V(.18,.85,.80));reachContact(actors.bash,'R',target,{kind:'phone'});if(e?.who==='bash'&&e.id==='s04_04'){bashPencil.visible=true;hold(bashPencil,actors.bash,'L','pencil');}}
  else{holdPhone(actors.riot);reachContact(actors.riot,'R',actors.riot.spine.localToWorld(V(.20,.85,.72)),{kind:'phone'});}
  setCamera(camera,[4.2,3.8,11.4],[-.7,1.4,.8],43);
  if(e?.who==='bash'&&mailboxPhase){setCamera(camera,[.3,2.4,2.9],[-3.9,1.15,-2.8],37);fixedCamera=true;}
  else if(e&&e.shot==='two')frameActors(camera,[positioned[e.who],positioned[e.to]||actors.riot],{padding:1.18});
 }else if(b.id==='s05'){
  put('brook',[-2.4,1.18,-.4],t,e,b,{seat:1});put('riot',[.6,.62,.65],t,e,b);put('pip',[-.65,.62,1.25],t,e,b);put('bash',[2.2,.62,1.2],t,e,b);
  cup.visible=true;hold(cup,actors.brook,'R','cup',{offset:V(.02,-.10,.08)});reachContact(actors.brook,'R',actors.brook.spine.localToWorld(V(.34,.45,.53)),{kind:'cup'});
  const parentQ=cup.parent.getWorldQuaternion(new THREE.Quaternion()).invert();cup.quaternion.copy(parentQ);const tea=timeline.events.find(e=>e.id==='s05_05');if(t>tea.end&&t<tea.end+1.0)reachContact(actors.brook,'R',actors.brook.head.localToWorld(V(.12,.28,.62)),{kind:'cup'});
  if(e?.id==='s05_08'){bashPencil.visible=true;hold(bashPencil,actors.bash,'R','pencil');actors.bash.head.rotation.x+=.12;}
  setCamera(camera,[-6.3,3.25,8.0],[-.7,1.8,0],40);
  if(e&&e.shot==='two')frameActors(camera,[positioned[e.who],positioned[e.to]||actors.brook],{padding:1.18});
 }else if(b.id==='s06'){
  const r=put('pip',[1.3,.58,-1.55],t,e,b,{seat:1,rise:t>=b.standAt?clamp((t-b.standAt)/1.2,0,1):null,path:t>=paths['pip-door'].start?paths['pip-door']:null,ground:0});
  if(t>=b.pivot.start&&t<b.pivot.end){pivotTurn(r,V(...b.pivot.position),0,b.pivot.toYaw,(t-b.pivot.start)/(b.pivot.end-b.pivot.start),0);states.pip.motion={turn:true,id:'pip-pivot'};}
  if(t<paths['pip-door'].start){readBook(r,t,{writing:l<5.8||(l>7.3&&l<8.6)});}
  else{notebook.g.visible=t<paths['pip-door'].end;hold(notebook.g,r,'L','notebook',{offset:V(0,-.12,.08),rotation:V(0,0,.12)});}
  if(t>=paths['pip-door'].end){r.root.visible=false;delete positioned.pip;delete states.pip;notebook.g.visible=false;}
  setCamera(camera,[3.4,2.45,4.6],[.4,1.6,-1.6],40);
  if(t>=b.notebookInsert[0]&&t<b.notebookInsert[1]){const p=notebook.g.getWorldPosition(V());setCamera(camera,[p.x,p.y+.95,p.z+.55],p.toArray(),36);fixedCamera=true;}
 }else if(b.id==='s07'){
  for(const [who,x] of [['bash',.2],['pip',1.4],['riot',2.6],['rocco',3.8]])put(who,[x,.50,-.05],t,e,b,{seat:1});
  readBook(actors.pip,t);setCamera(camera,[-.3,2.3,7.2],[2.0,1.30,-.10],39);
  if(e&&['riot','bash','rocco'].includes(e.who)&&e.shot==='two')frameActors(camera,[positioned[e.who],actors.pip],{padding:1.3});
  if(e?.who==='pip'&&e.id==='s07_07')authoredMove(camera,t,{start:e.start,end:e.end,from:[-.3,2.3,7.2],to:[.1,2.2,6.8],targetFrom:[2,1.3,-.1],targetTo:[2,1.3,-.1],fov:39});
 }else if(b.id==='s08'){
  const path=l<2.4?paths['pip-box']:l>=5.1&&l<=7?paths['pip-switch']:l>=7.8?paths['pip-exit']:null,p=l<5.1?[.65,0,1.9]:[-2.7,0,3.35],r=put('pip',p,t,e,b,{path,ground:0});
  if(l>=7.05&&l<7.7){const target=dressing.switchPlate.getWorldPosition(V()).add(V(0,0,.06)),amount=ease((l-7.05)/.20)*(1-ease((l-7.5)/.2)),error=reachContact(r,'L',target,{kind:'open',amount});contactErrors.push({who:'pip',kind:'light-switch',amount,error});}
  if(l>10.1){r.root.visible=false;delete positioned.pip;delete states.pip;}
  else if(l>2.4&&l<5.1)lookAtObject(r,modeled.pip_garage.getObjectByName('single sealed moving box').getWorldPosition(V()),.8);
  setCamera(camera,[4.6,3.1,8.2],[-.5,1.2,1.0],43);fixedCamera=true;
 }else if(b.id==='ending'){
  setCamera(camera,[2.5,2.6,1.8],[3.25,2.55,-.65],37);fixedCamera=true;
 }
 scene.updateMatrixWorld(true);attention(positioned,e,t,b);
 // Scripted looks override general listening, preserving the intended story targets.
 if(b.id==='s05'&&e?.id==='s05_03')lookAtObject(actors.brook,V(-8,2,-12),.5);
 if(b.id==='s04'&&e?.who==='dot'&&e.silent){actors.dot.head.rotation.y=0;actors.dot.face.pupils.forEach(p=>{p.position.x=0;p.position.y=0;});}
 if(b.id==='s07'&&t>timeline.events.find(e=>e.id==='s07_06').end){actors.bash.head.rotation.x+=.10;actors.bash.face.pupils.forEach(p=>p.position.y=-.025);}
 for(const {o,x,y,z} of wind){if(o.name==='summer cloud')o.position.x=x+.35*Math.sin(t*.025+x);else if(o.name==='paper chimes'){o.rotation.y=y+.12*Math.sin(t*.8);o.rotation.z=z+.025*Math.sin(t*.65);}else o.rotation.y=t*.55;}
 for(const root of [modeled.stoop_sunset,modeled.stoop_night])root.traverse(o=>{if(o.userData.practical)o.intensity=t<timeline.actions.lampOff?18:0;if(/bulb/.test(o.name)&&o.material)o.material.emissiveIntensity=t<timeline.actions.lampOff?1.5:0;});
 look.update(t,id,b,e,positioned);
 for(const [who,r] of Object.entries(positioned)){const state=states[who];const path=state.motion?.id?paths[state.motion.id]:null,turn=path?(gait(path,t+.04).yaw-gait(path,t-.04).yaw)/.08:state.motion?.turn?b.pivot.toYaw*2:0;followThrough(r,state.pose,t,{moving:!!state.motion,velocity:state.motion?1:0,turn,seated:state.seated,colliders:colliders[id]});orientSmears(look,r,e,t);}
 if(!fixedCamera){const visible=Object.values(positioned);if(visible.length){const target=visible.reduce((v,r)=>v.add(r.head.localToWorld(V(0,.65,.35))),V()).multiplyScalar(1/visible.length);flatten(camera,target,1.18);}}
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);for(const r of Object.values(positioned))cameraAwareHands(r,camera,.6);const heads={};for(const [who,r] of Object.entries(positioned))heads[who]=projectedHead(r,camera);
 lastInfo={time:t,beat:b.id,location:id,speaker:e?.who||null,voiceover:e?.voiceover||false,silent:e?.silent||false,line:e?.id||null,heads,visemes:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,r.refined.lastViseme])),footContacts:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,states[who].motion?r.motion.contacts:[]])),contacts:contactErrors,notebookVisible:notebook.g.visible,garageLight:t<B.s08.lightOff,motionIds:Object.fromEntries(Object.entries(states).map(([who,s])=>[who,s.motion?.id||null])),volume:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,r.motion.secondary.volume]))};return {b,e,l};
}
function text(s,x,y,size=48,color='#fff7dc',align='left',stroke=5){ctx.font=`${size}px Porchlight`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';if(stroke){ctx.lineWidth=stroke;ctx.strokeStyle='#25282a';ctx.strokeText(s,x,y);}ctx.fillStyle=color;ctx.fillText(s,x,y);}
function rect(x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
function overlay(t,b,e,l){
 if(b.id==='recap'){text('PREVIOUSLY',65,85,42,'#f0d38d');}
 if(b.id==='s01'&&l<2)text('SUMMER HOMEWORK',65,85,42,'#f0d38d');
 if(b.id==='s02'){ctx.globalAlpha=Math.max(0,Math.min(1,l/.8,(b.end-t)/.5));if(l<3.7){text('PORCHLIGHT',W/2,H*.41,140,'#f4d891','center',10);text('MAPLE HOLLOW',W/2,H*.53,32,'#faf1d6','center',4);}else{text('EPISODE 03',W/2,H*.40,34,'#ecdcaa','center',3);text('Summer Homework',W/2,H*.49,90,'#fff7e2','center',7);}ctx.globalAlpha=1;}
 if(b.id==='s04'&&t>b.laterCard&&t<b.laterCard+1.1){rect(50,55,475,90,12,'#1e2928dc');text('Four minutes later.',75,100,42,'#ead4a1');}
 if(e&&!e.silent&&e.caption!==false){const words=e.text.replace(/\.\.\./g,'…').split(/\s+/),i=Math.floor(clamp((t-e.start)/(e.end-e.start),0,.999)*words.length),first=Math.floor(i/5)*5;text(words.slice(first,first+5).join(' ').toUpperCase(),W/2,H-74,50,'#fff8e8','center',7);}
 if(b.id==='ending'){const u=clamp((t-timeline.actions.lampOff)/.55,0,1);if(u){ctx.fillStyle=`rgba(0,0,0,${u})`;ctx.fillRect(0,0,W,H);}if(t>timeline.actions.lampOff+.9)text('Friendzy',W/2,H*.59,43,'#ddd9c9','center',0);}
}
function renderAt(time,{draw=true,force=false}={}){const t=sampleClock(clamp(time,0,timeline.duration-1/24),timeline.fastWindows);if(draw&&t===lastRendered&&!force)return lastInfo;const {b,e,l}=drawWorld(t);if(draw){look.render(camera);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);overlay(t,b,e,l);lastRendered=t;}else lastRendered=null;return lastInfo;}
renderer.domElement.style.display='none';document.body.append(canvas);
window.episode={timeline,scene,camera,renderer,canvas,actors,modeled,look,illustrated:look,art,props:{notebook,phone,clipboard,pencil,bashPencil,cup,dressing},renderAt,get info(){return lastInfo;},frame(t){renderAt(t);if(lastJPEGTime!==lastRendered){lastJPEG=canvas.toDataURL('image/jpeg',.95).split(',')[1];lastJPEGTime=lastRendered;}return lastJPEG;}};renderAt(Number(params.get('time')||0));window.__ready=true;
if(params.has('inspect')){
 const {OrbitControls}=await import('../../../art/three/vendor/addons/controls/OrbitControls.js');const c=new OrbitControls(camera,canvas);c.target.set(0,1.5,0);c.update();c.addEventListener('change',()=>{look.render(camera);ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);lastRendered=null;});window.inspection={controls:c};
 const css=document.createElement('style');css.textContent='canvas{width:100vw;height:100vh;object-fit:contain}nav{position:fixed;bottom:18px;left:18px;display:flex;gap:8px;flex-wrap:wrap;background:#1d2d32e8;padding:12px;border-radius:10px}button,a{font:14px system-ui;color:#f5ead4;background:#38504b;border:1px solid #8c9c82;border-radius:5px;padding:9px;cursor:pointer;text-decoration:none}';document.head.append(css);const nav=document.createElement('nav');for(const [label,t] of [['Classroom',B.s01.start+2],['Street',B.s04.start+2],['Brook',B.s05.start+5],['Notebook',B.s06.start+7],['Essay',B.s07.start+15],['Garage',B.s08.start+3]]){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{renderAt(t,{force:true});const state=episode.info,who=state.speaker,r=actors[who];c.target.copy(r?.root.visible?r.head.getWorldPosition(V()):V(0,1.4,0));c.update();};nav.append(button);}const a=document.createElement('a');a.href='../';a.textContent='Watch Episode 3';nav.append(a);document.body.append(nav);
}

if(library)library.attach(window.episode);
