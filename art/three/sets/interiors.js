import * as THREE from 'three';

export function interiors(k) {
  const {root,night,group,mesh,box,sphere,cylinder,beam,torus,plane,label,photo,lamp,plant,table,chair,window,door,anchor,room}=k;
  const views=(wide=[6,4.2,10],target=[0,1.5,-.8],detail=[3,3,6],detailTarget=[0,1,-1])=>({wide,target,detail,detailTarget,overhead:[0,20,1]});
  function books(p,n=8,parent=root) {
    const g=group('books',p,parent);
    for(let i=0;i<n;i++)box('book',[0x678d8e,0xba7055,0xd5bb79,0x758354,0x8c748b][i%5],[i*.14,.18+(i%3)*.025,0],[.12,.36+(i%3)*.05,.28],g);return g;
  }
  function bookcase(p,w=1.6,parent=root) {
    const g=group('bookcase',p,parent);box('bookcase back',0x8e734c,[0,1.15,-.17],[w,2.3,.08],g);
    for(const x of [-w/2,w/2])box('bookcase side',0x9c794f,[x,1.15,0],[.1,2.3,.45],g);
    for(let i=0;i<4;i++) {box('shelf',0xb08b58,[0,.1+i*.65,0],[w,.08,.48],g);if(i<3)books([-w/2+.12,.15+i*.65,0],Math.floor(w/.15)-1,g);}return g;
  }
  function desk(p=[2,0,-3],parent=root) {
    const g=table(p,2.4,1.1,.95,parent);g.name='writing desk';
    box('desk drawers',0xa5895b,[.75,.48,0],[.7,.84,.9],g);
    for(const y of [.25,.5,.75]) {box('drawer front',0xb99a6b,[.75,y,.46],[.63,.2,.04],g);sphere('drawer pull',0x6e6850,[.75,y,.5],[.04,.03,.03],g);}
    plane('writing paper',0xf4ebcf,[-.3,1.023,.12],.5,.36,g,[-Math.PI/2,0,0]);
    beam('pencil',0xe3b957,[-.55,1.04,.12],[-.16,1.04,-.04],.012,g);chair([p[0]-.3,0,p[2]+1.15],Math.PI,parent);
    beam('desk lamp stem',0x6f885a,[.65,1.05,-.3],[.45,1.55,-.3],.035,g);
    mesh('desk lamp shade',new THREE.ConeGeometry(.2,.2,10,1,true),0xa5b67b,[.42,1.6,-.3],null,g,{material:{side:THREE.DoubleSide}});const light=new THREE.PointLight(0xffdaa0,18,8,2);light.position.set(.42,1.45,-.3);light.userData.practical=true;g.add(light);return g;
  }
  function bed(p,color=0x63849b,checked=false) {
    const g=group('bed',p);box('bed frame',0x926d49,[0,.32,0],[2,.5,3.4],g);
    for(const z of [-1.6,1.6])box('bed end',0xa27d54,[0,.7,z],[2,.9,.13],g);
    box('mattress',0xe6ddc9,[0,.65,0],[1.9,.3,3.1],g);box('duvet',color,[0,.84,.45],[1.94,.18,2.25],g);
    box('pillow',0xe5dfcd,[0,.88,-1.05],[1.25,.23,.55],g);
    if(checked)for(let i=0;i<6;i++) {box('checked blanket cross stripe',0x857a65,[0,.94,-.55+i*.38],[1.95,.015,.13],g,{ink:false});box('checked blanket long stripe',0xaaa18a,[-.88+i*.34,.951,.45],[.13,.012,2.25],g,{ink:false});}
    else box('orange throw',0xc07b42,[.25,.96,.9],[1.4,.06,.85],g,{rotation:[0,.18,0]});return g;
  }
  function ceilingLamp(p=[0,3.6,0],intensity=20) {
    const g=group('hanging ceiling lamp',p);beam('lamp cord',0x665944,[0,0,0],[0,-.65,0],.02,g);
    sphere('lamp globe',0xffdda5,[0,-.8,0],[.25,.2,.25],g);const l=new THREE.PointLight(0xffd9a4,intensity,14,2);l.position.set(0,-.8,0);l.userData.practical=true;g.add(l);return g;
  }
  function rug(p,w=4,d=2,color=0x8e9c5f) {return box('woven rug',color,p,[w,.025,d]);}
  function apartment() {
    room(11,8,4.2,0xdcc69d,0xd7b27c);window([1,2.35,-3.92],2.8,2.2);box('window night stars',0xf5e7ac,[.5,2.8,-3.82],[.035,.035,.02]);
    rug([0,.025,.5],5.3,3.2,0xd8bc79);
    const sofa=group('orange sofa',[-2.2,0,-1.8]);box('sofa base',0xbc682f,[0,.37,0],[3.7,.5,1.25],sofa);box('sofa back',0xc4793b,[0,.95,-.5],[3.7,1.15,.35],sofa);
    for(const x of [-1.65,1.65])box('sofa arm',0xd28a46,[x,.75,.04],[.4,.75,1.4],sofa);
    for(const x of [-.83,0,.83])box('sofa cushion',0xe39b50,[x,.69,.04],[.79,.25,1],sofa);
    box('sofa pillow',0xf0c776,[-.95,1,-.22],[.6,.55,.2],sofa,{rotation:[0,.1,.14]});
    box('sofa throw',0xcaa35c,[-1,.86,.35],[.4,.04,.9],sofa);
    const bean=group('green beanbag',[3.1,0,-.4]);sphere('beanbag seat',0x63974e,[0,.45,0],[1.2,.6,1],bean);sphere('beanbag back',0x73a35a,[0,.8,-.3],[.9,.7,.7],bean);
    const coffee=table([-.5,0,.85],2.8,1.3,.55);coffee.name='game coffee table';
    for(let i=0;i<3;i++)box('stacked board game',[0x617c8e,0xc68a51,0xe0c57e][i],[.45,.67+i*.09,0],[.9,.085,.65],coffee);
    cylinder('snack bowl',0xad7a4b,[-.65,.67,.12],.25,.16,coffee);sphere('snacks',0xe1bf73,[-.65,.77,.12],[.18,.06,.18],coffee);
    for(const p of [[-4.3,0,1.3],[4.65,0,-2.3],[3.7,0,-3]])plant(p,1.6);
    cylinder('floor lamp stand',0x766549,[-4.4,1.2,-2.7],.04,2.4);mesh('floor lampshade',new THREE.CylinderGeometry(.3,.48,.55,12),0xf0d383,[-4.4,2.5,-2.7],null);lamp([-4.4,2.2,-2.7],root,15);
    const shelves=group('left wall shelves',[-5.36,2,-1.5]);shelves.rotation.y=Math.PI/2;
    for(const y of [0,.7]) {box('floating shelf',0x9d7850,[0,y,0],[2.8,.12,.6],shelves);books([-.9,y+.08,0],6,shelves);plant([.8,y+.08,0],.6,false,shelves);}
    label('botanical wall art','SUMMER',[4.3,2.6,-3.9],1,1.3,'#e3b16b','#63844a');
    for(let i=0;i<16;i++) {const x=-5+i*.65,y=3.65-.5*Math.sin(i/15*Math.PI);if(i)beam('fairy light cable',0x645a44,[x-.65,3.65-.5*Math.sin((i-1)/15*Math.PI),-3.7],[x,y,-3.7],.012);sphere('fairy light bulb',0xf1d584,[x,y-.08,-3.7],[.055,.08,.055]);}
    const fan=group('ceiling fan',[0,4,0]);cylinder('fan hub',0x746a58,[0,0,0],.17,.2,fan);for(let i=0;i<4;i++){const b=box('fan blade',0x927957,[.65,0,0],[1.2,.045,.22],fan);b.position.set(Math.cos(i*Math.PI/2)*.7,0,Math.sin(i*Math.PI/2)*.7);b.rotation.y=-i*Math.PI/2;}
    anchor('sofa_left',[-3.03,.85,-1.7]);anchor('sofa_right',[-1.37,.85,-1.7]);anchor('beanbag',[3.1,.7,-.4]);anchor('floor',[-.5,0,2.4]);
    return views([6,4.1,10],[0,1.4,-1],[4,3,6],[-1,.8,-1]);
  }
  function bedroom(pip=false) {
    room(10,8,4,pip?0xd9c7a0:0x7b8e96,pip?0xb09166:0x697e80);bed([-2.7,0,-1.5],pip?0xb8af95:0x6588a5,pip);
    desk([1.6,0,-2.7]);window([.2,2.5,-3.92],1.6,2);bookcase([3.9,0,-3.5],1.4);
    rug([.1,.025,1.7],4.5,2.5,pip?0x89925c:0x6a7b69);
    if(pip) {
      door([4.1,0,-3.85],root,0x9c7950,1.15,2.7).rotation.y=-.85;
      cylinder('bedside cabinet',0x9e7c52,[-4.3,.4,-.2],.4,.8);torus('headphones',0x454f4c,[-4.3,.9,-.2],.2,.055);
      label('tree print','♧',[-2.7,2.4,-3.92],.9,1.2,'#eee7c9','#63824c');
    } else {
      sphere('basketball',0xcf8542,[2.7,2.9,-3.72],[.45,.45,.13]);torus('basketball seam',0x604832,[2.7,2.9,-3.56],.32,.016);
      const shelf=group('trophy shelf',[-3,2.55,-3.65]);box('trophy shelf board',0xa5916e,[0,0,0],[2.6,.12,.45],shelf);
      for(let i=0;i<4;i++){cylinder('trophy stem',0xd0b05b,[-.9+i*.6,.22,0],.04,.3,shelf);mesh('trophy cup',new THREE.CylinderGeometry(.15,.07,.2,10),0xcbb66c,[-.9+i*.6,.4,0],null,shelf);}
      const practice=table([2.4,0,1.2],2,1.3,.85);practice.name='solo practice game';box('practice board',0x59715c,[0,.95,0],[1.2,.05,.8],practice);for(let i=0;i<8;i++)cylinder('practice game piece',i%2?0xd7c48b:0x9d6747,[-.45+(i%4)*.3,1.02,-.2+Math.floor(i/4)*.4],.06,.08,practice);
      chair([2.4,0,2.3],Math.PI);for(let i=0;i<5;i++)box('floor book',[0x9b7c6d,0x748a9b,0xb19b78][i%3],[-.7+(i%3)*.8,.07,1+(i%2)*1.2],[.45,.1,.6],root,{rotation:[0,i*.6,0]});
    }
    anchor('bed',[-2.7,.93,-1.5]);anchor('desk',[1.3,.55,-1.55]);anchor('floor',[0,0,1]);return views();
  }
  function classroom() {
    room(12,10,4.6,0xe9d3a0,0xd4ac66);box('wood wainscot',0xa7844f,[0,.65,-4.95],[12,1.3,.06]);
    box('chalkboard frame',0x987242,[0,2.7,-4.85],[6.8,2.7,.15]);box('green chalkboard',0x48734f,[0,2.7,-4.75],[6.5,2.4,.06]);
    box('chalk ledge',0xb18c52,[0,1.43,-4.6],[6.8,.09,.23]);box('eraser',0xb5a382,[1.8,1.53,-4.62],[.3,.12,.12]);
    const teacher=table([-.5,0,-3.2],3.3,1.25,1.1);teacher.name='teacher desk';books([.5,1.2,0],5,teacher);
    cylinder('globe stand',0xb89b58,[-1,1.26,0],.15,.22,teacher);sphere('globe',0x7caab1,[-1,1.65,0],[.35,.35,.35],teacher);sphere('globe continent',0x8da85b,[-1.1,1.69,.29],[.2,.17,.04],teacher);
    for(let row=0;row<3;row++)for(const x of [-3,3]) {const z=-.8+row*2.5;const d=table([x,0,z],2.25,1.15,.9);d.name='student double desk';box('desk paper',0xf2e9d0,[.2,1.0,0],[.6,.02,.42],d);for(const dx of [-.62,.62])chair([x+dx,0,z+1],Math.PI);}
    const left=group('tall classroom windows',[-5.94,2.6,0]);left.rotation.y=Math.PI/2;for(const x of [-3,0,3])window([x,0,0],2.1,2.8,left);
    bookcase([4.5,0,-4.5],1.4);plant([4.4,2.3,-4.5],.7);
    cylinder('wall clock',0xe8e0c8,[4.5,3.55,-4.85],.38,.06).rotation.x=Math.PI/2;beam('clock hand',0x4b5648,[4.5,3.55,-4.79],[4.5,3.8,-4.79],.018);
    for(const [name,p] of [['teacher',[0,0,-2]],['bash_desk',[-3,.6,.2]],['pip_desk',[3,.6,.2]]])anchor(name,p);
    return views([7,5,12],[0,1.5,-1],[7,4,9],[0,2,-3]);
  }
  function garage() {
    room(11,9,4,0xb8c9cb,0x8c9b98,false);box('garage door',0x9baeb0,[0,1.7,-4.44],[8,3.4,.12]);
    for(let i=0;i<5;i++)box('garage panel seam',0x657c7e,[0,.3+i*.67,-4.35],[8,.035,.025]);for(const x of [-2.8,-.95,.95,2.8])window([x,2.8,-4.32],1.5,.4);
    for(const x of [-4.4,4.4]) {beam('door track',0x647675,[x,.1,-4.15],[x,3.6,-4.15],.05);beam('overhead door track',0x647675,[x,3.6,-4.15],[x,3.6,2.5],.05);}
    const moving=group('single sealed moving box',[0,0,.6]);box('cardboard carton',0xb3986e,[0,.43,0],[1.15,.86,.95],moving);box('packing tape',0xd2be91,[0,.866,0],[.14,.015,.95],moving);box('front tape',0xd2be91,[0,.43,.48],[.14,.86,.013],moving);label('shipping label','',[.25,.5,.49],.25,.18,undefined,undefined,moving);
    for(const side of [-1,1]) {const g=group('wall storage shelf',[side*5.15,2.9,-1.5]);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;box('shelf plank',0x8e9e94,[0,0,0],[3,.12,.6],g);for(let i=0;i<5;i++)box('storage container',0x8b9f95,[-1+i*.5,.23,0],[.4,.35,.35],g);}
    const bike=group('garage bicycle',[4,0,1]);bike.rotation.y=-.3;for(const x of [-.7,.7])torus('bicycle wheel',0x374749,[x,.55,0],.48,.045,bike);
    beam('bike frame',0x4e6b70,[-.7,.55,0],[.2,1.2,0],.04,bike);beam('bike frame',0x4e6b70,[.2,1.2,0],[.7,.55,0],.04,bike);beam('bike frame',0x4e6b70,[-.7,.55,0],[.7,.55,0],.04,bike);box('bike saddle',0x344443,[.2,1.24,0],[.35,.09,.18],bike);
    ceilingLamp([0,3.9,0],25);anchor('moving_box',[0,.87,.6]);anchor('pip',[0,0,2.5]);return views();
  }
  function dining(s) {
    room(12,10,4.2,s.mood==='storm'?0x929f9e:0xe1c7a0,0xaa7c4b);
    // Ceiling beams are real geometry, with no opaque ceiling obstructing camera access.
    for(const z of [-4.8,-1,3])box('ceiling beam',0x70543a,[0,4.15,z],[12,.18,.2]);
    window([2.6,2.6,-4.9],2.8,2.1);
    for(const x of [.95,4.25])box('curtain',0x9c9e83,[x,2.6,-4.7],[.4,2.4,.13]);
    const dinner=table([0,0,0],5.6,2.3,1.0);dinner.name='family dinner table';
    const positions=[[-2,.0,1.65],[-.1,0,1.65],[1.8,0,1.65],[-1.3,0,-1.65],[1.3,0,-1.65]];
    positions.forEach((p,i)=>{chair(p,i<3?Math.PI:0);anchor(['riot','rocco','bash','pip','walt'][i],[p[0],.6,p[2]]);});
    for(const [x,z] of [[-1.8,.66],[0,.66],[1.8,.66],[-1.1,-.66],[1.1,-.66]]) {
      cylinder('dinner plate',0xe6e0c3,[x,1.1,z],.29,.035,dinner);sphere('potatoes',0xcba85e,[x,1.17,z],[.19,.07,.17],dinner);
      cylinder('drinking glass',0xc6d4cd,[x+.43,1.2,z],.085,.25,dinner);
    }
    for(const x of [-1.4,0,1.4]) {cylinder('serving bowl',0x9a7549,[x,1.19,0],.34,.22,dinner);sphere('bowl of food',x===0?0x86a553:0xd4b66b,[x,1.3,0],[.27,.08,.27],dinner);}
    for(const x of [-.7,.7]) {cylinder('candle holder',0xa58b53,[x,1.18,0],.11,.2,dinner);cylinder('candle',0xf3dca3,[x,1.42,0],.055,.4,dinner);sphere('candle flame',0xffd16d,[x,1.67,0],[.04,.1,.04],dinner);const l=new THREE.PointLight(0xffba69,s.mood==='storm'?10:2,7,2);l.position.set(x,1.7,0);l.userData.candle=true;dinner.add(l);}
    const side=group('sideboard',[-3.5,0,-4.2]);box('cabinet',0x785639,[0,.7,0],[3.2,1.4,.8],side);for(const x of [-1,0,1])box('cabinet door',0x876544,[x,.68,.42],[.9,1.2,.04],side);box('cabinet top',0x92704b,[0,1.45,0],[3.4,.12,.95],side);
    for(const [x,w,h] of [[-4.4,.7,.9],[-3.4,1,1.15],[-2.25,.65,.8]]) {box('picture frame',0x785638,[x,2.7,-4.88],[w+.12,h+.12,.08]);box('picture matte',0xccb68f,[x,2.7,-4.82],[w,h,.02]);}
    label('August calendar','AUGUST\n12',[-5,2.6,-4.79],.8,1.15,'#e8dfc1','#4f5045');
    ceilingLamp([0,4.2,0],s.mood==='storm'?0:42);anchor('candle',[.7,1.67,0]);anchor('exit',[-4,0,3]);return views([7.8,4.8,11],[0,1.4,-.5],[6,3.5,8],[0,1.4,0]);
  }
  function hallway() {
    room(4.2,14,3.8,0xe4c47e,0xaa7c4d);rug([0,.025,0],1.65,12,0x9d694b);
    for(let i=0;i<10;i++) {const z=-5.6+i*1.25;box('runner diamond',0x677a73,[0,.045,z],[.43,.015,.43],root,{rotation:[0,Math.PI/4,0]});}
    door([0,0,-6.9],root,0x527584,1.3,2.7);
    const gallery=group('grandfather photo wall',[2.04,0,0]);gallery.rotation.y=-Math.PI/2;
    const photos=['photo_lantern.jpg','photo_storm.jpg','photo_storm_blurred.jpg'];
    for(let i=0;i<6;i++)photo('existing grandfather photograph',`art/gemini/grandpa/${photos[i%3]}`,[-4+i*1.65,2.3+(i%2)*.25,.01],1,1.05,gallery);
    for(const z of [-5,-1,3,5]) {const g=group('hallway sconce',[-1.95,2.7,z]);g.rotation.y=Math.PI/2;lamp([0,0,.12],g,8);}
    for(let i=0;i<4;i++)box('coat hook',0x60503b,[-1.94,2.3,-2+i*.4],[.18,.06,.07]);
    const console=table([1.45,0,4.2],.8,1.4,.95);console.name='hallway side table';cylinder('hallway bowl',0xc0a068,[0,1.08,0],.18,.1,console);
    anchor('photo_wall',[1.1,0,-.4]);anchor('entrance',[0,0,5.6]);anchor('exit',[0,0,-5.7]);
    return views([0,2.7,9],[0,1.6,-3],[-1.1,2.5,4],[1.9,2.1,0]);
  }
  function hall() {
    room(13,17,7,0x526c78,0x596f75);
    for(let x=-6;x<6.5;x+=.45)box('hall wall timber',0x405866,[x,3.5,-8.43],[.045,7,.045]);
    for(const x of [-6.4,6.4])for(const z of [-6,0,6]) {const g=group('shuttered hall window',[x,3.6,z]);g.rotation.y=x<0?Math.PI/2:-Math.PI/2;window([0,0,0],1.5,2.3,g);for(const xx of [-.65,.65])box('shutter',0x435866,[xx,0,.13],[.6,2.4,.08],g);}
    box('raised stage',0x657b7c,[0,.4,-6],[8,.8,4]);for(let i=0;i<2;i++)box('stage step',0x71847f,[0,.12+i*.16,-3.6-i*.4],[4,.24+i*.32,.45]);
    box('stage opening',0x27373f,[0,2.5,-8.32],[6,4,.06]);for(const x of [-2.8,2.8])box('red stage curtain',0x844950,[x,2.4,-8.18],[1.1,3.4,.17]);box('curtain valance',0x874c55,[0,4.2,-8.08],[6.5,.6,.22]);
    const game=table([0,0,-.4],3.8,2.1,1.1);game.name='covered game table';box('table cloth top',0xc4c5b5,[0,1.21,0],[4, .06,2.3],game);for(const z of [-1.15,1.15])box('hanging cloth',0xb5bbac,[0,1,z],[4,.45,.03],game);
    for(const side of [-1,1])for(let i=0;i<7;i++)chair([side*5,0,-5+i*1.9],side<0?Math.PI/2:-Math.PI/2);
    for(let i=0;i<13;i++)mesh('old bunting',new THREE.ConeGeometry(.2,.45,3),[0x959887,0x8b7174,0x7a8d8d][i%3],[-5.7+i*.95,4.8-.7*Math.sin(i/12*Math.PI),-6.5],null,root,{rotation:[0,0,Math.PI]});
    for(const x of [-5,0,5])beam('roof rafter',0x3d535d,[x,6.9,-8],[x,6.9,8],.09);
    anchor('game_table',[0,1.25,-.4]);anchor('stage',[0,.81,-5]);anchor('entrance',[0,0,6.5]);
    return views([0,4.2,14],[0,2,-3],[5,3.5,7],[0,1.2,-.4]);
  }
  function gym() {
    room(18,24,8,0xd6c98e,0xcda459);
    for(const x of [-8.94,8.94]) {const g=group('gym side wall',[x,0,0]);g.rotation.y=x<0?Math.PI/2:-Math.PI/2;box('green lower wall',0x939c7c,[0,1.25,.03],[24,2.5,.08],g);for(let z=-9;z<=9;z+=3)window([z,6.5,.02],2.4,1.6,g);}
    for(const z of [-10,-5,0,5,10])beam('roof truss',0x7b7c61,[-9,7.6,z],[9,7.6,z],.07);
    const line=(name,p,size)=>box(name,0xeee1b0,p,size,root,{ink:false});
    for(const x of [-7,7])line('court boundary',[x,.018,0],[.06,.02,20]);for(const z of [-10,0,10])line('court line',[0,.018,z],[14,.02,.06]);
    torus('centre court circle',0xf2e2ac,[0,.025,0],2.3,.03,root,[Math.PI/2,0,0]);
    for(const x of [-8.8,8.8]) {box('basketball backboard',0xe6dfc2,[x,4.1,-1],[.1,1.2,1.8]);torus('basketball hoop',0xb97545,[x+(x<0?.65:-.65),3.7,-1],.38,.035,root,[Math.PI/2,0,0]);beam('hoop bracket',0x787d68,[x,3.8,-1],[x+(x<0?.6:-.6),3.8,-1],.04);}
    box('meeting stage',0x997b4b,[0,.45,-9.7],[8,.9,3]);box('projection screen frame',0x545b53,[0,3.8,-11.35],[5.7,3.5,.15]);
    label('projection screen','WHY THE PARK IS GOOD',[0,3.8,-11.25],5.4,3.2,'#f1eedb','#647259');
    box('projector',0x666e63,[0,1.5,4.5],[.6,.25,.5]);cylinder('projector pedestal',0x777e6e,[0,.75,4.5],.07,1.5);
    const microphone=group('meeting microphone',[-1.2,0,-5.4]);cylinder('microphone base',0x444f4b,[0,.04,0],.25,.08,microphone);cylinder('microphone stand',0x58645b,[0,.8,0],.025,1.6,microphone);sphere('microphone head',0x3d4742,[0,1.68,0],[.07,.13,.07],microphone);
    for(let row=0;row<5;row++)for(const side of [-1,1])for(let col=0;col<3;col++)chair([side*(2.5+col*1.25),0,-3+row*2.15],Math.PI,root,true);
    const stack=group('stacked folding chairs',[7,0,-8]);for(let i=0;i<4;i++) {const c=chair([0,i*.18,0],.1,stack,true);c.scale.set(1,.5,1);}
    for(const [name,p] of [['stage',[0,.91,-9]],['floor_1',[-2,0,-5]],['floor_2',[0,0,-5]],['floor_3',[2,0,-5]],['floor_4',[3.8,0,-5]],['front_l',[-5,0,-5.5]],['front_r',[5,0,-5.5]],['side_l',[-7.5,0,-1]],['side_r',[7.5,0,-1]],['aisle',[0,0,2]]])anchor(name,p);
    return {...views([0,6.5,17],[0,2,-4],[7,5,6],[0,2,-7]),overhead:[0,35,1]};
  }
  return {apartment,bashRoom:()=>bedroom(false),pipRoom:()=>bedroom(true),classroom,garage,dining,hallway,hall,gym};
}
