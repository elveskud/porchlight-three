import {registerCharacter,retint} from '../cast.js';
import {box,ball,line,shirt,collar,buttons} from './parts.js';
export function register(){registerCharacter('pipmom',{base:'pip',size:[1.03,1.06,1.02],profile:{amp:.48,delay:.2,tilt:.025,tempo:.86,breath:1.15},extend:r=>{
 retint(r,{0xe7e2ee:0xe3e2c8,0xeae6f0:0xe3e2c8,0xf6a0bd:0xc6c5ac,0xf09bb9:0x8f9584,0xf3aac2:0xe3e2c8,0xffffff:0xf0edda,0x82798a:0x777d6b});shirt(r,0x3e9691,0x2b726f);collar(r);buttons(r,0x344e47);
 box(r.spine,'charcoal skirt',0x777f78,[0,.1,.02],[1.16,.65,.6]);line(r.spine,'cardigan opening',[[0,1.05,.34],[0,.12,.34]],0x2f6e68,.01);
 for(const leg of [r.legL,r.legR])ball(leg.foot,'brown flat shoe',0x6c5036,[0,-.01,.08],[.25,.12,.3]);
 r.root.userData.reference='art/gemini/characters/10_pips_mom.jpg';}});}
