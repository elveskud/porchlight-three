import * as THREE from 'three';
import {neutral} from './cast.js';
const clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp,S=Math.sin,PI=Math.PI;
export const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export const pulse=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
export const profiles={riot:{amp:.95,delay:.16,tilt:-.02,tempo:1.2,breath:1.6},rocco:{amp:.30,delay:.38,tilt:.055,tempo:.75,breath:1.1},bash:{amp:1.12,delay:.22,tilt:-.03,tempo:1.05,breath:1.45},pip:{amp:.50,delay:.30,tilt:.025,tempo:1.25,breath:1.7},owl:{amp:.42,delay:.34,tilt:0,tempo:.72,breath:1.2},gus:{amp:.70,delay:.26,tilt:.025,tempo:.8,breath:1.1},dot:{amp:.72,delay:.12,tilt:-.02,tempo:1.6,breath:1.8},brook:{amp:.30,delay:.42,tilt:.025,tempo:.6,breath:.9}};
const mouths={X:[0,0,0],A:[.135,.012,0],B:[.145,.046,1],C:[.175,.100,1],D:[.155,.155,.8],E:[.10,.103,0],F:[.067,.084,0],G:[.13,.029,1],H:[.145,.065,.2]};
export function speechShape(event,t){
 if(!event||event.silent||t<event.start||t>=event.end)return {viseme:'X',mouthWidth:0,mouthHeight:0,teeth:0,jaw:0,stress:0};
 const age=t-event.start,cues=event.mouthCues||[],index=cues.findIndex(c=>age>=c.start&&age<c.end),cue=cues[index]||{value:'X',end:age+1},next=cues[index+1],blend=next?ease((age-(cue.end-.035))/.035):0;
 const a=mouths[cue.value]||mouths.X,b=mouths[next?.value]||a,energy=event.envelope?.[Math.min(event.envelope.length-1,Math.floor(age*50))]??.65,quiet=event.quiet?.76:1;
 const stress=.65+.35*energy;return {viseme:cue.value,mouthWidth:mix(a[0],b[0],blend),mouthHeight:mix(a[1],b[1],blend)*stress*quiet,teeth:mix(a[2],b[2],blend),jaw:mix(a[1],b[1],blend)/.155*stress*quiet,stress:energy};
}
export function blinkAt(who,t,timeline){const c=profiles[who],index=Object.keys(profiles).indexOf(who),period=4.3+index*.31,phase=(t+index*.63)%period;
 let amount=pulse(phase,.14,.055)+(who==='pip'||who==='dot'?.65*pulse(phase,.36,.05):0);
 for(const e of timeline.events)if(e.who===who&&!e.silent)amount=Math.max(amount,.85*pulse(t,e.start-.13,.055),.72*pulse(t,e.end+.15,.07));return clamp(amount,0,1);
}
export function expression(p,face,strength=1){const g=strength;
 if(['happy','hype','cocky','determined'].includes(face)){p.brow+=.10*g;p.browY-=.02*g;p.headX-=.045*g;p.smile=1;}
 if(['nervous','scared','embarrassed'].includes(face)){p.brow-=.16*g;p.browY+=.035*g;p.headZ+=.045*g;p.earL+=.11*g;p.earR+=.07*g;p.smile=.35;}
 if(['sad','soft','gloom'].includes(face)){p.brow-=.09*g;p.headX+=.04*g;p.lids+=.08*g;p.smile=face==='sad'||face==='gloom'?-.45:.65;}
 if(['sleepy','asleep'].includes(face)){p.lids+=face==='asleep'?.98:.50;p.headX+=.16*g;p.headZ+=.07*g;}
 if(['shocked','yelling'].includes(face)){p.browY+=.09*g;p.headX-=.055*g;p.earL-=.05*g;p.earR-=.05*g;}
 if(['suspicious','deadpan'].includes(face)){p.lids+=.22*g;p.browAsym+=.075*g;p.headZ+=.025*g;}
}
export function poseAt(who,t,timeline,beat){
 const p=neutral(),c=profiles[who],active=timeline.events.filter(e=>e.who===who&&t>=e.start&&t<e.end).at(-1),upcoming=timeline.events.find(e=>e.who===who&&e.start>t&&e.start-t<.22),last=[...timeline.events].reverse().find(e=>e.who===who&&e.end<t),e=active||upcoming,quiet=!!e?.quiet||beat?.mood==='soft',amp=c.amp*(quiet?.42:1);
 p.torsoX=.006*S(t*c.breath);p.torsoZ=.006*S(t*.7+c.tempo);p.headZ=c.tilt;p.aLo=.10+(who==='bash'?.04:0);p.aRo=.13;p.aLb=who==='pip'?.12:.04;p.aRb=.08;p.asymmetry=who==='rocco'?.45:.12;p.browAsym=0;p.lidAsym=who==='rocco'?.03:0;p.handL=p.handR='relax';p.fingerCurl=0;p.thumb=.10;p.wristPitch=0;p.earL=p.earR=0;p.earX=0;p.tailWag=quiet?.018:.035;p.tailSpd=1.15;p.tailLift=0;p.smile=.85;p.lids=who==='rocco'?.15:0;
 if(last&&t-last.end<2.2)expression(p,last.face||last.do,.45*(1-ease((t-last.end)/2.2)));
 if(e){const age=t-e.start,d=e.end-e.start,enter=ease(age/.22),leave=ease((d-age)/.32),anticipation=-.12*pulse(age,-.08,.10),hold=enter*leave;
 const syllable=active?speechShape(e,t).stress:0,accent=pulse(age,Math.min(.55,d*.35),.18)+.45*pulse(age,d*.74,.22),g=amp*hold;
 p.torsoX+=(.025*accent+anticipation*.10)*amp;p.torsoY=.015*accent*amp;p.headX+=(-.03*accent+.025*pulse(age,d-.08,.15))*amp;
 p.aRo+=.16*g;p.aRf+=.36*accent*g*(.7+.3*syllable);p.aRb+=.44*g;p.handR='open';p.aRw=.08*accent*g;p.browAsym+=.025*accent;
 expression(p,e.face||e.do,hold);
 if(e.do==='gloom'){p.headX+=.13*hold;p.aLo=p.aRo=.02;p.smile=-.4;}
 if(e.do==='present'||e.face==='hype'){p.aLo+=.28*g;p.aRo+=.35*g;p.aLf+=.2*g;p.aRf+=.24*g;p.handL=p.handR='open';}
 if(e.do==='point'){p.aRf=.75*g;p.aRb=.22*g;p.handR='point';}
 if(e.do==='hips'){p.aLo=p.aRo=.43*hold;p.aLb=p.aRb=1.1*hold;p.handL=p.handR='grip';}
 if(e.do==='nod'){p.headX+=.10*pulse(age,.45,.20);}
 if(e.do==='nervous'||e.face==='nervous'){p.aLo=p.aRo=.04;p.aRb=.55;p.handR='grip';p.aRw=.015*S(age*21)*hold;}
 if(e.do==='laugh'||e.do==='chuckle'||e.face==='laughing'){p.squint=.30*hold;p.headX-=.06*hold;p.torsoX+=.02*S(age*11)*hold;p.laugh=hold*(.4+.6*syllable);}
 if(e.do==='wave'){p.aRo=1.5*hold;p.aRb=.45*hold;p.aRw=.32*S(age*8)*hold;}
 if(e.do==='shrug'){p.aLo=p.aRo=.45*hold;p.aLb=p.aRb=.70*hold;p.handL=p.handR='open';}
 if(e.do==='facepalm'){p.aRf=.95*hold;p.aRb=1.55*hold;p.headX=.17*hold;}
 if(e.silent){p.handR='relax';p.aRf*=.25;p.aRo*=.3;p.aRb*=.3;}
 p.fingerCurl=e.do==='hips'?.1:0;
 }else{
 const spoken=timeline.events.find(e=>t>=e.start&&t<e.end),delay=c.delay;if(spoken&&spoken.who!==who){const a=t-spoken.start-delay;p.headX+=.035*pulse(a,Math.min(1.0,(spoken.end-spoken.start)*.5),.22)*c.amp;p.browY+=.014*pulse(a,.45,.25);}
 if(last&&t-last.end<.65){const w=1-ease((t-last.end)/.65);p.aRb+=.12*w*c.amp;p.aRf+=.06*w*c.amp;}
 }
 Object.assign(p,speechShape(active,t));p.faceTension=['scared','nervous','shocked','suspicious'].includes(e?.face)?1:0;p.mouth=p.mouthHeight/.155;p.mouthCorners=p.smile;p.earL+=.018*S(t*1.1+c.delay);p.earR+=.014*S(t*.95+.7);return p;
}
export function attention(rigs,event,t,beat){
 const who=event?.who;for(const [id,r] of Object.entries(rigs)){
  let targetId=id===who?event.to:who;if(!targetId||!rigs[targetId])continue;const other=rigs[targetId],target=other.head.localToWorld(new THREE.Vector3(0,.70,.43)),head=r.head.localToWorld(new THREE.Vector3(0,.65,.35)),d=target.clone().sub(head).applyQuaternion(r.root.getWorldQuaternion(new THREE.Quaternion()).invert()),c=profiles[id],weight=ease((t-event.start-c.delay)/.18);
  const yaw=clamp(Math.atan2(d.x,Math.max(.65,Math.abs(d.z))),-.40,.40)*.65*weight;r.head.rotation.y=yaw;r.head.rotation.x+=clamp(-Math.atan2(d.y,Math.hypot(d.x,d.z))*.28,-.10,.10)*weight;
  const eyesAhead=ease((t-event.start-c.delay+.10)/.12),eyeX=clamp(d.x*.022,-.04,.04)*eyesAhead,eyeY=clamp(d.y*.025,-.024,.024)*eyesAhead;
  r.face.pupils.forEach(p=>{p.position.x=eyeX;p.position.y=eyeY;});
 }
}
export function lookAtObject(r,target,weight=1){const local=r.head.worldToLocal(target.clone()),distance=Math.max(.2,local.length());r.head.rotation.x+=clamp(-local.y*.08,-.12,.15)*weight;r.face.pupils.forEach((p,i)=>{p.position.x=clamp(local.x*.04+(i?-.006:.006)/distance,-.045,.045)*weight;p.position.y=clamp(local.y*.035,-.03,.03)*weight;});}
export function sampleClock(t,windows=[]){const fast=windows.some(([a,b])=>t>=a&&t<b),fps=fast?24:12;return Math.floor(t*fps+1e-7)/fps;}
