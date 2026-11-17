import * as THREE from 'three';
import {surfaceHeight as groundHeight,ribbon} from './landscape.js';
import {SITES} from './layout.js';
export function buildPlaces(k){
 const {root,group,box,mesh,cylinder,beam,window,door,bench,table,plant,lamp,anchor}=k;
 function site(id){const spec=SITES.find(s=>s.id===id),[x,z]=spec.position,g=group(spec.name,[x,groundHeight(x,z),z]);g.userData.source=spec.source;g.userData.location=id;g.userData.inferred=true;return g;}
 function gable(g,width,depth,y,color){const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(0,width*.32);s.lineTo(width/2,0);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2});geo.translate(0,y,-depth/2);mesh('modeled gable roof',geo,color,[0,0,0],null,g,{ink:false});}
 const church=site('lake_church');church.scale.setScalar(.74);box('church nave',0xf0e6c7,[0,1.35,0],[2.0,2.7,3.7],church);gable(church,2.35,4.1,2.7,0x7c7460);box('church tower',0xe6dcbc,[0,2.2,1.4],[1,4.4,1],church);mesh('church spire',new THREE.ConeGeometry(.9,1.9,4),0x7f7d69,[0,5.15,1.4],null,church,{rotation:[0,Math.PI/4,0]});door([0,0,1.97],church,0x657870,.65,1.5);window([-.65,1.55,1.91],.35,.9,church,k.night);window([.65,1.55,1.91],.35,.9,church,k.night);
 for(const side of [-1,1]){const flank=group('church side windows',[side*1.015,0,0],church);flank.rotation.y=side*Math.PI/2;for(const x of [-1,0,1])window([x,1.5,0],.4,.85,flank,k.night);}
 const shack=site('snack_shack');shack.rotation.y=-.22;box('snack shack walls',0xb79b6c,[0,1,0],[3.5,2,2.6],shack);gable(shack,4.0,3.1,2.05,0x728270);box('open serving hatch',0x4e6258,[0,1.32,1.32],[2.6,.95,.04],shack);box('serving counter',0xd2b17b,[0,.90,1.57],[3.0,.12,.65],shack);for(const x of [-1.4,1.4])box('hatch shutter',0x809a7c,[x,1.35,1.4],[.55,.95,.08],shack,{rotation:[0,x<0?.7:-.7,0]});for(const x of [-.8,-.2,.4])cylinder('counter cup',0xe5d6a8,[x,1.04,1.54],.07,.18,shack);door([1.35,0,-1.34],shack,0x829176,.7,1.8);anchor('snack_counter',[0,0,2.3],shack);
 const park=site('park');park.userData.developedPublicSpace=true;
 for(const [x,z,rot] of [[-5,1,-.4],[4,4,.65]]){const y=groundHeight(27+x,15+z)-park.position.y;bench([x,y,z],rot,park);}
 for(const [x,z] of [[-2,6],[6,-2]]){const y=groundHeight(27+x,15+z)-park.position.y;table([x,y,z],2.7,1.3,.83,park);for(const side of [-1,1]){box('picnic seat',0xa78b60,[x,y+.45,z+side*.95],[2.9,.12,.30],park);for(const dx of [-.9,.9])box('picnic support',0x78684c,[x+dx,y+.22,z+side*.95],[.1,.44,.2],park);}}
 // A green summer oak shades the park without occupying the central beach stage.
 const oak=group('park shade oak',[-2,0,2],park);cylinder('oak trunk',0x806044,[0,1.3,0],.27,2.6,oak);for(let i=0;i<7;i++)k.sphere('oak summer canopy',[0x6e8e4f,0x7d9c58,0x638449][i%3],[Math.cos(i*2.4)*1.1,3.3+(i%3)*.3,Math.sin(i*2.4)*.9],[1.5,1.1,1.3],oak);
 anchor('park_walk',[0,0,0],park);anchor('beach_reverse',[0,-.05,11]);
 function home(name,x,z,color,scale=1,porch=false){
  const g=group(name,[x,groundHeight(x,z),z]);g.scale.setScalar(scale);box('background home walls',color,[0,1.7,0],[3.8,3.4,3.2],g);gable(g,4.35,3.8,3.4,0x777765);
  for(const y of [1.1,2.65])for(const xx of [-1.05,1.05])window([xx,y,1.65],.7,.86,g,k.night);door([0,0,1.65],g,0x5b7b7b,.75,1.95);
  for(const side of [-1,1]){const flank=group('side wall windows',[side*1.93,0,0],g);flank.rotation.y=side*Math.PI/2;for(const xx of [-.8,.8])window([xx,2.4,0],.6,.75,flank,k.night);}
  window([0,2.5,-1.64],.75,.8,g,k.night).rotation.y=Math.PI;
  if(porch){box('home porch deck',0xccc5a6,[0,.22,2.3],[4.4,.44,1.8],g);box('porch canopy',0x7c8a79,[0,2.7,2.3],[4.5,.12,2.0],g);for(const xx of [-1.9,1.9])box('porch post',0xe3d9bc,[xx,1.5,3.0],[.12,2.6,.12],g);bench([-1,.44,2.15],0,g);}
  return g;
 }
 const brook=home('Mrs. Brook’s lakeshore house',-52,-19,0xb7c9c4,1.05,true);brook.rotation.y=-.9;brook.userData.source='art/gemini/sets/54_brook_porch_summer.jpg';
 const apt=site('apartment');box('apartment brick exterior',0xb66c51,[0,3.3,0],[6.5,6.6,4.9],apt);gable(apt,7.0,5.5,6.6,0x686e62);for(const y of [1.3,3.8,5.5])for(const x of [-2.2,2.2])window([x,y,2.5],1.0,1.2,apt,k.night);door([0,.6,2.5],apt,0x335c71,1.25,2.5);for(let i=0;i<3;i++)box('apartment approach steps',0xb69a72,[0,.1+i*.1,3.9-i*.4],[2.7,.2+i*.2,.5],apt);lamp([1.15,3,2.75],apt,k.night?10:0);
 for(const side of [-1,1]){const sideGroup=group('apartment side elevation',[side*3.28,0,0],apt);sideGroup.rotation.y=side*Math.PI/2;for(const y of [1.3,3.8,5.5])for(const xx of [-1.25,1.25])window([xx,y,0],.8,1.2,sideGroup,k.night);}
 for(const y of [1.3,3.8,5.5])for(const x of [-2,2])window([x,y,-2.49],.8,1.2,apt,k.night).rotation.y=Math.PI;
 const street=site('main_street');street.userData.contextOnly=true;
 for(let i=0;i<14;i++){const x=45+(i%5)*8,z=-33-Math.floor(i/5)*8,g=home('town background home',x,z,[0xc2b789,0x98b0a0,0x8daab0,0xc8987c,0xc3bda4][i%5],.75+(i%3)*.10);g.rotation.y=(i%3-1)*.12;}
 ribbon(k,'far shore village lane',[[1,-27],[4,-29],[7,-31],[7,-36],[15,-39],[30,-38],[44,-30],[58,-26],[71,-30],[86,-42]],2.2,0xb6ad8c);
 // Small ordinary beach amenities; no invented businesses or additional story landmarks.
 const rack=group('paddle storage rack',[-13,groundHeight(-13,6),6]);for(const x of [-.8,.8])box('rack upright',0x8e7853,[x,.8,0],[.1,1.6,.1],rack);box('rack crossbar',0xa28b60,[0,1.15,0],[2.0,.09,.1],rack);for(let i=0;i<3;i++){beam('spare paddle shaft',0xc5a16b,[-.6+i*.55,.08,.1],[-.5+i*.55,1.65,.1],.025,rack);box('spare paddle blade',0xc5a16b,[-.58+i*.55,.35,.1],[.16,.4,.045],rack);}
 const nb=group('beach information board',[-9,groundHeight(-9,9),9]);for(const x of [-.55,.55])box('notice post',0x93744c,[x,.8,0],[.10,1.6,.10],nb);box('information board back',0x8e704c,[0,1.5,0],[1.4,.85,.12],nb);for(let i=0;i<3;i++)box('plain notice paper',0xe7dbb6,[-.42+i*.42,1.5,.07],[.32,.6,.01],nb);
 root.userData.lakeWorld.sites=SITES;
}

