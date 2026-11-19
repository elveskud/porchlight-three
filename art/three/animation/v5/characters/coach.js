import * as THREE from 'three';
import {registerCharacter,retint} from '../cast.js';
import {ball,box,line,mesh,shirt,trousers} from './parts.js';
export function register(){registerCharacter('coach',{base:'bash',size:[1.03,1.12,1.02],profile:{amp:.88,delay:.13,tilt:.025,tempo:1.05,breath:1},extend:r=>{
 retint(r,{0x8a5a36:0x775f47,0xcfa070:0xb3b7aa});shirt(r,0x303e60,0x24304d);trousers(r,0x303e60);for(const e of r.ears)e.scale.multiplyScalar(.63);
 r.tail.chain[0].visible=false;line(r.pelvis,'long otter tail',[[0,.44,-.22],[.15,.1,-.5],[.38,-.1,-.85],[.75,-.1,-1.1]],0x775f47,.12);
 box(r.spine,'track jacket collar',0x303e60,[0,1.14,.025],[.9,.29,.65]);line(r.spine,'white jacket zip',[[0,1.23,.37],[0,.04,.34]],0xc8d2d4,.013);
 for(const side of [-1,1]){for(const offset of [-.035,.035]){line(side<0?r.armL.sh:r.armR.sh,'white tracksuit sleeve stripe',[[side*.11+offset,-.03,.11],[side*.12+offset,-.4,.11]],0xd4d9d4,.012);line(side<0?r.armL.el:r.armR.el,'white tracksuit lower sleeve stripe',[[side*.1+offset,-.04,.11],[side*.1+offset,-.4,.11]],0xd4d9d4,.012);}line(r.spine,'stopwatch neck cord',[[side*.25,1.2,.39],[side*.12,.62,.4],[0,.45,.43]],0xd4d3c4,.009);}
 mesh(r.spine,'silver stopwatch rim',new THREE.TorusGeometry(.13,.02,8,36),0xcbd0c9,[0,.43,.44]);ball(r.spine,'stopwatch face',0xe0e3d6,[0,.43,.44],[.12,.12,.02]);line(r.spine,'stopwatch hand',[[0,.43,.468],[.02,.51,.468]],0x4b5655,.007);
 r.root.userData.reference='art/gemini/characters/15_coach_reyes.jpg';}});}
