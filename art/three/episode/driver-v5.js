// Episode 4 "Not For Sale", version 5: same story, voices, sets and props as episode.js (v4), rebuilt on
//  art/three/animation/v5 (footstep planner, balanced standing, blended faces, held gaze, squash and stretch)
//  art/three/illustrated/reference-v3 (per-set light and shadow, boiling ink, paper)
// The old episode.js is untouched. Open render-v5.html?time=SECONDS to see one picture.
import * as THREE from 'three';
import {makeActor,applyActor,validateTimeline} from '../animation/v5/cast.js';
import {poseAt,blinkAt,attention,lookAtObject,expression,ease,sampleClock,drawingStep,fastWindowsFor} from '../animation/v5/performance.js';
import {gait,applyGait,stand,idleBalance,seatPose,seatedLegs,settleSeat,pelvisState,preTurn,PRE_TURN} from '../animation/v5/locomotion.js';
import {followThrough} from '../animation/v5/secondary.js';
import {squashAt,applyBodyScale} from '../animation/v5/squash.js';
import {orientSmears} from '../animation/v4/secondary.js';
import {hold,reachContact,cameraAwareHands} from '../animation/v3/interactions.js';
import {setCamera,projectedHead} from '../animation/v3/direction.js';
import {createIllustratedLook} from '../illustrated/reference-v3/look.js';
import {installArtDirection} from '../illustrated/reference-v3/art-direction.js';
import {buildSet} from '../sets/build.js';
import {SETS} from '../sets/catalog.js';
import {buildFamily,crowdActs,KIN} from './crowd.js';
import {buildSetV5} from '../sets/v5/index.js';
import {registerAll} from '../animation/v5/characters/index.js';

import {overshoot} from '../animation/v5/math.js';
export async function createEpisode({staging,timeline,hooks={}}){
const params=new URLSearchParams(location.search);
const spots=await fetch('/art/three/sets/spots.json').then(r=>r.json());
const W=1920,H=1080,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const FAST=fastWindowsFor(timeline);                       // 24-drawings-a-second windows; everything else is on twos
const font=new FontFace('Porchlight','url(/comparisons/episode01/source/Boogaloo-Regular.ttf)');await font.load();document.fonts.add(font);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.style.display='none';document.body.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,16/9,.1,600),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;document.body.append(canvas);const ctx=canvas.getContext('2d');
// Note: no scene lights. The illustrated look draws its own light and shadow per set (reference-v3/lighting.js).

