// Refined volumetric cast, layered onto the original rig without changing the baseline films.
import * as THREE from 'three';
import {paint} from './surfaces.js';
import {RoundedBoxGeometry} from '../../../../art/three/vendor/addons/geometries/RoundedBoxGeometry.js';
import {makeCharacter as baseMake,applyPose as baseApply} from '../../../../art/three/characters/cast.js';
export {CAST,ANIMS,neutral} from '../../../../art/three/characters/cast.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const sphere=new THREE.SphereGeometry(1,24,16),gradient=new THREE.DataTexture(new Uint8Array([148,199,235,255]),4,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
function material(color){return new THREE.MeshToonMaterial({color,gradientMap:gradient});}
function mesh(parent,name,geometry,color,p=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geometry,material(color));m.name=name;m.position.set(...p);m.scale.set(...scale);parent.add(m);return m;}
function line(parent,name,points,color,r=.006){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,name,new THREE.TubeGeometry(curve,16,r,5,false),color);}
export function makeCharacter(s){
 const r=baseMake(s);r.userData={};
 // Preserve the shallow silhouette; widen the drawn head slightly rather than inflating its depth.
 const head=r.head.getObjectByName('sculpted head');head.scale.x=s.species==='bear'?1.035:s.species==='bunny'?1.025:1;head.scale.y=s.species==='bear'?.97:1;
 r.face.f={...r.face.f,browBase:s.species==='bear'?.04:s.species==='raccoon'?.015:s.species==='fox'?.07:-.025};
 r.root.traverse(o=>{if(o.isMesh&&o.material?.isMeshToonMaterial){o.material=o.material.clone();o.material.gradientMap=gradient;}if(o.isMesh&&o.material?.side===THREE.BackSide)o.visible=false;});
 // A single fine head outline avoids dark seams between every rounded component.
 const edge=new THREE.Mesh(head.geometry,new THREE.MeshBasicMaterial({color:0x372d29,side:THREE.BackSide}));edge.name='fine outer head contour';edge.scale.set(1.018,1.018,1.025);head.add(edge);
 if(s.species==='fox'){
  const frames=[];r.head.traverse(o=>{if(o.name==='cat-eye glasses')frames.push(o);});frames.forEach(o=>{o.scale.x*=.93;o.position.z=.438;});
  for(const side of [-1,1])line(r.head,'glasses temple',[[side*.72,.73,.45],[side*.77,.72,.22],[side*.73,.71,-.19]],s.glasses,.017);
  line(r.head,'glasses bridge',[[-.10,.73,.448],[0,.75,.47],[.10,.73,.448]],s.glasses,.015);
  for(const side of [-1,1])mesh(r.head,'cream inner ear tuft',new THREE.ConeGeometry(.09,.18,3),s.cream,[side*.51,1.23,.08],[1,1,.3]);
 }
 // Slim sleeve joints bridge the elbow while the limb bends; tailored seams follow the sleeves.
 r.hands={};
 for(const [side,arm,key] of [[-1,r.armL,'L'],[1,r.armR,'R']]){
  arm.el.children.filter(o=>o.isMesh&&o.geometry===sphere).forEach(o=>o.visible=false);
  arm.el.children.filter(o=>o.isMesh&&Math.abs(o.position.y+.55)<.02).forEach(o=>o.visible=false);
  mesh(arm.el,'soft elbow seam',sphere,s.hoodie,[0,0,0],[.123,.14,.089]);
  const wrist=new THREE.Group();wrist.name='articulated paw '+key;wrist.position.set(0,-.55,.018);arm.el.add(wrist);
  mesh(wrist,'paw palm',sphere,s.hand,[0,0,0],[.128,.137,.079]);
  const thumb=mesh(wrist,'paw thumb',sphere,s.hand,[side*.115,.015,.035],[.059,.082,.065]);thumb.rotation.z=-side*.45;
  const fingers=[];for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set((i-1)*.067,-.09,.018);wrist.add(g);mesh(g,'rounded paw digit',sphere,s.hand,[0,-.057,0],[.041,.088,.055]);fingers.push(g);}
  r.hands[key]={wrist,thumb,fingers};
  if(s.hoodieDark!==undefined){line(arm.sh,'sleeve seam',[[side*.10,-.05,.101],[side*.12,-.23,.104],[side*.10,-.42,.101]],s.hoodieDark,.004);for(let j=0;j<4;j++)line(arm.el,'ribbed cuff stitch',[[-.09+j*.06,-.365,.106],[-.09+j*.06,-.43,.106]],s.hoodieDark,.003);}
 }
 // Readable construction, with restrained folds, ribbing and a stitched pocket opening.
 for(let i=0;i<12;i++)line(r.spine,'hem rib',[[-.53+i*.095,.025,.272],[-.53+i*.095,.12,.272]],s.hoodieDark,.0035);
 for(const side of [-1,1])line(r.spine,'hem fabric fold',[[side*.55,.18,.269],[side*.48,.28,.271],[side*.54,.34,.269]],s.hoodieDark,.006);
 if(s.species!=='fox')line(r.spine,'pocket opening',[[-.25,.37,.285],[0,.41,.289],[.25,.37,.285]],s.hoodieDark,.008);
 r.face.mouth.group.children.forEach(o=>o.visible=false);
 const mouth=new THREE.Group();mouth.name='eight viseme mouth';mouth.position.z=.025;r.face.mouth.group.add(mouth);
 const opening=mesh(mouth,'mouth cavity',sphere,0x4c1822,[0,0,0],[.15,.10,.014]);
 const tongue=mesh(mouth,'tongue',sphere,0xe18086,[0,-.04,.014],[.09,.026,.006]);
 const teeth=mesh(mouth,'upper teeth',new RoundedBoxGeometry(1,1,.01,2,.07),0xfff4dd,[0,.05,.018],[.18,.025,1]);
 const smile=line(mouth,'expressive closed smile',[[-.15,.018,.02],[-.075,-.035,.02],[.025,-.042,.02],[.16,.03,.02]],0x372126,.012);
 r.refined={mouth,opening,tongue,teeth,smile,eyeHighlights:[],body:r.spine.getObjectByName('tailored torso'),lastViseme:'X'};
 for(const [i,eye] of r.face.eyes.entries()){
  const lid=line(eye,'upper eyelid',[[-r.face.f.r*.85,.045,.038],[0,r.face.f.r*.94,.038],[r.face.f.r*.85,.045,.038]],s.species==='bunny'?0x8d8193:0x4b3026,.008);r.refined.eyeHighlights.push(lid);const closed=line(eye,'closed eyelid',[[-r.face.f.r*.72,0,.045],[0,-.012,.045],[r.face.f.r*.72,0,.045]],s.species==='bunny'?0x85798b:0x392e29,.009);closed.visible=false;eye.userData.closedLid=closed;
 }
 r.spine.traverse(o=>{if(o.isMesh&&o.material?.isMeshToonMaterial&&/torso|sleeve/.test(o.name)){o.material.map=paint('cloth');o.material.needsUpdate=true;}});
 r.root.userData.refinement='50-item 3D refinement';return r;
}
const mouthShapes={X:[0,0,0],A:[.135,.012,0],B:[.145,.046,1],C:[.175,.100,1],D:[.155,.155,.8],E:[.10,.103,0],F:[.067,.084,0],G:[.13,.029,1],H:[.145,.065,.2]};
export function applyPose(r,p,T,blink=0){
 baseApply(r,p,T,blink);
 const f=r.refined;if(!f)return;
 r.face.mouth.open.visible=false;r.face.mouth.smile.visible=false;
 r.face.mouth.group.children.forEach(o=>{if(o!==f.mouth)o.visible=false;});
 const viseme=p.viseme||(p.mouth>.7?'D':p.mouth>.35?'C':p.mouth>.08?'B':'X');const shape=mouthShapes[viseme]||mouthShapes.X,[w,h,tooth]=shape,asym=p.asymmetry||0;
 f.opening.visible=h>.009;f.opening.scale.set(w,h,.014);f.tongue.visible=h>.06;f.tongue.position.y=-h*.58;f.tongue.scale.set(w*.65,Math.min(.032,h*.22),.006);f.teeth.visible=tooth>.1&&h>.018;f.teeth.position.y=h*.55;f.teeth.scale.set(w*1.36,Math.min(h*.45,.035),1);
 f.smile.visible=h<.025;f.smile.scale.set(1,p.smile<0?-.6:Math.max(.45,p.smile),1);f.mouth.rotation.z=asym*.12;
 r.face.brows[0].rotation.z+=asym*.09;r.face.brows[1].position.y+=asym*.025;
 r.face.eyes.forEach((eye,i)=>{const closure=blink+p.lids+p.squint*.45;eye.scale.y=Math.max(.06,1-closure+(i===1?asym*.08:0));eye.children.forEach(o=>{if(o!==eye.userData.closedLid)o.visible=closure<.88;});eye.userData.closedLid.visible=closure>=.88;if(closure>=.88)eye.scale.y=1;});
 for(const [key,h] of Object.entries(r.hands)){
  const kind=p['hand'+key]||'relax';h.wrist.rotation.z=(key==='L'?-1:1)*(kind==='open'?.18:0);
  h.fingers.forEach((finger,i)=>{const pointing=kind==='point'&&i===0;finger.rotation.x=kind==='grip'?-.9:kind==='point'&&!pointing?-.95:kind==='open'?-.05:-.19;finger.scale.y=pointing?1.6:1;finger.rotation.z=kind==='open'?(i-1)*.17:0;});
 }
 f.lastViseme=viseme;
}
// Analytic two-bone reach. The paw target is clamped to the rig's actual segment lengths.
export function reach(r,key,target){
 const arm=key==='L'?r.armL:r.armR,local=r.spine.worldToLocal(target.clone()),start=arm.sh.position.clone(),d=local.sub(start),len=clamp(d.length(),.12,1.035),a=.5,b=.55;d.normalize();
 const along=(a*a-b*b+len*len)/(2*len),height=Math.sqrt(Math.max(.0001,a*a-along*along));
 const bend=V(key==='L'?-.8:.8,-.35,.8);bend.addScaledVector(d,-bend.dot(d)).normalize();const elbow=start.clone().addScaledVector(d,along).addScaledVector(bend,height),end=start.clone().addScaledVector(d,len);
 arm.sh.quaternion.setFromUnitVectors(V(0,-1,0),elbow.clone().sub(start).normalize());
 const lower=end.sub(elbow).applyQuaternion(arm.sh.quaternion.clone().invert()).normalize();arm.el.quaternion.setFromUnitVectors(V(0,-1,0),lower);r.root.updateMatrixWorld(true);
}
