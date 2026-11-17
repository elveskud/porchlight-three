// Semantic palette sampled from the actual local paintings and cast sheets.
// See palette-evidence.json for quantized reference-image colors.
import * as THREE from 'three';
export const PALETTE={ink:'#28302c',water:'#77cfd5',sand:'#f9a004',grass:'#91bb4d',pine:'#29714f',pineShadow:'#215439',leaf:'#63913e',sky:'#ace7fe',wall:'#ddba97',wood:'#b37d57',sofa:'#c46c41',beanbag:'#4d774e',nightSky:'#17365a',nightInk:'#151e25'};
const C=hex=>new THREE.Color(hex);
export function referenceColor(mesh,original,{actor=false,face=false}={}){
 const name=mesh.name.toLowerCase(),color=original.clone();if(actor)return color;
 if(/curved lake water|lake water/.test(name))return C(PALETTE.water);
 if(/surface glint|water reflection|duck wake/.test(name))return C('#b4eef0');
 if(/fir canop/.test(name))return C(PALETTE.pine);
 if(/broadleaf canop|oak summer canopy|shore woodland shrub/.test(name))return C(PALETTE.leaf);
 if(/continuous.*terrain/.test(name))return C('#ffffff');
 if(/damp shoreline/.test(name))return C('#ddaa45');
 if(/walking path|approach|connecting path|lane|forest path/.test(name))return C('#d6bf85');
 if(/forest trunks|oak trunk|trunk/.test(name))return C('#78513c');
 if(/sofa base|sofa back|sofa arm/.test(name))return C(PALETTE.sofa);
 if(/sofa cushion/.test(name))return C('#df8547');
 if(/beanbag/.test(name))return C(PALETTE.beanbag);
 if(/back wall|left wall|right wall|room ceiling/.test(name))return C(PALETTE.wall);
 if(/floor slab|floorboard/.test(name))return C('#bd956c');
 if(/cloud puff/.test(name))return C('#f7fcf1');
 if(/forest hill|distant wooded ridge/.test(name))return C('#719d78');
 if(/shore.*stone|shore.*pebble/.test(name))return C('#919987');
 return color;
}
export function remapInstance(color,kind){
 if(kind==='fir'){const light=color.getHSL({}).l;return C(PALETTE.pine).lerp(C('#43844d'),Math.max(0,Math.min(1,(light-.10)*1.5)));}
 if(kind==='leaf')return C(PALETTE.leaf).lerp(C('#8ca54a'),color.getHSL({}).l*.8);
 return color;
}
