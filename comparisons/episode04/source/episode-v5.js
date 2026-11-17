// Episode 4 "Not For Sale", version 5: same story, voices, sets and props as episode.js (v4), rebuilt on
//  art/three/animation/v5 (footstep planner, balanced standing, blended faces, held gaze, squash and stretch)
//  art/three/illustrated/reference-v3 (per-set light and shadow, boiling ink, paper)
// The old episode.js is untouched. Open render-v5.html?time=SECONDS to see one picture.
import * as THREE from 'three';
import {makeActor,applyActor,validateTimeline} from '../../../art/three/animation/v5/cast.js';
import {poseAt,blinkAt,attention,lookAtObject,expression,ease,sampleClock,drawingStep,fastWindowsFor} from '../../../art/three/animation/v5/performance.js';
import {gait,applyGait,stand,idleBalance,seatPose,seatedLegs,settleSeat,pelvisState,preTurn,PRE_TURN} from '../../../art/three/animation/v5/locomotion.js';
import {followThrough} from '../../../art/three/animation/v5/secondary.js';
import {squashAt,applyBodyScale} from '../../../art/three/animation/v5/squash.js';
import {orientSmears} from '../../../art/three/animation/v4/secondary.js';
import {hold,reachContact,cameraAwareHands} from '../../../art/three/animation/v3/interactions.js';
import {setCamera,projectedHead} from '../../../art/three/animation/v3/direction.js';
import {createIllustratedLook} from '../../../art/three/illustrated/reference-v3/look.js';
import {installArtDirection} from '../../../art/three/illustrated/reference-v3/art-direction.js';
import {buildSet} from '../../../art/three/sets/build.js';
import {SETS} from '../../../art/three/sets/catalog.js';
import {prepareEpisodeSetsV5,SEATS} from './sets-v5.js';
import {buildFamily,crowdActs,KIN} from './crowd.js';
import {storyProps} from './story-props.js';
import {box,ball,line} from './props.js';

import {overshoot} from '../../../art/three/animation/v5/math.js';
const params=new URLSearchParams(location.search);
const timeline=await fetch('./timeline-v5.json').then(r=>{if(!r.ok)throw Error('timeline-v5.json missing: run python3 comparisons/episode04/source/prepare.py');return r.json();});
const W=1920,H=1080,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const FAST=fastWindowsFor(timeline);                       // 24-drawings-a-second windows; everything else is on twos
const font=new FontFace('Porchlight','url(../../episode01/source/Boogaloo-Regular.ttf)');await font.load();document.fonts.add(font);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.style.display='none';document.body.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,16/9,.1,600),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;document.body.append(canvas);const ctx=canvas.getContext('2d');
// Note: no scene lights. The illustrated look draws its own light and shadow per set (reference-v3/lighting.js).

