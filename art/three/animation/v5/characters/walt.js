import {registerCharacter,retint} from '../cast.js';
import {box,line,hide,shirt,trousers,colour} from './parts.js';
export function register(){registerCharacter('walt',{base:'riot',size:[1.08,1.1,1.05],profile:{amp:.6,delay:.25,tilt:.02,tempo:.9,breath:1.2},extend:r=>{
 retint(r,{0xff6a00:0xc87b39,0xf7e3bd:0xe8dfb8,0x8f1228:0xd5b88a});r.head.traverse(o=>{if(o.isMesh&&o.material?.color?.getHex()===0xffd400)o.visible=false;});hide(r,/cat-eye glasses|glasses temple|glasses bridge|pocket|zipper/);shirt(r,0x7c8049,0x62683d);trousers(r,0x6e5639);
 for(const b of r.face.brows)b.traverse(o=>colour(o,0xa9a18a));
 box(r.spine,'white shoulder towel',0xe7e7d8,[.42,1.02,.36],[.23,.65,.075]);box(r.spine,'towel over shoulder',0xe7e7d8,[.42,1.28,.03],[.25,.09,.65]);box(r.spine,'towel at back',0xe7e7d8,[.42,1.02,-.3],[.23,.5,.065]);for(const x of [.34,.48])line(r.spine,'towel seam',[[x,.73,.402],[x,1.24,.402]],0xbfc4b4,.006);
 for(const side of [-1,1])for(let i=0;i<3;i++)line(r.head,'short grey whisker',[[side*(.18+i*.08),.23,.425],[side*(.2+i*.08),.25,.428]],0x8a8877,.005);
 r.root.userData.reference='art/gemini/characters/03_walt.jpg';}});}
