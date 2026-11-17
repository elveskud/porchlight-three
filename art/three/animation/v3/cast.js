// Additional cast follows the saved four-view Gemini sheets; all actors share the existing articulated rig.
import * as THREE from 'three';
import {makeCharacter as refinedMake,CAST,applyPose as refinedApply,neutral,reach} from '../../../../comparisons/episode01/source/refinements/cast.js';
import {RoundedBoxGeometry} from '../../vendor/addons/geometries/RoundedBoxGeometry.js';
export {CAST,neutral,reach};
const sphere=new THREE.SphereGeometry(1,24,16),V=(...p)=>new THREE.Vector3(...p),boxGeo=new RoundedBoxGeometry(1,1,1,3,.05);
const material=c=>new THREE.MeshToonMaterial({color:c});
function mesh(parent,name,g,c,p=[0,0,0],s=[1,1,1]){const o=new THREE.Mesh(g,material(c));o.name=name;o.position.set(...p);o.scale.set(...s);parent.add(o);return o;}
const ball=(p,n,c,pos,s)=>mesh(p,n,sphere,c,pos,s),box=(p,n,c,pos,s)=>mesh(p,n,boxGeo,c,pos,s);
function line(parent,name,pts,c,r=.01){return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>V(...a))),24,r,6,false),c);}
function flatShape(parent,name,points,c,z=.375,depth=.025){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(parent,name,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.006,bevelSegments:2}),c,[0,0,z]);}
const spec={
 owl:{name:'Owl',species:'bear',fur:0x9c7044,muzzle:0xdac69b,hoodie:0x716047,hoodieDark:0x514b38,cuff:0x514b38,hand:0x906738,leg:0xce9b4e,size:[1.03,1.04,1],tail:{segs:[{r:.01,color:0x9c7044}],baseX:0,curve:0}},
 gus:{name:'Gus',species:'bear',fur:0xc8cec2,muzzle:0xe3e3cc,hoodie:0x826348,hoodieDark:0x5d4938,cuff:0xbb9857,hand:0xc8cec2,leg:0xc8cec2,size:[.99,1.07,1],tail:{segs:[{r:.01,color:0xc8cec2}],baseX:0,curve:0}},
 dot:{...CAST.find(s=>s.name==='Pip'),name:'Dot',fur:0xf5edce,earInner:0xe2cfa8,hoodie:0xf4c742,hoodieDark:0xce9f36,cuff:0xf5edce,hand:0xf5edce,leg:0xf5edce,size:[.78,.78,.78]},
 brook:{name:'Brook',species:'bear',fur:0x9cbd84,muzzle:0xa9c896,hoodie:0xb39ac2,hoodieDark:0x95839c,cuff:0xe3d7b8,hand:0x9cbd84,leg:0x9cbd84,size:[1.02,.96,1],tail:{segs:[{r:.01,color:0x9cbd84}],baseX:0,curve:0}}
};
export const EXTRA_CAST=spec;
function spectacles(r,color,radius=.235){for(const side of [-1,1]){mesh(r.head,'round spectacles',new THREE.TorusGeometry(radius,.018,7,44),color,[side*.31,.72,.426],[1,1,.55]);line(r.head,'spectacle temple',[[side*.55,.72,.42],[side*.70,.72,.18],[side*.66,.70,-.15]],color,.012);}line(r.head,'spectacle bridge',[[-.075,.72,.43],[0,.74,.44],[.075,.72,.43]],color,.012);}
function extend(r,id){
 const keep=new Set([r.head.getObjectByName('sculpted head'),...r.face.eyes,...r.face.brows,r.face.mouth.group,r.sweat]);
 if(id!=='dot'){for(const o of r.head.children)if(!keep.has(o))o.visible=false;r.ears.forEach(e=>e.visible=false);r.ears=[];r.tail.chain[0].visible=false;}
 for(const o of r.spine.children)if(o.isMesh&&o!==r.refined.body)o.visible=false;
 if(id==='owl'){
  r.face.f.browBase=.025;
  for(const side of [-1,1]){ball(r.head,'cream owl eye disk',0xe4d5b2,[side*.31,.74,.354],[.35,.38,.012]);flatShape(r.head,'owl brow tuft',[[side*.35,1.18],[side*.77,1.38],[side*.67,.98]],0x9c7044,.04,.13);}
  spectacles(r,0x3d4238,.25);flatShape(r.head,'owl beak',[[-.10,.50],[.10,.50],[0,.29]],0xc89c4c,.414,.08);r.face.mouth.group.position.y=.20;
  flatShape(r.spine,'green bow tie',[[-.04,1.04],[-.24,1.16],[-.25,.96],[-.04,1.04],[.04,1.04],[.24,1.16],[.25,.96],[.04,1.04]],0x64864b,.28,.04);ball(r.spine,'bow tie knot',0x4e6b3c,[0,1.04,.33],[.06,.06,.025]);
  for(const side of [-1,1])line(r.spine,'jacket lapel',[[side*.07,1.02,.28],[side*.28,.78,.28],[side*.10,.65,.28]],0x4f4937,.016);
  for(const leg of [r.legL,r.legR])for(let i=0;i<3;i++)ball(leg.foot,'owl toe',0xc99c4e,[(i-1)*.11,-.035,.20],[.07,.055,.21]);
 }else if(id==='gus'){
  const head=r.head.getObjectByName('sculpted head');head.scale.set(.88,1.06,1);ball(r.head,'goat muzzle',0xe3e3cf,[0,.33,.375],[.38,.22,.035]);ball(r.head,'goat nose',0x606b5e,[0,.48,.429],[.12,.07,.025]);
  flatShape(r.head,'goat beard',[[-.18,.18],[.18,.18],[.08,-.10],[0,-.17],[-.08,-.10]],0xcfd4c5,.10,.15);
  for(const side of [-1,1]){ball(r.head,'goat side ear',0xc8cec2,[side*.75,.87,-.02],[.36,.13,.07]);const pts=[[side*.44,1.18,-.03],[side*.42,1.45,-.06],[side*.60,1.60,-.10],[side*.73,1.46,-.12]];line(r.head,'curved goat horn',pts,0xa5a58e,.075);line(r.spine,'overall strap',[[side*.34,1.22,.28],[side*.35,.72,.30]],0x5a4a38,.055);ball(r.spine,'overall button',0xc4ad6d,[side*.35,.74,.32],[.035,.035,.016]);}
  box(r.spine,'overall bib',0x8e7251,[0,.67,.285],[.65,.53,.045]);
  for(const arm of [r.armL,r.armR])arm.sh.traverse(o=>{let p=o;while(p){if(p===r.hands.L.wrist||p===r.hands.R.wrist)return;p=p.parent;}if(o.isMesh&&o.material?.color)o.material.color.set(0xc5a45e);});
 }else if(id==='dot'){
  r.refined.body.visible=false;flatShape(r.spine,'yellow dress',[[-.49,1.22],[.49,1.22],[.73,.05],[-.73,.05]],0xf4c742,-.23,.46);
  for(const leg of [r.legL,r.legR]){ball(leg.foot,'red trainer',0xb94d42,[0,.02,.12],[.27,.12,.25]);box(leg.foot,'cream trainer sole',0xf0e2bc,[0,-.065,.13],[.51,.06,.45]);line(leg.foot,'trainer lace',[[-.13,.13,.17],[.13,.13,.17]],0xf8edcc,.012);}
  r.face.f.browBase=-.015;r.face.brows.forEach(b=>b.children.forEach(o=>{if(o.material?.color)o.material.color.set(0x756d55);}));
 }else if(id==='brook'){
  r.head.getObjectByName('sculpted head').scale.set(.94,.96,1);spectacles(r,0x55694c,.20);r.face.mouth.group.position.y=.26;
  for(const side of [-1,1])ball(r.head,'turtle nostril',0x5c7854,[side*.055,.51,.413],[.018,.012,.008]);
  box(r.spine,'cream skirt',0xe1d6ba,[0,.23,.01],[1.24,.44,.53]);ball(r.spine,'turtle shell',0x4e6e46,[0,.64,-.49],[.89,1.00,.33]);
  mesh(r.spine,'shell rim',new THREE.TorusGeometry(.85,.045,7,50),0x3e5b39,[0,.64,-.59],[1,1.1,1]);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;line(r.spine,'shell seam',[[Math.cos(a)*.40,.64+Math.sin(a)*.44,-.81],[Math.cos(a)*.78,.64+Math.sin(a)*.86,-.67]],0x3e5b39,.014);}
 }
 r.root.userData.reference={owl:'art/gemini/characters/08_mr_hoot.jpg',gus:'art/gemini/characters/02_gus.jpg',dot:'art/gemini/characters/09_dot.jpg',brook:'art/gemini/characters/01_mrs_brook.jpg'}[id];r.root.userData.castId=id;
}
export function makeActor(id){const s=spec[id]||CAST.find(s=>s.name.toLowerCase()===id);if(!s)throw Error('Unknown actor '+id);const r=refinedMake(s);if(spec[id])extend(r,id);r.root.scale.multiplyScalar(.56);r.root.userData.castId=id;
 const mouthBase=r.face.mouth.group.position.clone(),headBase=r.head.scale.clone();const clothing=[];r.spine.traverse(o=>{if(o.isMesh&&/tailored torso|upper sleeve|hem fabric/.test(o.name)){o.geometry=o.geometry.clone();clothing.push({o,base:o.geometry.attributes.position.array.slice()});}});
 const skull=r.head.getObjectByName('sculpted head');skull.geometry=skull.geometry.clone();const jawBase=skull.geometry.attributes.position.array.slice(),cheeks=[];r.head.traverse(o=>{if(o.isMesh&&/face colour patch|goat muzzle/.test(o.name))cheeks.push({o,scale:o.scale.clone(),y:o.position.y});});r.motion={mouthBase,headBase,clothing,skull,jawBase,cheeks,contacts:[],lastPose:null};return r;
}
export function applyActor(r,p,t,blink){for(const leg of [r.legL,r.legR]){leg.hip.rotation.set(0,0,0);leg.knee.rotation.set(0,0,0);leg.foot.rotation.set(0,0,0);}refinedApply(r,p,t,blink);const mouth=r.face.mouth.group;r.motion.lastPose=p;mouth.position.copy(r.motion.mouthBase);mouth.position.y-=.018*(p.jaw||0);mouth.rotation.z=(p.asymmetry||0)*.10;
 const a=r.motion.skull.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=r.motion.jawBase[i*3],y=r.motion.jawBase[i*3+1],z=r.motion.jawBase[i*3+2],w=Math.max(0,Math.min(1,(-y-.05)/.5));a.setXYZ(i,x,y-.025*(p.jaw||0)*w,z);}a.needsUpdate=true;for(const c of r.motion.cheeks){c.o.scale.copy(c.scale);c.o.scale.x*=1-.012*(p.faceTension||0);c.o.position.y=c.y-.007*(p.jaw||0);}const f=r.refined;if(p.mouthWidth!==undefined){f.opening.scale.x=p.mouthWidth;f.opening.scale.y=p.mouthHeight;f.opening.visible=p.mouthHeight>.01;f.smile.visible=p.mouthHeight<=.02;f.tongue.visible=p.mouthHeight>.055;f.teeth.visible=p.teeth>.1&&p.mouthHeight>.018;f.teeth.scale.x=p.mouthWidth*1.36;f.teeth.position.y=p.mouthHeight*.55;f.tongue.position.y=-p.mouthHeight*.58;}
 r.face.brows[0].rotation.z+=(p.browAsym||0);r.face.brows[1].rotation.z-=(p.browAsym||0)*.6;
 r.face.eyes.forEach((eye,i)=>{eye.scale.y=Math.max(.06,eye.scale.y+(i?p.lidAsym||0:0));});
 for(const [side,hand] of Object.entries(r.hands)){hand.wrist.scale.set(1,1,1);hand.thumb.rotation.set(p.thumb||.10,0,(side==='L'?1:-1)*.45);hand.wrist.rotation.x=p.wristPitch||0;hand.fingers.forEach((finger,i)=>{finger.rotation.x+=(p.fingerCurl||0)*(1-i*.13);});}
 r.root.updateMatrixWorld(true);
}
