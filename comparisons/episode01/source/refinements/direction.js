import * as THREE from 'three';
import {reach} from './cast.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp;
function item(p,n,g,c,xyz,size){const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.9}));m.name=n;m.position.set(...xyz);if(size)m.scale.set(...size);p.add(m);return m;}
export function installProps(actors){
 const phone=actors.riot.phone;phone.removeFromParent();actors.riot.hands.L.wrist.add(phone);phone.position.set(0,-.04,.10);phone.rotation.set(.05,0,0);
 const bag=new THREE.Group();bag.name='Rocco red snack packet';actors.rocco.hands.L.wrist.add(bag);bag.position.set(0,-.03,.065);bag.rotation.z=.12;
 item(bag,'folded snack packet',new THREE.BoxGeometry(.23,.35,.09),0xb7443c,[0,-.08,0]);item(bag,'packet folded top',new THREE.BoxGeometry(.24,.035,.10),0x8d302c,[0,.10,0]);
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.035:.074;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(!i)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();item(bag,'packet star',new THREE.ShapeGeometry(shape),0xedc96c,[0,-.08,.048]);
 const biscuit=item(actors.rocco.hands.R.wrist,'held cracker',new THREE.CylinderGeometry(.07,.07,.025,8).rotateX(Math.PI/2),0xd9b777,[0,-.12,.055]);
 return {phone,bag,biscuit};
}
export function actProps({actors,props,t,e,b}){
 const riot=actors.riot,rocco=actors.rocco;
 const reading=b.id==='mlt1'&&t>62&&t<65.2||b.id==='mlt2'&&t>83.3&&t<87.5||b.id==='score'&&t<103.1;
 props.phone.visible=riot.root.visible&&reading;
 if(props.phone.visible){reach(riot,'L',riot.spine.localToWorld(V(-.35,.84,.72)));riot.hands.L.fingers.forEach(f=>f.rotation.x=-.85);riot.head.rotation.x=.10;riot.face.pupils.forEach(p=>p.position.y=-.025);}
 props.bag.visible=rocco.root.visible;props.biscuit.visible=false;
 if(rocco.root.visible){
  reach(rocco,'L',rocco.spine.localToWorld(V(-.37,.22,.42)));rocco.hands.L.fingers.forEach(f=>f.rotation.x=-.75);
  if(e?.who==='rocco'&&e.do==='munch'){
   const age=t-e.start,u=clamp(age/.32,0,1),v=rocco.spine.localToWorld(V(mix(.24,.05,u),mix(.35,1.48,u),mix(.42,.53,u)));reach(rocco,'R',v);props.biscuit.visible=true;rocco.hands.R.fingers.forEach(f=>f.rotation.x=-.6);
  }
 }
}
export function compose(camera,t,b,e,positioned){
 const set=(p,target,fov)=>{camera.position.copy(p);camera.fov=fov;camera.lookAt(target);camera.updateProjectionMatrix();};
 const face=r=>r.head.localToWorld(V(0,.65,.37));
 const pair=(a,b,dist=4.8)=>{const x=face(a),y=face(b),m=x.clone().add(y).multiplyScalar(.5);set(V(m.x+.15,m.y+.20,m.z+dist),V(m.x,m.y-.12,m.z),38);};
 if(e?.camera?.startsWith('close:')&&positioned[e.who]){
  const who=e.who;
  if((who==='bash'||who==='pip')&&positioned.bash&&positioned.pip)pair(positioned.bash,positioned.pip,4.25);
  else if(b.location==='apartment'&&positioned.riot&&positioned.rocco)pair(positioned.riot,positioned.rocco,4.7);
  else{const h=face(positioned[who]);set(V(h.x+.20,h.y+.18,h.z+3.7),V(h.x,h.y-.06,h.z),35);}
 }else if(e?.camera?.startsWith('two:')&&positioned.bash&&positioned.pip&&e.camera.includes('bash'))pair(positioned.bash,positioned.pip,4.6);
 else if(e?.camera?.startsWith('ots:')&&positioned.rocco&&positioned.riot){pair(positioned.riot,positioned.rocco,4.7);}
 else if(b.id==='alone')set(V(-.05,1.88,5.4),V(2.25,1.42,-.1),39);
 // A very small motivated push during the quiet memory; positions are absolute and seek-safe.
 if(b.id==='alone'){const k=clamp((t-b.start)/(b.end-b.start),0,1);camera.position.z-=k*.18;camera.updateProjectionMatrix();}
 if(b.id==='hill')set(V(8,4.8,10-(t-b.start)*.09),V(13.4,5.2,-28),32);
}
