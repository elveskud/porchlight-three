import * as THREE from 'three';
import {createKit} from '../primitives.js';
// Modelling helpers shared only by the new v5 assets. No random geometry: seeking is deterministic.
export function kit(id,mood='day') {
  const root=new THREE.Group();root.name=id;
  root.userData={id,mood,anchors:[],assetErrors:[],units:'metres'};
  const k=createKit(root,mood);
  const finish=()=>{root.traverse(o=>{if(o.isMesh && o.material?.color){o.userData.referenceColor=o.material.color.getHexString();o.userData.setMesh=true;}});return root;};
  const seat=(p,yaw=0)=>{const g=k.chair(p,yaw);g.scale.set(.9,.62,.9);return g;};
  const bench=(p,yaw=0)=>{const g=k.bench(p,yaw);g.scale.y=.64;return g;};
  function shelf(name,p,w=2,h=2,d=.5) {
    const g=k.group(name,p);for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])k.box('steel upright',0x596164,[x,h/2,z],[.045,h,.045],g);
    for(let y=.12;y<h;y+=.46){k.box('steel shelf',0x757e7b,[0,y,0],[w,.05,d],g);for(let i=0;i<Math.floor(w/.42);i++){
      const x=-w/2+.24+i*.43;
      if((i+Math.round(y*10))%3===0){k.box('document carton',0xb29669,[x,y+.17,0],[.36,.3,d*.8],g);k.box('carton hand slot',0x6f6657,[x,y+.23,d*.41],[.12,.035,.01],g);}
      else for(let j=0;j<3;j++){const c=[0x7e886b,0xb0a478,0x6e7c79,0xa28670][(i+j)%4];k.box('bound folder',c,[x-.12+j*.11,y+.16,0],[.08,.29,d*.72],g);k.box('folder label',0xd7cfac,[x-.12+j*.11,y+.15,d*.37],[.045,.06,.012],g);}
    }}return g;
  }
  function radio(p,w=.75,h=.45,parent=root,reels=false){
    const g=k.group(reels?'reel recorder':'radio receiver',p,parent);k.box('metal case',0x737d79,[0,h/2,0],[w,h,.3],g);
    k.box('dark faceplate',0x39434a,[0,h/2,.16],[w*.9,h*.81,.015],g);
    if(reels){for(const x of [-w*.26,w*.26]){k.cylinder('reel centre',0xbcbcb0,[x,h*.63,.2],.06,.04,g).rotation.x=Math.PI/2;k.torus('tape reel',0xbcc1b5,[x,h*.63,.2],h*.23,.018,g);for(let i=0;i<3;i++)k.sphere('reel aperture',0x29363a,[x+Math.cos(i*2.094)*h*.12,h*.63+Math.sin(i*2.094)*h*.12,.207],[h*.045,h*.045,.01],g);}}
    else {k.box('tuning dial',0xb1c6ab,[0,h*.64,.18],[w*.64,h*.24,.018],g);for(let i=0;i<8;i++)k.box('dial marking',0x455c4c,[-w*.27+i*w*.077,h*.64,.192],[.007,h*.18,.008],g);}
    for(const x of [-w*.3,0,w*.3])k.sphere('control knob',0x252e30,[x,h*.2,.2],[.045,.045,.025],g);return g;
  }
  function bicycle(p,scale=.7,yaw=0){const g=k.group('bicycle',p);g.scale.setScalar(scale);g.rotation.y=yaw;for(const x of [-.65,.65])k.torus('tyre',0x303a38,[x,.4,0],.39,.035,g);for(const [a,b] of [[[ -.65,.4,0],[-.2,1,0]],[[-.2,1,0],[.25,.4,0]],[[.25,.4,0],[-.65,.4,0]],[[-.2,1,0],[.6,1,0]],[[.6,1,0],[.25,.4,0]],[[.6,1,0],[.65,.4,0]]])k.beam('bicycle frame',0x806846,a,b,.028,g);k.box('saddle',0x343c38,[-.2,1.08,0],[.3,.07,.15],g);k.beam('handlebar',0x9baba2,[.6,1,0],[.52,1.27,.1],.025,g);return g;}
  function bareTree(p,scale=1){const g=k.group('winter tree',p);g.scale.setScalar(scale);k.beam('trunk',0x6a665c,[0,0,0],[.1,2.7,0],.14,g);for(let i=0;i<7;i++){const side=i%2?1:-1,y=1+i*.24;const a=[.07,y,0],b=[side*(.65+(i%3)*.16),y+.65,(i%3-1)*.35];k.beam('bare branch',0x6a665c,a,b,.055,g);k.beam('bare twig',0x6a665c,b,[b[0]+side*.22,b[1]+.42,b[2]-.1],.025,g);k.sphere('snow on branch',0xe0e8e7,[b[0],b[1]+.03,b[2]],[.17,.045,.07],g);}return g;}
  return {...k,finish,seat,bench,shelf,radio,bicycle,bareTree};
}