// ---- sets, cast, props (same content as v4) ----
const modeled={};
for(const id of ['park','apartment','lake','lake_night','stoop_sunset','stoop_night','main_street']){const root=buildSet(SETS.find(s=>s.id===id));root.visible=false;modeled[id]=root;scene.add(root);root.traverse(o=>{if(o.userData.marker)o.visible=false;});}
const art=installArtDirection(modeled);const setFx=prepareEpisodeSetsV5(modeled),referenceSets=setFx;
const logo=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(Error('Friendzy logo missing: art/inserts/friendzy-logo.png'));i.src='../../../art/inserts/friendzy-logo.png';});
const actors={};
for(const id of ['riot','rocco','bash','pip','preston','marlo','mayor','bashmom','hiker']){actors[id]=makeActor(id);scene.add(actors[id].root);actors[id].root.visible=false;}
buildFamily(scene,actors);   // six individual relatives (crowd.js)
validateTimeline(timeline,Object.keys(actors));
const lifeguard=new THREE.Group();lifeguard.name='Riot lifeguard outfit';actors.riot.spine.add(lifeguard);
box(lifeguard,'white lifeguard shirt',0xf1e7cf,[0,.68,.04],[1.08,1.10,.58]);box(lifeguard,'red lifeguard cross vertical',0xbd5543,[0,.79,.34],[.12,.34,.018]);box(lifeguard,'red lifeguard cross horizontal',0xbd5543,[0,.79,.34],[.34,.12,.018]);box(lifeguard,'lifeguard red shorts',0xad4d3d,[0,.13,0],[1.1,.25,.56]);line(lifeguard,'whistle cord',0x5c665a,[[-.28,1.21,.32],[0,.73,.38],[.28,1.21,.32]],.012);ball(lifeguard,'lifeguard whistle',0xb0b7ac,[0,.73,.41],[.065,.04,.04]);
const props=await storyProps(scene,modeled),look=createIllustratedLook({scene,renderer,actors,modeled});
const B=Object.fromEntries(timeline.beats.map(b=>[b.id,b])),E=Object.fromEntries(timeline.events.map(e=>[e.id,e])),paths=Object.fromEntries(timeline.paths.map(p=>[p.id,p]));
const pathsByWho={};for(const p of timeline.paths)(pathsByWho[p.who]??=[]).push(p);
const CROWD_TIMELINE={events:[],paths:[],fastWindows:[],duration:timeline.duration};      // relatives only stand and react: they never speak with Bash
const ENDING={id:'ending',location:'stoop_night',start:timeline.end_start,end:timeline.duration};
const EPS=1e-6;
let positioned={},states={},lastInfo=null,lastRendered=null,lastJPEGTime=null,lastJPEG=null,dt=1/12;

/** Walking speed of an actor at time t (0 when not on a path). Used for drag on ears, tail and hem. */
function speedOf(who,t){for(const p of pathsByWho[who]||[])if(t>=p.start&&t<=p.end)return pelvisState(p,t).speed;return 0;}

/**
 * Place and pose one actor. `path` (from along()) makes it walk; otherwise it stands (or sits, if seat>0).
 * Order matters: root position and facing first, then the pose, then the legs, then squash and secondary motion.
 */
function put(id,pos,t,b,{seat=0,yaw=0,path=null,face=null,turn=null,floor,lean=0}={}){
  const r=actors[id],crowd=id.startsWith('family'),who=crowd?'bash':id;
  const p=poseAt(who,t,crowd?CROWD_TIMELINE:timeline,b,{dt});
  if(face)expression(p,face,.7);
  if(lean){p.torsoX+=lean;p.headX-=lean*.6;}   // negative lean = leaning back (beanbag)
  let hop=0;
  if(crowd){const k=KIN.findIndex(k=>k.id===id),a=crowdActs(p,k,t,KIN[k].size<.7);hop=a.hop;yaw=clamp(-pos[0]*.05,-.4,.4);}   // each relative acts on their own cycle and turns toward the group
  if(id==='mayor'){p.headZ+=.025*Math.sin(t*3);p.aRw+=.025*Math.sin(t*11);}
  const sample=path?gait(path,t,r):null;
  r.root.visible=true;
  if(sample){r.root.position.copy(sample.position);r.root.rotation.set(0,sample.yaw,0);}
  else{r.root.position.fromArray(pos);r.root.position.y+=hop;r.root.rotation.set(0,yaw,0);}
  r.root.userData.hop=hop;
  if(seat&&floor!==undefined){const L=seatedLegs({hipY:pos[1],floor,scale:r.root.getWorldScale(V()).y,t,id});p.lLf=p.lRf=L.f;p.lLk=p.lRk=L.k;}else seatPose(p,seat);   // floor given: legs fit the seat (feet on the floor, or dangling)
  const blink=blinkAt(crowd?'bash#'+id:who,t,timeline)*(1-(p.noBlink||0));
  applyActor(r,p,t,blink);
  if(seat)settleSeat(r,seat);
  if(sample)applyGait(r,sample);
  else if(!seat)stand(r,()=>pos[1]+hop,{idle:idleBalance(id,t,{energy:crowd?1.0:1}),yaw,turn});
  if(!crowd)applyBodyScale(r,squashAt(who,t,{paths:pathsByWho[who],events:timeline.events,pose:p}));
  positioned[id]=r;states[id]={pose:p,motion:sample,seated:seat>0,speed:sample?sample.speed:0};
  return r;
}
/**
 * Where is a path-walker at time t? Before the walk it waits at the first point (making a stepping turn just before
 * it sets off, if its facing differs); after the walk it keeps the end facing.
 */
