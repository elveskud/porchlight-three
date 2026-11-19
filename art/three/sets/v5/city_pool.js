import {kit} from './kit.js';
export function build(){const k=kit('city_pool');k.box('pool deck',0x92aab4,[0,-.15,0],[15,.3,20]);
 k.box('pool basin',0x6c9cae,[-1,-.1,-2],[9,.1,13]);k.box('pool water',0x6dabc3,[-1,.013,-2],[8.7,.025,12.7],undefined,{material:{transparent:true,opacity:.8}});
 for(const x of [-5.5,3.5])k.box('pool edge',0xb9cbd0,[x,.035,-2],[.12,.07,13.2]);for(const z of [-8.5,4.5])k.box('pool edge',0xb9cbd0,[-1,.035,z],[9.1,.07,.12]);
 for(let lane=0;lane<6;lane++){const x=-4.8+lane*1.35;k.box('lane floor stripe',0x355b72,[x,.031,-2],[.1,.012,11.5]);for(const z of [-7.5,3.5])k.box('lane T marker',0x355b72,[x,.032,z],[.7,.012,.1]);if(lane<5)for(let i=0;i<38;i++)k.sphere('lane rope float',i%3===0?0x8dabc0:0xd7dfdb,[x+.67,.07,-8+i*.34],[.045,.045,.14]);}
 for(let i=0;i<7;i++)k.box('concrete bleacher tier',0xa4b6be,[5.15+i*.23,.16+i*.2,-3],[1.9-i*.08,.32+i*.4,12]);
 // Full glazed rear and left walls, roof trusses, planted view beyond glass.
 for(const x of [-7.3,7.3]){k.box('pool side glazing',0x718b9b,[x,2,-2],[.045,4,18],undefined,{material:{transparent:true,opacity:.2,depthWrite:false}});for(let z=-10;z<7;z+=1.5)k.box('glazing mullion',0x526b77,[x,2,z],[.09,4,.07]);for(const y of [1.3,2.65,4])k.box('glazing crossbar',0x526b77,[x,y,-2],[.08,.06,18]);}
 k.box('pool rear glazing',0x718b9b,[0,2,-10],[14.6,4,.045],undefined,{material:{transparent:true,opacity:.2,depthWrite:false}});for(let x=-7;x<7;x+=1.5)k.box('rear glazing mullion',0x526b77,[x,2,-9.96],[.07,4,.06]);for(const y of [1.3,2.65,4])k.box('rear glazing crossbar',0x526b77,[0,y,-9.96],[14.5,.06,.06]);
 k.box('steel roof',0x697e8b,[0,4.2,-2],[15,.1,18]);for(let z=-9;z<7;z+=2){k.beam('roof truss chord',0x4f6571,[-7.2,3.9,z],[7.2,3.9,z],.04);for(let i=0;i<8;i++)k.beam('roof diagonal brace',0x4f6571,[-7+i*1.8,3.9,z],[-6.1+i*1.8,4.15,z],.025);}
 const bench=k.bench([-.5,0,6.1]);bench.scale.x=1.8;for(let i=0;i<8;i++)k.tree([-8+i*2.1,0,-13],.8);
 return k.finish();}
