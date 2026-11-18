import {registerCharacter,retint} from '../cast.js';
import {ball,box,shape,line,hide,shirt,glasses,colour} from './parts.js';
export function register(){registerCharacter('ledger',{base:'mayor',size:[1.04,1.02,1.02],profile:{amp:.38,delay:.26,tilt:.012,tempo:.8,breath:1.2},extend:r=>{
 retint(r,{0xa9afa1:0xcd8b3e,0xd8d9c9:0xe7c780,0x3b506f:0x3f6d3d,0x2f3f5c:0x315a34,0xd7d4be:0xe7c780});hide(r,/mayor sash|sash gold border|pearl necklace/);shirt(r,0x3f6d3d,0x315a34);colour(r.spine.getObjectByName('mayor skirt'),0x7e7b6d);
 shape(r.head,'black calico face patch',[[-.78,1.15],[-.08,1.25],[-.08,.65],[-.3,.42],[-.7,.33],[-.86,.55]],0x333832,.355,.012);
 shape(r.head,'cream forehead blaze',[[-.06,1.2],[.08,1.22],[.18,.58],[-.04,.47]],0xe9c77e,.375,.012);
 ball(r.head,'black calico back patch',0x333832,[-.23,.77,-.3],[.48,.57,.08]);ball(r.head,'orange back patch',0xcd8b3e,[.35,.85,-.35],[.24,.34,.055]);
 r.head.traverse(o=>{if(o.name==='cat ear'){o.geometry.computeBoundingBox();if(o.geometry.boundingBox.max.x<0)colour(o,0x333832);}});
 glasses(r,0x59625a,.15,.54);for(const side of [-1,1])line(r.head,'spectacle chain',[[side*.49,.55,.46],[side*.58,.21,.3],[side*.53,-.17,.16],[side*.34,-.24,.18]],0x54594b,.008);
 box(r.spine,'calico grey skirt',0x7e7b6d,[0,.1,.01],[1.22,.65,.62]);line(r.spine,'cardigan opening',[[0,1.1,.35],[0,.2,.35]],0x294e2b,.009);
 // Existing mayor rig hides its tail: a calico tail follows the pelvis, with the same rounded silhouette as the sheet.
 line(r.pelvis,'calico tail orange',[[0,.48,-.28],[.25,.18,-.56],[.42,.1,-.72],[.65,.24,-.8]],0xcd8b3e,.09);ball(r.pelvis,'calico tail black tip',0x333832,[.65,.24,-.8],[.15,.1,.1]);
 r.root.userData.reference='art/gemini/characters/16_ms_ledger.jpg';}});}
