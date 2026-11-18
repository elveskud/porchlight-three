import {kit} from './kit.js';
export function build() {
 const k=kit('walt_garage');k.box('garage ceiling',0x8f8879,[0,3.12,0],[8,.12,9]);k.box('concrete garage floor',0xb5afa4,[0,-.08,0],[8,.16,9]);
 k.box('left plaster wall',0xc7bcaa,[-4,1.5,0],[.12,3,9]);k.box('right plaster wall',0xc7bcaa,[4,1.5,0],[.12,3,9]);
 k.box('rear wall left',0xc7bcaa,[-3.3,1.5,-4.5],[1.4,3,.12]);k.box('rear wall right',0xc7bcaa,[2.5,1.5,-4.5],[3,3,.12]);k.box('garage lintel',0xc7bcaa,[-.8,2.75,-4.5],[3.7,.5,.12]);
 for(let z=-4;z<4;z+=1.3)k.box('exposed roof beam',0x79654d,[0,3,z],[8,.16,.13]);
 k.box('raised segmented door',0x9a9d99,[-.8,2.95,-3.3],[3.6,.1,2.3]);for(let z=-4.2;z<-2.3;z+=.4)k.box('door seam',0x657071,[-.8,2.88,z],[3.5,.02,.025]);
 k.box('driveway outside',0xb8b2a3,[-.8,-.13,-8],[4,.1,8]);k.box('street outside',0x8d9390,[-.8,-.11,-8],[10,.06,1.2]);for(const x of [-4,3])k.tree([x,0,-10],1);k.box('far garden lawn',0x8ea36c,[0,-.2,-13],[18,.1,7]);
 k.shelf('left household storage',[-3.55,0,-.5],6.3,2.6,.6).rotation.y=Math.PI/2;
 const canoe=k.group('upright green canoe',[-2.7,.15,-2.4]);canoe.rotation.z=-.11;
 k.sphere('canoe hull',0x647d58,[0,1.25,0],[.46,1.52,.17],canoe);k.sphere('canoe inner well',0x9d8f66,[0,1.29,.12],[.34,1.35,.06],canoe);for(const y of [.6,1,1.5,2])k.box('canoe thwart',0x6c684e,[0,y,.19],[.57,.065,.065],canoe);
 const work=k.table([-2.4,0,-3.9],1.25,.65,.65);work.name='small repair bench';k.radio([-2.4,.72,-3.8],.5,.3);k.box('tool board',0xa88e61,[-2.9,1.35,-4.35],[1.1,.65,.05]);for(let i=0;i<5;i++)k.beam('hanging tool',0x69716b,[-3.3+i*.19,1.1,-4.3],[-3.3+i*.19,1.5,-4.3],.018);
 k.window([2.7,2.05,-4.4],1.7,.7);
 const car=k.group('green wood-sided station wagon',[2.15,0,-1.2]);
 k.box('wagon lower body',0x637f72,[0,.54,0],[1.65,.62,3.2],car);k.box('wood side panel',0xa28a5e,[-.84,.6,0],[.04,.36,2.65],car);k.box('wagon roof',0x637f72,[0,1.4,-.25],[1.5,.12,1.9],car);
 for(const x of [-.72,.72]){k.box('wagon side windows',0x718e96,[x,1.1,-.25],[.04,.48,1.8],car);for(const z of [-1.1,-.3,.6])k.box('wagon window pillar',0x637f72,[x,1.1,z],[.055,.55,.07],car);}
 k.box('wagon windshield',0x839da2,[0,1.08,.73],[1.38,.5,.06],car);k.box('front bumper',0xabb3aa,[0,.35,1.66],[1.7,.12,.13],car);for(const x of [-.61,.61])k.box('headlamp',0xe5d8a8,[x,.63,1.63],[.3,.18,.03],car);
 for(const x of [-.84,.84])for(const z of [-1,1]){const w=k.cylinder('station wagon tyre',0x3b4141,[x,.33,z],.33,.13,car);w.rotation.z=Math.PI/2;const hub=k.cylinder('wheel hub',0xb6b9ad,[x*1.03,.33,z],.18,.14,car);hub.rotation.z=Math.PI/2;}
 k.bicycle([3.15,0,1.5],.78,-.28);k.bicycle([1.3,0,-3.5],.6,.1);
 for(let i=0;i<4;i++){k.box('foreground storage carton',0xb59c70,[-3.1+i*.72,.2,3.7],[.6,.4,.55]);k.box('packing tape',0xc9b88e,[-3.1+i*.72,.405,3.7],[.08,.01,.55]);}
 for(let i=0;i<5;i++)k.sphere('old concrete stain',0x97958a,[-1.2+i*.6,.006,1.5+(i%2)*.6],[.18,.006,.12]);
 k.lamp([0,2.7,-1],undefined,1.2);return k.finish();
}
