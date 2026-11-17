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
const base=CAST.find(s=>s.name==='Bash');
Object.assign(spec,{
 preston:{...base,name:'Preston',fur:0x32aaa9,muzzle:0xdfcfa6,hoodie:0xeee9d9,hoodieDark:0xb6c9c1,cuff:0xe9dfbe,hand:0x32aaa9,leg:0xf1e9d8,size:[.98,1.10,1],tail:{segs:[{r:.01,color:0x2d9d91}],baseX:0,curve:0}},
 marlo:{...base,name:'Marlo',fur:0xa8adaa,muzzle:0xbfc4be,hoodie:0x303e43,hoodieDark:0x263238,cuff:0xe1dfce,hand:0xa8adaa,leg:0x354247,size:[.88,.95,.90],tail:{segs:[{r:.01,color:0xa0a7a2}],baseX:0,curve:0}},
 mayor:{...base,name:'Mayor',fur:0xa9afa1,muzzle:0xd8d9c9,hoodie:0x3b506f,hoodieDark:0x2f3f5c,cuff:0xd7d4be,hand:0xa9afa1,leg:0xa9afa1,size:[.99,1.0,1],tail:{segs:[{r:.01,color:0xa9afa1}],baseX:0,curve:0}},
 bashmom:{...base,name:'Bashmom',fur:0xb87539,muzzle:0xe3bb80,hoodie:0xb84f42,hoodieDark:0x873c36,cuff:0xb87539,hand:0xb87539,leg:0xb87539,size:[1.09,1.10,1],tail:{segs:[{r:.01,color:0xb87539}],baseX:0,curve:0}},
 hiker:{...base,name:'Hiker',fur:0xe2bc94,muzzle:0xe2bc94,hoodie:0xb9543f,hoodieDark:0x894236,cuff:0x89968e,hand:0x89968e,leg:0x425868,size:[.98,1.25,1],tail:{segs:[{r:.01,color:0x425868}],baseX:0,curve:0}}
});
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
 if(id==='preston'){
  r.head.getObjectByName('sculpted head').scale.set(.78,1.0,.92);flatShape(r.head,'cream peacock beak',[[-.22,.52],[.15,.54],[.38,.39],[.10,.30],[-.20,.34]],0xe0cda0,.39,.07);r.face.mouth.group.position.y=.26;
  for(const side of [-1,1])ball(r.head,'peacock eye patch',0xefe6c7,[side*.30,.72,.37],[.28,.31,.014]);
  for(let i=0;i<3;i++){line(r.head,'crest stem',[[0,1.18,0],[(i-1)*.14,1.55,0]],0x245b62,.012);ball(r.head,'peacock crest',0x3eaaa9,[(i-1)*.14,1.57,.01],[.075,.14,.055]);}
  flatShape(r.spine,'white jacket lapel',[[-.55,1.25],[-.12,1.1],[0,.62],[-.35,.90]],0xfff6df,.30,.025);flatShape(r.spine,'white jacket lapel right',[[.55,1.25],[.12,1.1],[0,.62],[.35,.90]],0xfff6df,.30,.025);flatShape(r.spine,'pink peacock tie',[[-.07,1.10],[.07,1.10],[.11,.67],[0,.55],[-.11,.67]],0xc27c9b,.35,.015);
  const fan=new THREE.Group();fan.name='peacock feather fan';r.spine.add(fan);for(let i=0;i<9;i++){const a=(i-4)*.24,feather=ball(fan,'volumetric peacock feather',[0x2f9e85,0x2c8d9c,0x2d7a99][i%3],[Math.sin(a)*1.45,.42+Math.cos(a)*1.8,-.62],[.23,.72,.07]);feather.rotation.z=-a;ball(feather,'feather gold eye',0xb7ae55,[0,.36,.8],[.66,.24,.18]);ball(feather,'feather turquoise eye',0x308c9d,[0,.36,1.01],[.42,.16,.10]);ball(feather,'feather blue pupil',0x345981,[0,.36,1.14],[.20,.10,.08]);}
 }else if(id==='marlo'){
  r.head.getObjectByName('sculpted head').scale.set(.95,.98,1);for(const side of [-1,1]){ball(r.head,'round mouse ear',0xa8adaa,[side*.68,1.17,-.05],[.32,.38,.15]);ball(r.head,'inner mouse ear',0x8e9895,[side*.68,1.17,.09],[.23,.28,.025]);}ball(r.head,'mouse nose',0x313b3c,[0,.45,.43],[.12,.075,.055]);
  flatShape(r.spine,'white shirt',[[-.30,1.20],[.30,1.20],[0,.72]],0xe4dfce,.30,.02);flatShape(r.spine,'assistant tie',[[-.05,1.16],[.05,1.16],[.09,.74],[0,.65],[-.09,.74]],0x85495c,.34,.02);for(const side of [-1,1])line(r.spine,'suit lapel',[[side*.42,1.20,.31],[side*.15,.91,.32],[0,.66,.32]],0x192a33,.018);line(r.pelvis,'mouse tail',[[0,.5,-.25],[-.25,.2,-.6],[-.65,.15,-.8],[-.9,.24,-.8]],0x8d9791,.027);
 }else if(id==='mayor'){
  for(const side of [-1,1]){flatShape(r.head,'cat ear',[[side*.37,1.10],[side*.68,1.49],[side*.76,.94]],0xa9afa1,-.04,.20);flatShape(r.head,'cat inner ear',[[side*.48,1.13],[side*.65,1.36],[side*.69,1.05]],0xc9aaa0,.17,.01);}box(r.spine,'mayor skirt',0x3b506f,[0,.16,.01],[1.2,.48,.56]);flatShape(r.spine,'mayor sash',[[-.53,1.22],[-.33,1.30],[.60,.38],[.44,.20]],0xb84f45,.31,.025);line(r.spine,'sash gold border',[[-.53,1.22,.35],[.44,.20,.35]],0xe2be62,.026);for(let i=0;i<9;i++){const a=Math.PI*i/8;ball(r.spine,'pearl necklace',0xe6d9ad,[(i-4)*.065,1.12-.11*Math.sin(a),.35],[.038,.038,.026]);}
 }else if(id==='bashmom'){
  box(r.spine,'red dress skirt',0xb84f42,[0,.12,.01],[1.30,.52,.62]);const apron=box(r.spine,'floral apron',0xe7d8a8,[0,.62,.34],[.95,1.12,.045]);
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#e9dfa9';g.fillRect(0,0,256,256);for(let i=0;i<26;i++){const x=(i*73)%256,y=(i*97)%256;g.fillStyle=['#bd605b','#76944d','#d39f56','#758f9e'][i%4];for(let j=0;j<5;j++){g.beginPath();g.arc(x+8*Math.cos(j*1.256),y+8*Math.sin(j*1.256),5,0,7);g.fill();}g.fillStyle='#d7b46b';g.beginPath();g.arc(x,y,3,0,7);g.fill();}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;apron.material.map=tex;apron.material.color.set(0xffffff);apron.material.needsUpdate=true;
 }else if(id==='hiker'){
  r.head.getObjectByName('sculpted head').scale.set(.85,1.07,.96);flatShape(r.head,'human beard',[[-.56,.64],[-.46,.13],[0,-.03],[.46,.13],[.56,.64],[.25,.37],[0,.28],[-.25,.37]],0x77543a,.37,.045);ball(r.head,'human nose',0xd8ad85,[0,.52,.48],[.12,.16,.085]);r.face.mouth.group.position.y=.24;
  ball(r.head,'navy wool hat',0x344d6a,[0,1.14,-.03],[.70,.42,.50]);box(r.head,'beanie ribbed brim',0x2b405a,[0,1.06,.03],[1.35,.22,.81]);ball(r.head,'beanie pompom',0x2b405a,[0,1.57,-.03],[.17,.17,.17]);
  ball(r.spine,'large green backpack',0x3f654d,[0,.88,-.75],[.87,1.3,.40]);for(const side of [-1,1])line(r.spine,'backpack strap',[[side*.43,1.28,.31],[side*.40,.38,.33]],0x3c493d,.055);mesh(r.spine,'purple rolled bedroll',new THREE.CylinderGeometry(.22,.22,1.85,18),0x766385,[0,1.9,-.70]).rotation.z=Math.PI/2;for(const side of [-1,1])line(r.spine,'bedroll band',[[side*.6,1.67,-.7],[side*.6,1.91,-.48],[side*.6,2.10,-.70]],0x4c4d4a,.025);for(const leg of [r.legL,r.legR])ball(leg.foot,'brown hiking boot',0x6f5744,[0,0,.10],[.27,.18,.32]);
 }
 r.root.userData.reference={owl:'art/gemini/characters/08_mr_hoot.jpg',gus:'art/gemini/characters/02_gus.jpg',dot:'art/gemini/characters/09_dot.jpg',brook:'art/gemini/characters/01_mrs_brook.jpg'}[id]||({preston:'06_preston',marlo:'07_marlo',mayor:'05_mayor',bashmom:'12_bashs_mom',hiker:'14_hiker'}[id]?`art/gemini/characters/${{preston:'06_preston',marlo:'07_marlo',mayor:'05_mayor',bashmom:'12_bashs_mom',hiker:'14_hiker'}[id]}.jpg`:null);r.root.userData.castId=id;
}
export function makeActor(id){const s=spec[id]||CAST.find(s=>s.name.toLowerCase()===id);if(!s)throw Error('Unknown actor '+id);const r=refinedMake(s);if(spec[id])extend(r,id);r.root.scale.multiplyScalar(.56);r.root.userData.castId=id;
 const mouthBase=r.face.mouth.group.position.clone(),headBase=r.head.scale.clone();const clothing=[];r.spine.traverse(o=>{if(o.isMesh&&/tailored torso|upper sleeve|hem fabric/.test(o.name)){o.geometry=o.geometry.clone();clothing.push({o,base:o.geometry.attributes.position.array.slice()});}});
 const skull=r.head.getObjectByName('sculpted head');skull.geometry=skull.geometry.clone();const jawBase=skull.geometry.attributes.position.array.slice(),cheeks=[];r.head.traverse(o=>{if(o.isMesh&&/face colour patch|goat muzzle/.test(o.name))cheeks.push({o,scale:o.scale.clone(),y:o.position.y});});r.motion={mouthBase,headBase,clothing,skull,jawBase,cheeks,contacts:[],lastPose:null};return r;
}
export function applyActor(r,p,t,blink){const fan=r.spine.getObjectByName('peacock feather fan');if(fan)fan.rotation.set(0,0,0);for(const leg of [r.legL,r.legR]){leg.hip.rotation.set(0,0,0);leg.knee.rotation.set(0,0,0);leg.foot.rotation.set(0,0,0);}refinedApply(r,p,t,blink);const mouth=r.face.mouth.group;r.motion.lastPose=p;mouth.position.copy(r.motion.mouthBase);mouth.position.y-=.018*(p.jaw||0);mouth.rotation.z=(p.asymmetry||0)*.10;
 const a=r.motion.skull.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=r.motion.jawBase[i*3],y=r.motion.jawBase[i*3+1],z=r.motion.jawBase[i*3+2],w=Math.max(0,Math.min(1,(-y-.05)/.5));a.setXYZ(i,x,y-.025*(p.jaw||0)*w,z);}a.needsUpdate=true;for(const c of r.motion.cheeks){c.o.scale.copy(c.scale);c.o.scale.x*=1-.012*(p.faceTension||0);c.o.position.y=c.y-.007*(p.jaw||0);}const f=r.refined;if(p.mouthWidth!==undefined){f.opening.scale.x=p.mouthWidth;f.opening.scale.y=p.mouthHeight;f.opening.visible=p.mouthHeight>.01;f.smile.visible=p.mouthHeight<=.02;f.tongue.visible=p.mouthHeight>.055;f.teeth.visible=p.teeth>.1&&p.mouthHeight>.018;f.teeth.scale.x=p.mouthWidth*1.36;f.teeth.position.y=p.mouthHeight*.55;f.tongue.position.y=-p.mouthHeight*.58;}
 r.face.brows[0].rotation.z+=(p.browAsym||0);r.face.brows[1].rotation.z-=(p.browAsym||0)*.6;
 r.face.eyes.forEach((eye,i)=>{eye.scale.y=Math.max(.06,eye.scale.y+(i?p.lidAsym||0:0));});
 for(const [side,hand] of Object.entries(r.hands)){hand.wrist.scale.set(1,1,1);hand.thumb.rotation.set(p.thumb||.10,0,(side==='L'?1:-1)*.45);hand.wrist.rotation.x=p.wristPitch||0;hand.fingers.forEach((finger,i)=>{finger.rotation.x+=(p.fingerCurl||0)*(1-i*.13);});}
 r.root.updateMatrixWorld(true);
}
