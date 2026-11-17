// tree.js — the Porchlight cast (Bash, Pip, Riot, Rocco) as procedural Three.js models
// with a named animation set. Proportions follow art/refs/cast-for-gemini/lineup.png.
// Sculpted face contours, shallow facial features, tailored clothing and continuous skinned tails.
// Load it with tree.html (importmap for "three"), via a local server:  python3 -m http.server
//
// Conventions: characters face +z (toward the camera). "L"/"R" = screen side as seen from
// the default camera, so L is the -x side and R is the +x side.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const S = Math.sin, C = Math.cos;
const { clamp, lerp } = THREE.MathUtils;
const sat = (x) => clamp(x, 0, 1);

/* ------------------------------------------------------------------ helpers */

const INK = new THREE.MeshBasicMaterial({ color: 0x1b1210, side: THREE.BackSide });
const INK_T = 0.022;                         // outline thickness (world units)
const SPHERE = new THREE.SphereGeometry(1, 32, 24);
// Two clear shading tones match the app artwork without glossy, balloon-like highlights.
const TOON = new THREE.DataTexture(new Uint8Array([175,255]),2,1,THREE.RedFormat);
TOON.minFilter=TOON.magFilter=THREE.NearestFilter;TOON.generateMipmaps=false;TOON.needsUpdate=true;
const std = (color, rough = .8, metal = 0) => new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const characterMaterial=color=>new THREE.MeshToonMaterial({color,gradientMap:TOON});
let buildingCharacter=false;
const LEG_UPPER=.55,LEG_LOWER=.42,FOOT_CLEARANCE=.115;
const FACE_Z=.35;

function addInk(m, t) {
  const g = m.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const sz = new THREE.Vector3();
  g.boundingBox.getSize(sz);
  const o = new THREE.Mesh(g, INK);
  o.scale.set(1 + 2 * t / (sz.x * m.scale.x), 1 + 2 * t / (sz.y * m.scale.y), 1 + 2 * t / (sz.z * m.scale.z));
  m.add(o);
}

// part(geometry, colour, {pos, rot, scale, rough, metal, ink})
function part(geo, color, o = {}) {
  const m = new THREE.Mesh(geo, o.mat || (buildingCharacter?characterMaterial(color):std(color,o.rough??.85,o.metal??0)));
  m.castShadow = true;
  m.receiveShadow = true;
  if (o.pos) m.position.set(...o.pos);
  if (o.rot) m.rotation.set(...o.rot);
  if (o.scale) m.scale.set(...o.scale);
  const t = o.ink ?? INK_T;
  if (t > 0) addInk(m, t);
  return m;
}

const grp = (parent, x = 0, y = 0, z = 0, name = '') => {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (name) g.name = name;
  if (parent) parent.add(g);
  return g;
};

const ell = (rx, ry, rz) => [rx, ry, rz];              // ellipsoid scale for the unit sphere
const caps = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 16);

const HY = 0.6;                                         // head centre above the neck pivot
const surf = (hs, x, y) => FACE_Z; // broad face cap; depth is in the sculpted sides, not bulging eyes

/* ------------------------------------------------------------------ face (shared) */

// f: { ex, ey, r, bw, bh, browCol, browBase, mx, my, mz, mrad, mw, mh, baseMouth, teeth }
function makeFace(head, hs, f) {
  const face = { eyes: [], pupils: [], brows: [], f };
  for (const side of [-1, 1]) {
    const z = surf(hs, f.ex, f.ey)+.012;
    const eye = grp(head, side * f.ex, HY + f.ey, z, 'eye');
    eye.add(part(SPHERE, 0xffffff, { scale: ell(f.r, f.r * 1.08, f.r * 0.16), ink: 0.008, rough: 0.35 }));
    const pupil = part(SPHERE, 0x15110f, { scale: ell(f.r * 0.5, f.r * 0.56, f.r * 0.065), pos: [0, 0, f.r * 0.19], ink: 0, rough: 0.3 });
    eye.add(pupil);
    eye.add(part(SPHERE, 0xffffff, { scale: ell(f.r * 0.15, f.r * 0.15, f.r * 0.1), pos: [f.r * 0.2, f.r * 0.22, f.r * 0.46], ink: 0, rough: 0.2 }));
    face.eyes.push(eye);
    face.pupils.push(pupil);

    const by = f.ey + f.r * 1.55;
    const brow = grp(head, side * f.ex, HY + by, surf(hs, f.ex, by) + .025, 'brow');
    brow.userData.y0 = brow.position.y;
    brow.userData.side = side;
    brow.add(part(new RoundedBoxGeometry(f.bw, f.bh ?? 0.07, 0.025, 2, 0.012), f.browCol, { ink: 0.008, rough: 0.9 }));
    face.brows.push(brow);
  }

  // mouth: smile arc (scale.y flips it to a frown) + open mouth that grows with `mouth`
  const mouth = grp(head, 0, HY + f.my, f.mz, 'mouth');
  const arcGeo = new THREE.TorusGeometry(f.mrad, f.mrad * 0.10, 8, 24, Math.PI).rotateZ(Math.PI);
  const smile = part(arcGeo, 0x2a1410, { scale: [f.mw ?? 1, 1, 1], ink: 0, rough: 0.6 });
  mouth.add(smile);
  const open = part(SPHERE, 0x5c0f20, { scale: ell(f.mrad * (f.mw ?? 1) * 0.95, 0.01, 0.012), pos: [0, -0.01, 0.008], ink: 0, rough: 0.5 });
  open.add(part(SPHERE, 0xff6b86, { scale: ell(0.6, 0.38, 0.6), pos: [0, -0.5, 0.25], ink: 0, rough: 0.6 }));
  mouth.add(open);
  if (f.teeth) {
    for (const sx of [-1, 1]) {
      mouth.add(part(new RoundedBoxGeometry(0.065, 0.11, 0.03, 2, 0.012), 0xffffff, { pos: [sx * 0.037, -f.mrad*.55 - .035, 0.0], ink: 0.01, rough: 0.4 }));
    }
  }
  face.mouth = { group: mouth, smile, open, mh: f.mh ?? 1, mw: f.mw ?? 1, base: f.baseMouth ?? 0 };
  return face;
}

