import {kit} from './kit.js';
// 28/29: left-hand broadcast desk, packed radio shelves, concrete floor and garage opening.
export function build({mood='day'}={}) {
 const k=kit('gus_garage',mood),night=mood==='night';
 k.box('grey ceiling',0x8b8c82,[0,3.12,0],[8,.12,8]);
 k.box('concrete floor',0x9da6a4,[0,-.08,0],[8,.16,8]);
 k.box('left plaster wall',0xa39c8d,[-4,1.5,0],[.12,3,8]);
 k.box('back wall left',0xa39c8d,[-2.4,1.5,-4],[3.2,3,.13]);
 k.box('back wall right',0xa39c8d,[3.35,1.5,-4],[1.3,3,.13]);
 for(const x of [-3.8,-1.1,1.6,3.8])k.box('ceiling joist',0x66675f,[x,3,0],[.1,.16,8]);
 if(night){k.box('closed garage door',0x52616a,[.95,1.22,-3.99],[3.4,2.44,.1]);for(const x of [.1,1.8])k.window([x,1.93,-3.9],1.45,.62);}
 else {k.box('raised garage door',0x899795,[.9,2.91,-2.6],[3.4,.12,2.6]);k.box('street beyond garage',0x969990,[1,-.12,-8],[7,.1,8]);for(const x of [-2,4]){k.box('small shop beyond opening',x<0?0xc5886e:0x477d8a,[x,1,-8],[2,2,2]);k.window([x,1.2,-6.98],.8,.7);}for(let i=0;i<7;i++)k.tree([-4+i*1.3,0,-14],.8,true);k.box('right street paving',0xb8b8a8,[7,-.1,-1],[6,.08,16]);k.box('right street road',0x8c9490,[8,-.08,-1],[2.7,.05,16]);for(let i=0;i<3;i++){k.box('right-hand shop facade',[0x447d8c,0x9d7660,0xb69259][i],[11,1.2,-5+i*3.5],[2,2.4,3]);k.window([9.95,1.2,-5+i*3.5],.8,.9).rotation.y=-Math.PI/2;}}
 const shelves=k.shelf('left radio shelving',[-3.55,0,-1.4],3.9,2.7,.65);shelves.rotation.y=Math.PI/2;
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)k.radio([-3.15,.55+i*.64,-2.5+j*1.25],1.08,.5,undefined,(i+j)%2===0).rotation.y=Math.PI/2;
 k.shelf('back equipment rack',[-2.5,0,-3.55],1.9,2.45,.55);k.radio([-2.5,.65,-3.2],1.5,.58,undefined,true);k.radio([-2.5,1.35,-3.2],1.5,.5);
 const desk=k.table([-2.25,0,.75],2.5,1.1,.72);desk.name='broadcast desk';
 k.cylinder('microphone base',0x7d8987,[-2.05,.82,.65],.19,.05);k.cylinder('microphone stem',0x7d8987,[-2.05,1.03,.65],.028,.4);
 k.sphere('vintage microphone',0xb2bbb4,[-2.05,1.4,.65],[.18,.28,.13]);for(let i=0;i<7;i++)k.box('microphone grille',0x354347,[-2.05,1.25+i*.045,.773],[.27,.014,.012]);
 k.box('red on-air base',0x69756c,[-3,.81,.8],[.25,.12,.25]);k.sphere('red on-air bulb',0xb74f45,[-3,1.01,.8],[.12,.18,.12]);
 k.cylinder('stool seat',0x9e784c,[-.8,.36,1.4],.31,.09);for(const x of [-1,-.6])for(const z of [1.2,1.6])k.beam('stool leg',0x87653f,[x-.04,.02,z],[x,.34,z],.035);
 k.cylinder('kettle body',0xb5bcb4,[-1.25,.9,.6],.14,.26);k.torus('kettle handle',0x65716a,[-1.25,1.1,.6],.11,.02);k.cylinder('tea mug',0xd1c5a9,[-1.55,.85,.9],.07,.14);
 if(night){k.lamp([-2.55,1.15,.35],undefined,5);k.shelf('right archive shelves',[3.55,0,-.4],4,2.7,.6).rotation.y=-Math.PI/2;}
 k.box('cardboard carton',0xb29b73,[2.75,.26,1.8],[.8,.5,.65]);k.box('carton seam',0x726e56,[2.75,.515,1.8],[.02,.01,.65]);
 return k.finish();
}