// ---- sets, cast, props (same content as v4) ----
const modeled={};
for(const id of [...new Set([...Object.values(staging.beats).map(b=>b.set),staging.ending?.set||'stoop_night',...(staging.preloadSets||[])])]){const spec=SETS.find(s=>s.id===id);if(!spec)throw Error(`Unknown set ${id}: add its catalog entry`);const root=await buildSetV5(id)||buildSet(spec);root.visible=false;modeled[id]=root;scene.add(root);root.traverse(o=>{if(o.userData.marker)o.visible=false;});}
const art=installArtDirection(modeled);
const setFx=hooks.prepareSets?.(modeled)||{animate(){}};const referenceSets=setFx;
const logo=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(Error('Friendzy logo missing: art/inserts/friendzy-logo.png'));i.src='../../../art/inserts/friendzy-logo.png';});
await registerAll();
const actors={};
for(const id of [...new Set([...(staging.cast||['riot','rocco','bash','pip']),...Object.values(staging.beats).flatMap(b=>Object.keys(b.actors||{}))])]){actors[id]=makeActor(id);scene.add(actors[id].root);actors[id].root.visible=false;}
if(Object.values(staging.beats).some(b=>b.crowd==='family'))buildFamily(scene,actors);   // six individual relatives (crowd.js)
validateTimeline(timeline,Object.keys(actors));
const props=await hooks.setup?.({scene,modeled,actors,timeline,staging})||{};
const look=createIllustratedLook({scene,renderer,actors,modeled});
const B=Object.fromEntries(timeline.beats.map(b=>[b.id,b])),E=Object.fromEntries(timeline.events.map(e=>[e.id,e])),paths=Object.fromEntries(timeline.paths.map(p=>[p.id,p]));
const pathsByWho={};for(const p of timeline.paths)(pathsByWho[p.who]??=[]).push(p);
const CROWD_TIMELINE={events:[],paths:[],fastWindows:[],duration:timeline.duration};      // relatives only stand and react: they never speak with Bash
const ENDING={id:'ending',location:staging.ending?.set||'stoop_night',start:timeline.end_start,end:timeline.duration};
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
function drawWorld(t){
 look.resetActors();positioned={};states={};Object.values(actors).forEach(r=>r.root.visible=false);
 // Beat boundaries: a tiny epsilon so float noise never moves a cut by a drawing.
 const found=timeline.beats.find(b=>t>=b.start-EPS&&t<b.end-EPS),b=found||(t>=timeline.end_start-EPS?ENDING:null);
 if(!b)throw Error('No beat at time '+t);
 const e=timeline.events.find(e=>t>=e.start&&t<e.end),l=t-b.start,id=b.location;
 Object.entries(modeled).forEach(([k,r])=>r.visible=k===id);
 const data=b.id==='ending'?staging.ending:staging.beats[b.id];
 if(!data)throw Error(`No staging for beat ${b.id}: add it to staging.json`);
 const frame={t,b,e,l,actors,modeled,props,timeline,staging,B,E,paths,put,along,positioned,states,camera,look,V,clamp,ease,PRE_TURN};
 hooks.beforeFrame?.(frame);
 const c=data.camera;
 if(!c)throw Error(`No camera for ${b.id}: add camera.pos and camera.target`);
 const cp=c.pos.map((v,i)=>v+(c.velocity?.[i]||0)*l);
 setCamera(camera,cp,c.target,c.fov||45);
 for(const [who,a] of Object.entries(data.actors||{})){
   if(a.hook)continue;
   let seat=(a.seat||a.spot)&&spots[data.set]?.[a.seat||a.spot];
   const pos=a.at||seat?.pos;
   if(!pos)throw Error(`${b.id}.${who}: set at or a named seat`);
   const options={...(seat||{}),...a,seat:a.seat?1:(a.seated?1:0)};
   if(a.paths?.length){
     const ps=a.paths.map(id=>paths[id]);
     if(a.showFrom==='path'&&t<ps[0].start)continue;
     if(a.hideAfter==='path'&&t>=ps.at(-1).end)continue;
     const p=ps.find((p,i)=>!ps[i+1]||t<ps[i+1].start-PRE_TURN)||ps.at(-1);
     const motion=along(p.id,pos,t);put(who,motion.pos,t,b,{...options,path:motion.path,yaw:motion.yaw,turn:motion.turn});
   }else put(who,pos,t,b,options);
 }
 if(data.crowd==='family')for(const k of KIN)put(k.id,k.home,t,b,{face:'happy'});
 for(const name of data.hooks||[]){if(!hooks[name])throw Error(`Unknown hook ${name}: export it from props.js`);hooks[name](frame);}
 if(c.flatten!==false&&!frame.skipFlatten)look.flatten(camera,V(...(c.flatTarget||c.target)),typeof c.flatten==='number'?c.flatten:1.3);
 // Close-up cuts (timeline.cuts, from prepare.py): the camera moves in on one speaker for a line and a beat, then the wide shot returns.
 let cutNow=null;{const c=(timeline.cuts||[]).find(c=>t>=c.start-EPS&&t<c.end-EPS),r=c&&positioned[c.who];if(r){scene.updateMatrixWorld(true);const target=r.head.getWorldPosition(V());target.y+=.28;const dir=camera.position.clone().sub(target);dir.y=0;if(dir.lengthSq()<1e-6)dir.set(0,0,1);dir.normalize();dir.y=c.pitch??.10;dir.normalize();camera.position.copy(target).addScaledVector(dir,c.dist);camera.fov=30;camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);cutNow=c;}}
 modeled[id].userData.update?.(t);
 setFx.animate(t);
 scene.updateMatrixWorld(true);attention(positioned,timeline,t,b);
 hooks.afterAttention?.(frame);
 for(const root of [modeled.stoop_sunset,modeled.stoop_night].filter(Boolean))root.traverse(o=>{if(/bulb/.test(o.name)&&o.material)o.material.emissiveIntensity=(timeline.actions.lampOn===undefined||t>=timeline.actions.lampOn)&&t<timeline.actions.lampOff?1.5:0;});
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
 if(b.id==='s01'&&l<2)text(timeline.title.toUpperCase(),65,85,42,'#f0d38d');
 if(b.id==='s02'){ctx.globalAlpha=Math.max(0,Math.min(1,l/.8,(b.end-t)/.5));if(l<3.7){text('PORCHLIGHT',W/2,H*.41,140,'#f4d891','center',10);text('MAPLE HOLLOW',W/2,H*.53,32,'#faf1d6','center',4);}else{text('EPISODE '+String(timeline.episode).padStart(2,'0'),W/2,H*.40,34,'#ecdcaa','center',3);text(timeline.title,W/2,H*.49,90,'#fff7e2','center',7);}ctx.globalAlpha=1;}
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
window.episode={timeline,staging,scene,camera,renderer,canvas,actors,modeled,look,illustrated:look,art,referenceSets,props,renderAt,fastWindows:FAST,get info(){return lastInfo;},
 frame(t){renderAt(t);if(lastJPEGTime!==lastRendered){lastJPEG=canvas.toDataURL('image/jpeg',.95).split(',')[1];lastJPEGTime=lastRendered;}return lastJPEG;}};
renderAt(Number(params.get('time')||0));window.__ready=true;return window.episode;
}