/* ------------------------------------------------------------------ species heads */

function earGroup(head, x, y, z, side) {
  const g = grp(head, x, y, z, 'ear');
  g.userData.side = side;
  return g;
}

// Front contours are traced from the approved lineup. Extrusion and bevel retain real side volume.
function solidShape(shape,depth=.54,bevel=.08){
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:24});
  g.translate(0,0,-depth/2);return g;
}
function headShape(species){
  const q=new THREE.Shape();
  if(species==='bear'){
    q.moveTo(0,.68);q.bezierCurveTo(.53,.7,.75,.52,.76,.12);q.bezierCurveTo(.79,-.35,.47,-.66,0,-.68);q.bezierCurveTo(-.47,-.66,-.79,-.35,-.76,.12);q.bezierCurveTo(-.75,.52,-.53,.7,0,.68);
  }else if(species==='bunny'){
    q.moveTo(0,.69);q.bezierCurveTo(.5,.69,.7,.4,.7,-.04);q.bezierCurveTo(.72,-.45,.45,-.66,0,-.68);q.bezierCurveTo(-.45,-.66,-.72,-.45,-.7,-.04);q.bezierCurveTo(-.7,.4,-.5,.69,0,.69);
  }else{
    const fox=species==='fox';q.moveTo(0,fox?.73:.67);
    if(fox)q.quadraticCurveTo(.12,.61,.4,.58);else q.quadraticCurveTo(.44,.68,.66,.48);
    q.quadraticCurveTo(.8,.4,.78,.02);q.lineTo(.99,-.17);q.lineTo(.86,-.27);q.lineTo(.97,-.42);q.lineTo(.57,-.49);q.lineTo(0,-.71);q.lineTo(-.57,-.49);q.lineTo(-.97,-.42);q.lineTo(-.86,-.27);q.lineTo(-.99,-.17);q.quadraticCurveTo(-.78,.02,-.78,.23);
    if(fox){q.quadraticCurveTo(-.78,.5,-.4,.58);q.quadraticCurveTo(-.12,.61,0,.73);}else q.quadraticCurveTo(-.65,.67,0,.67);
  }
  q.closePath();return q;
}
function headSolid(head,s){const m=part(solidShape(headShape(s.species)),s.fur,{pos:[0,HY,0],ink:.018});m.name='sculpted head';head.add(m);}
function patch(head,shape,color,z=FACE_Z+.008){const m=part(new THREE.ShapeGeometry(shape,24),color,{pos:[0,HY,z],ink:0});m.name='face colour patch';m.castShadow=false;head.add(m);return m;}
function ellipsePatch(head,color,x,y,rx,ry,z=FACE_Z+.015){const q=new THREE.Shape();q.absellipse(x,y,rx,ry,0,Math.PI*2,false,0);return patch(head,q,color,z);}
function nose(head,color,rx,ry,z=.426){const m=part(SPHERE,color,{scale:[rx,ry,.035],pos:[0,HY-.115,z],ink:.006});m.name='nose';head.add(m);}
function earSolid(shape,color,depth=.10){return part(solidShape(shape,depth,.018),color,{ink:.012});}
function buildBear(head,s){
 const hs=[1,.94,.44];headSolid(head,s);ellipsePatch(head,s.muzzle,0,-.29,.4,.27);nose(head,0x171313,.155,.09,.414);
 const ears=[-1,1].map(side=>{const e=earGroup(head,side*.59,HY+.61,-.06,side);e.add(part(SPHERE,s.fur,{scale:[.235,.235,.085],ink:.015}));e.add(part(SPHERE,s.muzzle,{scale:[.14,.14,.025],pos:[0,0,.087],ink:0}));return e;});
 const face=makeFace(head,hs,{ex:.31,ey:.12,r:.15,bw:.32,bh:.075,browCol:0x211811,browBase:.22,my:-.27,mz:.403,mrad:.18});
 return {hs,ears,earBase:.06,earBaseX:0,face};
}
function buildBunny(head,s){
 const hs=[.95,.95,.44];headSolid(head,s);for(const side of [-1,1]){ellipsePatch(head,0xffffff,side*.14,-.32,.25,.19);ellipsePatch(head,0xf3aac2,side*.48,-.18,.105,.055,.374);}
 const n=new THREE.Shape();n.moveTo(-.065,-.1);n.lineTo(.065,-.1);n.lineTo(0,-.17);n.closePath();const nm=earSolid(n,0xf09bb9,.025);nm.position.set(0,HY,.405);head.add(nm);
 const ears=[-1,1].map(side=>{const e=earGroup(head,side*.29,HY+.63,-.03,side);const q=new THREE.Shape();q.moveTo(-.09,0);q.bezierCurveTo(-.22,.35,-.23,1.1,-.07,1.27);q.bezierCurveTo(.08,1.43,.22,.55,.12,.08);q.quadraticCurveTo(.06,-.04,-.09,0);e.add(earSolid(q,s.fur));const inner=part(new THREE.ShapeGeometry(q,20),s.earInner,{pos:[0,.08,.073],scale:[.58,.82,1],ink:0});e.add(inner);e.userData.splay=side>0?.38:-.08;return e;});
 const face=makeFace(head,hs,{ex:.285,ey:.09,r:.195,bw:.25,bh:.025,browCol:0x82798a,browBase:-.06,my:-.31,mz:.404,mrad:.15,teeth:true});
 return {hs,ears,earBase:.10,earBaseX:0,face};
}
function buildFox(head,s){
 const hs=[1.12,.9,.44];headSolid(head,s);
 const cream=new THREE.Shape();cream.moveTo(-.88,-.16);cream.quadraticCurveTo(-.34,-.24,-.17,-.025);cream.quadraticCurveTo(0,.065,.17,-.025);cream.quadraticCurveTo(.34,-.24,.88,-.16);cream.lineTo(.99,-.17);cream.lineTo(.86,-.27);cream.lineTo(.97,-.42);cream.lineTo(.57,-.49);cream.lineTo(0,-.71);cream.lineTo(-.57,-.49);cream.lineTo(-.97,-.42);cream.lineTo(-.86,-.27);cream.closePath();patch(head,cream,s.cream);
 // A short tapered snout reads as a fox in profile without a round protruding muzzle.
 const snout=part(new THREE.ConeGeometry(.16,.17,16).rotateX(Math.PI/2),s.cream,{pos:[0,HY-.1,.393],scale:[1.25,.65,1],ink:0});head.add(snout);nose(head,0x181511,.105,.065,.492);
 const ears=[-1,1].map(side=>{const e=earGroup(head,side*.52,HY+.49,-.045,side);const q=new THREE.Shape();q.moveTo(-.22,0);q.quadraticCurveTo(-.29,.39,-.04,1.1);q.quadraticCurveTo(.2,.65,.23,.02);q.closePath();e.add(earSolid(q,s.fur));const inn=part(new THREE.ShapeGeometry(q,20),s.earInner,{scale:[.63,.76,1],pos:[0,.09,.074],ink:0});e.add(inn);return e;});
 const face=makeFace(head,hs,{ex:.36,ey:.1,r:.145,bw:.36,bh:.065,browCol:0x211710,browBase:.20,my:-.28,mz:.41,mrad:.225,mw:1.08,mh:1,baseMouth:0});
 // Filled cat-eye rims with true openings, rather than thick circular torus goggles.
 for(const side of [-1,1]){const frame=new THREE.Shape();frame.moveTo(.09,.17);frame.quadraticCurveTo(.4,.31,.87,.38);frame.lineTo(.72,.07);frame.quadraticCurveTo(.58,-.16,.29,-.09);frame.quadraticCurveTo(.10,-.04,.09,.17);const hole=new THREE.Path();hole.absellipse(.38,.075,.215,.15,-.12,Math.PI*2-.12,true,0);frame.holes.push(hole);const g=new THREE.ExtrudeGeometry(frame,{depth:.035,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2,curveSegments:24});const rim=part(g,s.glasses,{pos:[0,HY,.405],scale:[side,1,1],ink:.007});rim.name='cat-eye glasses';head.add(rim);}
 head.add(part(new RoundedBoxGeometry(.17,.035,.035,2,.015),s.glasses,{pos:[0,HY+.13,.415],ink:.005}));
 return {hs,ears,earBase:.23,earBaseX:0,face};
}
function buildRaccoon(head,s){
 const hs=[1.1,.9,.44];headSolid(head,s);
 const forehead=new THREE.Shape();forehead.moveTo(-.73,.29);forehead.quadraticCurveTo(-.68,.55,0,.49);forehead.quadraticCurveTo(.68,.55,.73,.29);forehead.quadraticCurveTo(.38,.32,0,.19);forehead.quadraticCurveTo(-.38,.32,-.73,.29);patch(head,forehead,0xf0eef2);
 const mask=new THREE.Shape();mask.moveTo(-.77,.21);mask.quadraticCurveTo(-.4,.25,0,.1);mask.quadraticCurveTo(.4,.25,.77,.21);mask.lineTo(.84,-.1);mask.quadraticCurveTo(.3,-.16,0,-.09);mask.quadraticCurveTo(-.3,-.16,-.84,-.1);mask.closePath();patch(head,mask,s.mask,.373);
 ellipsePatch(head,0xf2f0f3,0,-.36,.43,.27,.38);nose(head,0x171518,.125,.075,.427);
 const ears=[-1,1].map(side=>{const e=earGroup(head,side*.59,HY+.5,-.045,side);const q=new THREE.Shape();q.moveTo(-.19,0);q.lineTo(-.1,.48);q.quadraticCurveTo(.24,.3,.2,.015);q.closePath();e.add(earSolid(q,s.fur));e.add(part(new THREE.ShapeGeometry(q),s.mask,{pos:[0,.045,.073],scale:[.65,.72,1],ink:0}));return e;});
 const face=makeFace(head,hs,{ex:.34,ey:.075,r:.15,bw:.31,bh:.055,browCol:0x211f29,browBase:.08,my:-.31,mz:.418,mrad:.18});
 return {hs,ears,earBase:.19,earBaseX:0,face};
}

