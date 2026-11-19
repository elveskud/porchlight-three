// The scripted props and actions stay here; timing and camera groups stay in staging.json.
import * as THREE from 'three';
import {box,ball,line,makeClipboard} from '../../art/three/episode/primitives.js';
import {hold} from '../../art/three/animation/v3/interactions.js';
import {applyActor} from '../../art/three/animation/v5/cast.js';
import {blinkAt} from '../../art/three/animation/v5/performance.js';
import {settleSeat} from '../../art/three/animation/v5/locomotion.js';
export {prepareEpisodeSetsV5 as prepareSets} from '../../art/three/episode/sets.js';
const V=(...v)=>new THREE.Vector3(...v),clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
let outfit,accessories;
export function setup({scene,actors}){
 const root=new THREE.Group();root.name='Episode 34 scripted props';scene.add(root);
 const clipboard=makeClipboard(root);clipboard.name='Riot laminated day list';clipboard.scale.setScalar(.56);
 for(let i=0;i<6;i++){
  box(clipboard,'list time row',0x59635b,[-.15,.23-i*.085,.041],[.10,.014,.005]);
  box(clipboard,'list task row',0x59635b,[.05,.23-i*.085,.041],[.20,.014,.005]);
 }
 const letter=new THREE.Group();letter.name='folded scholarship letter';root.add(letter);
 box(letter,'folded cream paper',0xe8ddbf,[0,0,0],[.34,.008,.23]);
 box(letter,'worn paper crease',0xb6ab90,[0,.005,0],[.006,.003,.23]);
 const leaf=new THREE.Group();leaf.name='dry brown leaf';root.add(leaf);
 const outline=new THREE.Shape();outline.moveTo(0,-.12);outline.quadraticCurveTo(-.13,.01,0,.15);outline.quadraticCurveTo(.13,.01,0,-.12);
 const blade=new THREE.Mesh(new THREE.ShapeGeometry(outline),new THREE.MeshStandardMaterial({color:0x987047,roughness:1,side:THREE.DoubleSide}));blade.name='dry leaf blade';blade.rotation.x=-Math.PI/2;leaf.add(blade);
 line(leaf,'leaf vein',0x66533c,[[0,.006,-.15],[0,.006,.12]],.005);
 outfit=new THREE.Group();outfit.name='Riot lifeguard shirt';actors.riot.spine.add(outfit);
 box(outfit,'white lifeguard shirt',0xf1e7cf,[0,.68,.04],[1.08,1.10,.58]);
 box(outfit,'red cross vertical',0xbd5543,[0,.79,.34],[.12,.34,.018]);box(outfit,'red cross horizontal',0xbd5543,[0,.79,.34],[.34,.12,.018]);
 accessories=new THREE.Group();accessories.name='Riot morning hat and sunglasses';actors.riot.head.add(accessories);
 ball(accessories,'summer cap crown',0x748b74,[0,1.44,-.03],[.53,.17,.39]);box(accessories,'summer cap brim',0x748b74,[0,1.33,.36],[.79,.045,.42]);
 for(const x of [-.36,.36])box(accessories,'sunglasses lens',0x34494b,[x,.72,.49],[.49,.30,.045]);
 box(accessories,'sunglasses bridge',0x34494b,[0,.74,.50],[.25,.035,.035]);
 const splash=new THREE.Group();splash.name='cannonball splash';root.add(splash);
 for(let i=0;i<12;i++)ball(splash,'water splash droplet',0xa7d8d4,[0,0,0],[.065,.11,.065]);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.025,6,32),new THREE.MeshStandardMaterial({color:0xb0d8cf,roughness:1}));ring.name='splash ripple';ring.rotation.x=-Math.PI/2;splash.add(ring);
 return {root,clipboard,letter,leaf,splash,ring};
}
export const hookNames=['props.day','props.letter','props.final'];
export function beforeFrame({props,b,actors}){
 // hold() reparents props to a hand. Start every seek from the same scene-space transform.
 for(const p of [props.clipboard,props.letter,props.leaf]){
  props.root.add(p);p.position.set(0,0,0);p.rotation.set(0,0,0);p.scale.setScalar(p===props.clipboard?.56:1);
 }
 for(const p of [props.clipboard,props.letter,props.leaf,props.splash])p.visible=false;
 outfit.visible=b.id==='s03';accessories.visible=b.id==='s01'||b.id==='s03';actors.riot.refined.body.visible=!outfit.visible;
 for(const o of actors.riot.head.children)if(/cat-eye glasses|glasses temple|glasses bridge/.test(o.name))o.visible=!accessories.visible;
}
function day(f){
 const {props,actors,t,b,E,states,timeline}=f;
 props.clipboard.visible=true;hold(props.clipboard,actors.riot,'L','clipboard',{offset:V(0,-.10,.10)});
 if(b.id==='s03')cannonball(f);
 if(b.id==='s04'&&t<E.s04_00.end){
  const r=actors.bash,p=states.bash.pose,u=clamp((t-E.s04_00.start)/.55),amount=Math.sin(Math.PI*u);
  p.aLf-=amount*1.2;p.aRf-=amount*1.1;p.aLo+=amount*.5;p.aRo+=amount*.5;
  applyActor(r,p,t,blinkAt('bash',t,timeline));settleSeat(r,1);
 }
 if(b.id==='s04'&&E.s04_10&&t>=E.s04_10.start&&t<E.s04_10.end)actors.riot.head.rotation.y+=.12*Math.sin((t-E.s04_10.start)*8);
}
function cannonball(f){
 const {t,b,E,timeline,props,put,states,actors,camera}=f;
 const shot=timeline.cuts.find(c=>c.beat===b.id&&c.who==='bash');
 if(!shot||t<shot.start||t>=shot.end)return;
 // Cut into the leap just beyond the canopy, then follow it to the water.
 const age=Math.max(0,t-shot.start),u=clamp(age/1.3);
 const pos=[-5+2.8*u,2*(1-u)-1.1*u+.6*Math.sin(Math.PI*u),-2.9-3.6*u];
 if(age>=1.3)pos[1]=-1.1+.035*Math.sin((age-1.3)*3);
 const r=put('bash',pos,t,b,{yaw:2.35}),p=states.bash.pose;
 const tuck=Math.sin(Math.PI*u);p.lLf+=tuck*.85;p.lRf+=tuck*.85;p.lLk-=tuck*1.1;p.lRk-=tuck*1.1;
 p.aLf-=tuck*.7;p.aRf-=tuck*.7;applyActor(r,p,t,blinkAt('bash',t,timeline));
 camera.position.set(1,3,-8);camera.lookAt(-3,1.5,-5);camera.updateMatrixWorld(true);
 const splashAge=age-1.3;
 if(splashAge>=0&&splashAge<3.8){
  props.splash.visible=true;props.splash.position.set(-2.2,.025,-6.5);
  const drops=props.splash.children.filter(o=>o.name==='water splash droplet');
  for(let i=0;i<drops.length;i++){
   const a=i*Math.PI*2/drops.length,life=clamp(splashAge/1.2),radius=.15+life*1.2;
   drops[i].position.set(Math.cos(a)*radius,Math.max(0,1.15*Math.sin(Math.PI*life))*(.7+.3*(i%3)/2),Math.sin(a)*radius);
   const size=Math.max(.001,1-life);drops[i].scale.set(.065*size,.11*size,.065*size);
  }
  props.ring.scale.setScalar(.3+splashAge*.7);
 }
}
function letter(f){
 day(f);const {props,actors,t,E}=f;
 const start=E.s05_01.start,end=start+.8,u=smooth((t-start)/.8),rest=V(1.0,.56,.28);
 props.letter.visible=true;props.leaf.visible=true;
 if(t<end){
  hold(props.letter,actors.pip,'R','clipboard',{offset:V(0,-.04,.12)});
  props.letter.position.lerp(rest,u);props.letter.quaternion.slerp(new THREE.Quaternion(),u);
 }else{props.letter.position.copy(rest);props.letter.rotation.set(0,0,0);}
 props.leaf.position.copy(props.letter.position).add(V(.04,.012,.015));props.leaf.rotation.set(0,.4,0);
}
function final(f){
 day(f);const {props,actors,t,E}=f,rest=V(1,.56,.28);
 props.letter.visible=true;props.letter.position.copy(rest);props.letter.rotation.set(0,0,0);
 props.leaf.visible=true;props.leaf.position.copy(rest).add(V(.04,.012,.015));props.leaf.rotation.set(0,.4,0);
 const at=E.s06_09?.start;
 if(at!==undefined&&t>=at){
  const u=smooth((t-at)/1);const old=props.leaf.position.clone();
  hold(props.leaf,actors.riot,'R','open',{offset:V(0,.02,.13)});props.leaf.position.lerp(old,1-u);
 }
}
export const actions={'props.day':day,'props.letter':letter,'props.final':final};
