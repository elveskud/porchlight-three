// Distant modeled sky details, frozen for repeatable renders and exports.
import * as THREE from 'three';
export function sky(kit,spec) {
  if(!['lake','stoop','park','street','brookPorch','waltPorch','hallExterior'].includes(spec.build))return;
  const {root,group,sphere,mesh,night}=kit;
  const g=group('distant sky');
  if(spec.build==='lake'){
    let seed=731;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    if(night){mesh('moon',new THREE.SphereGeometry(2.8,24,16),0xffefbd,[0,44,-155],null,g,{ink:false,shadow:false,material:{emissive:0xffefbd,emissiveIntensity:1}});for(let i=0;i<90;i++){const a=random()*Math.PI*2,r=145+random()*60;mesh('star',new THREE.SphereGeometry(.10+random()*.08,5,3),0xf4eccd,[Math.cos(a)*r,25+random()*100,Math.sin(a)*r],null,g,{ink:false,shadow:false,material:{emissive:0xf4eccd,emissiveIntensity:1}});}}
    if(!night||spec.mood==='storm')for(let i=0;i<15;i++){const a=i/15*Math.PI*2,cloud=group(spec.mood==='storm'?'storm cloud':'summer cloud',[Math.cos(a)*155,30+(i%4)*4,Math.sin(a)*155],g);for(let j=0;j<4;j++)sphere('cloud puff',spec.mood==='storm'?0x667780:0xf2edda,[-4+j*3,(j%2)*1.4,0],[3.7,2.4,2.8],cloud);}return;
  }
  if(spec.mood==='storm') {
    for(let i=0;i<7;i++)sphere('storm cloud',0x52616c,[-36+i*12,14+(i%2)*3,-48],[10,2.8,3],g);return;
  }
  if(night) {
    mesh('moon',new THREE.SphereGeometry(1.3,20,12),0xffefbd,[0,16,-50],null,g,{ink:false,shadow:false,material:{emissive:0xffefbd,emissiveIntensity:1}});
    for(let i=0;i<45;i++)mesh('star',new THREE.SphereGeometry(.065+(i%3)*.025,5,3),0xf4eccd,[-48+(i*13.7)%96,8+(i*3.19)%22,-54],null,g,{ink:false,shadow:false,material:{emissive:0xf4eccd,emissiveIntensity:1}});
  } else {
    for(let i=0;i<5;i++) {
      const cloud=group('summer cloud',[-34+i*16,12+(i%3)*2.8,-48],g);
      for(let j=0;j<4;j++)sphere('cloud puff',spec.mood==='sunset'?0xf1d49e:0xf3efdb,[-2.2+j*1.5,(j%2)*.6,0],[1.7,1,1.2],cloud);
    }
  }
}