const HEADS = { bear: buildBear, bunny: buildBunny, fox: buildFox, raccoon: buildRaccoon };

/* ------------------------------------------------------------------ body */

function makeTail(parent,t){
 const base=grp(parent,0,.12,-.26,'tailGroup');
 if(t.segs.length===1){base.add(part(SPHERE,t.segs[0].color,{scale:[t.segs[0].r,t.segs[0].r,t.segs[0].r*.65],ink:.012}));return {chain:[base],baseX:t.baseX,baseZ:t.baseZ??0,curve:t.curve};}
 const lengths=t.segs.map(s=>s.len??.3),total=lengths.reduce((a,b)=>a+b,0),starts=[0];lengths.forEach(n=>starts.push(starts.at(-1)+n));
 const bones=t.segs.map((s,i)=>{const b=new THREE.Bone();b.name=`tail bone ${i}`;if(i){b.position.y=lengths[i-1];}return b;});
 bones.forEach((b,i)=>(i?bones[i-1]:base).add(b));
 const positions=[],colours=[],skinIndex=[],skinWeight=[],indices=[],rings=48,sides=16;
 const fox=t.segs.length===5;
 for(let i=0;i<=rings;i++){const u=i/rings,y=u*total;let joint=0;while(joint<bones.length-1&&y>starts[joint+1])joint++;const mix=clamp((y-starts[joint])/lengths[joint],0,1),next=Math.min(joint+1,bones.length-1);
  // Continuous tapered silhouette: no spheres or overlapping cylinder seams.
  const radius=fox?(.035+.30*Math.pow(Math.sin(Math.PI*u),.8)):(.045+.19*Math.pow(Math.sin(Math.PI*u),.55));
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;positions.push(Math.cos(a)*radius,y,Math.sin(a)*radius*.66);const color=new THREE.Color(fox?(u>.73+.04*Math.cos(a*4)?t.segs.at(-1).color:t.segs[0].color):t.segs[Math.min(6,Math.floor(u*7))].color);colours.push(color.r,color.g,color.b);skinIndex.push(joint,next,0,0);skinWeight.push(1-mix,mix,0,0);if(i<rings&&j<sides){const v=i*(sides+1)+j;indices.push(v,v+sides+1,v+1,v+sides+1,v+sides+2,v+1);}}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=characterMaterial(0xffffff);material.vertexColors=true;const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='continuous tapered tail';mesh.castShadow=true;mesh.frustumCulled=false;base.add(mesh);parent.updateWorldMatrix(true,true);base.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
 return {chain:bones,baseX:t.baseX,baseZ:t.baseZ??0,curve:t.curve};
}

