import * as THREE from 'three';
import {surfaceHeight} from '../../sets/lake-world/landscape.js';
import {vertex,fragment,screenVertex,screenFragment} from './shaders.js';
import {referenceColor,remapInstance,PALETTE} from './palette.js';
import {drawnFir,drawnBroadleaf,brushTexture} from './shapes.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const WHITE=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);WHITE.needsUpdate=true;
export function createIllustratedLook({scene,renderer,actors={},modeled={},width=1920,height=1080}){
 renderer.toneMapping=THREE.NoToneMapping;renderer.shadowMap.enabled=false;
 const materials=[],groupIds=new Map(),geometryCache=new Map(),spriteObjects=[],internalLines=[],accents=[],instanceIds=new Map(),bases=new Map();let nextId=1;
 const actorSet=new Set(Object.values(actors).map(a=>a.root));
 const idFor=key=>{if(!groupIds.has(key))groupIds.set(key,nextId++);return groupIds.get(key);};
 const ancestor=(o,predicate)=>{let p=o;while(p&&p!==scene){if(predicate(p))return p;p=p.parent;}return null;};
 const tag=o=>{const actor=ancestor(o,p=>actorSet.has(p));if(actor)return {key:actor.uuid,actor:true};const group=ancestor(o,p=>p.isGroup&&/cloud|sofa|beanbag|coffee table|wood table|cottage|home|church|snack shack|apartment|lookout|old festival hall|bicycle|bench|potted plant|door|window/.test(p.name.toLowerCase()));return {key:group?.uuid||o.uuid,actor:false};};
 const all=[];scene.traverse(o=>all.push(o));
 // Add a small set of structural lines. Their line width stays in screen pixels.
 for(const o of all){if(o.name==='summer cloud'||o.name==='storm cloud')o.position.y*=.66;if(o.name==='moon')o.position.y*=.52;if(o.name==='star')o.position.y*=.55;if(o.isSprite){spriteObjects.push(o);continue;}if(o.isLineSegments){o.visible=false;continue;}if(!o.isMesh)continue;if(/outline|fine outer head contour/.test(o.name)){o.visible=false;continue;}
  if(/^(tabletop|sofa cushion|door panel|window frame|floating shelf|gable roof|modeled gable roof|drawer front|picture frame)$/.test(o.name)){
   const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,60),new THREE.LineBasicMaterial({color:PALETTE.ink,transparent:true,opacity:.55,depthWrite:false}));edge.name='selected drawn structure line';edge.renderOrder=4;o.add(edge);internalLines.push(edge);
  }
 }
 for(const r of Object.values(actors)){
  bases.set(r,{head:r.head.scale.clone(),spine:r.spine.scale.clone()});
  for(const eye of r.face.eyes){const ring=new THREE.Mesh(new THREE.TorusGeometry(r.face.f.r, .007, 5, 40),new THREE.MeshBasicMaterial({color:PALETTE.ink}));ring.scale.y=1.08;ring.position.z=.034;ring.name='drawn eye contour';eye.add(ring);all.push(ring);}
  const g=new THREE.Group();g.name='rigged motion accents';r.hands.R.wrist.add(g);for(let i=0;i<3;i++){const pts=[V(.20+i*.08,-.13,.10),V(.26+i*.08,-.03,.10),V(.22+i*.08,.08,.10)],m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),8,.010,4,false),new THREE.MeshBasicMaterial({color:PALETTE.ink,transparent:true,opacity:.65}));m.name='drawn motion stroke';g.add(m);all.push(m);}const smearShape=new THREE.Shape();smearShape.moveTo(.08,-.12);smearShape.quadraticCurveTo(.45,-.28,.62,.08);smearShape.quadraticCurveTo(.26,.01,.08,-.12);const smear=new THREE.Mesh(new THREE.ShapeGeometry(smearShape),new THREE.MeshBasicMaterial({color:r.spec.hand,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));smear.name='drawn motion smear';smear.position.z=-.025;g.add(smear);all.push(smear);g.visible=false;accents.push({g,r,smear});
 }
 // Geometry stays volumetric; the revised contour supplies the illustrated silhouette.
 const fir=drawnFir(),broad=drawnBroadleaf();
 for(const o of all){if(!o.isMesh||/outline|fine outer head contour/.test(o.name))continue;
  const name=o.name.toLowerCase(),info=tag(o),actor=info.actor;
  const face=actor&&!!ancestor(o,p=>p.name==='headGroup')&&o.name!=='sculpted head';
  const tree=o.isInstancedMesh&&/canop|forest trunks/.test(name),kind=/fir canop/.test(name)?'fir':/broadleaf canop/.test(name)?'leaf':null;
  if(kind==='fir')o.geometry=fir;if(kind==='leaf')o.geometry=broad;
  if(/cloud puff/.test(name)){o.geometry=broad;o.scale.y*=.86;}
  if(tree){const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);matrix.decompose(p,q,s);const distance=Math.hypot(p.x+2,p.z+13),f=1-.36*THREE.MathUtils.smoothstep(distance,22,85),ground=surfaceHeight(p.x,p.z);p.y=ground+(p.y-ground)*f;s.multiplyScalar(f);matrix.compose(p,q,s);o.setMatrixAt(i,matrix);}o.instanceMatrix.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();}
  if(o.instanceColor&&kind)for(let i=0;i<o.count;i++){const c=new THREE.Color();o.getColorAt(i,c);o.setColorAt(i,remapInstance(c,kind));}
  if(/continuous.*terrain/.test(name)&&o.geometry.attributes.color){const colors=o.geometry.attributes.color;for(let i=0;i<colors.count;i++){const c=new THREE.Color().fromBufferAttribute(colors,i);const isGrass=c.g>c.r*.94&&c.g>c.b*1.1;c.copy(new THREE.Color(isGrass?PALETTE.grass:PALETTE.sand));colors.setXYZ(i,c.r,c.g,c.b);}colors.needsUpdate=true;}
  if(o.name==='soft contact shadow'){
   const original=o.geometry.parameters;if(original.width&&original.height){o.geometry=new THREE.CircleGeometry(1,40);o.scale.set(original.width*.45,original.height*.45,1);}
   o.material.map=null;o.material.color.set('#79573e');o.material.opacity=.14;
  }
  const original=Array.isArray(o.material)?o.material[0]:o.material;if(!original?.color)continue;
  const color=referenceColor(o,original.color,{actor,face}),isWater=/curved lake water|lake water/.test(name),flat=face||/notebook page|clipboard paper|die face|mouth|eye|pupil|brow|nose|patch|glasses|smile|teeth|tongue|drawn |emblem|glass|star|moon|bulb|whistle|cloth top|surface glint|water reflection|contact shadow/.test(name);
  const distant=tree||/ridge|forest hill/.test(name),land=/continuous.*terrain|damp shoreline|path|lane|approach|floor slab/.test(name);
  const ownId=idFor(info.key),geoKey=o.geometry.uuid+'/'+ownId+(o.isInstancedMesh?'/'+o.uuid:'');
  if(!geometryCache.has(geoKey)){
   const geo=o.geometry.clone();
   if(o.isInstancedMesh){const ids=new Float32Array(o.count),m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.decompose(p,q,s);const root=ancestor(o,p=>p.userData?.lakeWorld),key=(root?.uuid||o.parent.uuid)+'/'+Math.round(p.x*100)+'/'+Math.round(p.z*100);if(tree){if(!instanceIds.has(key))instanceIds.set(key,idFor(key));ids[i]=instanceIds.get(key);}else ids[i]=idFor(o.uuid+'/'+i);}geo.setAttribute('illustratedId',new THREE.InstancedBufferAttribute(ids,1));}
   else{const ids=new Float32Array(geo.attributes.position.count);ids.fill(ownId);geo.setAttribute('illustratedId',new THREE.BufferAttribute(ids,1));}geometryCache.set(geoKey,geo);
  }
  o.geometry=geometryCache.get(geoKey);
  let map=null,mapMix=0;
  const preserveMap=original.map&&(/wall art|notice|photo|label|die face|notebook page|clipboard paper/.test(name));
  if(preserveMap){map=original.map;mapMix=1;}
  else if(original.transparent&&original.map&&/pool|halo|wake/.test(name)){map=original.map;mapMix=1;}
  else if(!actor&&!flat){map=brushTexture(/wood|plank|table|floor|shelf|roof|door/.test(name)?'wood':'paint');mapMix=1;}
  if(o.instanceColor)color.set(0xffffff);
  const shadow=color.clone().lerp(new THREE.Color(actor?'#474654':'#596449'),actor?.16:.15);
  const uniform={uFill:{value:color},uShadow:{value:shadow},uPass:{value:0},uKind:{value:/painted color patch|leaf midrib|cloth fold|surface glint|water reflection|contact shadow|duck wake|^star$/.test(name)?0:actor?1:isWater?.70:land?.12:distant?.18:.42},uNormalControl:{value:actor?(face?1:o.name==='sculpted head'?.82:0):kind?.65:0},uShade:{value:flat||land||isWater?0:1},uOpacity:{value:original.opacity},uMap:{value:map||WHITE},uMapMix:{value:mapMix},uTint:{value:new THREE.Color(0xffffff)},uDistant:{value:new THREE.Color('#9bb8a3')},uFarFade:{value:distant?.66:0},uPool:{value:V(0,-1000,0)},uPoolPower:{value:1000},uEmission:{value:/distant flashlight|star|moon|bulb|fairy light/.test(name)?1:0},uTime:{value:0},uStage:{value:V(-2,0,-13)},uLight:{value:V(-.5,.8,.7).normalize()}};
  const m=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:uniform,transparent:original.transparent,opacity:original.opacity,side:original.side,depthWrite:original.depthWrite,depthTest:original.depthTest,vertexColors:!!o.geometry.attributes.color,toneMapped:false});
  m.name='illustrated / '+o.name;m.color=uniform.uFill.value;m.emissive=original.emissive?.clone()||new THREE.Color(0);m.emissiveIntensity=original.emissiveIntensity||0;m.roughness=1;m.metalness=0;m.userData={illustrated:true,flatFace:face,actor};o.material=m;o.castShadow=false;o.receiveShadow=false;materials.push(m);
 }
 const colorTarget=new THREE.WebGLRenderTarget(width,height,{samples:4});colorTarget.texture.colorSpace=THREE.SRGBColorSpace;
 const idTarget=new THREE.WebGLRenderTarget(width,height,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
 const screenScene=new THREE.Scene(),screenCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),post=new THREE.ShaderMaterial({vertexShader:screenVertex,fragmentShader:screenFragment,uniforms:{colorBuffer:{value:colorTarget.texture},idBuffer:{value:idTarget.texture},resolution:{value:new THREE.Vector2(width,height)},ink:{value:new THREE.Color(PALETTE.ink)}},depthTest:false,depthWrite:false,toneMapped:false});screenScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));
 const audit={materials:materials.length,twoTone:true,screenSpaceInk:true,drawnFaces:true,matte:true,foliageInstances:instanceIds.size,weakPerspective:1.5,referencePalette:PALETTE,animationAccents:accents.length};
 function update(t,id,b,event,positioned){
  const night=id==='hall'||id.includes('night'),inside=['apartment','bash_home','pip_home','classroom','pip_garage'].includes(id),pool=id.startsWith('stoop')&&(id==='stoop_sunset'?t>=49.35:t<(b.lightOff??132.1));
  renderer.shadowMap.enabled=false;renderer.toneMapping=THREE.NoToneMapping;scene.fog=null;scene.background=new THREE.Color(id==='pip_garage'?'#2f434c':id==='pip_home'?'#30485a':id==='bash_home'?'#34495e':inside?'#d5b894':night?'#203d60':id==='hall_outside'||id.includes('sunset')?'#eac995':PALETTE.sky);
  for(const m of materials){const u=m.uniforms;u.uPass.value=0;u.uOpacity.value=m.opacity;u.uTime.value=t;if(/bulb/.test(m.name))u.uEmission.value=m.emissiveIntensity>0?1:0;u.uTint.value.setRGB(...(id==='pip_garage'?(b.lightOff!==undefined&&t>b.lightOff?[.16,.22,.28]:[.65,.76,.78]):id==='pip_home'?[.65,.73,.85]:id==='classroom'?[1,.99,.91]:id==='bash_home'?[.53,.66,.82]:inside?[1,.94,.82]:id==='hall'?[.18,.27,.34]:id==='hall_outside'?[.86,.78,.68]:night?[.38,.50,.68]:[1,.99,.95]));u.uDistant.value.set(night?'#345169':'#a5bb99');u.uStage.value.set(...(id==='hall_outside'?[0,0,2]:id==='bash_home'?[1.6,0,-2.7]:[-2,0,-13]));u.uPoolPower.value=pool?.16:1000;u.uPool.value.set(3.25,2.55,-.65);if(id==='apartment'){u.uPool.value.set(-2,1,-1.7);u.uPoolPower.value=.045;}if(id==='pip_home'){u.uPool.value.set(1.8,1.5,-2.7);u.uPoolPower.value=.18;}if(id==='classroom'){u.uPool.value.set(-3,2,0);u.uPoolPower.value=.045;}if(id==='brook_porch'){u.uPool.value.set(-1,1,0);u.uPoolPower.value=.035;}if(id==='bash_home'){u.uPool.value.set(2,1.5,-2.7);u.uPoolPower.value=.25;}if(id==='lake_night'&&b.id!=='intro'&&b.id!=='s02'){u.uPool.value.set(-.4,.5,1);u.uPoolPower.value=.055;}if(id==='hall_outside'){u.uPool.value.set(-3,1,4);u.uPoolPower.value=.025;}if(id==='hall'){u.uPool.value.set(Math.sin(t*1.4)*1.8,1.2,-.4+Math.cos(t)*.8);u.uPoolPower.value=.36;}}
  for(const {g,r,smear} of accents){const age=event?t-event.start:-1;smear.visible=!!event&&['wave','point'].includes(event.do)&&(age>.17&&age<.27||age>.61&&age<.71);g.visible=!!event&&event.who===r.spec.name.toLowerCase()&&['wave','point','fan','facepalm'].includes(event.do)&&Math.sin((t-event.start)*Math.PI*3)>.65;}
  for(const r of Object.values(actors)){
   const base=bases.get(r);r.head.scale.copy(base.head);r.spine.scale.copy(base.spine);if(!r.root.visible)continue;
   const yaw=Math.abs(r.head.rotation.y);r.head.scale.x*=1/Math.max(.93,Math.cos(yaw));
   const active=event?.who===r.spec.name.toLowerCase(),age=active?t-event.start:0;
   const bounce=0; // Volume-preserving follow-through is owned by animation/v3.r.spine.scale.y*=1+bounce;r.spine.scale.x*=1-bounce*.5;
  }
  scene.updateMatrixWorld(true);
 }
 function flattenCamera(camera,b,event,positioned){
  // Keep established exterior clearances where a longer lens would back into the forest.
  if(b.id==='intro'||b.id==='hill')return;
  let focus;if(event?.camera&&positioned[event.who])focus=positioned[event.who].head.localToWorld(V(0,.65,.35));else if(b.id==='hill')focus=V(13.4,5.2,-28);else if(b.id==='tower'||b.id==='rematch')focus=V(-3,2.2,-1.3);else if(b.location==='lake'||b.location==='lake_night')focus=V(0,2,-11);else if(b.location==='apartment')focus=V(-.35,1.5,-.65);else if(b.id==='ending')focus=V(3.25,2.55,-.65);else if(b.id==='cold')focus=V(0,1.2,-.5);else focus=V(2,1.4,-.1);
  const dir=camera.getWorldDirection(V()),distance=Math.max(2,focus.clone().sub(camera.position).dot(dir)),factor=1.5;camera.position.addScaledVector(dir,-distance*(factor-1));camera.fov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/factor)*180/Math.PI;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 }
 function render(camera){
  const size=renderer.getDrawingBufferSize(new THREE.Vector2());if(size.x!==colorTarget.width||size.y!==colorTarget.height){colorTarget.setSize(size.x,size.y);idTarget.setSize(size.x,size.y);post.uniforms.resolution.value.copy(size);}
  materials.forEach(m=>m.uniforms.uPass.value=0);renderer.setRenderTarget(colorTarget);renderer.render(scene,camera);
  const background=scene.background,clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),hidden=[...spriteObjects,...internalLines].map(o=>({o,visible:o.visible}));hidden.forEach(x=>x.o.visible=false);scene.background=null;renderer.setClearColor(0x000000,0);materials.forEach(m=>m.uniforms.uPass.value=1);renderer.setRenderTarget(idTarget);renderer.render(scene,camera);materials.forEach(m=>m.uniforms.uPass.value=0);scene.background=background;hidden.forEach(x=>x.o.visible=x.visible);renderer.setClearColor(clear,alpha);renderer.setRenderTarget(null);renderer.render(screenScene,screenCamera);
 }
 function resetActors(){for(const r of Object.values(actors)){const base=bases.get(r);r.head.scale.copy(base.head);r.spine.scale.copy(base.spine);}}
 return {update,resetActors,flattenCamera,render,audit,accents,materials,colorTarget,idTarget,dispose(){colorTarget.dispose();idTarget.dispose();post.dispose();}};
}