function along(id,fallback,t){
  const p=paths[id];
  if(t<p.start){const pre=preTurn(p,t);return {pos:p.points[0],path:null,yaw:pre.yaw,turn:pre.turn};}
  if(t>p.end)return {pos:p.points.at(-1),path:null,yaw:p.endYaw??preTurn(p,p.start).yaw,turn:null};
  return {pos:fallback,path:p,yaw:0,turn:null};
}
function eat(r,t){props.sandwich.visible=true;hold(props.sandwich,r,'R','cup',{offset:V(0,-.06,.12)});const target=r.head.localToWorld(V(.22,.16,.56));reachContact(r,'R',target,{kind:'cup',amount:.55+.25*Math.sin(t*1.7)**2});}

function drawWorld(t){
 look.resetActors();positioned={};states={};Object.values(actors).forEach(r=>r.root.visible=false);
 // Beat boundaries: a tiny epsilon so float noise never moves a cut by a drawing.
 const found=timeline.beats.find(b=>t>=b.start-EPS&&t<b.end-EPS),b=found||(t>=timeline.end_start-EPS?ENDING:null);
 if(!b)throw Error('No beat at time '+t);
 const e=timeline.events.find(e=>t>=e.start&&t<e.end),l=t-b.start,id=b.location;
 Object.entries(modeled).forEach(([k,r])=>r.visible=k===id);
 for(const p of [props.clipboard,props.spoon,props.hammer,props.sandwich,props.sign,props.bucket,props.easel,props.car,props.bee])p.visible=false;
 props.notice.visible=id==='main_street'&&l>=2.9;props.pin.visible=props.notice.visible;props.old.visible=true;
 lifeguard.visible=b.id==='s01';actors.riot.refined.body.visible=!lifeguard.visible;
  if(b.id==='s01'){
  put('riot',[-.9,0,3],t,b);put('bash',[-2.8,0,3],t,b);
  for(const who of ['preston','marlo']){const a=along('opening-'+who,[who==='preston'?3.1:5.2,0,2.3],t);put(who,a.pos,t,b,{path:a.path,yaw:a.yaw,turn:a.turn});}
  put('mayor',[7.3,.55,2],t,b,{seat:1});props.easel.visible=true;props.car.visible=true;
  const reveal=E.s01_01.start-.55,w=ease((t-reveal)/.65);props.cloth.scale.y=1.82*(1-w);props.cloth.position.y=1.98-.9*w;props.cloth.visible=w<1;
  props.clipboard.visible=true;hold(props.clipboard,actors.marlo,'R','clipboard',{offset:V(0,-.12,.10)});
  if(w>0&&w<1)reachContact(actors.marlo,'L',V(5.35,1.23,.40),{kind:'open'});
  setCamera(camera,[2.1,1.9,12.0],[2.1,1.65,2],43);
 }else if(b.id==='s02'){
  setCamera(camera,[1.2,3.2,11.5-l*.03],[-3.4,3.7,-16],50);   // panned left so the whole lookout tower, roof included, is in frame
 }else if(b.id==='s03'){
  const hip=SEATS.sofaTop+.04,sz=SEATS.sofaFrontZ-.18;   // hips just above the cushion, thighs along it, knees past the front edge
  put('bash',[-2.9,hip,sz],t,b,{seat:1,floor:0,yaw:.32});put('pip',[-1.5,hip,sz],t,b,{seat:1,floor:0,yaw:-.28});put('rocco',[3.1,.36,.22],t,b,{seat:1,floor:0,yaw:-.55,lean:-.12});put('riot',[.3,0,1.7],t,b);   // Rocco sunk into the beanbag: thighs come out of the front, shins hang over the edge
  eat(actors.rocco,t);setCamera(camera,[.3,2.35,6.6],[0,1.55,-1],45);
 }else if(b.id==='s04'){
  put('rocco',[-6,.55,3],t,b,{seat:1});put('bash',[-2.8,0,3],t,b);put('riot',[-.9,0,3],t,b);put('pip',[1,0,3],t,b);put('mayor',[7.3,.55,2],t,b,{seat:1});
  const a=along('mom-enter',[-4.4,0,3],t);put('bashmom',a.pos,t,b,{path:a.path,yaw:a.yaw,turn:a.turn,face:'happy'});
  props.spoon.visible=true;hold(props.spoon,actors.bashmom,'L','pencil',{offset:V(0,-.04,.1)});
  for(const who of ['preston','marlo']){const p=paths['return-'+who];if(t>=p.start){const a=along(p.id,[who==='preston'?3.1:5.2,0,2.3],t);put(who,a.pos,t,b,{path:a.path,yaw:a.yaw,turn:a.turn});}}
  for(const k of KIN)put(k.id,k.home,t,b,{face:'happy'});
  props.sign.visible=true;props.bucket.visible=true;
  for(let i=0;i<props.haze.length;i++){const h=props.haze[i],u=(t*.22+i*.19)%1;h.position.set(Math.sin(t*.6+i)*.18,.52+u*1.25,.05*Math.cos(t+i));h.scale.set(.16+u*.18,.10+u*.10,.15+u*.1);h.material.opacity=.08*(1-u);}
  if(l<2){props.hammer.visible=true;hold(props.hammer,actors.rocco,'R','pencil',{offset:V(0,-.02,.10)});reachContact(actors.rocco,'R',V(-6.27,1.15+.10*Math.abs(Math.sin(l*7)),3.55),{kind:'pencil'});}else eat(actors.rocco,t);
  if(positioned.marlo){props.clipboard.visible=true;hold(props.clipboard,actors.marlo,'L','clipboard',{offset:V(0,-.12,.1)});}
  setCamera(camera,[.15,2.3,14.8],[.2,1.6,.6],49);
 }else if(b.id==='s05'){
  for(const [who,x] of [['bash',-3],['riot',-1],['pip',1],['rocco',-5]])put(who,[x,0,3],t,b,{face:'happy'});
  const enter=paths['hiker-enter'],exit=paths['hiker-exit'];
  if(t<exit.end){const a=along(t<exit.start-PRE_TURN?enter.id:exit.id,[3.9,0,2.1],t);put('hiker',a.pos,t,b,{path:a.path,yaw:a.yaw,turn:a.turn,face:'happy'});}
  const beeAt=E.s05_03.end+3.25;if(t>=beeAt&&t<beeAt+.9){props.bee.visible=true;props.bee.position.set(-2+(t-beeAt)*5,1.8+.08*Math.sin(t*10),3.7);}
  if(e?.id==='s05_05')eat(actors.bash,t);setCamera(camera,[.15,2.3,14.8],[.2,1.6,.6],49);
 }else if(b.id==='s06'){
  const en=paths['preston-lake-enter'],ex=paths['preston-lake-exit'];
  if(t<ex.end){const a=along(t<ex.start-PRE_TURN?en.id:ex.id,[1.1,0,2.4],t),r=put('preston',a.pos,t,b,{path:a.path,yaw:a.yaw,turn:a.turn});
   if(t<timeline.actions.horn){r.head.rotation.x+=.12;lookAtObject(r,V(1,0,-1),.4);}
   else{r.spine.rotation.x=0;const fan=r.spine.getObjectByName('peacock feather fan');fan.rotation.y=.20*Math.sin((t-timeline.actions.horn)*12)*Math.exp(-(t-timeline.actions.horn)*3);}}
  setCamera(camera,[5,2.5,-6.5],[1,1.35,1],43);
 }else if(b.id==='s07'){
  put('riot',[1.25,.50,-.05],t,b,{seat:1});put('rocco',[2.65,.50,-.05],t,b,{seat:1});setCamera(camera,[-.6,2.7,9],[1.4,1.65,-.6],43);
 }else if(b.id==='s08'){
  const enter=paths['marlo-board-enter'],exit=paths['marlo-board-exit'];
  if(t<exit.end){const step=paths['marlo-stepaside'],seg=t<enter.end?enter:t<exit.start-PRE_TURN?step:exit,a=along(seg.id,[-3.15,.16,5.5],t);
   // After arriving she turns her back to the camera (a real stepping turn), holds, then steps aside.
   const u=clamp((l-2.25)/.4,0,1),turning=seg===step&&!a.path&&l>=2.25&&l<2.65,yaw=seg===step&&!a.path&&l<2.65?(l<2.25?0:Math.PI*ease(u)):a.yaw;
   const r=put('marlo',a.pos,t,b,{path:a.path,yaw,turn:turning?{from:0,to:Math.PI,u}:a.turn});
   props.clipboard.visible=true;hold(props.clipboard,r,'R','clipboard',{offset:V(0,-.12,.10)});
   if(l>=2.4&&l<3.5)reachContact(r,'L',modeled.main_street.getObjectByName('notice pin').getWorldPosition(V()),{kind:'open',amount:ease((l-2.4)/.35)*(1-ease((l-3.2)/.3))});}
  setCamera(camera,[-.5,2.4,11],[-4.1,1.5,4.6],44);
  if(t>=timeline.actions.noticeInsert[0]&&t<timeline.actions.noticeInsert[1]){const p=props.notice.getWorldPosition(V());setCamera(camera,[p.x,p.y+.03,p.z+2.0],[p.x,p.y-.10,p.z],42);}
 }else if(b.id==='ending'){
  setCamera(camera,[2.5,2.6,1.8],[3.25,2.55,-.65],37);
 }else throw Error('No camera for beat '+b.id);
 // Flatter lens on the exterior shots (longer lens, camera farther back, same framing): reads more like a painted plate.
 // Interiors are skipped (the camera would back through the wall) and so is the notice close-up insert.
 const FLAT_TARGET={s01:[2.1,1.55,2],s04:[.2,1.7,.6],s05:[.2,1.7,.6],s06:[1,1.35,1],s07:[1.4,1.65,-.6],s08:[-4.1,1.5,4.6]};
 const insert=b.id==='s08'&&t>=timeline.actions.noticeInsert[0]&&t<timeline.actions.noticeInsert[1];
 if(FLAT_TARGET[b.id]&&!insert)look.flatten(camera,V(...FLAT_TARGET[b.id]),1.3);
 // Close-up cuts (timeline.cuts, from prepare.py): the camera moves in on one speaker for a line and a beat, then the wide shot returns.
 let cutNow=null;{const c=(timeline.cuts||[]).find(c=>t>=c.start-EPS&&t<c.end-EPS),r=c&&positioned[c.who];if(r){scene.updateMatrixWorld(true);const target=r.head.getWorldPosition(V());target.y+=.28;const dir=camera.position.clone().sub(target);dir.y=0;if(dir.lengthSq()<1e-6)dir.set(0,0,1);dir.normalize();dir.y=.10;dir.normalize();camera.position.copy(target).addScaledVector(dir,c.dist);camera.fov=30;camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);cutNow=c;}}
 setFx.animate(t);
 scene.updateMatrixWorld(true);attention(positioned,timeline,t,b);
 if(b.id==='s06'&&positioned.preston&&t<timeline.actions.horn)lookAtObject(actors.preston,V(1,0,-1),.25);
 for(const root of [modeled.stoop_sunset,modeled.stoop_night])root.traverse(o=>{if(/bulb/.test(o.name)&&o.material)o.material.emissiveIntensity=t<timeline.actions.lampOff?1.5:0;});
 look.update(t,id,{...b,lightOff:timeline.actions.lampOff},e,positioned);
 for(const [who,r] of Object.entries(positioned)){
  const state=states[who],base=who.startsWith('family')?'bash':who;
  followThrough(r,state.pose,t,{speedNow:state.speed,speedBefore:speedOf(base,t-.15),seated:state.seated});
  orientSmears(look,r,e,t);cameraAwareHands(r,camera,.6);
 }
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const heads=Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,projectedHead(r,camera)]));
 lastInfo={time:t,dt,cut:cutNow?cutNow.who:null,beat:b.id,location:id,speaker:e?.who||null,silent:e?.silent||false,voiceover:false,line:e?.id||null,heads,
  visemes:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,r.refined.lastViseme])),
  footContacts:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,states[who].motion?r.motion.contacts:[]])),
  motionIds:Object.fromEntries(Object.entries(states).map(([who,s])=>[who,s.motion?.id||null])),
  volume:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,r.motion.secondary?.volume??1])),
  cameraPosition:camera.position.toArray(),cameraQuaternion:camera.quaternion.toArray(),cameraFov:camera.fov};
 return {b,e,l};
}
function text(s,x,y,size=48,color='#fff7dc',align='left',stroke=5){ctx.font=`${size}px Porchlight`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';if(stroke){ctx.lineWidth=stroke;ctx.strokeStyle='#25282a';ctx.strokeText(s,x,y);}ctx.fillStyle=color;ctx.fillText(s,x,y);}
function overlay(t,b,e,l){
 if(b.id==='s01'&&l<2)text('NOT FOR SALE',65,85,42,'#f0d38d');
 if(b.id==='s02'){ctx.globalAlpha=Math.max(0,Math.min(1,l/.8,(b.end-t)/.5));if(l<3.7){text('PORCHLIGHT',W/2,H*.41,140,'#f4d891','center',10);text('MAPLE HOLLOW',W/2,H*.53,32,'#faf1d6','center',4);}else{text('EPISODE 04',W/2,H*.40,34,'#ecdcaa','center',3);text('Not For Sale',W/2,H*.49,90,'#fff7e2','center',7);}ctx.globalAlpha=1;}
 if(e&&!e.silent){const words=e.text.replace(/\.\.\./g,'…').split(/\s+/),i=Math.floor(clamp((t-e.start)/(e.end-e.start),0,.999)*words.length),first=Math.floor(i/5)*5;text(words.slice(first,first+5).join(' ').toUpperCase(),W/2,H-74,50,'#fff8e8','center',7);}
 if(b.id==='ending'){const u=clamp((t-timeline.actions.lampOff)/.55,0,1);ctx.fillStyle=`rgba(0,0,0,${u})`;ctx.fillRect(0,0,W,H);const lu=t-timeline.actions.lampOff-.9;if(lu>=0){const size=330*(.90+.10*overshoot(lu,.22,.5)),x=W/2-size/2,y=H*.50-size/2;ctx.save();ctx.globalAlpha=Math.min(1,lu/.2);ctx.beginPath();ctx.roundRect(x,y,size,size,size*.225);ctx.clip();ctx.drawImage(logo,x,y,size,size);ctx.restore();}}   // the Friendzy logo pops in small on black
}
/** Draw the picture that is on screen at `time`. Whole drawings are held: same drawing for the whole 1/12 s (or 1/24 s in a fast window). */
function renderAt(time,{draw=true,force=false}={}){
 const raw=clamp(time,0,timeline.duration-1/24),t=sampleClock(raw,FAST);dt=drawingStep(t,FAST);
 if(draw&&t===lastRendered&&!force)return lastInfo;
 const {b,e,l}=drawWorld(t);
 if(draw){look.render(camera,t);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);overlay(t,b,e,l);lastRendered=t;}else lastRendered=null;
 return lastInfo;
}
window.episode={timeline,scene,camera,renderer,canvas,actors,modeled,look,illustrated:look,art,referenceSets,props,renderAt,fastWindows:FAST,get info(){return lastInfo;},
 frame(t){renderAt(t);if(lastJPEGTime!==lastRendered){lastJPEG=canvas.toDataURL('image/jpeg',.95).split(',')[1];lastJPEGTime=lastRendered;}return lastJPEG;}};
renderAt(Number(params.get('time')||0));window.__ready=true;
