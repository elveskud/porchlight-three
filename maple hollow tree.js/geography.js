// Claude's original 1500 × 1000 town layout, retained as a proposed staging plan.
// Map x points east, map y points south. A planning metre maps to 0.02 Three.js units.
export const SCALE=.02;
export const LAKE={x:420,y:400,rx:210,ry:160};
export const wobble=t=>1+.12*Math.sin(2*t+.5)+.08*Math.sin(3*t+1.7)+.05*Math.sin(5*t+.3);
export const shore=(t,e=0)=>[LAKE.x+LAKE.rx*(wobble(t)+e)*Math.cos(t),LAKE.y+LAKE.ry*(wobble(t)+e)*Math.sin(t)];
export const ring=(e,n=120,a0=0,a1=Math.PI*2)=>Array.from({length:n+1},(_,i)=>shore(a0+(a1-a0)*i/n,e));
export const lakeDistance=(x,y)=>{const u=(x-LAKE.x)/LAKE.rx,v=(y-LAKE.y)/LAKE.ry;return Math.hypot(u,v)-wobble(Math.atan2(v,u));};
export const AVENUES=[720,800,880,960,1040,1120,1200,1280,1360];
export const STREETS=[390,470,550,630,710,790,870];
export const PEAKS=[{x:1095,y:55,r:135},{x:955,y:5,r:100},{x:1195,y:215,r:90},{x:830,y:-15,r:75},{x:1330,y:40,r:150},{x:1480,y:190,r:120},{x:1400,y:300,r:70}];
export const CREEK_IN=[[1120,-5],[1060,60],[990,105],[920,150],[860,185],[800,205],[740,222],[680,245],[610,270],shore(-.95)];
export const CREEK_OUT=[shore(2.25),[255,560],[215,615],[190,690],[150,760],[125,860],[115,940],[110,1005]];
export const RAIL=[[-5,962],[300,952],[620,940],[900,934],[1200,928],[1505,915]];
const road=(id,name,pts,w=12,extra={})=>({id,name,pts,w,...extra});
export const ROADS=[
 road('lake-loop','Lakeshore loop',ring(.2,110),12,{h:true}),
 road('main','Main Street',[[697.5357616273116,470],[1365,470]],20),
 road('exit','Road out of town',[[1365,470],[1420,466],[1460,455],[1505,446]],14),
 ...AVENUES.map((x,i)=>road(`avenue-${i+1}`,'Residential connector',[[x,390],[x,870]],12,{h:true})),
 ...STREETS.filter(y=>y!==470).map((y,i)=>road(`cross-${i+1}`,'Neighbourhood street',[[y===550?612:700,y],[1365,y]],12,{h:true})),
 road('station-link','Station approach',[[880,870],[892,920],[900,1005]],8),
 road('south-exit','South connector',[[1200,870],[1215,940],[1240,1005]],8),
 road('mill-road','Creek approach',[[800,390],[800,300],[812,228],[830,195]],8),
 road('ridge-loop','Ridge road',[[960,390],[965,330],[1010,300],[1080,320],[1120,390]],8),
 road('west-south','Southwest road',[shore(1.95,.2),[335,690],[325,850],[318,1005]],8),
 road('west-link','West connector',[shore(Math.PI-.45,.2),[100,505],[-5,525]],8),
 road('camp-track','West forest track',[[100,505],[90,580],[85,660]],7,{gravel:true}),
 road('ranger-track','Ranger track',[shore(Math.PI+.55,.2),[180,245],[120,165]],7,{gravel:true}),
 road('north-loop','North shore lane',[shore(-2,.2),[325,180],[250,170],[265,125],[360,112],[345,62],[270,45]],8),
 road('apartment-lane','Apartment approach',[shore(-.45,.2),[675,331]],7,{gravel:true}),
 road('farm-lane','Farm track',[[618,890],[612,1005]],7,{gravel:true}),
 // Complete the draft's disconnected hill, park, homes, trail, and east-side streets.
 road('hall-track','Old hall approach',[shore(-1.5,.2),[460,150],[470,132]],6,{gravel:true}),
 road('park-walk','Park walk',[shore(1.15,.2),shore(1.15,.62)],4,{gravel:true,walk:true}),
 road('beach-east-link','Beach access east',[shore(0,.11),shore(0,.2)],3,{walk:true,gravel:true}),
 road('beach-west-link','Beach access west',[shore(Math.PI,.11),shore(Math.PI,.2)],3,{walk:true,gravel:true}),
 road('shore-path','Beach path',ring(.11,36,0,Math.PI),3,{gravel:true,walk:true}),
 road('walt-lane','Family-home lane',[[335,690],[350,705],[515,705],[640,710],[700,710]],8,{h:true}),
 road('ranger-trail','Forest walking trail',[[120,165],[180,190],[220,190],[265,125]],3,{walk:true,gravel:true}),
 road('ridge-trail','Ridge walking trail',[[1120,390],[1190,330],[1250,262]],3,{walk:true,gravel:true}),
 road('lumber-link','Workshop approach',[[800,300],[868,262]],6,{gravel:true}),
 road('farm-link','Farm connector',[[618,890],[700,870]],7,{gravel:true}),
];
export const DISTRICTS=[
 {id:'lake',name:'Lake & park',color:'#6c9da1',description:'Beach, lookout, dock, festival shore and the protected park.'},
 {id:'north',name:'Hall hill',color:'#8c9071',description:'Old festival hall and its north-shore approach.'},
 {id:'west',name:'West woods',color:'#527858',description:'Mrs. Brook’s shore, forest walks and the ranger station.'},
 {id:'centre',name:'Main Street',color:'#b77b5a',description:'Civic buildings, radio garage, square and small shops.'},
 {id:'homes',name:'Family neighbourhoods',color:'#c1a372',description:'The boys’ homes, Walt’s porch, school and gym.'},
 {id:'edge',name:'Town edge',color:'#888b8d',description:'Outward roads, railway and draft service landmarks.'},
];
