import * as THREE from 'three';
import {kit} from './kit.js';
// Needs painting: restrained provisional layout explicitly requested by the build brief.
export function build(){const k=kit('car');k.root.userData.needsPainting=true;
 k.box('interior floor',0x495a57,[0,-.08,0],[2.3,.16,3.5]);k.box('rear bench cushion',0x6b8077,[0,.37,1.05],[1.8,.17,.65]);k.box('rear bench back',0x6b8077,[0,.7,1.37],[1.8,.65,.12]);
 for(const x of [-.53,.53]){k.box('front seat cushion',0x71877e,[x,.35,-.25],[.7,.16,.65]);k.box('front seat back',0x71877e,[x,.73,.06],[.7,.78,.16]);k.box('front headrest',0x71877e,[x,1.2,.06],[.45,.25,.15]);}
 for(const x of [-1.08,1.08]){k.box('door lower panel',0x657c70,[x,.45,-.15],[.1,.9,2.8]);k.box('window sill',0x425853,[x,.94,-.15],[.13,.09,2.8]);for(const z of [-1.5,1.4])k.beam('window pillar',0x60796b,[x,.85,z],[x,1.6,z],.055);k.box('door handle',0xb9bfb0,[x*.95,.67,.2],[.04,.05,.23]);}
 k.box('windscreen glass',0xb4d0cc,[0,1.31,-1.57],[2,.62,.025],undefined,{material:{transparent:true,opacity:.1,depthWrite:false}});
 k.box('dashboard',0x485a54,[0,.87,-1.3],[2,.32,.45]);k.box('instrument binnacle',0x354845,[-.55,1.05,-1.1],[.65,.15,.14]);for(let i=0;i<3;i++)k.sphere('dashboard gauge',0xc9d2ba,[-.74+i*.18,1.04,-1.015],[.065,.055,.01]);
 const wheel=k.torus('steering wheel',0x273c36,[-.55,.98,-.83],.25,.025);wheel.rotation.x=-.35;k.beam('steering column',0x3c4c46,[-.55,.93,-1.25],[-.55,.98,-.83],.045);
 k.box('rearview mirror',0x3d4e49,[0,1.48,-1.42],[.38,.14,.06]);k.box('mirror glass',0xa7b9b7,[0,1.48,-1.38],[.31,.09,.01]);
 const road=k.group('scrolling road outside',[0,-.18,-11]);k.box('grey road',0x8b9690,[0,0,0],[5,.05,28],road);const markings=k.group('scrolling road markings',[0,0,0],road);for(let i=0;i<12;i++)k.box('road centre dash',0xdcd5b0,[0,.035,-12+i*2.4],[.09,.01,.8],markings);
 for(const side of [-1,1]){k.box('roadside grass',0x8ba16a,[side*7,-.04,0],[9,.08,32],road);for(let i=0;i<6;i++)k.tree([side*(4+i%2),0,-12+i*5],.7,true,road);}
 k.root.userData.update=t=>{markings.position.z=(t*3)%2.4;};
 return k.finish();}