// Visible downhill footings keep buildings grounded when reverse shots expose their sides.
export function groundBuildings(k){
 const {root,box,group,door,window}=k,buildings=[];root.updateMatrixWorld(true);
 root.traverse(o=>{const footprints={'far shore cottage':[2.08,1.90],'Lake church':[2.12,3.85],'Lake snack shack':[3.6,2.7],'Mrs. Brook’s lakeshore house':[3.95,3.35],'Riot and Rocco’s apartment':[6.6,5.0],'town background home':[3.95,3.35]};if(footprints[o.name])buildings.push([o,footprints[o.name]]);});
 for(const [g,[w,d]] of buildings){
  const base=g.getWorldPosition(new THREE.Vector3()),sc=g.getWorldScale(new THREE.Vector3());let lowest=base.y;
  for(const x of [-w*.5,0,w*.5])for(const z of [-d*.5,0,d*.5]){const v=g.localToWorld(new THREE.Vector3(x,0,z));lowest=Math.min(lowest,groundHeight(v.x,v.z));}
  const low=(lowest-base.y)/sc.y-.11,top=.025;box('downhill stone foundation',0x9d9c83,[0,(low+top)*.5,0],[w,top-low,d],g,{ink:false});
  if(g.name==='far shore cottage'){
   g.children.filter(o=>o.name==='window').forEach(o=>o.position.x*=1.25);
   door([0,0,d*.5+.025],g,0x637e73,.50,1.40);
   const front=g.localToWorld(new THREE.Vector3(0,0,d*.5+.65)),drop=Math.max(.15,(base.y-groundHeight(front.x,front.z))/sc.y);
   for(let i=0;i<3;i++){const h=drop*(i+1)/3;box('village doorstep',0xaaa487,[0,-drop+h*.5,d*.5+.55-i*.20],[.76,h,.25],g,{ink:false});}
  }
  if(g.name==='Lake snack shack'){
   g.children.filter(o=>o.name==='entrance door'&&o.position.z<0).forEach(o=>o.removeFromParent());
   const back=group('finished rear elevation',[0,0,-1.37],g);back.rotation.y=Math.PI;door([.70,0,0],back,0x829176,.7,1.8);window([-.75,1.3,0],.65,.7,back,false);
   for(let i=0;i<8;i++)box('timber siding seam',0xa48d66,[0,.18+i*.23,.015],[3.45,.015,.012],back,{ink:false});
   const side=group('snack shack side elevation',[1.81,0,0],g);side.rotation.y=Math.PI/2;window([0,1.3,0],.75,.75,side,false);
  }
 }
 root.userData.lakeWorld.groundedBuildings=buildings.length;
}