function makeCharacter(s) {
  buildingCharacter=true;
  const root = new THREE.Group();
  root.name = s.name;
  root.scale.set(...(s.size ?? [1, 1, 1]));
  const pelvis = grp(root, 0, 0.85, 0, 'pelvis');
  const spine = grp(pelvis, 0, 0, 0, 'spine');

  // A tailored silhouette: broad front, shallow sides and restrained corner rounding.
  const body=part(new RoundedBoxGeometry(1.2,1.27,.50,4,.085),s.hoodie,{pos:[0,.64,0],ink:.018});body.name='tailored torso';spine.add(body);
  spine.add(part(new RoundedBoxGeometry(1.22,.14,.52,3,.035),s.hoodieDark,{pos:[0,.075,0],ink:.012}));
  spine.add(part(new RoundedBoxGeometry(1.04,.23,.34,3,.08),s.hoodie,{pos:[0,1.16,-.14],ink:.012}));
  spine.add(part(new THREE.BoxGeometry(.012,.9,.012),s.hoodieDark,{pos:[0,.71,.267],ink:0}));
  if(s.species!=='fox'){
    const pocket=new THREE.Shape();pocket.absellipse(0,.33,.29,.15,0,Math.PI*2,false,0);spine.add(part(new THREE.ShapeGeometry(pocket,24),s.hoodieDark,{pos:[0,0,.278],ink:0}));
    for(const x of [-.12,.12])spine.add(part(new THREE.BoxGeometry(.014,.23,.014),0xf1e7d3,{pos:[x,1.05,.282],ink:0}));
  }else{
    for(const side of [-1,1]){spine.add(part(new THREE.BoxGeometry(.023,.88,.014),s.stripe,{pos:[side*.48,.65,.27],ink:0}));spine.add(part(new THREE.BoxGeometry(.018,.22,.014),s.stripe,{pos:[side*.25,.30,.27],rot:[0,0,-side*.65],ink:0}));}
  }

  // head (pivot at the neck)
  const head = grp(spine, 0, 1.2, 0, 'headGroup');
  const sp = HEADS[s.species](head, s);
  head.traverse(o=>{if(o.isMesh&&o.name!=='sculpted head')o.castShadow=false;});

  // Sleeves overlap at the joints; separate ball shoulders made the original rig look padded.
  const arm=(side)=>{
    const sh=grp(spine,side*.70,1.03,0,side<0?'leftArmGroup':'rightArmGroup');
    const upper=part(caps(.145,.28),s.hoodie,{pos:[0,-.25,0],scale:[1,1,.72],ink:.014});upper.name='upper sleeve';sh.add(upper);
    const el=grp(sh,0,-.5,0,'elbow');el.add(part(caps(.132,.19),s.hoodie,{pos:[0,-.205,0],scale:[1,1,.72],ink:.014}));
    el.add(part(new THREE.CylinderGeometry(.14,.14,.09,18),s.cuff,{pos:[0,-.40,0],scale:[1,1,.72],ink:.009}));
    el.add(part(SPHERE,s.hand,{scale:[.16,.175,.10],pos:[0,-.55,0],ink:.012}));
    if(s.species==='fox'){sh.add(part(new THREE.BoxGeometry(.02,.37,.012),0xd8d7d1,{pos:[side*.12,-.24,.11],ink:0}));el.add(part(new THREE.BoxGeometry(.018,.28,.012),0xd8d7d1,{pos:[side*.11,-.2,.1],ink:0}));}
    return {sh,el};
  };
  const armL=arm(-1),armR=arm(1);

  // Longer shins and thighs restore the proportions in the original lineup.
  const leg=(side)=>{
    const hip=new THREE.Bone();hip.name='hip';hip.position.x=side*.28;pelvis.add(hip);
    const knee=new THREE.Bone();knee.name='knee';knee.position.y=-LEG_UPPER;hip.add(knee);
    const foot=grp(knee,0,-LEG_LOWER,0,'foot');foot.add(part(SPHERE,s.leg,{scale:[.265,.105,.235],pos:[0,0,.085],ink:.012}));
    const buildGeometry=(extra=0)=>{
      const vertices=[],indices=[],skinIndex=[],skinWeight=[],rings=24,sides=16,total=LEG_UPPER+LEG_LOWER;
      for(let i=0;i<=rings;i++){const y=i/rings*total,r=.132-.022*(i/rings)+extra,blend=clamp((y-(LEG_UPPER-.14))/.28,0,1);
        for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;vertices.push(side*.28+Math.cos(a)*r,-y,Math.sin(a)*r*.76);skinIndex.push(0,1,0,0);skinWeight.push(1-blend,blend,0,0);if(i<rings&&j<sides){const v=i*(sides+1)+j;indices.push(v,v+1,v+sides+1,v+sides+1,v+1,v+sides+2);}}
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));geo.setIndex(indices);geo.computeVertexNormals();return geo;
    };
    root.updateMatrixWorld(true);const skeleton=new THREE.Skeleton([hip,knee]);
    for(const outlined of [false,true]){const m=new THREE.SkinnedMesh(buildGeometry(outlined?.012:0),outlined?INK:characterMaterial(s.leg));m.name=outlined?'leg outline':'continuous leg';m.castShadow=!outlined;m.receiveShadow=!outlined;m.frustumCulled=false;pelvis.add(m);root.updateMatrixWorld(true);m.bind(skeleton);}
    return {hip,knee,foot};
  };
  const legL = leg(-1), legR = leg(1);

  const tail = makeTail(pelvis, s.tail);

  // sweat drops (Pip's nervous pose, works for anyone)
  const sweat = grp(head, 0.8, HY + 0.3, 0.1, 'sweat');
  const drops = [0, 1, 2].map((i) => {
    const d = part(SPHERE, 0x6ec8ff, { scale: ell(0.06, 0.09, 0.05), ink: 0.008, rough: 0.2 });
    d.position.set(i * 0.1 - 0.05, 0, i * 0.05);
    sweat.add(d);
    return d;
  });

  buildingCharacter=false;
  return { root, pelvis, spine, head, armL, armR, legL, legR, tail, ...sp, sweat, drops, spec: s };
}

