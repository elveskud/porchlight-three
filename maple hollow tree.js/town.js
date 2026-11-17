import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {buildTown} from './world.js';
import {SCALE,ROADS,DISTRICTS,ring,CREEK_IN,CREEK_OUT,PEAKS} from './geography.js';
import {createNetwork} from './routes.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const plan=await fetch('./plan.json').then(r=>{if(!r.ok)throw Error('Town plan could not load');return r.json();});
const map=$('map');let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch(error){$('loading').textContent='Enable graphics acceleration in your browser to view Maple Hollow.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;map.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive Maple Hollow town');
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdce8d5);
const hemi=new THREE.HemisphereLight(0xfff4da,0x76876b,1.7);scene.add(hemi);const sun=new THREE.DirectionalLight(0xfff0d4,2.4);sun.position.set(-12,26,17);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.025;Object.assign(sun.shadow.camera,{left:-19,right:19,top:15,bottom:-15,near:1,far:70});scene.add(sun);
const perspective=new THREE.PerspectiveCamera(42,1,.2,180),orthographic=new THREE.OrthographicCamera(-20,20,13,-13,.01,180);perspective.name='town_overview_camera';orthographic.name='town_plan_camera';orthographic.up.set(0,0,-1);
let camera=perspective,mode='3d',dirty=true,selected=null,selectedRoom=null,night=false;
const orbit=new OrbitControls(perspective,renderer.domElement);orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.47;orbit.minDistance=.35;orbit.maxDistance=75;
const pan=new OrbitControls(orthographic,renderer.domElement);pan.enableRotate=false;pan.enableDamping=true;pan.enabled=false;pan.minZoom=.6;pan.maxZoom=12;
const M=p=>new THREE.Vector3((p[0]-750)*SCALE,0,(p[1]-500)*SCALE);
const town=buildTown(plan,2026);scene.add(town.world);const network=createNetwork(ROADS,plan.sites);
const byId=new Map(plan.sites.map(s=>[s.id,s]));
const routeGroup=new THREE.Group();routeGroup.name='planning_route';scene.add(routeGroup);
const selection=new THREE.Mesh(new THREE.RingGeometry(.3,.32,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xe9ad50,side:THREE.DoubleSide,depthTest:false}));selection.renderOrder=10;selection.visible=false;scene.add(selection);
const grid=new THREE.GridHelper(32,32,0x7e8b6c,0xa4b396);grid.position.y=.06;grid.visible=false;grid.material.transparent=true;grid.material.opacity=.25;scene.add(grid);
function status(text){$('status').textContent=text;}
function view(next){mode=next;camera=next==='plan'?orthographic:perspective;orbit.enabled=next==='3d';pan.enabled=next==='plan';$('view-3d').classList.toggle('active',next==='3d');$('view-plan').classList.toggle('active',next==='plan');dirty=true;}
function overview(){orbit.enableDamping=false;orbit.target.set(0,0,0);perspective.position.set(20,26,28);orbit.update();orbit.enableDamping=true;pan.target.set(0,0,0);orthographic.position.set(0,60,0);orthographic.zoom=1;orthographic.lookAt(0,0,0);pan.update();orthographic.updateProjectionMatrix();dirty=true;}
function focus(site){const p=M(site.at);if(mode==='plan'){pan.target.copy(p);orthographic.position.set(p.x,60,p.z);orthographic.zoom=2.2;orthographic.updateProjectionMatrix();pan.update();}else{orbit.enableDamping=false;orbit.target.copy(p).add(new THREE.Vector3(0,.13,0));const offset=site.parcel&&Math.max(...site.parcel)>65?2.3:1.5;perspective.position.copy(p).add(new THREE.Vector3(offset,offset*1.05,offset*1.3));orbit.update();orbit.enableDamping=true;}dirty=true;}
function clearRoute(){routeGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});routeGroup.clear();}
function updateRoute(){
 clearRoute();const result=network.route($('from').value,$('to').value);
 if(!result){$('distance').textContent='No connected route is available for these places.';return null;}
 $('distance').textContent=`${Math.round(result.metres)} m on this layout · about ${Math.max(1,Math.round(result.walkMinutes))} min at 1.3 m/s`;
 if($('route-toggle').getAttribute('aria-pressed')==='true'&&result.points.length>1){const points=result.points.map(p=>M(p).setY(.14));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xeb9f42,depthTest:false}));line.renderOrder=12;routeGroup.add(line);for(const p of [points[0],points.at(-1)]){const dot=new THREE.Mesh(new THREE.SphereGeometry(.07,10,6),new THREE.MeshBasicMaterial({color:0xead18b,depthTest:false}));dot.position.copy(p);dot.renderOrder=13;routeGroup.add(dot);}}
 dirty=true;return result;
}
function addLink(text,url){const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener';$('set-links').append(a);}
function roomDetails(location){
 selectedRoom=location?.id||null;if(!location)return;
 $('source').replaceChildren();const first=location.sources[0];if(first){const a=document.createElement('a');a.textContent=`Source: ${first.file}:${first.line}`;a.href='../'+first.file;a.target='_blank';$('source').append(a);}
 if(location.episodes.length)$('source').append(document.createTextNode(` · Episodes ${location.episodes.map(e=>e.slice(2)).join(', ')}`));
 if(location.reference)addLink('Source painting ↗','../'+location.reference);
 document.querySelectorAll('#rooms button').forEach(b=>b.classList.toggle('active',b.dataset.id===location.id));
}
function selectSite(id,{focusCamera=true,room=null}={}){
 const site=byId.get(id);if(!site)return false;selected=site;selectedRoom=room;
 if(site.draft&&!$('drafts').checked){$('drafts').checked=true;town.layers.drafts.visible=true;renderList();}
 $('title').textContent=site.name;$('place-name').textContent=site.name;$('description').textContent=site.description;
 $('district-name').textContent=DISTRICTS.find(d=>d.id===site.district).name.toUpperCase();$('evidence').textContent=site.draft?'DRAFT ADDITION':'STORY LOCATION / LAYOUT PROPOSED';
 $('rooms').replaceChildren();$('set-links').replaceChildren();$('source').replaceChildren();
 const rooms=plan.locations.filter(l=>l.site===id);for(const location of rooms){const b=document.createElement('button');b.textContent=location.name;b.dataset.id=location.id;b.onclick=()=>{selectSite(id,{focusCamera:false,room:location.id});};$('rooms').append(b);}
 for(const set of site.sets)addLink(set.replaceAll('_',' ')+' ↗',`../sets.html?set=${encodeURIComponent(set)}`);
 roomDetails(rooms.find(l=>l.id===room)||rooms[0]);
 selection.position.copy(M(site.at)).setY(.08);selection.visible=true;
 document.querySelectorAll('#place-list button').forEach(b=>b.classList.toggle('on',b.dataset.id===id));
 if(focusCamera)focus(site);const url=new URL(location.href);url.searchParams.set('place',id);history.replaceState({},'',url);
 status(`${site.draft?'Optional draft addition. ':''}Position ${site.at.map(Math.round).join(', ')} · Proposed planning metres. Choose a room or open a completed 3D set.`);dirty=true;return true;
}
function selectOutside(location){selected=null;selection.visible=false;$('title').textContent=location.name;$('place-name').textContent=location.name;$('district-name').textContent=location.scope==='mobile'?'TRAVELLING PROP':'OUTSIDE MAPLE HOLLOW';$('evidence').textContent=location.confidence.toUpperCase();$('description').textContent=location.scope==='mobile'?'The station wagon moves between locations and has no fixed building plot.':'This location belongs to the world outside Maple Hollow. It is catalogued here without placing it on the town map or inventing a travel distance.';$('rooms').replaceChildren();$('set-links').replaceChildren();roomDetails(location);if(location.id!=='pip_new_bedroom'&&location.scope!=='mobile')addLink('Open the off-town city set ↗','../city%20set/city.html');status('Off-town and mobile locations are catalogued separately from Maple Hollow’s physical sites.');dirty=true;}
function renderList(){
 const district=$('district').value,q=$('search').value.trim().toLowerCase();let matches=[];
 const ep=q.match(/^(?:ep(?:isode)?\s*)?(\d{1,2})$/);const querySite=s=>{const rooms=plan.locations.filter(l=>l.site===s.id);return ep?s.episodes.includes('ep'+ep[1].padStart(2,'0')):[s.name,s.id,...rooms.flatMap(l=>[l.name,l.id])].join(' ').toLowerCase().includes(q);};
 $('place-list').replaceChildren();
 if(district!=='off-town')for(const s of plan.sites.filter(s=>(!s.draft||$('drafts').checked)&&(district==='all'||s.district===district)&&querySite(s))){matches.push(s);const b=document.createElement('button');b.dataset.id=s.id;b.className=(s.draft?'draft ':'')+(selected?.id===s.id?'on':'');b.append(document.createTextNode(s.name));const small=document.createElement('small');small.textContent=(s.draft?'DRAFT ADDITION · ':DISTRICTS.find(d=>d.id===s.district).name+' · ')+(s.episodes.length?'EP '+s.episodes.map(e=>e.slice(2)).join(' / '):'');b.append(small);b.onclick=()=>{selectSite(s.id);closeMenu();};$('place-list').append(b);}
 if(district==='off-town'||(district==='all'&&q))for(const l of plan.locations.filter(l=>l.scope!=='local'&&(ep?l.episodes.includes('ep'+ep[1].padStart(2,'0')):l.name.toLowerCase().includes(q)||l.id.includes(q)))){matches.push(l);const b=document.createElement('button');b.dataset.location=l.id;b.textContent=l.name;const small=document.createElement('small');small.textContent=l.scope==='mobile'?'TRAVELLING PROP':'OUTSIDE TOWN';b.append(small);b.onclick=()=>{selectOutside(l);closeMenu();};$('place-list').append(b);}
 $('count').textContent=`${matches.length} ${district==='off-town'?'outside / mobile locations':'places in this view'}`;dirty=true;return matches;
}
function closeMenu(){document.body.classList.remove('menu-open');$('menu').setAttribute('aria-expanded','false');}
for(const d of DISTRICTS){const o=document.createElement('option');o.value=d.id;o.textContent=d.name;$('district').append(o);}
for(const select of [$('from'),$('to')])for(const s of plan.sites){const o=document.createElement('option');o.value=s.id;o.textContent=s.name+(s.draft?' (draft)':'');select.append(o);}
$('from').value='apt';$('to').value='tower';$('from').onchange=$('to').onchange=updateRoute;
$('route-toggle').onclick=()=>{$('route-toggle').setAttribute('aria-pressed',String($('route-toggle').getAttribute('aria-pressed')!=='true'));updateRoute();};
$('search').oninput=renderList;$('district').onchange=renderList;
$('menu').onclick=()=>{const on=document.body.classList.toggle('menu-open');$('menu').setAttribute('aria-expanded',String(on));};
$('drafts').onchange=()=>{town.layers.drafts.visible=$('drafts').checked;renderList();dirty=true;};
$('festival').onchange=()=>{town.placeGroups.stage.visible=$('festival').checked;dirty=true;};town.placeGroups.stage.visible=false;
$('trees').onchange=()=>{town.layers.vegetation.visible=$('trees').checked;dirty=true;};
$('grid').onclick=()=>{grid.visible=!grid.visible;town.layers.parcels.visible=grid.visible;$('grid').setAttribute('aria-pressed',String(grid.visible));dirty=true;};
function setNight(on){night=on;scene.background.set(on?0x203c46:0xdce8d5);hemi.intensity=on?.7:1.7;hemi.color.set(on?0xb3cdda:0xfff4da);sun.intensity=on?.85:2.4;sun.color.set(on?0xb6cfe5:0xfff0d4);town.litMats.forEach(m=>m.emissiveIntensity=on?1.4:0);town.world.traverse(o=>{if(o.isPointLight)o.intensity=on?(o.userData.dayIntensity||0)*2:0;if(o.isMesh&&o.material?.emissive?.getHex())o.material.emissiveIntensity=on?1:.1;});$('night').setAttribute('aria-pressed',String(on));dirty=true;}
$('night').onclick=()=>setNight(!night);$('overview').onclick=overview;$('view-3d').onclick=()=>view('3d');$('view-plan').onclick=()=>view('plan');
const labelIds=['apt','hall','tower','park','brook','school','square','townline','walt','pip','bash'];
const labels=labelIds.map(id=>{const site=byId.get(id),b=document.createElement('button');b.className='pin';b.textContent=site.name.replace('Riot & Rocco’s apartment','The apartment').replace('Lifeguard lookout','Lookout').replace('Mrs. Brook’s house','Mrs. Brook').replace('Bash’s family home','Bash').replace('Pip’s family home','Pip');b.onclick=()=>selectSite(id);$('labels').append(b);return {site,button:b};});
let showLabels=true;$('labels-toggle').onclick=()=>{showLabels=!showLabels;$('labels').hidden=!showLabels;$('labels-toggle').setAttribute('aria-pressed',String(showLabels));dirty=true;};
function updateLabels(){
 const occupied=[];const w=map.clientWidth,h=map.clientHeight;
 for(const l of [...labels].sort((a,b)=>(b.site===selected)-(a.site===selected))){const v=M(l.site.at);v.y=.35;v.project(camera);const x=(v.x*.5+.5)*w,y=(-v.y*.5+.5)*h;
  const width=l.button.offsetWidth||90,height=l.button.offsetHeight||22;const area={x:x-width/2,y:y-height-5,w:width,h:height};
  const visible=v.z>-1&&v.z<1&&x>15&&x<w-15&&y>40&&y<h-45&&!occupied.some(a=>area.x<a.x+a.w+6&&area.x+area.w+6>a.x&&area.y<a.y+a.h+6&&area.y+area.h+6>a.y);
  l.button.hidden=!visible;l.button.classList.toggle('selected',l.site===selected);if(visible){l.button.style.left=x+'px';l.button.style.top=y+'px';occupied.push(area);}
 }
 const target=(mode==='3d'?orbit:pan).target.clone(),a=target.clone().project(camera),b=target.clone().add(new THREE.Vector3(2,0,0)).project(camera);let px=Math.hypot((a.x-b.x)*w/2,(a.y-b.y)*h/2),metres=100;
 while(px>140){px/=2;metres/=2;}while(px<45){px*=2;metres*=2;}
 if(Number.isFinite(px)&&px>0){$('scale').firstChild.textContent=`${metres} m `;$('scale').querySelector('span').style.width=px+'px';}
}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(town.clickable,false);for(const hit of hits){let visible=true;for(let p=hit.object;p;p=p.parent)if(!p.visible)visible=false;if(visible){selectSite(hit.object.userData.site);break;}}});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('save-png').onclick=()=>{renderer.render(scene,camera);renderer.domElement.toBlob(b=>b&&download(b,`maple-hollow-${mode}-${night?'night':'day'}.png`));};
const completePlan=()=>({...plan,landscape:{lake:ring(0),shore:ring(.16),creekIn:CREEK_IN,creekOut:CREEK_OUT,peaks:PEAKS},roads:ROADS,districts:DISTRICTS,routing:{nodes:network.nodes,edges:network.edges,siteNodes:network.siteNodes},currentRoute:updateRoute()});
$('save-json').onclick=()=>download(new Blob([JSON.stringify(completePlan(),null,2)],{type:'application/json'}),'maple-hollow-master-plan.json');
async function exportGLB(){
 // Bake forest instances into ordinary editable meshes for consistent Blender imports.
 const output=new THREE.Scene();output.name='Maple Hollow master plan';output.userData={units:'metres',status:plan.status,coordinate_system:plan.coordinate_system,limitations:plan.limitations};const copy=town.world.clone(true),remove=[],instanced=[];
 copy.traverse(o=>{if(o.isLineSegments||o.isLineLoop)remove.push(o);if(o.isInstancedMesh)instanced.push(o);});
 for(const o of instanced){const instances=new THREE.Group();instances.name='editable forest instances';instances.position.copy(o.position);instances.rotation.copy(o.rotation);instances.scale.copy(o.scale);const matrix=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const m=new THREE.Mesh(o.geometry,o.material);m.name=`forest tree ${i+1}`;m.applyMatrix4(matrix);instances.add(m);}o.parent.add(instances);remove.push(o);}
 remove.forEach(o=>o.removeFromParent());
 copy.scale.multiplyScalar(1/SCALE);copy.traverse(o=>{if(o.isPointLight){o.distance/=SCALE;o.intensity/=SCALE*SCALE;}});output.add(copy);const exportCamera=perspective.clone();exportCamera.position.multiplyScalar(1/SCALE);exportCamera.near/=SCALE;exportCamera.far/=SCALE;output.add(exportCamera);const key=sun.clone();key.position.multiplyScalar(1/SCALE);output.add(key);return new GLTFExporter().parseAsync(output,{binary:true,onlyVisible:true,trs:true});
}
$('save-glb').onclick=async()=>{const button=$('save-glb');button.disabled=true;status('Packing the town’s editable geometry…');try{const result=await exportGLB();download(new Blob([result],{type:'model/gltf-binary'}),'maple-hollow.glb');status('Saved Maple Hollow GLB. Import in Blender using File → Import → glTF 2.0.');}catch(e){status('Export failed: '+e.message);console.error(e);}finally{button.disabled=false;}};
new ResizeObserver(()=>{const w=map.clientWidth,h=map.clientHeight;if(!w||!h)return;renderer.setSize(w,h);perspective.aspect=w/h;perspective.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(42)/2)*Math.max(1,1.25/perspective.aspect)));perspective.updateProjectionMatrix();const height=26*Math.max(1,1.4/(w/h));orthographic.left=-height*w/h/2;orthographic.right=height*w/h/2;orthographic.top=height/2;orthographic.bottom=-height/2;orthographic.updateProjectionMatrix();dirty=true;}).observe(map);
for(const c of [orbit,pan])c.addEventListener('change',()=>{dirty=true;});
renderer.setAnimationLoop(()=>{(mode==='3d'?orbit:pan).update();if(dirty){if(camera===perspective){const near=Math.max(.005,Math.min(.2,perspective.position.distanceTo(orbit.target)/50));if(Math.abs(perspective.near-near)>.00001){perspective.near=near;perspective.updateProjectionMatrix();}}renderer.render(scene,camera);updateLabels();dirty=false;}});
THREE.DefaultLoadingManager.onLoad=()=>{dirty=true;};
overview();renderList();updateRoute();setNight(params.has('night'));if(params.get('view')==='plan')view('plan');if(params.get('place')&&!selectSite(params.get('place')))status('Unknown place link — showing the town overview.');$('loading').hidden=true;
status(`${plan.sites.length} mapped sites · ${plan.locations.length} catalogued story locations · ${town.houses.length} background homes · ${town.bridges.length} creek bridges · Geography proposed for review.`);
window.mapleHollow={plan,network,town,scene,renderer,selectSite,selectOutside,overview,view,setNight,exportGLB,completePlan,updateRoute,get camera(){return camera;},get selected(){return selected;},get mode(){return mode;}};
