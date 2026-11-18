// Episode-specific prop choreography; actor positions and cameras live in staging.json.
import * as THREE from 'three';
import {storyProps} from './source/story-props.js';
import {prepareEpisodeSetsV5} from './source/sets-v5.js';
import {box,ball,line} from './source/props.js';
import {hold,reachContact} from '../../art/three/animation/v3/interactions.js';
import {lookAtObject} from '../../art/three/animation/v5/performance.js';
import {setCamera} from '../../art/three/animation/v3/direction.js';
const V=(...a)=>new THREE.Vector3(...a);
let lifeguard;
export const prepareSets=prepareEpisodeSetsV5;
export async function setup({scene,modeled,actors}){
lifeguard=new THREE.Group();lifeguard.name='Riot lifeguard outfit';actors.riot.spine.add(lifeguard);
box(lifeguard,'white lifeguard shirt',0xf1e7cf,[0,.68,.04],[1.08,1.10,.58]);box(lifeguard,'red lifeguard cross vertical',0xbd5543,[0,.79,.34],[.12,.34,.018]);box(lifeguard,'red lifeguard cross horizontal',0xbd5543,[0,.79,.34],[.34,.12,.018]);box(lifeguard,'lifeguard red shorts',0xad4d3d,[0,.13,0],[1.1,.25,.56]);line(lifeguard,'whistle cord',0x5c665a,[[-.28,1.21,.32],[0,.73,.38],[.28,1.21,.32]],.012);ball(lifeguard,'lifeguard whistle',0xb0b7ac,[0,.73,.41],[.065,.04,.04]);

return storyProps(scene,modeled);
}
function eat(props,r,t){props.sandwich.visible=true;hold(props.sandwich,r,'R','cup',{offset:V(0,-.06,.12)});const target=r.head.localToWorld(V(.22,.16,.56));reachContact(r,'R',target,{kind:'cup',amount:.55+.25*Math.sin(t*1.7)**2});}
export function beforeFrame({props,b,l,actors}){
 for(const p of [props.clipboard,props.spoon,props.hammer,props.sandwich,props.sign,props.bucket,props.easel,props.car,props.bee])p.visible=false;
 props.notice.visible=b.location==='main_street'&&l>=2.9;props.pin.visible=props.notice.visible;props.old.visible=true;
 lifeguard.visible=b.id==='s01';actors.riot.refined.body.visible=!lifeguard.visible;
}
export const hookNames=['props.s01','props.s03','props.s04','props.s05','props.s06','props.s08'];

function s01(f){const {t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,positioned,camera,clamp,ease,PRE_TURN}=f;
props.easel.visible=true;props.car.visible=true;
 const reveal=E.s01_01.start-.55,w=ease((t-reveal)/.65);props.cloth.scale.y=1.82*(1-w);props.cloth.position.y=1.98-.9*w;props.cloth.visible=w<1;
 props.clipboard.visible=true;hold(props.clipboard,actors.marlo,'R','clipboard',{offset:V(0,-.12,.10)});
 if(w>0&&w<1)reachContact(actors.marlo,'L',V(5.35,1.23,.40),{kind:'open'});
}

function s03(f){const {t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,positioned,camera,clamp,ease,PRE_TURN}=f;
eat(props,actors.rocco,t);
}

function s04(f){const {t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,positioned,camera,clamp,ease,PRE_TURN}=f;
props.spoon.visible=true;hold(props.spoon,actors.bashmom,'L','pencil',{offset:V(0,-.04,.1)});
 props.sign.visible=true;props.bucket.visible=true;
 for(let i=0;i<props.haze.length;i++){const h=props.haze[i],u=(t*.22+i*.19)%1;h.position.set(Math.sin(t*.6+i)*.18,.52+u*1.25,.05*Math.cos(t+i));h.scale.set(.16+u*.18,.10+u*.10,.15+u*.1);h.material.opacity=.08*(1-u);}
 if(l<2){props.hammer.visible=true;hold(props.hammer,actors.rocco,'R','pencil',{offset:V(0,-.02,.10)});reachContact(actors.rocco,'R',V(-6.27,1.15+.10*Math.abs(Math.sin(l*7)),3.55),{kind:'pencil'});}else eat(props,actors.rocco,t);
 if(positioned.marlo){props.clipboard.visible=true;hold(props.clipboard,actors.marlo,'L','clipboard',{offset:V(0,-.12,.1)});}
}

function s05(f){const {t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,positioned,camera,clamp,ease,PRE_TURN}=f;
const beeAt=E.s05_03.end+3.25;if(t>=beeAt&&t<beeAt+.9){props.bee.visible=true;props.bee.position.set(-2+(t-beeAt)*5,1.8+.08*Math.sin(t*10),3.7);}
 if(e?.id==='s05_05')eat(props,actors.bash,t);
}

function s06(f){const {t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,positioned,camera,clamp,ease,PRE_TURN}=f;
if(positioned.preston){const r=actors.preston;if(t<timeline.actions.horn){r.head.rotation.x+=.12;lookAtObject(r,V(1,0,-1),.4);}else{r.spine.rotation.x=0;const fan=r.spine.getObjectByName('peacock feather fan');fan.rotation.y=.20*Math.sin((t-timeline.actions.horn)*12)*Math.exp(-(t-timeline.actions.horn)*3);}}
}

function s08(f){const {t,b,e,l,actors,modeled,props,timeline,E,paths,put,along,positioned,camera,clamp,ease,PRE_TURN}=f;
  const enter=paths['marlo-board-enter'],exit=paths['marlo-board-exit'];
  if(t<exit.end){const step=paths['marlo-stepaside'],seg=t<enter.end?enter:t<exit.start-PRE_TURN?step:exit,a=along(seg.id,[-3.15,.16,5.5],t);
   // After arriving she turns her back to the camera (a real stepping turn), holds, then steps aside.
   const u=clamp((l-2.25)/.4,0,1),turning=seg===step&&!a.path&&l>=2.25&&l<2.65,yaw=seg===step&&!a.path&&l<2.65?(l<2.25?0:Math.PI*ease(u)):a.yaw;
   const r=put('marlo',a.pos,t,b,{path:a.path,yaw,turn:turning?{from:0,to:Math.PI,u}:a.turn});
   props.clipboard.visible=true;hold(props.clipboard,r,'R','clipboard',{offset:V(0,-.12,.10)});
   if(l>=2.4&&l<3.5)reachContact(r,'L',modeled.main_street.getObjectByName('notice pin').getWorldPosition(V()),{kind:'open',amount:ease((l-2.4)/.35)*(1-ease((l-3.2)/.3))});}

  if(t>=timeline.actions.noticeInsert[0]&&t<timeline.actions.noticeInsert[1]){f.skipFlatten=true;const p=props.notice.getWorldPosition(V());setCamera(camera,[p.x,p.y+.03,p.z+2.0],[p.x,p.y-.10,p.z],42);}

}

export const actions={'props.s01':s01,'props.s03':s03,'props.s04':s04,'props.s05':s05,'props.s06':s06,'props.s08':s08};
export function afterAttention({b,t,positioned,timeline,actors}){if(b.id==='s06'&&positioned.preston&&t<timeline.actions.horn)lookAtObject(actors.preston,V(1,0,-1),.25);}
