import * as THREE from 'three';
import {buildLakeWorld} from './lake-world/index.js';

export function exteriors(k) {
  const {root,night,group,mesh,box,sphere,cylinder,beam,torus,label,lamp,plant,table,chair,bench,tree,window,door,anchor}=k;
  const terrain=(color=0x83a65b,size=100)=>box('land',color,[0,-.25,0],[size,.4,size],root,{ink:false});
  function water(p=[0,-.015,-13],w=48,d=22) {
    box('lake water',night?0x355b7e:0x59b5cf,p,[w,.09,d],root,{ink:false,material:{roughness:.3,metalness:.08}});
    for(let i=0;i<26;i++) box('water reflection',night?0x648aa0:0xb8e6df,[-w/2+1+(i*7.39)%(w-2),p[1]+.052,p[2]-d/2+1+(i*3.71)%(d-2)],[.5+(i%4)*.42,.006,.025],root,{ink:false});
  }
  function reeds(x,z,n=8) {
    const g=group('reed bed',[x,0,z]);
    for(let i=0;i<n;i++) {const xx=Math.sin(i*2.4)*.55,zz=Math.cos(i*2.4)*.35,h=.65+(i%3)*.14;
      beam('reed stem',0x77783c,[xx,0,zz],[xx+.09,h,zz],.018,g);cylinder('cattail',0x8c5931,[xx+.09,h,zz],.045,.22,g);
    }
  }
  function hills() {
    for(let i=0;i<7;i++)sphere('forest hill',i%2?0x6c985a:0x82a260,[-26+i*9,-.4,-30-(i%2)*3],[8,3+(i%3),5]);
    for(let i=0;i<27;i++)tree([-29+i*2.3,0,-25-Math.sin(i)*2],.9+(i%5)*.14,true);
  }
  function cottage(p,color=0xc7b883,scale=1) {
    const g=group('far shore cottage',p);g.scale.setScalar(scale);
    box('house walls',color,[0,1,0],[2,2,1.8],g);
    mesh('pitched roof',new THREE.ConeGeometry(1.65,1,4),0x785f50,[0,2.5,0],null,g,{rotation:[0,Math.PI/4,0]});
    window([-.45,1,.94],.5,.65,g,night);window([.45,1,.94],.5,.65,g,night);return g;
  }
  function roof(g,w,d,y,color=0x61584a) {
    const sh=new THREE.Shape();sh.moveTo(-d/2,0);sh.lineTo(0,d*.3);sh.lineTo(d/2,0);sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-w/2,y,0);
    mesh('gable roof',geo,color,[0,0,0],null,g);
  }
  function oldHall(p=[0,0,-2],scale=1) {
    const g=group('old festival hall',p);g.scale.setScalar(scale);
    box('timber building',0x8b7957,[0,1.8,0],[8,3.6,5],g);
    for(let y=.25;y<3.6;y+=.24)box('weatherboard',0x6f6047,[0,y,2.51],[8,.024,.04],g,{ink:false});roof(g,9,6,3.6);
    for(const x of [-3,-1.8,1.8,3]) {
      window([x,1.95,2.59],.85,1.35,g);
      for(let j=0;j<3;j++)box('boarded window',0x5e503e,[x,1.5+j*.38,2.72],[1,.13,.06],g,{rotation:[0,0,j%2?.12:-.1]});
    }
    const entry=door([0,.42,2.62],g,0x735332,1.5,2.35);entry.name='hall door hinge';
    box('front porch',0x8b7658,[0,.22,3.22],[8.4,.44,1.5],g);
    for(const x of [-3.9,-1.1,1.1,3.9])box('porch post',0x796647,[x,1.9,3.7],[.12,3,.12],g);
    for(let i=0;i<4;i++)box('hall step',0x9a865f,[0,.08+i*.1,5.1-i*.35],[2.8,.16+i*.2,.46],g);
    box('cupola base',0x93815d,[0,5.4,-.2],[1.15,1.25,1.1],g);
    for(const x of [-.27,0,.27])box('cupola louvre',0x494537,[x,5.45,.37],[.1,.57,.08],g);
    mesh('cupola roof',new THREE.ConeGeometry(1,1,4),0x625c4d,[0,6.5,-.2],null,g,{rotation:[0,Math.PI/4,0]});anchor('hall_door',[0,.45,3.3],g);return g;
  }
  function lake(s) {
    const landscape=buildLakeWorld(k,s);
    for(let i=0;i<5;i++){const x=9+i*3;cottage([x,landscape.groundHeight(x,-23),-23],[0xe7d9aa,0xc87762,0x9bad90][i%3],.8);}
    oldHall([15,4.8,-30],.63);
    const dock=group('wooden swimming dock',[-5,.15,-3.5]);
    for(let i=0;i<18;i++)box('dock plank',0xb58c4e,[0,0,i*.25-2.2],[2.1,.12,.22],dock);
    for(const x of [-.85,.85])for(const z of [-2,1.8])cylinder('dock piling',0x7d6343,[x,-.25,z],.09,1,dock);
    const tower=group('lifeguard lookout',[-6.2,0,-.8]);
    for(const x of [-1.1,1.1])for(const z of [-.8,.8]) {
      box('lookout post',0xa8844a,[x,1.8,z],[.14,3.6,.14],tower);
      beam('lookout cross brace',0x9e7942,[x,.2,-.8],[x,2.2,.8],.045,tower);
    }
    box('lookout deck',0xc6aa6d,[0,2.35,0],[2.6,.16,2.1],tower);
    for(let i=0;i<9;i++)box('deck board',0x9c7d49,[-1.15+i*.28,2.44,0],[.014,.008,2.05],tower,{ink:false});
    for(const x of [-1.15,1.15]) {box('lookout rail',0xeee4c4,[x,3.1,0],[.08,.08,1.9],tower);for(let z=-.75;z<=.75;z+=.5)box('rail baluster',0xded4b1,[x,2.76,z],[.06,.65,.06],tower);}
    for(const x of [-.9,-.3,.3,.9])box('back baluster',0xe8ddbc,[x,2.8,-.86],[.06,.72,.06],tower);
    box('back rail',0xeee4c4,[0,3.16,-.86],[2.4,.08,.08],tower);
    mesh('red lookout canopy',new THREE.ConeGeometry(1.9,1.1,8),0xc74f47,[0,4.15,0],null,tower);
    for(let i=0;i<4;i++)mesh('cream canopy stripe',new THREE.ConeGeometry(1.912,1.102,1,1,true,i*Math.PI/2,Math.PI/4),0xf4ebd2,[0,4.15,0],null,tower,{ink:false,material:{side:THREE.DoubleSide}});
    for(const x of [-.38,.38])beam('ladder rail',0xc3a36b,[x,.05,2.2],[x,2.5,.68],.05,tower);
    for(let i=0;i<8;i++)beam('ladder rung',0xe2c187,[-.38,.2+i*.3,2.1-i*.18],[.38,.2+i*.3,2.1-i*.18],.04,tower);
    anchor('tower',[0,2.45,0],tower);
    const canoe=group('red canoe',[1,.18,-1.7]);canoe.rotation.y=-.15;
    const sh=new THREE.Shape();sh.moveTo(-1.8,0);sh.quadraticCurveTo(0,-.9,1.8,0);sh.quadraticCurveTo(0,.9,-1.8,0);
    const hull=new THREE.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.07,bevelThickness:.05});hull.rotateX(-Math.PI/2);
    mesh('canoe hull',hull,0xc34c3f,[0,0,0],null,canoe);sphere('canoe interior',0x896d46,[0,.37,0],[1.5,.04,.45],canoe);
    for(const x of [-.65,.65])box('canoe seat',0xc9aa70,[x,.42,0],[.16,.06,.78],canoe);beam('paddle',0xcba86e,[-1,.5,-.5],[1,.5,.5],.04,canoe);
    for(const [x,z] of [[-2,1],[4,0],[6,1],[-9,1],[8,-1]])reeds(x,z,7);
    for(const [x,z] of [[-8,1.8],[-7.2,1.5],[7,1.3]])sphere('shore stone',0x949e93,[x,.25,z],[.6,.4,.45]);
    anchor('sand_rocco',[-2,0,2]);anchor('shore_bash',[1,0,2.6]);anchor('shore_pip',[3,0,2.2]);
    if(s.mood==='storm')lamp([12,1.2,-22],root,12);
    landscape.groundBuildings();
    return landscape.cameras;
  }
  function bicycle(p,rotation=0,parent=root) {
    const g=group('bicycle',p,parent);g.rotation.y=rotation;
    for(const x of [-.65,.65]) {torus('bicycle tyre',0x303c38,[x,.5,0],.44,.045,g);torus('wheel rim',0xa7b3ad,[x,.5,0],.37,.018,g);}
    for(const [a,b] of [[[0,.55,0],[-.65,.5,0]],[[0,.55,0],[.25,1.13,0]],[[.25,1.13,0],[-.65,.5,0]],[[.25,1.13,0],[.65,.5,0]],[[-.4,1.12,0],[-.65,.5,0]],[[-.4,1.12,0],[.25,1.13,0]]])beam('cycle frame',0x425f58,a,b,.028,g);
    box('bicycle saddle',0x49423c,[.25,1.18,0],[.32,.08,.15],g);beam('handlebar',0x707d73,[-.4,1.12,0],[-.45,1.38,0],.025,g);return g;
  }
  function railing(p,width,parent=root) {
    const g=group('porch railing',p,parent);box('handrail',0xd5dbca,[0,1,0],[width,.12,.12],g);
    for(let x=-width/2+.1;x<width/2;x+=.24)box('baluster',0xbec6b8,[x,.55,0],[.045,.95,.045],g);return g;
  }
  function stoop() {
    terrain(0xc4b29d,90);box('street',night?0x58636f:0x8c8677,[-8,-.02,0],[10,.12,65],root,{ink:false});box('raised sidewalk',0xc8c1ad,[0,.07,0],[7,.25,40],root,{ink:false});
    const g=group('brick apartment facade',[2,0,-2]);box('brick house',0xb65e46,[0,4,-1],[7,8,4],g);
    for(let y=.3;y<8;y+=.27)for(let x=-3.4;x<3.5;x+=.75)box('brick mortar',0xcf8765,[x+(Math.round(y/.27)%2)*.3,y,1.012],[.7,.018,.008],g,{ink:false});
    for(const y of [1.2,4.8,7])for(const x of [-2.4,1.9])window([x,y,1.07],1,1.5,g,night&&y>4);door([0,.6,1.11],g,0x335c71,1.4,2.6);
    for(let i=0;i<3;i++)box('broad stoop step',0xae8b5a,[0,.1+i*.19,2.4-i*.45],[3.3,.2+i*.38,.55],g);box('door landing',0xb59665,[0,.48,1.4],[3.3,.23,.8],g);
    for(const x of [-1.53,1.53]) {for(let i=0;i<4;i++)beam('iron railing post',0x353c3a,[x,.15+i*.15,2.65-i*.4],[x,1.1+i*.15,2.65-i*.4],.035,g);beam('sloping iron handrail',0x353c3a,[x,1.1,2.65],[x,1.56,1.45],.045,g);}
    lamp([1.25,2.55,1.35],g,night?20:8);plant([4.3,.2,.4],1.25);bicycle([-1.2,.1,-1.2],.1);
    for(let i=0;i<5;i++) {tree([-3,.15,-6-i*6],1.2);cottage([-11,0,-10-i*7],[0xc2bd7b,0x8da39c,0xd4a36e][i%3],1.3);}
    for(const z of [-5,-16]) {cylinder('streetlamp post',0x3c4844,[-4,1.6,z],.06,3.2);lamp([-4,3.25,z],root,night?20:3);}
    for(let i=0;i<4;i++)anchor(`step_${i+1}`,[1.05+i*.65,.59,.04]);anchor('door_landing',[2,.65,-.8]);anchor('railing_puddles',[3.53,1.1,.65]);
    return {wide:[-5,3.8,10],target:[1,2,-1],detail:[-3,3.5,7],detailTarget:[2,1.4,-.2],overhead:[0,26,0]};
  }
  function porch(walt=false) {
    terrain(0x86a563,70);const g=group(walt?'Walt’s porch':'Mrs. Brook’s porch');const deck=walt?0x9b8c73:0xe5e4cd,wall=walt?0xb9ad78:0xb7c9c8;
    box('porch floor',deck,[0,.3,0],[9,.6,5],g);for(let x=-4.4;x<4.5;x+=.28)box('porch board seam',0x939b89,[x,.611,0],[.012,.008,5],g,{ink:false});
    box('house wall',wall,[0,2.7,-3],[10,5,1],g);door([2,.6,-2.42],g,walt?0xe8bf83:0x6e7969,1.3,2.6);window([-1.6,2.5,-2.4],2.2,2,g,night);
    if(walt)for(const x of [-3,-.2])box('blue shutter',0x5d7581,[x,2.5,-2.3],[.5,2.2,.1],g);
    for(const x of [-4.2,4.2])box('porch pillar',0xe5dfc5,[x,2.5,1.9],[.19,4,.19],g);box('porch canopy',walt?0x777967:0xdce2d4,[0,4.5,-.15],[9.5,.22,5.5],g);
    railing([-3.2,.6,2.2],2,g);railing([3.2,.6,2.2],2,g);for(let i=0;i<4;i++)box('porch steps',deck,[0,.08+i*.13,3.8-i*.4],[3,.16+i*.26,.48],g);
    for(const x of [-1.55,1.55])beam('step handrail',0xd2d6c5,[x,1.6,2],[x,.9,3.9],.055,g);
    const rocking=chair([-2.4,.62,-.4],.25,g);rocking.name='rocking chair';for(const x of [-2.67,-2.13])beam('rocker runner',0x806342,[x,.67,-1.1],[x,.67,.45],.06,g);
    if(walt)chair([-.5,.62,-1],-.1,g);const t=table([-1,.62,.1],.8,.8,.73,g);cylinder('tea cup',0xe9d7a4,[0,.84,0],.09,.16,t);torus('cup handle',0xe9d7a4,[.11,.84,0],.06,.018,t);
    for(const p of [[-3.6,.62,-1.8],[3.7,.62,1.4],[2.8,.62,1.4]])plant(p,.9,true,g);lamp([2.9,3.05,-2.2],g,10);
    const chimes=group('paper chimes',[-3.3,3.7,1.1],g);for(let i=0;i<4;i++){beam('chime string',0xc0b99e,[i*.15,0,0],[i*.15,-.5-(i%2)*.13,0],.008,chimes);box('paper chime',0xf0dba6,[i*.15,-.65-(i%2)*.13,0],[.1,.3,.01],chimes);}
    if(!walt) {water([0,-.03,-14],52,18);for(let i=0;i<13;i++)tree([-22+i*3.5,0,-25],1,true);}else box('road beyond porch',0x7e7b79,[0,-.02,9],[60,.1,5],root,{ink:false});
    for(const x of [-9,10])tree([x,0,-5],1.6);
    if(!walt) {
      const parts=g.children.filter(o=>['house wall','entrance door','window','lantern support','lantern glass','lantern cap','practical light'].includes(o.name));
      const side=group('right-hand house wall',[2,0,0],g);side.rotation.y=-Math.PI/2;for(const part of parts)side.add(part);
    }
    anchor('rocker',[-2.4,1.18,-.4]);anchor('tea_table',[-1,1.35,.1]);anchor('porch_left',[-.6,.62,1]);anchor('porch_right',[1,.62,1]);
    return {wide:walt?[9,4.6,11]:[-9,4.2,11],target:walt?[0,1.7,0]:[0,1.7,-3],detail:[-7,3,5],detailTarget:[-1.7,1.5,0],overhead:[0,23,3]};
  }
  function park() {
    terrain(0x82a34f);water([0,-.03,-14],70,18);hills();const oak=tree([2,0,-3],2.7);oak.name='old lakeside oak';
    for(const [x,z] of [[-10,-7],[-13,-4],[-17,-5],[-15,2],[-18,6]])tree([x,0,z],1.7);bench([4,0,.5],-.2);bench([-4,0,-5],.2);
    for(const [x,z] of [[-7,1],[-10,-2]]) {table([x,0,z],3,1.5,.85);for(const dz of [-1,1]) {box('picnic bench',0xa47e49,[x,.48,z+dz],[3.2,.13,.3]);for(const dx of [-1,1])box('picnic support',0x785f3e,[x+dx,.24,z+dz],[.12,.48,.24]);}}
    for(const [x,z] of [[-3,-4],[8,-4],[10,-4]])reeds(x,z);
    const notice=group('park notice board',[-6,0,5]);for(const x of [-.85,.85])box('notice post',0x796143,[x,1.1,0],[.14,2.2,.14],notice);
    box('notice board',0x825c37,[0,1.9,0],[2.1,1.25,.13],notice);label('park sale notice','PUBLIC NOTICE\nTown meeting',[0,1.9,.08],1.8,1,undefined,undefined,notice);
    anchor('oak',[1,0,-1]);anchor('park_centre',[-1,0,2]);anchor('notice_board',[-6,0,6]);
    return {wide:[10,5.6,16],target:[0,2.4,-3],detail:[8,5,8],detailTarget:[2,3,-3],overhead:[0,34,0]};
  }
  function street() {
    terrain(0xbbb9a3);box('paved street',0xb8b6a6,[0,-.02,-4],[8,.12,54],root,{ink:false});
    for(let z=-28;z<17;z+=1.4)for(let x=-3.7;x<4;x+=1.4)box('paving joint',0xa5a794,[x,.045,z],[1.3,.009,.016],root,{ink:false});
    for(const side of [-1,1]) {
      box('sidewalk',0xc7c7b6,[side*6,.12,-4],[4,.3,54],root,{ink:false});
      for(let i=0;i<5;i++) {
        const g=group('main street building',[side*8,0,8-i*7]);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;
        box('shop walls',[0xa8bc90,0xc9969d,0xd4ad75,0x99b2bb,0xbcb78d][i],[0,2.1,0],[6,4.2,4],g);box('shop cornice',0xe3d9bd,[0,4.25,.15],[6.3,.2,4.2],g);
        window([-1.35,1.65,2.07],1.7,1.9,g);door([1.5,0,2.08],g,0x66867f,1,2.7);
        for(let j=0;j<10;j++)box('striped shop awning',j%2?0xefdfab:[0x629b77,0xae7eac,0xc9935f][i%3],[-2.7+j*.6,2.95,2.65],[.59,.14,1.4],g,{rotation:[-.14,0,0]});
      }
    }
    const clock=group('stone clock tower',[7,0,-23]);box('tower',0xa59b80,[0,4,0],[3.5,8,3.5],clock);roof(clock,4.4,4.4,8,0x6e7166);
    cylinder('clock face',0xe6ddbf,[0,6.3,1.81],.75,.05,clock).rotation.x=Math.PI/2;beam('minute hand',0x3e4945,[0,6.3,1.86],[0,6.82,1.86],.025,clock);beam('hour hand',0x3e4945,[0,6.3,1.86],[-.35,6.15,1.86],.03,clock);
    hills();bench([-4.8,.3,1],Math.PI/2);const board=group('street notice board',[-4.4,.3,5]);box('board',0x8f704a,[0,1.55,0],[2,1.4,.15],board);for(const x of [-.8,.8])box('post',0x705b3e,[x,.8,0],[.12,1.6,.12],board);
    label('town meeting notice','TOWN MEETING\nSchool gym',[0,1.55,.09],1.8,1.15,undefined,undefined,board);
    const mail=group('blue mailbox',[-4.4,.3,-3]);box('mailbox body',0x3c6989,[0,.8,0],[.7,1.05,.6],mail);sphere('rounded mailbox top',0x3c6989,[0,1.32,0],[.35,.25,.3],mail);box('mail slot',0x233c4c,[0,1.03,.31],[.48,.06,.02],mail);
    anchor('interview',[-1,0,4]);anchor('mailbox',[-3.5,.3,-3]);anchor('notice_board',[-3.2,.3,5]);
    return {wide:[1,5,19],target:[0,2,-8],detail:[2,3,9],detailTarget:[-4,1.7,3],overhead:[0,35,0]};
  }
  function hallExterior() {
    terrain(0x999d53);oldHall();for(const x of [-10,10])for(let i=0;i<5;i++)tree([x+Math.sin(i)*2,0,-5-i*3],1.6,true);
    box('worn approach path',0xc5ae77,[0,-.015,9],[2.6,.06,13],root,{ink:false});anchor('front_l',[-2,0,5]);anchor('front_r',[2,0,5]);anchor('door',[0,.45,1.4]);
    return {wide:[9,5,15],target:[0,2,0],detail:[4,3.5,9],detailTarget:[0,1.8,1],overhead:[0,29,2]};
  }
  return {lake,stoop,brookPorch:()=>porch(false),waltPorch:()=>porch(true),park,street,hallExterior};
}
