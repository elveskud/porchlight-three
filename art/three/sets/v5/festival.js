import * as THREE from 'three';
import {buildLandscape} from '../lake-world/landscape.js';
import {populateVegetation} from '../lake-world/population.js';
import {sky} from '../sky.js';
export function lakeside(k,mood){buildLandscape(k,{mood});populateVegetation(k);sky(k,{build:'lake',mood});if(mood==='storm'){k.root.traverse(o=>{if(o.name==='moon'||o.name==='star')o.visible=false;});for(let i=0;i<8;i++)k.sphere('low storm cloud bank',0x465063,[-35+i*10,8+(i%2),-45],[9,3.5,5]);}}
export function dressFestival(k,{roof=false,storm=false}={}){
 k.box('golden festival sand apron',0xd2b16e,[0,-.035,5],[22,.02,13]);
 const stage=k.group(roof?'covered festival stage':'memory lakeside platform',[0,0,-1]);
 k.box('raised wooden platform',0x9d7951,[0,.2,0],[4.4,.4,1.8],stage);for(let x=-2.1;x<2.2;x+=.22)k.box('stage plank seam',0x6d5944,[x,.408,0],[.012,.012,1.8],stage);
 for(let i=0;i<2;i++)k.box('stage entrance step',0x9d7951,[0,.07+i*.1,1.15-i*.15],[1.1,.14,.5],stage);
 if(roof){for(const x of [-2,2])for(const z of [-.7,.7])k.box('stage roof post',0x806245,[x,1.5,z],[.12,2.6,.12],stage);k.box('low flat stage roof',0x92734f,[0,2.88,0],[4.75,.15,2.15],stage);for(const x of [-2,2])k.beam('stage diagonal brace',0x806245,[x,2,.7],[x*.65,2.78,.7],.06,stage);}
 else for(const x of [-1.7,1.7])k.beam('cloth support pole',0x92754e,[x,0,-1.3],[x,2.5,-1.3],.035);
 if(!roof){const shape=new THREE.Shape();shape.moveTo(-1.65,2.3);shape.lineTo(1.65,2.3);shape.lineTo(1.65,storm?1.9:1.55);if(storm){shape.lineTo(.7,1.8);shape.lineTo(1.1,2.02);shape.lineTo(.3,1.88);shape.lineTo(.8,2.17);shape.lineTo(-.2,1.98);shape.lineTo(-.6,2.1);shape.lineTo(-1.65,1.65);}else shape.quadraticCurveTo(0,1.35,-1.65,1.55);shape.closePath();k.mesh('blank hanging cloth',new THREE.ShapeGeometry(shape),0xe5dfbc,[0,0,-1.3],null,undefined,{material:{side:THREE.DoubleSide},ink:false});}
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const x=side*(3.3+i*1.5),z=.5+i*1.4;
  const table=k.table([x,0,z],2.5,.8,.56);if(storm&&i!==2){table.rotation.z=side*.75;table.position.y=.24;}
  if(roof){const b=k.bench([x,0,z+.6]);b.scale.x=1.1;if(storm&&i===0)b.rotation.z=side*.65;}
 }
 if(roof){k.table([0,0,3.5],1.2,.9,.58);for(const p of [[-.9,0,3.5],[.9,0,3.5],[0,0,4.3],[0,0,2.7]])k.seat(p,p[0]===0?(p[2]<3.5?Math.PI:0):p[0]>0?-Math.PI/2:Math.PI/2);}
 const colors=[0xbf6760,0xd1ad56,0x6c9c76,0x628c9f];
 for(const z of [-.7,2,5]){for(const x of [-6.5,6.5])k.beam('festival string pole',0x806b4d,[x,0,z],[x,2.35,z],.035);for(let i=0;i<33;i++){
  const x=-6.4+i*.4,y=2.32-.42*Math.sin((x+6.4)/12.8*Math.PI);if(i<32)k.beam('festoon cable',0x535952,[x,y,z],[x+.4,2.32-.42*Math.sin((x+6.8)/12.8*Math.PI),z],.009);
  const flag=new THREE.Shape();flag.moveTo(-.1,0);flag.lineTo(.1,0);flag.lineTo(storm?.15:0,-.25);flag.closePath();k.mesh('festival pennant',new THREE.ShapeGeometry(flag),colors[i%4],[x,y-.025,z],null,undefined,{material:{side:THREE.DoubleSide},ink:false});
  if(i%2===0)k.sphere('festival bulb',storm?0xbabca1:0xffdf94,[x,y-.07,z+.04],[.035,.045,.035]);
 }}
 if(storm){for(let i=0;i<20;i++)k.beam('rain streak',0x667a96,[-9+(i*7%53)/3,3+(i%3)*.3,-5+(i*11%29)/2],[-9+(i*7%53)/3-.13,2.5+(i%3)*.3,-5+(i*11%29)/2],.006);for(let i=0;i<12;i++)k.box('white wave crest',0xb3c4cc,[-20+i*3,.06,-6-(i%3)*3],[1.5,.04,.08]);}
}
