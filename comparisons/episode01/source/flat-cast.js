// Genuine 2D vector puppets on planes at authored depths. No volumetric character meshes.
import * as THREE from 'three';
import {CAST,headShape} from '../../../art/three/characters/cast.js';
const materials=new Map();
const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,toneMapped:false}));return materials.get(color);};
const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
function piece(parent,shape,color,x=0,y=0,z=0,ink=true){const g=group(parent,x,y,z),geo=new THREE.ShapeGeometry(shape,28);if(ink){const border=new THREE.Mesh(geo,mat(0x211a20));border.scale.set(1.035,1.035,1);border.position.z=-.004;g.add(border);}const m=new THREE.Mesh(geo,mat(color));g.add(m);return g;}
function ellipse(parent,color,x,y,rx,ry,z=0,ink=true){const s=new THREE.Shape();s.absellipse(0,0,rx,ry,0,Math.PI*2,false,0);return piece(parent,s,color,x,y,z,ink);}
function rect(parent,color,x,y,w,h,z=0,r=.03){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return piece(parent,s,color,x,y,z);}
const line=(parent,points,color=0x211a20,z=.08,width=.018)=>{const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,z)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,20,width,5,false),mat(color));parent.add(m);return m;};
export function makeFlatActor(who,guard=false){
 const s=CAST.find(c=>c.name.toLowerCase()===who),root=new THREE.Group();root.name=who+' flat puppet';
 const hip=group(root,0,1.085,0),body=group(hip),head=group(body,0,1.2,.035);const h=group(head,0,.6,0);
 const fur=s.fur,cloth=guard?0xd9413f:s.hoodie,dark=guard?0xb52d36:s.hoodieDark;
 const tail=group(hip,-.36,.24,-.025);let tailMesh=null;
 if(who==='riot'||who==='rocco'){
  const q=new THREE.Shape();q.moveTo(0,0);q.bezierCurveTo(.5,.05,1.55,.3,1.65,1.65);q.bezierCurveTo(1.15,1.05,.95,.5,.1,.45);q.closePath();tailMesh=piece(tail,q,fur);if(who==='riot'){const t=new THREE.Shape();t.moveTo(1.3,.8);t.lineTo(1.45,1.0);t.lineTo(1.42,.87);t.lineTo(1.65,1.65);t.quadraticCurveTo(1.61,1.12,1.47,.85);t.closePath();piece(tail,t,s.cream,0,0,.008,false);}else for(let i=0;i<5;i++)line(tail,[[.4+i*.23,.2+i*.16],[.55+i*.23,.42+i*.20]],s.mask,.01,.07);
 }else ellipse(tail,who==='pip'?0xffffff:fur,.4,0,.18,.17);
 const torso=new THREE.Shape();torso.moveTo(-.48,1.24);torso.quadraticCurveTo(-.6,.8,-.6,.05);torso.lineTo(.6,.05);torso.quadraticCurveTo(.6,.8,.48,1.24);torso.closePath();piece(body,torso,cloth,0,0,.015);
 rect(body,dark,0,.08,1.21,.14,.025,.015);line(body,[[0,.18],[0,1.1]],dark,.03,.009);
 if(who!=='riot'){ellipse(body,dark,0,.34,.29,.15,.035);for(const x of [-.12,.12])line(body,[[x,1.17],[x*.9,.94]],0xf1e8dc,.04,.007);}else if(!guard){for(const side of [-1,1]){line(body,[[side*.49,1.14],[side*.51,.18]],s.stripe,.04,.011);line(body,[[side*.13,.23],[side*.32,.4]],s.stripe,.04,.009);}}
 const limbs={};for(const side of [-1,1]){
  const sh=group(body,side*.69,1.02,.02),el=group(sh,0,-.5,.005);rect(sh,guard?fur:cloth,0,-.24,.29,.56,0,.11);rect(el,guard?fur:cloth,0,-.21,.27,.47,0,.10);if(!guard)rect(el,s.cuff,0,-.4,.28,.09,.01,.015);ellipse(el,fur,0,-.56,.16,.17,.015);limbs[side]={sh,el};
 }
 const legs=[];for(const side of [-1,1]){const leg=group(hip,side*.28,0,-.012),shin=group(leg,0,-.55,.001);rect(leg,fur,0,-.275,.25,.57,0,.10);rect(shin,fur,0,-.20,.23,.43,0,.09);ellipse(shin,fur,0,-.44,.265,.105,.01);legs.push({side,leg,shin});if(guard)rect(hip,0xd9413f,side*.28,-.08,.31,.25,.005,.015);}
 const ears=[];
 for(const side of [-1,1]){
  const e=group(h,side*(who==='pip'?.29:who==='bash'?.59:.54),who==='bash'?.62:.52,-.01);ears.push(e);
  if(who==='bash'){ellipse(e,fur,0,0,.235,.235);ellipse(e,s.muzzle,0,0,.14,.14,.008,false);}else{const q=new THREE.Shape();if(who==='pip'){q.moveTo(-.09,0);q.bezierCurveTo(-.22,.35,-.23,1.1,-.07,1.27);q.bezierCurveTo(.08,1.43,.22,.55,.12,.08);q.closePath();}else{const ht=who==='riot'?1.1:.48;q.moveTo(-.22,0);q.lineTo(-.04,ht);q.quadraticCurveTo(.24,ht*.6,.22,0);q.closePath();}piece(e,q,fur);const inner=piece(e,q,who==='pip'?s.earInner:who==='riot'?s.earInner:s.mask,0,.07,.009,false);inner.scale.set(.62,.76,1);}
 }
 piece(h,headShape(s.species),fur,0,0,.02);
 if(who==='bash')ellipse(h,s.muzzle,0,-.29,.4,.27,.04,false);
 if(who==='pip'){for(const side of [-1,1]){ellipse(h,0xffffff,side*.14,-.32,.25,.19,.04,false);ellipse(h,0xf3aac2,side*.48,-.18,.105,.055,.045,false);}}
 if(who==='riot'){const q=new THREE.Shape();q.moveTo(-.88,-.16);q.quadraticCurveTo(-.34,-.24,-.17,-.025);q.quadraticCurveTo(0,.065,.17,-.025);q.quadraticCurveTo(.34,-.24,.88,-.16);q.lineTo(.99,-.17);q.lineTo(.86,-.27);q.lineTo(.97,-.42);q.lineTo(.57,-.49);q.lineTo(0,-.71);q.lineTo(-.57,-.49);q.lineTo(-.97,-.42);q.lineTo(-.86,-.27);q.closePath();piece(h,q,s.cream,0,0,.04,false);}
 if(who==='rocco'){const white=new THREE.Shape();white.moveTo(-.73,.29);white.quadraticCurveTo(-.68,.55,0,.49);white.quadraticCurveTo(.68,.55,.73,.29);white.quadraticCurveTo(.38,.32,0,.19);white.quadraticCurveTo(-.38,.32,-.73,.29);piece(h,white,0xf0eef2,0,0,.035,false);const mask=new THREE.Shape();mask.moveTo(-.77,.21);mask.quadraticCurveTo(-.4,.25,0,.1);mask.quadraticCurveTo(.4,.25,.77,.21);mask.lineTo(.84,-.1);mask.quadraticCurveTo(.3,-.16,0,-.09);mask.quadraticCurveTo(-.3,-.16,-.84,-.1);mask.closePath();piece(h,mask,s.mask,0,0,.04,false);ellipse(h,0xf2f0f3,0,-.36,.43,.27,.045,false);}
 const r=who==='pip'?.195:.15,ex=who==='riot'?.36:who==='rocco'?.34:who==='bash'?.31:.285,eyes=[],pupils=[],brows=[];
 for(const side of [-1,1]){const eye=group(h,side*ex,.1,.055);ellipse(eye,0xffffff,0,0,r,r*1.06);const pupil=ellipse(eye,0x17141a,0,0,r*.5,r*.55,.012,false);ellipse(pupil,0xffffff,r*.2,r*.25,r*.16,r*.16,.008,false);eyes.push(eye);pupils.push(pupil);brows.push(rect(h,who==='pip'?0x7b7683:0x211a20,side*ex,.1+r*1.55,who==='pip'?.25:.31,who==='pip'?.025:.06,.07,.004));}
 if(who==='riot'){for(const side of [-1,1]){const q=new THREE.Shape();q.moveTo(.09,.17);q.quadraticCurveTo(.4,.31,.87,.38);q.lineTo(.72,.07);q.quadraticCurveTo(.58,-.16,.29,-.09);q.quadraticCurveTo(.1,-.04,.09,.17);const hole=new THREE.Path();hole.absellipse(.38,.075,.215,.15,-.12,Math.PI*2-.12,true,0);q.holes.push(hole);const rim=piece(h,q,s.glasses,0,0,.085,false);rim.scale.x=side;}rect(h,s.glasses,0,.13,.17,.035,.085,.01);}
 if(who==='pip'){const n=new THREE.Shape();n.moveTo(-.065,-.1);n.lineTo(.065,-.1);n.lineTo(0,-.17);n.closePath();piece(h,n,0xf09bb9,0,0,.08);}else ellipse(h,0x18151a,0,-.115,who==='bash'?.155:who==='riot'?.105:.125,who==='bash'?.09:.065,.085);
 const my=who==='riot'?-.28:who==='bash'?-.27:-.31,mr=who==='riot'?.225:who==='pip'?.15:.18,mouth=group(h,0,my,.09),open=ellipse(mouth,0x571a2a,0,-.03,mr,.13,.005),smile=line(mouth,[[-mr,0],[0,-mr*.55],[mr,0]],0x211a20,.01,.017);ellipse(open,0xf3748d,0,-.045,mr*.58,.04,.012,false);
 if(who==='pip'){for(const x of [-.037,.037])rect(mouth,0xffffff,x,-.12,.065,.11,.025,.004);}
 if(guard){rect(h,0xd33d3f,0,.45,.80,.09,.095,.015);line(body,[[0,1.1],[0,.75]],0xede4c8,.055,.013);ellipse(body,0xd2d6d0,0,.73,.075,.055,.065);}
 function apply(p,t,{seated=false,point=null}={}){
  hip.position.y=seated?0:1.085+(p.air||0);body.rotation.z=p.torsoZ*.5+p.sway;body.position.y=Math.sin(t*1.9)*.012;head.rotation.z=p.headZ*.6;head.position.x=p.headY*.08;
  for(let i=0;i<2;i++){const side=i?1:-1,e=ears[i];e.rotation.z=-side*((who==='pip'?(side>0?.43:.03):who==='riot'?.23:.1)+(side<0?p.earL:p.earR));}
  for(const side of [-1,1]){const l=limbs[side],angle=side<0?p.aLo:p.aRo,fold=side<0?p.aLw:p.aRw,bend=side<0?p.aLb:p.aRb;l.sh.rotation.z=side*(angle+Math.abs(side<0?p.aLf:p.aRf)*.35);l.el.rotation.z=side*(bend*.55+fold*.4);}
  if(point!==null){const side=point>=0?1:-1;limbs[side].sh.rotation.z=side*1.5;limbs[side].el.rotation.z=-side*.12;}
  for(const l of legs){l.leg.scale.y=seated?.56:1;l.leg.rotation.z=seated?l.side*.15:(l.side<0?p.lLf:p.lRf)*.7;l.shin.rotation.z=seated?-l.side*.35:(l.side<0?p.lLk:p.lRk)*.5;}
  const blink=Math.pow(Math.max(0,Math.cos(t*1.7+who.length)),32);eyes.forEach((e,i)=>{e.scale.y=Math.max(.06,1-p.lids-p.squint*.65-blink);pupils[i].position.x=p.lookX*.03;brows[i].rotation.z=(i?1:-1)*(.13+p.brow);brows[i].position.y=.1+r*1.55+p.browY;});
  const amount=Math.max(0,p.mouth);open.visible=amount>.045;open.scale.y=.2+amount;smile.visible=amount<.15;tail.rotation.z=.06*Math.sin(t*2);root.updateMatrixWorld(true);
 }
 return {root,hip,head,faceAnchor:h,limbs,apply,height:who==='pip'?4.45:who==='riot'?4.2:3.75};
}