/* ------------------------------------------------------------------ cast (colours from lineup.png) */

const CAST = [
  { name: 'Bash', species: 'bear', size: [1.06, 1.02, 1], spd: 0.85, hopK: 0.8,
    fur: 0x8a5a36, muzzle: 0xcfa070, hoodie: 0xe51b2d, hoodieDark: 0xb30f1e, cuff: 0xb30f1e, hand: 0x8a5a36, leg: 0x8a5a36,
    tail: { segs: [{ r: 0.2, len: 0.01, color: 0x8a5a36 }], baseX: -1.2, curve: 0 } },
  { name: 'Pip', species: 'bunny', size: [.95,.98,1], spd: 1.25, hopK: 1.25,
    fur: 0xe7e2ee, earInner: 0xf6a0bd, hoodie: 0x3a6df0, hoodieDark: 0x2448b8, cuff: 0x2448b8, hand: 0xeae6f0, leg: 0xe7e2ee,
    tail: { segs: [{ r: 0.25, len: 0.01, color: 0xffffff }], baseX: -1.2, curve: 0 } },
  { name: 'Riot', species: 'fox', spd: 1.05, hopK: 1,
    fur: 0xff6a00, cream: 0xf7e3bd, earInner: 0x8f1228, glasses: 0xffd400,
    hoodie: 0x1c1c1f, hoodieDark: 0xff6a00, cuff: 0xff6a00, hand: 0xff6a00, leg: 0xff6a00, stripe: 0xff6a00,
    tail: { segs: [{ r: 0.2, color: 0xff6a00 }, { r: 0.27, color: 0xff6a00 }, { r: 0.33, color: 0xff6a00 }, { r: 0.33, color: 0xff6a00 }, { r: 0.27, len: 0.2, color: 0xf7e3bd }], baseX: -1.0, baseZ: -0.3, curve: 0.22 } },
  { name: 'Rocco', species: 'raccoon', spd: 1.0, hopK: 1,
    fur: 0x8d8f9c, mask: 0x2c2d38,
    hoodie: 0x23b573, hoodieDark: 0x188a56, cuff: 0x188a56, hand: 0x8d8f9c, leg: 0x8d8f9c,
    tail: { segs: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ r: 0.2 - i * 0.008, len: 0.26, color: i % 2 ? 0x34353f : 0x8d8f9c })), baseX: -0.9, baseZ: -0.35, curve: 0.2 } },
];

