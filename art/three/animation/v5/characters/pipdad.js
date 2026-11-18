import {registerCharacter,retint} from '../cast.js';
import {shape,shirt,collar,buttons,glasses,line} from './parts.js';
export function register(){registerCharacter('pipdad',{base:'pip',size:[1.08,1.1,1.03],profile:{amp:.5,delay:.23,tilt:.018,tempo:.85,breath:1.2},extend:r=>{
 retint(r,{0xe7e2ee:0xdedfc9,0xeae6f0:0xdedfc9,0xf6a0bd:0xb8bfab,0xf09bb9:0x8b9681,0xf3aac2:0xdedfc9,0xffffff:0xe9e9d4,0x82798a:0x6d7968});shirt(r,0xb5ccde,0x8dabbf);collar(r,0xb5ccde);
 shape(r.spine,'brown waistcoat left',[[-.55,1.2],[-.23,1.2],[0,.94],[0,.12],[-.28,.01],[-.58,.15]],0x8e7655,.31,.055);shape(r.spine,'brown waistcoat right',[[.55,1.2],[.23,1.2],[0,.94],[0,.12],[.28,.01],[.58,.15]],0x8e7655,.31,.055);shape(r.spine,'waistcoat back',[[-.57,1.2],[.57,1.2],[.57,.12],[-.57,.12]],0x8e7655,-.32,.04);buttons(r,0x594d37);glasses(r,0x718477,.13,.55);
 for(const side of [-1,1])line(r.spine,'waistcoat pocket',[[side*.2,.36,.38],[side*.45,.4,.38]],0x5f533d,.008);
 r.root.userData.reference='art/gemini/characters/11_pips_dad.jpg';}});}
