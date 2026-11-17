import * as THREE from 'three';
import {reach} from './cast.js';
const clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp,S=Math.sin,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const profile={bash:{amp:1.1,tempo:1.1,tilt:-.035},pip:{amp:.52,tempo:1.3,tilt:.045},riot:{amp:.9,tempo:1,tilt:-.018},rocco:{amp:.34,tempo:.72,tilt:.06}};
const pulse=(x,center,width)=>Math.exp(-Math.pow((x-center)/width,2));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export function blinkAt(who,t,timeline){
 const k=Object.keys(profile).indexOf(who),period=4.6+k*.43,phase=(t+k*.8)%period;
 let amount=pulse(phase,.12,.065);
 for(const e of timeline.events)if(e.who===who){amount=Math.max(amount,.9*pulse(t,e.start-.12,.065),.8*pulse(t,e.end+.17,.07));}
 return amount;
}
export function refinePose(p,who,t,event,timeline){
 const c=profile[who],e=event?.who===who?event:null,quiet=!!e?.quiet||t>111,amp=c.amp*(quiet?.30:1),age=e?t-e.start:0,duration=e?e.end-e.start:1;
 // Distinct rest poses and planted legs. No constant head scanning or repeated presentation loops.
 p.headY=0;p.headZ=c.tilt+.012*S(t*.75+c.tempo);p.headX=who==='rocco'?.045:0;
 p.torsoX=.008*S(t*(who==='rocco'?1.2:1.6)+c.tempo);p.torsoZ=.006*S(t*.8+c.tempo);p.torsoY=0;
 p.lLf=p.lRf=p.lLk=p.lRk=0;p.air=0;p.shift=0;p.sway=0;p.lean=0;p.turn=0;
 p.aLo=.12;p.aRo=.15;p.aLf=.025;p.aRf=.025;p.aLb=who==='pip'?.12:.04;p.aRb=.08;p.aLw=p.aRw=0;
 p.brow=e?.face==='yelling'?.13:e?.face==='suspicious'?.055:e?.face==='nervous'?-.12:-.025;p.browY=e?.face==='shocked'?.08:0;
 p.lids=who==='rocco'&&!e?.face?.includes('shocked')?.22:0;p.squint=0;p.sweat=0;p.smile=e?.face==='nervous'?.35:1;
 p.asymmetry=who==='rocco'?.55:who==='riot'?.25:0;p.handL=p.handR='relax';
 p.earL=.012*S(t*1.1+c.tempo);p.earR=.012*S(t*.95+.7);p.earX=0;p.tailWag=quiet?.025:.055;p.tailSpd=1.15;p.tailLift=0;
 if(e){
  const enter=ease(age/.25),leave=ease((duration-age)/.28),envelope=enter*leave;
  const accent=pulse(age,Math.min(.68,duration*.4),.29)+.55*pulse(age,duration*.73,.24);
  const anticipate=-.14*pulse(age,.05,.10),settle=.1*pulse(age,duration-.1,.18),g=amp*envelope;
  p.torsoX+=(accent*.032+anticipate*.06)*amp;p.headX+=(-.045*accent+settle*.1)*amp;p.headZ+=.035*accent*amp;
  p.aLo+=.12*g;p.aRo+=.22*g;p.aRf+=.36*accent*g;p.aRb+=.35*g;p.aLw=.10*g;p.aRw=.1*g;p.handR='open';
  if(e.do==='point'||e.face==='yelling'){p.aRo+=.12*g;p.aRf+=.42*g;p.aRb=.2*g;p.handR='point';p.headX-=.035*g;}
  if(e.do==='wave'){const phase=age*8;p.aRo=.4+1.5*envelope;p.aRw=.4*S(phase)*envelope;p.aRb=.3*envelope;p.handR='open';}
  if(e.do==='present'){p.aLo=p.aRo=.55*envelope;p.aLf=p.aRf=.22*envelope;p.aLb=p.aRb=.4*envelope;p.handL=p.handR='open';}
  if(e.do==='fan'){p.aRo=.55;p.aRb=1.8;p.aRw=.25*S(age*9);p.handR='open';}
  if(e.do==='facepalm'){p.aRo=-.45*envelope;p.aRf=1.1*envelope;p.aRb=1.6*envelope;p.headX=.15*envelope;p.handR='open';}
  if(e.face==='laughing'){p.squint=.30*envelope;p.headX=-.08*envelope;p.torsoX+=.025*S(age*11)*envelope;p.earL+=.05*pulse(age,.9,.4);}
  if(e.face==='nervous'){p.headZ=.065;p.brow=-.14;p.aLf=.2;p.aLb=.35;p.handL='grip';p.earR+=.08;}
  if(e.face==='shocked'){p.brow=-.12;p.browY=.08;p.headX=-.05;p.earL-=.08;p.earR-=.06;}
  if(e.face==='asleep'){p.lids=.72;p.headZ=.08;}
  const cue=e.mouthCues.find(c=>age>=c.start-.018&&age<c.end-.018);p.viseme=cue?.value||'X';
  p.tailWag+=.10*amp*envelope;p.earL+=.05*accent*amp;p.earR+=.035*pulse(age,Math.min(.8,duration*.45)+.11,.4)*amp;
 }else{
  p.viseme='X';const prev=timeline.events.find(x=>t>x.end&&t<x.end+.65&&x.who===who);
  if(prev){const u=(t-prev.end)/.65;p.aRb+=.10*(1-u);p.earR+=.04*S(u*Math.PI)*(1-u);}
  const listen=event&&event.who!==who;if(listen){const delayed=t-event.start-.32,nod=pulse(delayed,Math.min(1.2,(event.end-event.start)*.65),.24);p.headX+=.04*nod*c.amp;p.browY+=.012*nod;}
 }
 // Deliberate held punchline responses rather than continuous gesturing.
 if(who==='bash'&&t>104.5&&t<108)p.headX+=.10*ease((t-104.5)/.5);
 if(who==='pip'&&t>66.1&&t<68)p.headZ-=.06*pulse(t,66.8,.55);
 return p;
}
export function travelPose(p,progress,distance,who){
 const settling=1-ease((progress-.72)/.28),phase=distance*8.5+(who==='pip'?.4:0),s=S(phase),step=.43*settling;
 p.lLf=step*s;p.lRf=-step*s;p.lLk=.46*Math.max(0,S(phase+1.1))*settling;p.lRk=.46*Math.max(0,S(phase+Math.PI+1.1))*settling;
 p.aLf=-.22*s*settling;p.aRf=.22*s*settling;p.aLb=p.aRb=.16*settling;p.torsoY=.035*s*settling;p.air=.012*Math.abs(S(phase))*settling;
}
export function directAttention(positioned,e,t,timeline,b){
 const upcoming=timeline.events.find(x=>x.start>=t&&x.start-t<.18),previous=timeline.events.find(x=>t>x.end&&t-x.end<.35),focus=upcoming||e||previous;
 for(const [who,r] of Object.entries(positioned)){
  const targetWho=focus?.who===who?(b.id==='alone'?null:who==='riot'?'rocco':'riot'):focus?.who;
  const other=positioned[targetWho];if(!other)continue;
  const target=other.head.localToWorld(V(0,.67,.35)),headPos=r.head.localToWorld(V(0,.65,.35)),d=target.clone().sub(headPos);d.applyQuaternion(r.root.getWorldQuaternion(new THREE.Quaternion()).invert());
  const yaw=clamp(Math.atan2(d.x,Math.max(.6,Math.abs(d.z))),-.42,.42),anticipation=upcoming?.7*ease((t-(upcoming.start-.18))/.18):e?.7:.7*(1-ease((t-previous.end)/.35));
  r.head.rotation.y=yaw*anticipation;r.head.rotation.x+=clamp(-Math.atan2(d.y,Math.hypot(d.x,d.z))*.35,-.10,.10);
  r.face.pupils.forEach(p=>{p.position.x=clamp(d.x*.025,-.040,.040);p.position.y=clamp(d.y*.025,-.025,.025);});
 }
}
export function restHands(r,who,t){
 for(const side of ['L','R']){const x=side==='L'?-.43:.43;const v=r.pelvis.localToWorld(V(x,.12,.39));reach(r,side,v);}
 // Flatten the tail sideways to clear the back of the seat.
 if(r.tail.chain.length>1){r.tail.chain[0].rotation.z=who==='rocco'?-1.0:.85;r.tail.chain[0].rotation.y=who==='rocco'?-.55:.3;}
}
export function handContact(r,key,target,kind='grip'){
 reach(r,key,target);const hand=r.hands[key];hand.fingers.forEach(f=>{f.rotation.x=kind==='point'?.05:-.85;});
}
