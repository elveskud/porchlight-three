import * as THREE from 'three';
import {drawnBroadleaf,drawnFir} from '../../../art/three/illustrated/reference-v2/shapes.js';
import {createKit} from '../../../art/three/sets/primitives.js';
import {applyReferenceSets} from '../../../art/three/sets/reference-v2/build.js';
const V=(...a)=>new THREE.Vector3(...a);
export function prepareEpisodeSets(modeled){
 const bean=new THREE.Group();bean.name='unused story beanbag';const switchPlate=new THREE.Group();applyReferenceSets(modeled,{bean,switchPlate});
 const park=modeled.park;park.clear();const k=createKit(park,'day'),{box,sphere,beam,group,bench,tree,mesh,torus,cylinder}=k;
 box('reference park lawn',0x87a959,[0,-.12,0],[180,.24,180]);box('lake water',0x79c8d6,[0,-.02,-22],[140,.08,30]);for(let i=0;i<35;i++)box('water reflection',0xb5e7dd,[-50+i*3,.028,-10-(i%6)*3],[1+(i%4),.005,.025]);
 for(let i=0;i<18;i++)sphere('distant green hill',0x83b3aa,[-70+i*8,0,-45],[9,2.8+(i%4)*.4,4]);for(let i=0;i<62;i++){const x=-70+i*2.35+Math.sin(i*2.7)*.8,z=-39+(i%4)*1.0;const tr=tree([x,0,z],.55+(.5+.5*Math.sin(i*1.73))*.60,true);tr.traverse(o=>{if(o.isMesh&&o.name==='fir crown'){o.geometry=drawnFir();o.scale.set(.45,.45,.45);}});}
 const oak=group('old park oak',[7.6,0,-4.5]);for(const [a,b,r] of [[[0,0,0],[.4,5.4,0],.50],[[.3,2.7,0],[-1.8,5.8,.3],.24],[[.4,3.2,0],[2.5,6.4,0],.26],[[.4,4,0],[.9,7.2,-.5],.22]])beam('oak branching trunk',0x887456,a,b,r,oak);
 for(let i=0;i<13;i++){const a=i*2.4,r=i<8?3.4:1.8;const crown=mesh('oak canopy mass',drawnBroadleaf(),[0x77a255,0x5d8d4f,0x8baf64][i%3],[Math.cos(a)*r,6.4+(i%3)*.7,Math.sin(a)*r*.6],[2.15+Math.sin(i)*.2,1.35+(i%2)*.15,1.5],oak);crown.rotation.y=a;}for(let i=0;i<5;i++){const a=i*1.3;beam('oak exposed root',0x817354,[0,.10,0],[Math.cos(a)*1.7,.03,Math.sin(a)*1.1],.13,oak);}
 for(let i=0;i<7;i++)tree([-11-i*4,0,-3-(i%3)*4],1.3+(i%2)*.25);
 function picnic(x,z){const g=group('reference picnic table',[x,0,z]);for(let i=0;i<5;i++)box('picnic tabletop plank',0xa18d58,[0,.80,-.4+i*.20],[2.8,.10,.18],g);for(const side of [-1,1]){box('picnic bench plank',0xa18d58,[0,.47,side*.88],[3.1,.10,.32],g);for(const x of [-1,1])beam('picnic diagonal support',0x827348,[x,.04,side*1.1],[x,.75,0],.06,g);}return g;}
 picnic(-6.0,1.9);picnic(-11,-3);picnic(-16,-6);bench([7.3,0,2.0],0);bench([5,0,-8],-.15);
 for(const [x,z] of [[-7,-5],[12,-7],[15,-5]]){const reed=group('waterside reeds',[x,0,z]);for(let i=0;i<10;i++){const xx=Math.sin(i*2.4)*.6,zz=Math.cos(i*2.4)*.4,h=.5+(i%4)*.2;beam('reed blade',0x526e42,[xx,0,zz],[xx+.1,h,zz],.015,reed);if(i%3===0)cylinder('reed seed head',0x81704a,[xx+.1,h,zz],.033,.2,reed);}}
 // Broad shadows follow the oak and tables without covering the performance area.
 const shadow=mesh('oak ground shadow',new THREE.CircleGeometry(1,40),0x70904f,[7,.012,-3],[4.7,3.1,1]);shadow.rotation.x=-Math.PI/2;shadow.material.side=THREE.DoubleSide;
 for(let i=0;i<5;i++){const g=group('summer cloud',[-40+i*20,16+(i%2)*3,-65]);for(let j=0;j<4;j++)sphere('cloud puff',0xf4faf0,[-2+j*1.6,j%2*.7,0],[2.1,1.1,1.2],g);}
 park.userData.referenceMatched=true;
 const apartment=modeled.apartment;apartment.traverse(o=>{if(o.name==='room shell'){const floor=o.getObjectByName('floor slab');floor.scale.z=20;floor.position.z=4;for(const name of ['left wall','right wall']){const wall=o.getObjectByName(name);wall.scale.x=20;wall.position.z=4;}}});const a=createKit(apartment,'night');a.box('apartment ceiling',0xd9bda7,[0,4.25,3],[11,.12,22]);const shelves=apartment.getObjectByName('left wall shelves');if(shelves){a.box('small radio',0x725d47,[.75,.30,.1],[.6,.4,.32],shelves);a.box('radio speaker',0x423f38,[.62,.3,.275],[.22,.24,.01],shelves);a.sphere('radio tuning knob',0xc3b68d,[.94,.3,.28],[.045,.045,.025],shelves);}
 for(const [id,root] of [['park',park],['apartment',apartment],['lake',modeled.lake]]){root.userData.referenceMatched=true;root.traverse(o=>{if(!o.isMesh||!o.material?.color)return;o.userData.referenceSet=id;o.userData.referenceColor=o.material.color.getHexString();if(id==='apartment'){if(/wall/.test(o.name))o.userData.referenceColor='dfb894';if(/floor slab|floorboard/.test(o.name))o.userData.referenceColor='dca66c';} });}
 return {sets:['park','apartment','lake','lake_night','stoop_sunset','stoop_night','main_street'],pictures:Object.fromEntries(Object.entries(modeled).map(([id,r])=>[id,r.userData.reference]))};
}