/* ------------------------------------------------------------------ pose + animation set */

const neutral = () => ({
  air: 0, lean: 0, sway: 0, turn: 0, shift: 0,
  torsoX: 0, torsoY: 0, torsoZ: 0, headX: 0, headY: 0, headZ: 0,
  aLo: 0.12, aLf: 0, aLb: 0, aLw: 0, aRo: 0.12, aRf: 0, aRb: 0, aRw: 0,
  lLf: 0, lLk: 0, lRf: 0, lRk: 0,
  earL: 0, earR: 0, earX: 0, tailWag: 0.25, tailSpd: 2, tailLift: 0,
  mouth: 0, smile: 1, brow: 0, browY: 0, squint: 0, lids: 0, sweat: 0, lookX: 0, lookY: 0,
});
const POSE_KEYS = Object.keys(neutral());

/* Each animation writes target values into `p` for time t (seconds of animation time).
   Arm keys: o = outward swing, f = forward swing, b = elbow bend forward, w = elbow fold sideways.
   Leg keys: f = thigh forward, k = knee bend. The pelvis is lowered to keep the feet on the floor. */
const ANIMS = {
  idle(t, p) {
    const b = S(t * 1.9);
    p.torsoX = 0.025 * b; p.headX = -0.03 * b + 0.02 * S(t * 0.6); p.headY = 0.18 * S(t * 0.45); p.headZ = 0.04 * S(t * 0.8 + 1);
    p.aLo += 0.03 * b; p.aRo += 0.03 * b; p.aLf = 0.05 * b; p.aRf = -0.05 * b;
    p.lLf = p.lRf = 0.04 + 0.03 * b; p.lLk = p.lRk = 0.08 + 0.06 * b;
    p.earL = 0.04 * S(t * 1.1); p.earR = 0.04 * S(t * 1.4 + 1);
    p.tailWag = 0.3; p.tailSpd = 2.2;
  },

  wave(t, p) {
    ANIMS.idle(t, p);
    p.aRo = 1.9; p.aRf = 0.05; p.aRw = 1.0 + 0.45 * S(t * 9);
    p.headZ = -0.1; p.headY = 0.2; p.torsoZ = -0.04;
    p.mouth = 0.5; p.brow = -0.2; p.browY = 0.02; p.tailWag = 0.5; p.tailSpd = 6;
    p.earL = 0.1 * S(t * 9); p.earR = 0.1 * S(t * 9 + 1);
  },

  cheer(t, p, c) {
    const u = S(t * 6.5), crouch = Math.max(0, -u), up = Math.max(0, u);
    p.aLo = p.aRo = 2.55 + 0.15 * S(t * 13); p.aLw = p.aRw = 0.3 + 0.2 * u;
    p.torsoX = -0.12 * up + 0.2 * crouch; p.headX = -0.2 * up;
    p.lLf = p.lRf = 0.7 * crouch + 0.25 * up; p.lLk = p.lRk = 1.2 * crouch + 0.6 * up;
    p.air = 0.45 * up * c.hopK;
    p.mouth = 0.9; p.brow = -0.4; p.browY = 0.03; p.squint = 0.25;
    p.earL = p.earR = 0.3 * up - 0.2 * crouch; p.earX = 0.2 * up;
    p.tailWag = 0.6; p.tailSpd = 10;
  },

  laugh(t, p) {
    const k = S(t * 14);
    p.torsoX = 0.25 + 0.07 * k; p.headX = -0.35 + 0.1 * k;
    p.aLo = -0.5; p.aLf = 1.0; p.aLb = 1.4;                      // L hand holds the belly
    p.aRo = 0.5 + 0.15 * k; p.aRf = 0.4;
    p.lLf = p.lRf = 0.15 + 0.05 * k; p.lLk = p.lRk = 0.3;
    p.mouth = 0.75 + 0.25 * S(t * 14 + 0.5); p.brow = -0.35; p.squint = 0.85;
    p.torsoZ = 0.04 * k; p.tailWag = 0.8; p.tailSpd = 14; p.earL = p.earR = 0.1 * k;
  },

  nervous(t, p) {
    ANIMS.idle(t, p);
    p.torsoX = 0.12; p.headX = 0.1; p.headY = 0.5 * S(t * 2.5);
    p.aLo = 0.15; p.aRo = 0.15; p.aLf = p.aRf = 0.9;
    p.aLb = 1.7 + 0.2 * S(t * 10); p.aRb = 1.7 + 0.2 * S(t * 10 + 2);
    p.lLf = 0.12 + 0.1 * S(t * 14); p.lRf = 0.12 + 0.1 * S(t * 14 + Math.PI);
    p.lLk = p.lRk = 0.25;
    p.brow = -0.55; p.browY = 0.03; p.smile = -0.4; p.mouth = 0.12 + 0.1 * S(t * 13);
    p.sweat = 1; p.lookX = S(t * 2.5); p.earX = -0.6; p.earL = p.earR = 0.4;
    p.tailWag = 0.2; p.tailSpd = 20;
  },

  shrug(t, p) {
    ANIMS.idle(t, p);
    const k = sat(1.5 * S(t * 1.7) + 0.5);
    p.aLo = lerp(0.12, 0.5, k); p.aRo = lerp(0.12, 0.5, k);
    p.aLf = p.aRf = 0.2 * k; p.aLb = p.aRb = 0.9 * k; p.aLw = p.aRw = 0.9 * k;
    p.headZ = 0.2 * k; p.headY = 0; p.smile = lerp(1, -0.6, k); p.brow = -0.3 * k; p.browY = 0.04 * k;
    p.torsoZ = 0.03 * k; p.lookY = 0.3 * k;
  },

  facepalm(t, p) {
    ANIMS.idle(t, p);
    const k = sat(1.4 * S(t * 1.2) + 0.6);
    p.aRo = lerp(0.12, -0.85, k); p.aRf = lerp(0, 1.35, k); p.aRb = lerp(0, 1.55, k);
    p.torsoX = 0.2 * k + 0.02 * S(t * 0.8); p.headX = 0.35 * k; p.headZ = -0.08 * k;
    p.smile = lerp(1, -1, k); p.brow = 0.4 * k; p.squint = 0.6 * k;
  },

  point(t, p) {
    ANIMS.idle(t, p);
    const k = sat(1.6 * S(t * 1.4) + 0.6);
    p.aRo = lerp(0.12, 0.45, k); p.aRf = lerp(0, 1.45, k) + 0.05 * S(t * 6) * k; p.aRb = 0.05 * k;
    p.aLo = lerp(0.12, 0.7, k); p.aLw = -1.1 * k;                // L hand on hip
    p.headY = 0.3 * k; p.torsoY = 0.2 * k; p.mouth = 0.3 * k; p.browY = 0.02 * k;
  },

  hop(t, p, c) {
    const u = S(t * 5.5), crouch = Math.max(0, -u), up = Math.max(0, u);
    p.aLo = p.aRo = 0.5 + 0.3 * up; p.aLf = p.aRf = 0.5 * up; p.aLb = p.aRb = 0.6;
    p.lLf = p.lRf = 0.55 * crouch + 0.2 * up; p.lLk = p.lRk = 1.0 * crouch + 0.5 * up;
    p.air = 0.4 * up * c.hopK;
    p.torsoX = 0.1 * crouch - 0.05 * up; p.mouth = 0.35; p.brow = -0.15;
    p.earL = p.earR = 0.25 * up; p.earX = 0.15 * up; p.tailWag = 0.5; p.tailSpd = 8;
  },

  // --- acting poses used by scripted scenes ---
  sleep(t, p) {                                   // standing slumped, eyes shut
    const b = S(t * 1.1);
    p.torsoX = 0.3 + 0.03 * b; p.headX = 0.5 + 0.04 * b; p.headZ = 0.12; p.torsoZ = 0.04 * S(t * 0.5);
    p.lids = 1; p.smile = 0.4; p.mouth = 0.05 + 0.04 * b; p.brow = -0.2;
    p.aLo = p.aRo = 0.1; p.aLf = p.aRf = 0.1; p.aLb = p.aRb = 0.2;
    p.lLf = p.lRf = 0.08; p.lLk = p.lRk = 0.14;
    p.earL = p.earR = 0.25; p.earX = -0.25; p.tailWag = 0.1; p.tailSpd = 1;
  },

  present(t, p) {                                 // both arms open, "ta-da"
    ANIMS.idle(t, p);
    p.aLo = p.aRo = 0.9 + 0.1 * S(t * 3); p.aLf = p.aRf = 0.55; p.aLb = p.aRb = 0.5; p.aLw = p.aRw = 0.35;
    p.headX = -0.12; p.torsoX = -0.04; p.mouth = 0.45; p.brow = -0.2; p.browY = 0.02;
    p.air = 0.05 * Math.max(0, S(t * 5)); p.tailWag = 0.6; p.tailSpd = 7;
  },

  yellpoint(t, p) {                               // yelling, jabbing a finger forward
    const k = S(t * 8);
    p.aRo = 0.35; p.aRf = 1.5 + 0.05 * k; p.aRb = 0.05; p.aLo = 0.3; p.aLf = 0.3; p.aLb = 1.4;
    p.torsoX = 0.14; p.headX = -0.05; p.headY = 0.1; p.brow = 0.6; p.mouth = 0.7; p.smile = -0.2;
    p.lLf = 0.15; p.lRf = 0.15 + 0.15 * Math.max(0, S(t * 5)); p.lLk = p.lRk = 0.2;
    p.tailWag = 0.5; p.tailSpd = 9;
  },

  yell(t, p) {                                    // two fists up, shouting
    const k = S(t * 9);
    p.aLo = p.aRo = 0.45; p.aLf = p.aRf = 0.6; p.aLb = p.aRb = 1.5;
    p.torsoX = 0.16 + 0.04 * k; p.headX = -0.12; p.brow = 0.6; p.mouth = 0.8; p.smile = -0.2;
    p.air = 0.04 * Math.max(0, k); p.lLf = p.lRf = 0.12; p.lLk = p.lRk = 0.2;
    p.tailWag = 0.5; p.tailSpd = 10;
  },

  cocky(t, p) {                                   // hands on hips, chin up
    ANIMS.idle(t, p);
    p.aLo = p.aRo = 0.75; p.aLw = p.aRw = -1.15;
    p.headX = -0.1; p.headZ = 0.1; p.torsoX = -0.05; p.browY = 0.03; p.brow = 0.15;
    p.tailWag = 0.5; p.tailSpd = 4;
  },

  walk(t, p) {
    const ph = t * 5.5, s = S(ph);
    p.lLf = 0.55 * s; p.lRf = -0.55 * s;
    p.lLk = 0.15 + 0.7 * Math.max(0, S(ph + 1.6)); p.lRk = 0.15 + 0.7 * Math.max(0, S(ph + 1.6 + Math.PI));
    p.aLf = -0.45 * s; p.aRf = 0.45 * s; p.aLb = 0.25; p.aRb = 0.25;
    p.torsoY = 0.1 * s; p.turn = -0.05 * s; p.sway = 0.03 * C(ph * 2); p.torsoX = 0.04;
    p.headY = -0.05 * s; p.headX = 0.02 * C(ph * 2);
    p.mouth = 0.1; p.tailWag = 0.35; p.tailSpd = 5;
    p.earL = 0.15 * C(ph * 2); p.earR = 0.15 * C(ph * 2 + 0.6);
  },
};

