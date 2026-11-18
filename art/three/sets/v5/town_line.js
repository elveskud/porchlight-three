import {kit} from './kit.js';
export function build(){const k=kit('town_line');
 k.box('summer verge',0xd7bc67,[-8,-.08,-4],[16,.16,26]);k.box('winter verge',0x9a9583,[8,-.08,-4],[16,.16,26]);
 k.box('road summer half',0xa9a89a,[-2.3,.005,-2],[3,.015,25]).rotation.y=-.3;k.box('road winter half',0x8d8c7e,[2.3,.005,-2],[3,.015,25]).rotation.y=.3;
 for(const x of [-.8,.8])k.box('signpost',0x938163,[x,.95,-1],[.12,1.9,.12]);k.box('blank summer boundary board',0xa38a61,[-.58,1.65,-.95],[1.16,.66,.12]);k.box('blank winter boundary board',0x8e877a,[.58,1.65,-.95],[1.16,.66,.12]);
 for(let i=0;i<8;i++){k.tree([-4-(i%3)*2,0,-2-i*2.4],.7+(i%3)*.1);k.bareTree([4+(i%3)*2,0,-2-i*2.4],.7+(i%3)*.1);}
 for(let i=0;i<45;i++){const x=-.5-((i*7)%53)/6,z=2-((i*11)%79)/5;k.beam('golden grass blade',i%2?0xc1a14d:0xe2c876,[x,.01,z],[x+.06,.15+(i%4)*.04,z],.009);}
 for(let i=0;i<6;i++)k.sphere('winter puddle',0xb0bfc3,[2+i*.8,.01,-i*1.3],[.28,.01,.14]);
 // Blank board deliberately follows the reference: no invented town or story text.
 return k.finish();}
