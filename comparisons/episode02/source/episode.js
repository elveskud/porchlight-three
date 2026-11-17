import * as THREE from 'three';
import {makeCharacter,CAST,ANIMS,neutral,applyPose,reach} from '../../episode01/source/refinements/cast.js';
import {refineEnvironment} from '../../episode01/source/refinements/environment.js';
import {refinePose,blinkAt,travelPose,directAttention,restHands} from '../../../art/three/illustrated/v2/performance.js';
import {createIllustratedLook} from '../../../art/three/illustrated/v2/look.js';
import {installArtDirection} from '../../../art/three/illustrated/v2/art-direction.js';
import {installProps} from '../../episode01/source/refinements/direction.js';
import {buildSet} from '../../../art/three/sets/build.js';
import {SETS} from '../../../art/three/sets/catalog.js';
import {makeDie,prepareHall,prepareDrawer} from './props.js';
const params=new URLSearchParams(location.search),timeline=await fetch('./timeline.json').then(r=>r.json()),W=1920,H=1080,scale=.56,clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const font=new FontFace('Porchlight','url(../../episode01/source/Boogaloo-Regular.ttf)');await font.load();document.fonts.add(font);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,16/9,.1,600),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
const ambient=new THREE.HemisphereLight(0xffefd4,0x7b9273,1.6),fill=new THREE.AmbientLight(0xffffff,.45),key=new THREE.DirectionalLight(0xffedcc,2.5);scene.add(ambient,fill,key);
const modeled={},actors={};for(const id of ['lake','lake_night','hall_outside','bash_home','apartment','stoop_sunset','stoop_night']){const g=buildSet(SETS.find(s=>s.id===id));g.visible=false;modeled[id]=g;scene.add(g);g.traverse(o=>{if(o.userData.marker)o.visible=false;});}
const simple=color=>new THREE.MeshStandardMaterial({color,roughness:1});
function mesh(parent,name,geo,color,p){const m=new THREE.Mesh(geo,simple(color));m.name=name;m.position.set(...p);parent.add(m);return m;}
function ball(parent,name,color,p,size){const m=mesh(parent,name,new THREE.SphereGeometry(1,16,12),color,p);m.scale.set(...size);return m;}
function guardRig(){const base=CAST.find(s=>s.name==='Riot'),rig=makeCharacter({...base,hoodie:0xd9413f,hoodieDark:0xb52d36,cuff:base.fur,stripe:0xd9413f});
 for(const a of [rig.armL,rig.armR])a.sh.traverse(o=>{if(o.isMesh&&o.material?.color&&o.material.color.getHex()!==0x1b1210)o.material.color.set(base.fur);});
 rig.spine.children.forEach(o=>{if(o.isMesh&&o.position.y>1.1&&o.position.z<0)o.visible=false;if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.name!=='tailored torso')o.visible=false;});
 mesh(rig.head,'lifeguard visor',new THREE.BoxGeometry(.80,.05,.26),0xd9413f,[0,1.08,.38]);
 for(const x of [-.28,.28])mesh(rig.pelvis,'red shorts',new THREE.BoxGeometry(.32,.28,.28),0xd9413f,[x,-.06,0]);
 mesh(rig.spine,'white lifeguard emblem',new THREE.BoxGeometry(.19,.065,.02),0xfff1d5,[.22,.80,.28]);mesh(rig.spine,'white lifeguard emblem upright',new THREE.BoxGeometry(.065,.19,.02),0xfff1d5,[.22,.80,.29]);
 const cordPoints=[new THREE.Vector3(-.16,1.18,.28),new THREE.Vector3(-.12,.88,.32),new THREE.Vector3(0,.8,.34),new THREE.Vector3(.12,.88,.32),new THREE.Vector3(.16,1.18,.28)];mesh(rig.spine,'whistle lanyard',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPoints),24,.009,5,false),0xeee4d0,[0,0,0]);
 const whistle=ball(rig.spine,'whistle',0xe0e1db,[0,.80,.30],[.07,.05,.025]);return rig;
}
for(const s of CAST){const r=makeCharacter(s);r.root.scale.multiplyScalar(scale);r.root.visible=false;scene.add(r.root);actors[s.name.toLowerCase()]=r;}
actors.guard=guardRig();actors.guard.root.scale.multiplyScalar(scale);actors.guard.root.visible=false;scene.add(actors.guard.root);
const phone=new THREE.Group();mesh(phone,'phone body',new THREE.BoxGeometry(.18,.28,.035),0x252a2d,[0,0,0]);mesh(phone,'phone screen',new THREE.BoxGeometry(.145,.21,.01),0x668c89,[0,0,.024]);actors.riot.phone=phone;
const props=installProps(actors),guardPhone=phone.clone();actors.guard.hands.L.wrist.add(guardPhone);guardPhone.position.set(0,-.04,.1);
const tower=modeled.lake.getObjectByName('lifeguard lookout');tower.children.forEach(o=>{if(o.name.includes('canopy'))o.position.y+=1.2;});for(const x of [-1.1,1.1])for(const z of [-.8,.8])mesh(tower,'canopy extension',new THREE.BoxGeometry(.14,1.4,.14),0xa8844a,[x,4.2,z]);
const environment=refineEnvironment({scene,modeled,renderer,ambient,fill,key});
const hall=prepareHall(modeled.hall_outside),room=prepareDrawer(modeled.bash_home),hallDie=makeDie(modeled.hall_outside,'hall rolling die',.20),roomDie=makeDie(modeled.bash_home,'pocket lantern die',.20);hallDie.visible=roomDie.visible=false;
const art=installArtDirection(modeled),illustrated=createIllustratedLook({scene,renderer,actors,modeled});
const B=Object.fromEntries(timeline.beats.map(b=>[b.id,b])),eventAt=t=>timeline.events.find(e=>t>=e.start&&t<e.end),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};let lastInfo=null;
function pose(who,t,event){const p=neutral();ANIMS.idle(t+who.length,p);return refinePose(p,who,t,event,timeline);}
function place(who,pos,yaw,t,e,{guard=false,seat=false,walking=0,run=false,scared=false}={}){
 const r=guard?actors.guard:actors[who],p=pose(who,t,e);r.root.visible=true;r.root.position.fromArray(pos);r.root.rotation.set(0,yaw,0);
 if(walking){const a=walking*(run?1.6:1),s=Math.sin(a*8.0);p.lLf=.42*s;p.lRf=-.42*s;p.lLk=.45*Math.max(0,Math.sin(a*8+1.1));p.lRk=.45*Math.max(0,Math.sin(a*8+Math.PI+1.1));p.aLf=-.25*s;p.aRf=.25*s;p.air=run?.08*Math.abs(s):.018*Math.abs(s);p.headX=run?.09:p.headX;p.torsoX=run?.12:p.torsoX;}
 const seatWeight=seat===true?1:Number(seat)||0;if(seatWeight){p.lLf=p.lRf=Math.PI/2*seatWeight;p.lLk=p.lRk=.95*seatWeight;p.air=0;}
 if(scared){p.earL=.19;p.earR=.15;p.brow=-.2;p.browY=.05;p.headX=.07;}
 applyPose(r,p,t,blinkAt(who,t,timeline));if(seatWeight)r.pelvis.position.y*=1-seatWeight;r.root.updateMatrixWorld(true);if(seatWeight>.8)restHands(r,who,t);return r;
}
function setCamera(p,target,fov=40){camera.position.fromArray(p);camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
function frameGroup(rigs,{padding=1.1,focus=null}={}){
 const visible=rigs.filter(Boolean);if(!visible.length)return;const box=new THREE.Box3();for(const r of visible){const foot=r.root.position.clone(),head=r.head.localToWorld(V(0,1.25,.35));box.expandByPoint(foot.add(V(-.4,-.1,0)));box.expandByPoint(head.add(V(.4,.2,0)));}const center=box.getCenter(V()),size=box.getSize(V()),distance=Math.max(4.3,size.y*1.65,size.x*.95)*padding;setCamera([center.x+.20,center.y+.22,box.max.z+distance],[center.x,center.y+.03,center.z],36);
}
function snack(t,e){props.bag.visible=actors.rocco.root.visible;props.biscuit.visible=false;if(!actors.rocco.root.visible)return;const r=actors.rocco;reach(r,'L',r.spine.localToWorld(V(-.37,.22,.42)));if(e?.who==='rocco'&&e.do==='munch'){props.biscuit.visible=true;const u=smooth((t-e.start)/.35);reach(r,'R',r.spine.localToWorld(V(mix(.24,.05,u),mix(.35,1.48,u),mix(.42,.53,u))));}}
function drawWorld(t){
 illustrated.resetActors();let b=timeline.beats.find(b=>t>=b.start&&t<b.end)||{id:'ending',location:'stoop_night',start:timeline.end_start,end:timeline.duration,lightOff:timeline.actions.lampOff};const id=b.location,l=t-b.start,e=eventAt(t),positioned={};
 Object.entries(modeled).forEach(([k,g])=>g.visible=k===id);Object.values(actors).forEach(r=>r.root.visible=false);hallDie.visible=roomDie.visible=false;room.mint.visible=room.keys.visible=false;room.sock.visible=false;room.drawer.position.z=.46;hall.hinge.rotation.y=0;guardPhone.visible=props.phone.visible=false;
 const add=(who,p,yaw=0,opt={})=>positioned[who]=place(who,p,yaw,t,e,opt);
 let scriptedCamera=false;
 if(b.id==='s01'){
  add('riot',[-6.2,2.45,-.65],.10,{guard:true});add('bash',[-.6,-.05,1.15],-.06);add('pip',[1.05,-.05,1.2],-.10);add('rocco',[3.1,.20,.9],-.12,{seat:true});
  if(e?.role==='perform'){const r=positioned.bash,age=t-e.start;r.armR.sh.rotation.x=-.8;r.armR.el.rotation.x=-1.25;r.hands.R.wrist.rotation.z=.13*Math.sin(age*13);r.head.rotation.z=.08*Math.sin(age*2);}
  if(b.game&&t>=b.game.cardStart&&t<b.game.cardEnd){guardPhone.visible=true;reach(positioned.riot,'L',positioned.riot.spine.localToWorld(V(-.35,.8,.65)));positioned.riot.head.rotation.x=.10;}
  setCamera([1.8,4.1,14.3],[-2.2,2.05,-1.0],42);
  if(e&&['bash','pip','rocco'].includes(e.who)&&!e.id.includes('after03'))frameGroup([positioned.bash,positioned.pip,positioned.rocco],{padding:1.25});
  const challenge=timeline.events.find(e=>e.id==='s01_after03');if(t>challenge.end&&t<B.s02.start-.3){for(const who of ['bash','pip','rocco']){const r=positioned[who];r.head.rotation.y=.3;r.face.pupils.forEach(p=>p.position.x=.035);}positioned.bash.ears?.forEach?.(o=>o.rotation.z=.15);}
 }else if(b.id==='s02'){
  setCamera([4+Math.sin(l*.15)*.5,4.2,17-l*.08],[0,2,-11],42);scriptedCamera=true;
 }else if(id==='hall_outside'){
  const starting={riot:[-2.45,0,4.7],rocco:[2.7,0,5.0],pip:[-.85,0,4.9],bash:[.9,0,3.2]};
  for(const who of ['riot','pip','bash','rocco']){
   let p=[...starting[who]],yaw=who==='bash'&&b.id!=='s03'?-.2:who==='rocco'?-.13:.05,walking=0,run=false;
   if(b.id==='s03'){const u=smooth(l/1.15);p[0]=mix(starting[who][0]-3,p[0],u);walking=u<1?(l+.2*who.length):0;}
   if(who==='bash'&&['s04','s04b','s05'].includes(b.id)){
    const speech=timeline.events.find(e=>e.id==='s04_00'),u=b.id==='s04'?smooth((t-speech.end)/6.7):1;p=[mix(.9,.30,u),mix(0,.45,u),mix(3.2,1.25,u)];walking=b.id==='s04'&&u>0&&u<1?(t-speech.end)*.52:0;
   }
   if(b.id==='s05'){
    const own=timeline.events.find(e=>e.beat==='s05'&&e.who===who),start=own.end+(who==='rocco'?.8:.35),u=smooth((t-start)/1.0);if(t>start){p[0]-=u*10;p[2]+=u*2;p[1]*=1-u;yaw=-1.05;walking=t-start;run=true;if(u>.96)continue;}
   }
   const r=add(who,p,yaw,{walking,run,scared:b.id==='s04b'||b.id==='s05'});
   if(b.id==='s05'&&t<timeline.events.find(e=>e.beat==='s05'&&e.who===who).end){r.armL.sh.rotation.z=-.7;r.armR.sh.rotation.z=.7;r.head.rotation.x=-.08;}
  }
  hall.hinge.rotation.y=1.25*smooth((t-timeline.actions.doorOpen)/2.5);if(b.id==='s03'||b.id==='s04')hall.hinge.rotation.y=0;
  if(b.id==='s04b'){
   const r=positioned.bash;if(r&&l<5.6){scene.updateMatrixWorld(true);const a=smooth((l-.4)/1.1)*(1-smooth((l-5.05)/.5)),knob=hall.hinge.getObjectByName('brass door knob').getWorldPosition(V()),start=r.hands.R.wrist.getWorldPosition(V());reach(r,'R',start.lerp(knob,a));r.hands.R.fingers.forEach(f=>f.rotation.x=-.1);}
  }
  if(b.id==='s05'){
   const u=smooth((t-timeline.actions.dieStart)/(timeline.actions.dieStop-timeline.actions.dieStart));hallDie.visible=true;hallDie.position.set(mix(-.68,.68,u),.56+Math.sin(Math.PI*u)*.10,mix(.74,1.85,smooth(u*3)));hallDie.rotation.set(0,Math.PI,-Math.PI*4*u);
  }
  setCamera([8.1,4.4,14.6],[0,2.2,1.7],41);
  if(b.id==='s03'&&e&&Number(e.id.split('_').at(-1))%4!==0){const target=positioned[e.to]||positioned[e.who==='riot'?'bash':'riot'];frameGroup([positioned[e.who],target],{padding:1.1});}
  if(b.id==='s04b'&&l>3.0){setCamera([4.1,2.9,8.8],[.1,1.55,1.6],36);scriptedCamera=true;if(e&&e.who!=='bash')frameGroup([positioned[e.who],positioned.bash],{padding:1.15});}
  if(b.id==='s05'&&l<1.8){setCamera([1.65,1.2,4.0],[.25,.68,1.25],35);scriptedCamera=true;}
 }else if(b.id==='s06'||b.id==='s07'){
  const seats={bash:[-.8,.18,1.25],pip:[.7,.18,1.25],riot:[3.0,-.05,1.25],rocco:[4.4,-.05,1.45]};
  for(const who of b.id==='s07'?['bash','pip']:['bash','pip','riot','rocco']){
   let p=[...seats[who]],u=b.id==='s06'?smooth(l/1.0):1,walking=u<1?l:0,yaw=0;
   p[0]=mix(p[0]+5,p[0],u);const farewell=timeline.events.find(e=>e.id==='s06_04');if(['riot','rocco'].includes(who)&&t>farewell.end+.15){const v=smooth((t-farewell.end-.15)/1.15);p[0]+=v*8;yaw=1.1;walking=t-farewell.end;if(v>.98)continue;}
   if(who==='pip'&&b.id==='s07')p[0]-=.24*smooth(l/1.2);
   const sit=who==='bash'||who==='pip'?(b.id==='s06'?smooth((l-.8)/.6):1):0;if(sit)p[1]=mix(-.05,.18,sit);add(who,p,yaw,{seat:sit,walking});
  }
  frameGroup(Object.values(positioned),{padding:1.35});
  if(positioned.bash&&b.id==='s07'){reach(positioned.bash,'L',positioned.bash.spine.localToWorld(V(-.25,.2,.4)));positioned.bash.hands.L.wrist.rotation.z=.02*Math.sin(l*25);}
 }else if(b.id==='s08'){
  const enter=smooth(l/1.15),r=add('bash',[mix(5.0,3.05,enter),0,-2.2],-.40,{walking:enter<1?l:0,scared:true});
  const open=smooth((l-4.2)/.7),close=smooth((l-6.5)/.5),inside=smooth((l-5.3)/.65);room.drawer.position.z=.46+.55*open*(1-close);room.sock.visible=l>7;room.mint.visible=room.keys.visible=l>1.2;roomDie.visible=l>1.25&&l<7.0;
  roomDie.position.set(mix(2.30,2.35,inside),mix(1.15,.76,inside),mix(-2.37,-2.7+room.drawer.position.z-.28,inside));roomDie.rotation.set(-.10+.1*inside,.12,0);
  if(l>.45&&l<1.8){const u=smooth((l-.45)/.85);reach(r,'L',r.spine.localToWorld(V(-.32,.1,.18)).lerp(V(2.3,1.2,-2.37),u));}else if(l>5.3&&l<6.7)reach(r,'L',roomDie.position.clone().add(V(.03,.06,.02)));else if(l>6.7)reach(r,'L',V(2.35,.8,-2.7+room.drawer.position.z));
  setCamera([3.6,2.4,4.5],[.65,1.65,-1.7],40);
  if(l>4.3&&l<5.3){setCamera([2.45,1.78,-1.25],[2.30,1.12,-2.37],30);scriptedCamera=true;}
 }else if(b.id==='ending'){
  setCamera([2.5,2.6,1.8],[3.25,2.55,-.65],37);modeled.stoop_night.traverse(o=>{if(/bulb/.test(o.name)&&o.material)o.material.emissiveIntensity=t<timeline.actions.lampOff?1.5:0;if(o.userData.practical)o.intensity=t<timeline.actions.lampOff?18:0;});scriptedCamera=true;
 }else if(id==='apartment'){
  add('bash',[-3.05,.815,-1.23],0,{seat:true});add('pip',[-1.55,.815,-1.23],0,{seat:true});add('rocco',[3.1,.87,.25],0,{seat:true});add('riot',[1.45,0,1.8]);setCamera([2.4,2.6,7],[-.35,1.5,-.65],38);
 }
 scene.updateMatrixWorld(true);directAttention(positioned,e,t,timeline,b);snack(t,e);
 // Preserve the authored knock and door-contact hands after listening attention.
 illustrated.update(t,id,b,e,positioned);if(!scriptedCamera&&b.id!=='s02'){
  const focus=Object.values(positioned).length?Object.values(positioned).reduce((v,r)=>v.add(r.head.localToWorld(V(0,.65,.35))),V()).multiplyScalar(1/Object.values(positioned).length):V(0,1.5,0),dir=camera.getWorldDirection(V()),d=Math.max(2,focus.sub(camera.position).dot(dir));camera.position.addScaledVector(dir,-d*.35);camera.fov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/1.35)*180/Math.PI;camera.updateProjectionMatrix();
 }
 const fan=modeled.apartment.getObjectByName('ceiling fan');fan.rotation.y=t*.55;
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const heads={};for(const [who,r] of Object.entries(positioned)){const v=r.head.localToWorld(V(0,.65,.35)).project(camera);heads[who]={x:(v.x+1)/2,y:(1-v.y)/2,z:v.z};}
 lastInfo={time:t,beat:b.id,location:id,speaker:e?.who||null,line:e?.id||null,silent:e?.silent||false,heads,doorAngle:hall.hinge.rotation.y,drawer:room.drawer.position.z,dieVisible:hallDie.visible||roomDie.visible,visemes:Object.fromEntries(Object.entries(positioned).map(([who,r])=>[who,r.refined.lastViseme]))};return {b,e,l};
}
function text(str,x,y,size=48,color='#fff7dc',align='left',stroke=5){ctx.font=`${size}px Porchlight`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';if(stroke){ctx.lineWidth=stroke;ctx.strokeStyle='#25282a';ctx.strokeText(str,x,y);}ctx.fillStyle=color;ctx.fillText(str,x,y);}
function rect(x,y,w,h,r,c){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();}
function wrap(s,width,size){ctx.font=`${size}px Porchlight`;const lines=[];let l='';for(const w of s.split(/\s+/)){const n=l?l+' '+w:w;if(ctx.measureText(n).width>width&&l){lines.push(l);l=w;}else l=n;}if(l)lines.push(l);return lines;}
function overlay(t,b,e,l){
 if(b.id==='s01'&&l<2)text('DARE HOUSE',60,88,43,'#f0d38d');
 if(b.id==='s02'){const alpha=Math.min(1,l/.8,(b.end-t)/.5);ctx.globalAlpha=Math.max(0,alpha);if(l<3.7){text('PORCHLIGHT',W/2,H*.41,140,'#f4d891','center',10);text('MAPLE HOLLOW',W/2,H*.53,32,'#faf1d6','center',4);}else{text('EPISODE 02',W/2,H*.40,34,'#ecdcaa','center',3);text('Dare House',W/2,H*.49,100,'#fff7e2','center',7);}ctx.globalAlpha=1;}
 if(b.game&&t>=b.game.cardStart&&t<b.game.cardEnd){const x=1210,y=65,w=635,h=285;rect(x,y,w,h,24,'#faf3df');rect(x,y,w,55,18,'#d6a64e');text('TRUTH OR DARE',x+w/2,y+28,30,'#fff8e3','center',0);wrap(b.game.prompt,w-60,36).forEach((s,i)=>text(s,x+w/2,y+102+i*43,36,'#303c31','center',0));text('FRIENDZY',x+w/2,y+h-22,18,'#a18d69','center',0);}
 if(b.id==='s04b'&&l>.2&&l<2.2){rect(50,55,440,90,12,'#1e2928dc');text('40 seconds later.',75,100,42,'#ead4a1');}
 if(b.id==='s06'&&l>.2&&l<1.8)text('Later that night.',65,85,42,'#f1d899');
 if(e&&!e.silent&&e.caption!==false){const words=e.text.replace(/\.\.\./g,'…').split(/\s+/),i=Math.floor(clamp((t-e.start)/(e.end-e.start),0,.999)*words.length),first=Math.floor(i/5)*5;text(words.slice(first,first+5).join(' ').toUpperCase(),W/2,H-74,51,'#fff8e8','center',7);}
 if(b.transition==='fade'&&l<.35){ctx.fillStyle=`rgba(12,19,27,${1-l/.35})`;ctx.fillRect(0,0,W,H);}
 if(b.id==='ending'){const u=clamp((t-timeline.actions.lampOff)/.55,0,1);if(u){ctx.fillStyle=`rgba(0,0,0,${u})`;ctx.fillRect(0,0,W,H);}if(t>timeline.actions.lampOff+.9)text('Friendzy',W/2,H*.59,43,'#ddd9c9','center',0);}
}
function renderAt(time){const t=clamp(time,0,timeline.duration-1/24),{b,e,l}=drawWorld(t);illustrated.render(camera);ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);overlay(t,b,e,l);return lastInfo;}
renderer.domElement.style.display='none';document.body.append(canvas);
window.episode={timeline,scene,camera,renderer,canvas,actors,modeled,illustrated,art,props,storyProps:{hall,room,hallDie,roomDie},renderAt,get info(){return lastInfo;},frame(t){renderAt(t);return canvas.toDataURL('image/jpeg',.95).split(',')[1];}};renderAt(Number(params.get('time')||0));window.__ready=true;
if(params.has('inspect')){
 const {OrbitControls}=await import('../../../art/three/vendor/addons/controls/OrbitControls.js');const c=new OrbitControls(camera,canvas);c.target.set(0,1.6,0);c.update();c.addEventListener('change',()=>{illustrated.render(camera);ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);});window.inspection={controls:c};
 const css=document.createElement('style');css.textContent='canvas{width:100vw;height:100vh;object-fit:contain}nav{position:fixed;bottom:18px;left:18px;display:flex;gap:8px;flex-wrap:wrap;background:#1d2d32e8;padding:12px;border-radius:10px}button,a{font:14px system-ui;color:#f5ead4;background:#38504b;border:1px solid #8c9c82;border-radius:5px;padding:9px;cursor:pointer;text-decoration:none}';document.head.append(css);
 const nav=document.createElement('nav');for(const [label,t] of [['Lake',4],['Hall',B.s03.start+2],['Door',B.s04b.start+7],['Bedroom',B.s08.start+2.5],['Apartment',-1]]){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{if(t<0){const old=timeline.beats;timeline.beats=[{id:'proof-apartment',location:'apartment',start:0,end:timeline.duration}];renderAt(1);timeline.beats=old;c.target.set(0,1.5,0);}else{renderAt(t);c.target.set(...(t<B.s02.start?[-2,2,-1]:t<B.s06.start?[0,1.6,2]:[1.5,1.3,-2]));}c.update();};nav.append(button);}const link=document.createElement('a');link.href='../';link.textContent='Watch Episode 2';nav.append(link);document.body.append(nav);
}
