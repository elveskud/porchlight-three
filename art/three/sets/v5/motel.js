import {kit} from './kit.js';
export function build({mood='day'}={}){const k=kit('motel',mood),night=mood==='night';
 const shell=k.room(7,6,3,0xe8e3bf,0x929f9c,false);shell.getObjectByName('back wall').visible=false;for(const [x,y,w,h] of [[-2.875,1.5,1.25,3],[1.5,1.5,.7,3],[3.225,1.5,.55,3],[-.55,.6,3.4,1.2],[-.55,2.75,3.4,.5],[2.4,2.6,1.1,.8]])k.box('rear plaster around window',0xe8e3bf,[x,y,-3],[w,h,.05]);k.box('motel ceiling',0xb8bcb0,[0,3.06,0],[7,.1,6]);for(const x of [-3.4,3.4])k.box('brown ceiling trim',0x896b49,[x,2.9,0],[.06,.07,6]);k.box('brown rear trim',0x896b49,[0,2.9,-2.94],[7,.07,.06]);
 for(const z of [.9,-1]){const g=k.group('single teal bed',[-1.85,0,z]);k.box('wood bed frame',0x9a8258,[0,.18,0],[2.4,.25,1.15],g);k.box('mattress',0xc3d3c6,[0,.36,0],[2.35,.22,1.1],g);k.box('teal bedspread',0x547f82,[.2,.49,0],[1.92,.08,1.12],g);k.box('bedspread side',0x547f82,[.2,.3,.55],[1.92,.4,.04],g);k.sphere('teal pillow',0x618b8b,[-.87,.54,0],[.34,.1,.4],g);k.box('wood headboard',0x9a8258,[-1.23,.58,0],[.09,1.16,1.23],g);}
 k.table([-2.65,0,-.05],.55,.65,.55);k.cylinder('bedside lamp stem',0x8c8d7e,[-2.65,.8,-.05],.025,.4);k.mesh('cream bedside shade',new THREE.CylinderGeometry(.14,.22,.32,12),0xe4ddad,[-2.65,1.06,-.05]);
 const rearWindow=k.window([-.55,1.85,-2.92],3.4,1.3);rearWindow.getObjectByName('window frame').visible=false;for(const [x,y,w,h] of [[-1.76,0,.12,1.45],[1.76,0,.12,1.45],[0,.71,3.64,.12],[0,-.71,3.64,.12]])k.box('wood window surround',0x886944,[x,y,0],[w,h,.1],rearWindow);const glass=rearWindow.getObjectByName('glass');glass.material=glass.material.clone();glass.material.transparent=true;glass.material.opacity=.12;glass.material.depthWrite=false;k.box('dark wood window sill',0x876240,[-.55,1.14,-2.8],[3.68,.1,.25]);
 k.door([2.4,0,-2.84],undefined,0x765536,1.1,2.2);
 k.box('window air conditioner',0xb6aa88,[.5,.6,-2.65],[1.1,.6,.35]);for(let i=0;i<8;i++)k.box('air conditioner vent',0x555f58,[.05+i*.1,.72,-2.465],[.06,.17,.01]);
 k.table([2.6,0,1],1.4,.85,.72);k.seat([1.75,0,1],Math.PI/2);k.box('wall calendar',0xf0ebd5,[-3.41,1.65,-.2],[.04,.62,.45]);k.box('calendar picture',0x89a7ac,[-3.38,1.83,-.2],[.015,.22,.4]);
 for(const p of [[-1.6,0,2.2],[1.8,0,-2.1]])k.box('muted floor mat',0x59726b,[p[0],.008,p[2]],[1,.012,.55]);
 // The view is modelled, not a painted card.
 for(const x of [-2.6,1.5]){k.box('snowy neighbouring house',night?0x4b526c:0xb7beb5,[x,1.1,-7],[2,2.2,1.5]);k.box('snowy flat roof',0xd5dfe0,[x,2.25,-7],[2.1,.12,1.6]);k.window([x,1.3,-6.2],.7,.8,undefined,night);k.bareTree([x+.9,0,-5.6],.75);}
 k.box('street outside',night?0x59647e:0xb4c2c7,[0,-.12,-6],[12,.08,5]);if(night)k.lamp([-2.65,.98,-.05],undefined,3);
 return k.finish();}
import * as THREE from 'three';
