import * as THREE from 'three';
import {LAKE_OUTLINE,COVERAGE} from './layout.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp;
const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);};
let terrainHeights=null;
const warp=(v,inner)=>{const a=Math.abs(v)/320;return Math.sign(v)*(a<=.5?a*inner*2:inner+(a-.5)*(320-inner)*2);};
const curve=new THREE.CatmullRomCurve3(LAKE_OUTLINE.map(([x,z])=>V(x,0,z)),true,'centripetal');
export const SHORE=curve.getPoints(240).slice(0,-1).map(p=>[p.x,p.z]);
export function signedShore(x,z){let inside=false,d=Infinity;for(let i=0,j=SHORE.length-1;i<SHORE.length;j=i++){
 const [ax,az]=SHORE[j],[bx,bz]=SHORE[i],dx=bx-ax,dz=bz-az,u=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-ax-u*dx,z-az-u*dz));
 if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
 }return inside?-d:d;}
export function groundHeight(x,z,knownDistance){
 const d=knownDistance??signedShore(x,z);if(d<0)return -.08-.065*Math.min(-d,12);
 // A plateau receives the existing hall at its unchanged 4.8m datum.
 const hill=4.85*Math.exp(-(((x-15)/12)**2+((z+31)/9)**2));
 const roll=.35+1.6*Math.sin(x*.034+.5)**2+1.2*Math.cos(z*.038)**2;
 const upland=roll*smooth(8,34,d);let h=-.05+.18*smooth(2.5,9,d)+upland+hill*smooth(0,4,d);
 const plateau=(1-smooth(2.8,5.5,Math.abs(x-15)))*(1-smooth(2.6,5,Math.abs(z+30)));h=mix(h,4.8,plateau);
 // The dialogue and beach-entry stage remains flat and unobstructed.
 const stage=(1-smooth(9,15,Math.abs(x+2)))*(1-smooth(3.5,7,Math.abs(z-1)));return mix(h,-.05,stage);
}
export function surfaceHeight(x,z){if(!terrainHeights)return groundHeight(x,z);const inverse=(v,inner)=>{const a=Math.abs(v),q=a<=inner?a/(inner*2):.5+(a-inner)/(2*(320-inner));return (Math.sign(v)*q+1)*128;},gx=inverse(x,64),gz=inverse(z,50),ix=Math.max(0,Math.min(255,Math.floor(gx))),iz=Math.max(0,Math.min(255,Math.floor(gz))),u=Math.max(0,Math.min(1,gx-ix)),v=Math.max(0,Math.min(1,gz-iz)),a=terrainHeights[ix+iz*257],b=terrainHeights[ix+1+iz*257],c=terrainHeights[ix+(iz+1)*257],d=terrainHeights[ix+1+(iz+1)*257];return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
export function seeded(seed=COVERAGE.forestSeed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function surface(k,name,geo,color,options={}){return k.mesh(name,geo,color,[0,0,0],null,k.root,{ink:false,...options});}
export function ribbon(k,name,pts,width,color){
 const path=new THREE.CatmullRomCurve3(pts.map(([x,z])=>V(x,0,z)),false,'centripetal'),positions=[],uv=[],indices=[],steps=Math.max(24,pts.length*12);
 for(let i=0;i<=steps;i++){const u=i/steps,p=path.getPoint(u),t=path.getTangent(u),normal=V(-t.z,0,t.x).normalize();for(const side of [-1,1]){const x=p.x+normal.x*width*.5*side,z=p.z+normal.z*width*.5*side;positions.push(x,surfaceHeight(x,z)+.045,z);uv.push((side+1)/2,u*12);}if(i<steps){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const m=surface(k,name,geo,color,{material:{side:THREE.DoubleSide}});m.userData.walkable=true;m.userData.width=width;m.userData.centerline=path.getPoints(100).map(p=>[p.x,p.z]);return m;
}
export function buildLandscape(k,spec){
 const random=seeded(),geo=new THREE.PlaneGeometry(640,640,256,256);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,colors=[],sand=new THREE.Color(0xd7b46d),grass=new THREE.Color(0x7f9e5b),bed=new THREE.Color(0x7e9b84),c=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=warp(p.getX(i),64),z=warp(p.getZ(i),50),d=signedShore(x,z),h=groundHeight(x,z,d);p.setXYZ(i,x,h,z);if(d<0)c.copy(bed);else c.copy(sand).lerp(grass,smooth(3.2,8.0,d));const brush=.97+.035*Math.sin(x*.63)*Math.sin(z*.47);c.multiplyScalar(brush);colors.push(c.r,c.g,c.b);}
 terrainHeights=Array.from({length:p.count},(_,i)=>p.getY(i));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const land=surface(k,'continuous lakeside terrain',geo,0xffffff,{material:{vertexColors:true}});land.castShadow=false;
 const waterShape=new THREE.Shape(SHORE.map(([x,z])=>new THREE.Vector2(x,-z)));const waterGeo=new THREE.ShapeGeometry(waterShape,64);waterGeo.rotateX(-Math.PI/2);const water=surface(k,'curved lake water',waterGeo,k.night?0x335d78:0x63b5c5,{material:{roughness:.38,metalness:.08}});water.position.y=COVERAGE.waterLevel;water.castShadow=false;water.userData.water=true;
 // Thin bank ribbons follow the actual lake edge rather than forming a floating rectangle.
 const ringPositions=[],ringIndices=[];for(let i=0;i<=SHORE.length;i++){const [x,z]=SHORE[i%SHORE.length],before=SHORE[(i+SHORE.length-1)%SHORE.length],after=SHORE[(i+1)%SHORE.length],t=V(after[0]-before[0],0,after[1]-before[1]).normalize();let n=V(-t.z,0,t.x);if(signedShore(x+n.x*.3,z+n.z*.3)<0)n.negate();for(const w of [.03,.58]){const xx=x+n.x*w,zz=z+n.z*w;ringPositions.push(xx,surfaceHeight(xx,zz)+.022,zz);}if(i<SHORE.length){const j=i*2;ringIndices.push(j,j+2,j+1,j+1,j+2,j+3);}}
 const bankGeo=new THREE.BufferGeometry();bankGeo.setAttribute('position',new THREE.Float32BufferAttribute(ringPositions,3));bankGeo.setIndex(ringIndices);bankGeo.computeVertexNormals();surface(k,'continuous damp shoreline',bankGeo,0xb9b18a,{material:{side:THREE.DoubleSide}});
 const reflections=[];for(let i=0;i<150;i++){const x=-39+random()*79,z=-24+random()*22;if(signedShore(x,z)>-1.5)continue;const m=k.box('lake surface glint',k.night?0x7195a5:0xc0e2d3,[x,.003,z],[.25+random()*1.8,.003,.016+random()*.018],k.root,{ink:false,shadow:false});reflections.push(m);}
 // A shore walk and access spurs connect the reverse views to established town districts.
 const walk=[];for(let i=0;i<=SHORE.length;i+=8){const [x,z]=SHORE[i%SHORE.length],t=V(x,0,z+13).normalize(),offset=t.z>.35&&Math.abs(x)<20?8.0:4.2,candidate=[x+t.x*offset,z+t.z*offset];walk.push(candidate);}ribbon(k,'continuous shore walking path',walk,1.45,0xc8bd91);
 ribbon(k,'beach approach',[[0,7],[2,10],[8,14],[17,16],[27,18],[43,18],[57,10],[64,-4]],2.0,0xcab98c);
 ribbon(k,'east shore town lane',[[42,-4],[50,-8],[58,-16],[66,-24],[76,-35],[86,-42]],3.0,0xb3ad91);
 ribbon(k,'west forest path',[[-23,3],[-31,1],[-43,-6],[-51,-15],[-57,-22],[-65,-29]],1.5,0xc0b48a);
 ribbon(k,'hall hill approach',[[29,-24],[27,-29],[24,-33],[20,-35],[15,-35],[15,-33]],1.25,0xbcb089);
 ribbon(k,'park connecting path',[[12,14],[22,15],[30,18],[35,23],[39,28]],1.4,0xc7bb92);
 // Low rolling ridges close the horizon on every side; summer vegetation stays green.
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=220+(i%4)*13;k.sphere('distant wooded ridge',[0x718b72,0x879a7a,0x8f9e87][i%3],[Math.cos(a)*r,1,Math.sin(a)*r],[35+(i%3)*8,12+(i%5)*5,35]);}
 const creek=ribbon(k,'west creek bed',[[-40,-20],[-48,-27],[-59,-31],[-69,-39],[-75,-54],[-87,-65]],1.1,0x658e92);creek.userData.walkable=false;creek.userData.water=true;
 k.root.userData.lakeWorld={version:1,coverage:COVERAGE,shore:SHORE,stagePreserved:true,geography:'Painting-led production staging, informed by the proposed town plan; inferred hidden geometry.'};return {groundHeight,signedShore,reflections};
}
