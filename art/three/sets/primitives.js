import * as THREE from 'three';

// Scene-local ownership: switching sets disposes these materials, textures and geometries.
export function createKit(root, mood) {
  const materials = new Map();
  const textures = new Set();
  const night = ['night','storm'].includes(mood);
  const ink = new THREE.LineBasicMaterial({color:0x292b2d, transparent:true, opacity:0.48});
  const material = (color, options = {}) => {
    const key = `${color}/${JSON.stringify(options)}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness:0.86, ...options}));
    return materials.get(key);
  };
  function group(name, p = [0,0,0], parent = root) {
    const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g;
  }
  function mesh(name, geometry, color, p, size, parent = root, options = {}) {
    const m = new THREE.Mesh(geometry, material(color, options.material));
    m.name = name; m.position.set(...p);
    if (size) m.scale.set(...size);
    m.castShadow = options.shadow !== false; m.receiveShadow = true;
    if (options.rotation) m.rotation.set(...options.rotation);
    if (options.ink !== false) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), ink);
      e.name = `${name} · outline`; m.add(e);
    }
    parent.add(m); return m;
  }
  const box = (name, color, p, size, parent = root, options) => mesh(name, new THREE.BoxGeometry(1,1,1), color, p, size, parent, options);
  const sphere = (name, color, p, size, parent = root) => mesh(name, new THREE.SphereGeometry(1,12,8), color,p,size,parent,{ink:false});
  const cylinder = (name,color,p,r,h,parent=root) => mesh(name,new THREE.CylinderGeometry(r,r,h,12),color,p,null,parent,{ink:false});
  function beam(name, color, a, b, thickness = 0.07, parent = root) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
    const m = cylinder(name,color,av.clone().add(bv).multiplyScalar(.5).toArray(),thickness,av.distanceTo(bv),parent);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize()); return m;
  }
  function torus(name,color,p,r,t,parent=root,rot=[0,0,0]) {
    return mesh(name,new THREE.TorusGeometry(r,t,6,24),color,p,null,parent,{rotation:rot,ink:false});
  }
  function plane(name,color,p,w,h,parent=root,rot=[0,0,0]) {
    return mesh(name,new THREE.PlaneGeometry(w,h),color,p,null,parent,{rotation:rot,ink:false,shadow:false});
  }
  function label(name,text,p,w,h,bg='#f2e6c7',fg='#3b453c',parent=root) {
    const canvas=document.createElement('canvas'); canvas.width=768; canvas.height=384;
    const c=canvas.getContext('2d'); c.fillStyle=bg; c.fillRect(0,0,768,384);
    c.fillStyle=fg; c.textAlign='center'; c.textBaseline='middle';
    const lines=text.split('\n'); c.font=`600 ${Math.min(95,600/Math.max(...lines.map(l=>l.length)))}px Georgia`;
    lines.forEach((line,i)=>c.fillText(line,384,192+(i-(lines.length-1)/2)*110));
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; textures.add(texture);
    const m=plane(name,0xffffff,p,w,h,parent); m.material=new THREE.MeshBasicMaterial({map:texture}); return m;
  }
  function photo(name,url,p,w,h,parent=root) {
    box(`${name} frame`,0x725037,p,[w+.13,h+.13,.08],parent);
    const t=new THREE.TextureLoader().load(url,undefined,undefined,()=>{root.userData.assetErrors.push(url);});
    t.colorSpace=THREE.SRGBColorSpace; textures.add(t);
    const m=plane(name,0xffffff,[p[0],p[1],p[2]+.046],w,h,parent);
    m.material=new THREE.MeshBasicMaterial({map:t}); return m;
  }
  function lamp(p,parent=root,intensity=night?16:4) {
    cylinder('lantern support',0x34383c,[p[0],p[1]+.25,p[2]],.045,.5,parent);
    box('lantern glass',0xffdda0,p,[.23,.35,.23],parent,{material:{emissive:0xffba52,emissiveIntensity:night?1:0.2}});
    box('lantern cap',0x34383c,[p[0],p[1]+.22,p[2]],[.35,.07,.35],parent);
    const light=new THREE.PointLight(0xffd396,intensity,9,2); light.position.set(...p); light.name='practical light';
    light.userData.practical=true; parent.add(light); return light;
  }
  function plant(p,scale=1,flowers=false,parent=root) {
    const g=group(flowers?'flower pot':'potted plant',p,parent); g.scale.setScalar(scale);
    mesh('terracotta pot',new THREE.CylinderGeometry(.28,.2,.45,12),0xb96a43,[0,.23,0],null,g);
    for(let i=0;i<5;i++) {
      const a=i*2.4; beam('stem',0x567642,[0,.4,0],[Math.cos(a)*.25,.85+(i%2)*.15,Math.sin(a)*.25],.025,g);
      sphere(flowers?'flower':'leaf',flowers?[0xdc6d79,0xf6d68d,0xb794d1][i%3]:0x618945,[Math.cos(a)*.25,.82+(i%2)*.15,Math.sin(a)*.25],flowers?[.14,.1,.14]:[.13,.3,.08],g);
    }
    return g;
  }
  function table(p,w=2.4,d=1.2,height=.95,parent=root) {
    const g=group('wood table',p,parent); box('tabletop',0xa67444,[0,height,0],[w,.13,d],g);
    for(const x of [-w/2+.13,w/2-.13]) for(const z of [-d/2+.13,d/2-.13]) box('table leg',0x755136,[x,height/2,z],[.12,height,.12],g);
    return g;
  }
  function chair(p,rotation=0,parent=root,folding=false) {
    const g=group(folding?'folding chair':'wood chair',p,parent); g.rotation.y=rotation;
    const wood=folding?0x8b8269:0x916d48, frame=folding?0x555d58:0x755136;
    box('seat',wood,[0,.53,0],[.61,.1,.57],g);
    box('chair back',wood,[0,.99,-.23],[.61,.48,.09],g);
    for(const x of [-.24,.24]) for(const z of [-.22,.22]) {
      if(folding) beam('folding leg',frame,[x,.03,z*1.5],[x,.76,-z],.028,g);
      else box('chair leg',frame,[x,.27,z],[.07,.54,.07],g);
    }
    if(folding) for(const x of [-.28,.28]) beam('back support',frame,[x,.5,-.25],[x,1.2,-.25],.025,g);
    return g;
  }
  function bench(p,rotation=0,parent=root) {
    const g=group('park bench',p,parent); g.rotation.y=rotation;
    for(let i=0;i<4;i++) box('bench slat',0x9a7347,[0,.55,i*.14-.21],[2.2,.08,.11],g);
    for(let i=0;i<3;i++) box('back slat',0x9a7347,[0,.87+i*.16,-.33],[2.2,.11,.07],g);
    for(const x of [-.85,.85]) {box('bench support',0x3f4940,[x,.27,0],[.08,.54,.5],g); box('back support',0x3f4940,[x,.86,-.36],[.07,.85,.07],g);}
    return g;
  }
  function tree(p,scale=1,pine=false,parent=root) {
    const g=group(pine?'fir tree':'summer tree',p,parent); g.scale.setScalar(scale);
    cylinder('trunk',0x79583e,[0,1.1,0],.18,2.2,g);
    if(pine) for(let i=0;i<3;i++) mesh('fir crown',new THREE.ConeGeometry(1.05-i*.19,1.6,7),[0x426a46,0x365c41,0x4d784b][i],[0,1.6+i*.7,0],null,g,{ink:false});
    else {
      beam('branch',0x79583e,[0,1,0],[-.7,2.4,0],.1,g); beam('branch',0x79583e,[0,1.3,0],[.7,2.5,.1],.11,g);
      for(let i=0;i<5;i++) sphere('leaf canopy',[0x658f46,0x739e4b,0x577d3e][i%3],[Math.cos(i*1.5)*.8,2.6+(i%2)*.35,Math.sin(i*1.5)*.6],[1.05,.85,.9],g);
    }
    return g;
  }
  function window(p,w=1.6,h=1.8,parent=root,glow=false) {
    const g=group('window',p,parent);
    box('window frame',0xe5dbc0,[0,0,0],[w+.16,h+.16,.1],g);
    box('glass',night?0x233b62:0x9ecbd8,[0,0,.06],[w,h,.04],g,{material:glow?{emissive:0xffd47c,emissiveIntensity:.7}: {}});
    box('window mullion',0xdfd8be,[0,0,.095],[.055,h,.05],g);
    box('window crossbar',0xdfd8be,[0,0,.095],[w,.055,.05],g);
    return g;
  }
  function door(p,parent=root,color=0x37637b,w=1.25,h=2.5) {
    const g=group('entrance door',p,parent);
    box('door frame',0xe9ddbf,[0,h/2,-.03],[w+.22,h+.16,.12],g);
    box('doorway shadow',0x1f292a,[0,h/2,.04],[w,h,.03],g);
    const hinge=group('door hinge',[-w/2,0,.09],g); hinge.userData.interactive='door';
    box('door leaf',color,[w/2,h/2,0],[w,h,.1],hinge);
    for(const y of [h*.28,h*.72]) box('door panel',color,[w/2,y,.065],[w*.73,h*.32,.035],hinge);
    sphere('brass door knob',0xd6ae65,[w-.15,h*.47,.14],[.06,.06,.06],hinge);
    return hinge;
  }
  function anchor(name,p,parent=root) {
    const g=group(name,p,parent); g.userData.anchor=true;
    root.userData.anchors.push({name,position:g.getWorldPosition(new THREE.Vector3()).toArray()});
    const m=mesh('anchor marker',new THREE.RingGeometry(.15,.2,24),0xeeb455,[0,.025,0],null,g,{rotation:[-Math.PI/2,0,0],ink:false,shadow:false,material:{side:THREE.DoubleSide}});
    m.userData.marker=true; m.visible=false; return g;
  }
  function room(w=10,d=8,h=4,wall=0xe5d0a0,floor=0xb88d5b,boards=true) {
    const g=group('room shell');
    box('floor slab',floor,[0,-.1,0],[w,.2,d],g);
    plane('back wall',wall,[0,h/2,-d/2],w,h,g);
    plane('left wall',wall,[-w/2,h/2,0],d,h,g,[0,Math.PI/2,0]);
    plane('right wall',wall,[w/2,h/2,0],d,h,g,[0,-Math.PI/2,0]);
    if(boards)for(let x=-w/2+.16;x<w/2;x+=.32) box('floorboard seam',0x8f704c,[x,.005,0],[.012,.008,d],g,{ink:false});
    box('back skirting',0x8a6745,[0,.17,-d/2+.04],[w,.32,.07],g);
    return g;
  }
  return {root,night,group,mesh,box,sphere,cylinder,beam,torus,plane,label,photo,lamp,plant,table,chair,bench,tree,window,door,anchor,room,textures};
}
