import {kit} from './kit.js';
export function build({view='street'}={}) {const k=kit('city_street','winter'),canal=view==='canal';
 k.box('winter pavement',0xc7d2d4,[0,-.1,-9],[28,.2,42]);k.box(canal?'frozen canal':'city road',canal?0xc8d8df:0x929fa4,[canal?-5:0,.01,-9],[canal?5:5.5,.025,42]);
 function block(x,z,w,h,d,color){k.box('city masonry building',color,[x,h/2,z],[w,h,d]);k.box('snow along parapet',0xdce5e4,[x,h+.04,z],[w+.12,.09,d+.12]);for(let xx=-w/2+.4;xx<w/2;xx+=.65)for(let y=1.1;y<h-.3;y+=.85){k.box('dark city window',0x536973,[x+xx,y,z+d/2+.01],[.34,.57,.03]);k.box('stone window sill',0xb1b1a5,[x+xx,y-.3,z+d/2+.05],[.42,.06,.08]);}k.box('shop front glazing',0x495c65,[x,.65,z+d/2+.04],[w*.78,1.15,.04]);}
 if(!canal){for(const side of [-1,1])for(let i=0;i<5;i++){const h=4.5+(i%3)*1.15;block(side*(4.2+(i%2)*.15),-3-i*4.3,2.8,h,4,[0x926b5c,0x9a9a8a,0x857e74,0x8f665b][(i+(side>0?1:0))%4]);k.box('raised sidewalk',0xb3bfc0,[side*3.1,.05,-9],[1,.1,29]);}
 block(0,-28,4,7.5,2,0x829aa4);
 for(let y=1;y<7.5;y+=.65)k.box('office horizontal glazing',0xa4b9c2,[0,y,-26.98],[3.8,.025,.04]);
 const shelter=k.group('bus shelter',[-3.3,0,2.2]);k.box('shelter roof',0x737e7e,[0,1.8,0],[2,.1,.8],shelter);for(const x of [-.9,.9])k.box('shelter post',0x657476,[x,.9,0],[.05,1.8,.05],shelter);k.bench([-3.3,0,2.1]);
 const rack=k.group('shop clothes rack',[-3.05,0,-1.5]);for(const x of [-.55,.55])k.beam('rack upright',0x7d8580,[x,.1,0],[x,1.25,0],.025,rack);k.beam('rack rail',0x7d8580,[-.55,1.25,0],[.55,1.25,0],.025,rack);for(let i=0;i<6;i++)k.box('hanging coat',[0x976f74,0x889a9a,0x9f947a][i%3],[-.45+i*.18,.88,0],[.14,.65,.16],rack);
 }else{for(let i=0;i<8;i++)block(-10+i*2.8,-14-(i%2)*2,2.4,2.7+(i%3)*1.1,2,[0x84969b,0x998d7a,0x718a94][i%3]);k.bench([-1.8,0,1.3],-.2);k.bareTree([.3,0,-.8],1.2);for(let z=-14;z<7;z+=1.6){k.beam('canal railing post',0x4d5d60,[-2.8,0,z],[-2.8,.64,z],.025);if(z<5.5)k.beam('canal handrail',0x4d5d60,[-2.8,.61,z],[-2.8,.61,z+1.6],.025);}k.lamp([1.2,1.9,-2.4],undefined,.3);k.beam('streetlamp pole',0x59666a,[1.2,0,-2.4],[1.2,1.9,-2.4],.035);}
 for(let i=0;i<12;i++)k.sphere('snow bank',0xd8dfd9,[(i%2?1:-1)*(2.6+i%3*.2),.07,4-i*2],[.55,.09,.3]);
 return k.finish();}
