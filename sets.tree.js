// Full 3D first-six-episode set collection. Serve the project root and open sets.html.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {SETS,EPISODES,resolveSet} from './art/three/sets/catalog.js';
import {buildSet,disposeSet} from './art/three/sets/build.js';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const viewport=$('viewport');
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});}
catch(error){$('loading').textContent='3D needs WebGL. Enable graphics acceleration in your browser and reload.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewport.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Orbitable modeled set');renderer.domElement.tabIndex=0;
const scene=new THREE.Scene();const fill=new THREE.AmbientLight(0xffffff,.35);scene.add(fill);const camera=new THREE.PerspectiveCamera(42,1,.1,250);camera.name='review_camera';
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=100;
const hemi=new THREE.HemisphereLight(0xfff1d9,0x718266,2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe4b8,3);sun.position.set(-8,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;
Object.assign(sun.shadow.camera,{left:-25,right:25,bottom:-25,top:25,near:1,far:80});scene.add(sun);
let current=null,root=null,stageMarks=false,doorsOpen=false,practicalsOn=true,view='wide';
function status(message){$('status').textContent=message;}
function setView(name) {
  if(!root)return;view=name;const c=root.userData.cameras;
  // Update once before setting the target to clear any pending orbit inertia.
  controls.enableDamping=false;controls.update();camera.position.fromArray(c[name]||c.wide);
  controls.target.fromArray(c[name+'Target']||(name==='detail'?(c.detailTarget||c.target):c.target));camera.lookAt(controls.target);controls.update();controls.enableDamping=true;
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
}
function updateMarks(){root?.traverse(o=>{if(o.userData.marker)o.visible=stageMarks;});$('anchors').setAttribute('aria-pressed',String(stageMarks));}
function lighting(spec) {
  const night=spec.mood==='night',storm=spec.mood==='storm',warm=['sunset','evening'].includes(spec.mood);
  const skies={day:0xb9dfdf,sunset:0xe7b578,evening:0xc5b297,night:0x1d3553,storm:0x344752};
  fill.intensity=storm?.12:night?.55:.3;
  scene.background=new THREE.Color(skies[spec.mood]);scene.fog=new THREE.Fog(skies[spec.mood],spec.build==='lake'?95:65,spec.build==='lake'?360:145);
  hemi.color.set(storm?0x8faeca:night?0xa9c7e3:0xfff1dc);hemi.groundColor.set(night||storm?0x425467:0x83926b);hemi.intensity=storm?.6:night?.75:1.8;
  sun.color.set(night||storm?0x9cbcd9:warm?0xffc580:0xffedd0);sun.intensity=storm?.55:night?.85:warm?2.1:2.7;
  if(['apartment','bash_home','pip_home','hall'].includes(spec.id)){hemi.intensity=1.15;sun.intensity=1.2;}
  sun.position.set(warm?-14:-8,warm?12:18,12);renderer.toneMappingExposure=1.05;
}
function selectSet(value,{push=true}={}) {
  const spec=typeof value==='string'?resolveSet(value):value;if(!spec)throw new Error(`Set not found: ${value}`);
  $('loading').hidden=false;disposeSet(root);current=spec;doorsOpen=false;practicalsOn=true;
  root=buildSet(spec);scene.add(root);lighting(spec);camera.far=root.userData.lakeWorld?900:250;camera.updateProjectionMatrix();controls.maxDistance=root.userData.lakeWorld?180:100;document.querySelectorAll('[data-lake-view]').forEach(b=>b.hidden=!root.userData.lakeWorld);setView('wide');updateMarks();
  $('label').textContent=spec.name;$('mood').textContent=spec.mood;$('note').textContent=spec.note;
  $('episode-tags').textContent=`EPISODE${spec.episodes.length>1?'S':''} ${spec.episodes.map(n=>String(n).padStart(2,'0')).join(' / ')}`;
  $('set-number').textContent=String(SETS.indexOf(spec)+1).padStart(2,'0');
  $('reference-image').src=spec.reference;$('reference-image').alt=`Original reference painting for ${spec.name}`;
  $('reference-link').href=spec.reference;$('reference-note').textContent=spec.reference;
  let hasDoor=false,hasLight=false,meshCount=0;
  root.traverse(o=>{if(o.userData.interactive==='door')hasDoor=true;if(o.userData.practical){hasLight=true;o.userData.onIntensity=o.intensity||24;}if(o.isMesh)meshCount++;});
  $('door').hidden=!hasDoor;$('door').textContent='Open door';$('door').setAttribute('aria-pressed','false');
  $('lights').hidden=!hasLight;practicalsOn=false;root.traverse(o=>{if(o.userData.practical&&o.intensity>0)practicalsOn=true;});$('lights').setAttribute('aria-pressed',String(practicalsOn));
  document.querySelectorAll('#list button').forEach(b=>{b.classList.toggle('on',b.dataset.id===spec.id);b.setAttribute('aria-current',b.dataset.id===spec.id?'true':'false');});
  status(`${meshCount} modeled objects · ${root.userData.anchors.length} stage marks · Metres · Hidden sides inferred from the painting`);
  if(push){const u=new URL(location.href);u.searchParams.set('set',spec.id);history.replaceState({},'',u);}
  $('loading').hidden=true;return spec;
}
function renderList() {
  const ep=$('episode').value,query=$('search').value.toLowerCase().trim();
  const entries=SETS.filter(s=>(ep==='all'||EPISODES.find(e=>e.number===Number(ep)).sets.includes(s.id))&&`${s.name} ${s.id}`.toLowerCase().includes(query));
  $('list').replaceChildren();for(const s of entries){
    const b=document.createElement('button');b.dataset.id=s.id;b.classList.toggle('on',current?.id===s.id);b.setAttribute('aria-current',current?.id===s.id?'true':'false');
    const index=document.createElement('span');index.className='index';index.textContent=String(SETS.indexOf(s)+1).padStart(2,'0');
    const name=document.createElement('span');name.textContent=s.name;const small=document.createElement('small');small.textContent=`EP ${s.episodes.map(n=>String(n).padStart(2,'0')).join(' · ')}`;name.append(small);b.append(index,name);
    b.onclick=()=>{selectSet(s);document.body.classList.remove('menu-open');$('menu').setAttribute('aria-expanded','false');};$('list').append(b);
  }
  $('count').textContent=entries.length?`${entries.length} set${entries.length===1?'':'s'} in this view`:'No matching sets';
  return entries;
}
for(const ep of EPISODES){const o=document.createElement('option');o.value=ep.number;o.textContent=`${String(ep.number).padStart(2,'0')} · ${ep.title}`;$('episode').append(o);}
$('episode').onchange=()=>{const entries=renderList();if(entries.length&&!entries.includes(current))selectSet(entries[0]);};$('search').oninput=renderList;
function compare(on){$('reference').hidden=!on;$('workspace').classList.toggle('compare',on);$('compare').setAttribute('aria-pressed',String(on));}
$('compare').onclick=()=>compare($('reference').hidden);
$('anchors').onclick=()=>{stageMarks=!stageMarks;updateMarks();};
$('door').onclick=()=>{doorsOpen=!doorsOpen;root.traverse(o=>{if(o.userData.interactive==='door')o.rotation.y=doorsOpen?-Math.PI*.58:0;});$('door').textContent=doorsOpen?'Close door':'Open door';$('door').setAttribute('aria-pressed',String(doorsOpen));};
$('lights').onclick=()=>{practicalsOn=!practicalsOn;root.traverse(o=>{if(o.userData.practical)o.intensity=practicalsOn?o.userData.onIntensity:0;});$('lights').setAttribute('aria-pressed',String(practicalsOn));};
$('menu').onclick=()=>{const on=document.body.classList.toggle('menu-open');$('menu').setAttribute('aria-expanded',String(on));};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('snapshot').onclick=()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob)download(blob,`${current.id}-${view}.png`);else status('PNG save failed. Please try again.');},'image/png');};
async function exportGLB() {
  // Export editable mesh geometry, named groups, practical lights, anchors, and the review camera.
  const output=new THREE.Scene();output.name=current.name;output.userData={...root.userData};const copy=root.clone(true);
  const remove=[];copy.traverse(o=>{if(o.isLineSegments||o.userData.marker)remove.push(o);});remove.forEach(o=>o.removeFromParent());
  output.add(copy);output.add(camera.clone());const key=sun.clone();key.castShadow=false;output.add(key);
  const result=await new GLTFExporter().parseAsync(output,{binary:true,onlyVisible:true,trs:true});return result;
}
$('export').onclick=async()=>{const button=$('export');button.disabled=true;status('Packing editable geometry and textures…');const id=current.id;
  try{const result=await exportGLB();download(new Blob([result],{type:'model/gltf-binary'}),`${id}.glb`);status(`Saved ${id}.glb — import in Blender with File → Import → glTF 2.0.`);}
  catch(error){status(`Export failed: ${error.message}`);console.error(error);}finally{button.disabled=false;}
};
new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(42)/2)*Math.max(1,1.25/camera.aspect)));camera.updateProjectionMatrix();renderPending=true;}).observe(viewport);
$('reference-image').onerror=()=>status(`Reference painting could not load: ${current.reference}`);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status('Graphics context lost. Reload to restore the set.');});
let renderPending=true;
// Static sets only redraw while the camera changes, when controls are used, or after UI/asset updates.
controls.addEventListener('change',()=>{renderPending=true;});
const observer=new MutationObserver(()=>{renderPending=true;});observer.observe($('main'),{subtree:true,attributes:true,childList:true,characterData:true});
THREE.DefaultLoadingManager.onLoad=()=>{renderPending=true;};
renderer.setAnimationLoop(()=>{controls.update();if(renderPending){renderer.render(scene,camera);renderPending=false;}});
const initial=resolveSet(params.get('set'));renderList();selectSet(initial||SETS[0],{push:!!params.get('set')});
if(!initial)status('Unknown set link — showing the summer lake. Choose any set from the collection.');
if(params.get('compare')==='1')compare(true);if(params.get('view'))setView(params.get('view'));
// Narrow automation interface for deterministic screenshots and asset-pack verification.
window.porchlightSets={catalog:SETS,episodes:EPISODES,select:id=>{selectSet(id);renderPending=true;},setView:name=>{setView(name);renderPending=true;},compare,exportGLB,get root(){return root;},get camera(){return camera;},get renderer(){return renderer;},get scene(){return scene;}};
