import * as THREE from 'three';
import {registerCharacter,retint} from '../cast.js';
import {mesh,ball,box,line,shape,shirt,trousers,collar,buttons} from './parts.js';
export function register(){registerCharacter('hal',{base:'bash',size:[1.22,1.18,1.15],profile:{amp:.72,delay:.32,tilt:.012,tempo:.72,breath:1.4},extend:r=>{
 retint(r,{0x8a5a36:0x5c4939,0xcfa070:0x9f7e57});shirt(r,0x63804f,0x4c653b);trousers(r,0xb29768);collar(r,0x63804f);buttons(r,0x3c4f35);
 mesh(r.head,'ranger hat brim',new THREE.CylinderGeometry(.96,.96,.055,36),0x8b8b58,[0,1.25,-.02]);mesh(r.head,'ranger hat crown',new THREE.CylinderGeometry(.48,.63,.45,8),0x8b8b58,[0,1.48,-.04]);mesh(r.head,'dark ranger hat band',new THREE.CylinderGeometry(.605,.64,.08,24),0x55583b,[0,1.31,-.04]);
 for(const side of [-1,1])line(r.head,'hat chin cord',[[side*.7,1.2,.1],[side*.57,.18,.23],[0,-.05,.3]],0x424335,.012);
 shape(r.spine,'ranger badge',[[.26,.93],[.38,.95],[.42,.86],[.4,.75],[.3,.7],[.23,.79]],0xbcc28d,.345,.02);line(r.spine,'ranger shirt opening',[[0,1.05,.34],[0,.08,.34]],0x3c5638,.008);
 r.root.userData.reference='art/gemini/characters/04_big_hal.jpg';}});}