// left-handed version of any pose (swap the L/R keys, flip the sideways ones)
const MIRROR_PAIRS = [['aLo', 'aRo'], ['aLf', 'aRf'], ['aLb', 'aRb'], ['aLw', 'aRw'], ['lLf', 'lRf'], ['lLk', 'lRk'], ['earL', 'earR']];
const MIRROR_NEG = ['torsoZ', 'torsoY', 'headY', 'headZ', 'turn', 'sway', 'lookX'];
ANIMS.waveL = (t, p) => {
  ANIMS.wave(t, p);
  for (const [a, b] of MIRROR_PAIRS) { const x = p[a]; p[a] = p[b]; p[b] = x; }
  for (const k of MIRROR_NEG) p[k] = -p[k];
};

/* ------------------------------------------------------------------ apply a pose to a rig */

function applyPose(r, p, T, blink) {
  const g = (a, k) => LEG_UPPER * C(a) + LEG_LOWER * C(k - a);              // foot depth below hip
  r.pelvis.position.set(p.shift, FOOT_CLEARANCE + Math.max(g(p.lLf, p.lLk), g(p.lRf, p.lRk)) + p.air, 0);
  r.pelvis.rotation.set(p.lean, p.turn, p.sway);
  r.spine.rotation.set(p.torsoX, p.torsoY, p.torsoZ);
  r.head.rotation.set(p.headX, p.headY, p.headZ);

  r.armL.sh.rotation.set(-p.aLf, 0, -p.aLo); r.armL.el.rotation.set(-p.aLb, 0, -p.aLw);
  r.armR.sh.rotation.set(-p.aRf, 0, p.aRo);  r.armR.el.rotation.set(-p.aRb, 0, p.aRw);

  for (const [leg, f, k] of [[r.legL, p.lLf, p.lLk], [r.legR, p.lRf, p.lRk]]) {
    leg.hip.rotation.x = -f; leg.knee.rotation.x = k; leg.foot.rotation.x = f - k;
  }

  for (const e of r.ears) {
    const side = e.userData.side, extra = side < 0 ? p.earL : p.earR;
    e.rotation.set(r.earBaseX + p.earX, 0, -side * (r.earBase + (e.userData.splay||0) + extra));
  }

  const face = r.face, fr = face.f.r;
  face.eyes.forEach((e) => { e.scale.y = Math.max(0.06, 1 - blink - p.squint * 0.7 - p.lids); });
  face.pupils.forEach((pu) => pu.position.set(p.lookX * 0.35 * fr, p.lookY * 0.3 * fr, fr * 0.19));
  face.brows.forEach((b) => {
    b.rotation.z = b.userData.side * (face.f.browBase + p.brow);
    b.position.y = b.userData.y0 + p.browY;
  });
  const m = face.mouth, open = clamp(p.mouth + m.base, 0, 1.2);
  m.open.scale.y = 0.012 + open * 0.15 * m.mh;
  m.open.visible = open > 0.04;
  m.smile.visible = open < 0.2;
  m.smile.scale.y = p.smile*.55;

  r.sweat.visible = p.sweat > 0.05;
  if (r.sweat.visible) {
    r.drops.forEach((d, i) => {
      const f = (T * 0.9 + i / 3) % 1;
      const k = p.sweat * (1 - f * f * f) + 0.001;
      d.position.y = -f * 0.7; d.scale.set(0.06 * k, 0.09 * k, 0.05 * k);
    });
  }

  const tl = r.tail.chain;
  tl.forEach((seg, j) => {
    seg.rotation.z = (j === 0 ? r.tail.baseZ : 0) + p.tailWag * (j === 0 ? 1 : 0.5) * S(T * p.tailSpd - j * 0.55);
    seg.rotation.x = j === 0 ? r.tail.baseX + p.tailLift : r.tail.curve;
  });
}


export {headShape,S,C,clamp,lerp,sat,INK,SPHERE,std,part,grp,ell,caps,makeCharacter,CAST,ANIMS,neutral,POSE_KEYS,applyPose};
