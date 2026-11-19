import {kit} from './kit.js';
export function build(){const k=kit('archive');
 k.room(8,12,3,0x92948a,0x9b9e94,false);k.box('basement ceiling',0x787b70,[0,3.08,0],[8,.1,12]);
 for(let z=-5.8;z<5.8;z+=1.05)k.box('low ceiling joist',0x747970,[0,2.88,z],[8,.14,.12]);
 for(const side of [-1,1]){for(let i=0;i<4;i++){const g=k.shelf('wall archive shelving',[side*3.6,0,-4.3+i*2.8],2.6,2.65,.65);g.rotation.y=side<0?Math.PI/2:-Math.PI/2;}for(let i=0;i<3;i++)k.shelf('inner shelf aisle',[side*2,0,-4.4+i*2.3],1.65,2.4,.5);}
 k.window([0,2.35,-5.92],.85,.35);k.table([2.1,0,2.25],1.9,1,.7);k.radio([2.1,.78,2.25],.85,.65,undefined,true);
 for(let i=0;i<5;i++){const x=-3.1+i*1.5;k.box('floor archive carton',0xb09a75,[x,.18,4.4],[.75,.35,.6]);for(let j=0;j<4;j++)k.cylinder('rolled plan',0xd1ccb4,[x-.2+j*.12,.66,4.4],.045,.75).rotation.z=(j-1.5)*.07;}
 k.lamp([0,2.6,.5],undefined,2);k.lamp([0,2.6,-3.5],undefined,1);return k.finish();}
