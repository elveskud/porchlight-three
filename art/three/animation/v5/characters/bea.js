import {registerCharacter,retint} from '../cast.js';
import {ball,shape,shirt,collar} from './parts.js';
export function register(){registerCharacter('bea',{base:'bash',size:[.67,.67,.67],profile:{amp:.95,delay:.08,tilt:.045,tempo:1.22,breath:.85},extend:r=>{
 retint(r,{0x8a5a36:0xb77436,0xcfa070:0xe3af6e});shirt(r,0xe78fa9,0xc97290);r.refined.body.visible=false;
 shape(r.spine,'pink dress',[[-.52,1.18],[.52,1.18],[.67,.02],[-.67,.02]],0xe78fa9,-.27,.61);collar(r,0xeaa1b4);
 ball(r.head,'bow centre',0xeea3ba,[-.55,1.22,.15],[.1,.1,.08]);for(const side of [-1,1]){const bow=ball(r.head,'pink bow loop',0xeea3ba,[-.55+side*.16,1.22+side*.07,.12],[.17,.15,.06]);bow.rotation.z=side*.4;}
 r.root.userData.reference='art/gemini/characters/13_bea.jpg';}});}
