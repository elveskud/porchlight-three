import * as THREE from 'three';
const textures=new Map();
export function paint(kind='plaster'){
 if(textures.has(kind))return textures.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#faf8f1';x.fillRect(0,0,256,256);
 let n=173;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 for(let i=0;i<1700;i++){const a=random()*256,b=random()*256;x.strokeStyle=`rgba(89,78,58,${.018+random()*.045})`;x.lineWidth=.4+random()*.7;x.beginPath();x.moveTo(a,b);if(kind==='wood')x.bezierCurveTo(a+20,b-3,a+65,b+4,a+100,b+random()*4);else if(kind==='cloth')x.lineTo(a+1,b+6);else x.lineTo(a+random()*3,b+random()*3);x.stroke();}
 if(kind==='cloth'){x.strokeStyle='rgba(74,68,61,.035)';for(let i=0;i<256;i+=4){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;textures.set(kind,t);return t;
}
export function radial(color='255,214,139'){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,`rgba(${color},.7)`);g.addColorStop(.35,`rgba(${color},.24)`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
export function skyTexture(night,sunset=false){
 const c=document.createElement('canvas');c.width=16;c.height=512;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,512);
 const colors=night?['#142a43','#294861','#67808b']:sunset?['#8caac2','#efbd87','#f4d5a0']:['#7fb8d2','#b0d7de','#e3e4be'];colors.forEach((v,i)=>g.addColorStop(i/2,v));ctx.fillStyle=g;ctx.fillRect(0,0,16,512);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
