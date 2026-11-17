// Shortest paths follow actual road/trail segments. No straight-line water shortcuts.
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function project(p,a,b){const x=b[0]-a[0],y=b[1]-a[1],d=x*x+y*y;const t=d?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/d)):0;return {t,point:[a[0]+t*x,a[1]+t*y]};}
export function intersection(a,b,c,d) {
 const x=b[0]-a[0],y=b[1]-a[1],u=d[0]-c[0],v=d[1]-c[1],den=x*v-y*u;
 if(Math.abs(den)<1e-9)return null;
 const dx=c[0]-a[0],dy=c[1]-a[1],t=(dx*v-dy*u)/den,s=(dx*y-dy*x)/den;
 return t>=-1e-7&&t<=1+1e-7&&s>=-1e-7&&s<=1+1e-7?{t:Math.max(0,Math.min(1,t)),s:Math.max(0,Math.min(1,s))}:null;
}
export function createNetwork(roads,sites) {
 const segments=roads.flatMap(road=>road.pts.slice(1).map((b,i)=>({a:road.pts[i],b,road,ts:[0,1]}))).filter(s=>distance(s.a,s.b)>.001);
 const joins=[];
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++) {
  const a=segments[i],b=segments[j],hit=intersection(a.a,a.b,b.a,b.b);
  if(hit){a.ts.push(hit.t);b.ts.push(hit.s);}
  // Analytic shoreline points and the polygonal loop can differ by centimetres.
  for(const p of [a.a,a.b]) {const q=project(p,b.a,b.b);if(distance(p,q.point)<.75){b.ts.push(q.t);joins.push([p,q.point]);}}
  for(const p of [b.a,b.b]) {const q=project(p,a.a,a.b);if(distance(p,q.point)<.75){a.ts.push(q.t);joins.push([p,q.point]);}}
 }
 const access=[];
 for(const site of sites) {
  let best=null;for(const segment of segments){const q=project(site.entrance,segment.a,segment.b),d=distance(site.entrance,q.point);if(!best||d<best.distance)best={segment,...q,distance:d};}
  best.segment.ts.push(best.t);access.push({site:site.id,from:site.entrance,to:best.point,length:best.distance});
 }
 const nodes=[],edges=[],index=new Map(),adj=[],unique=new Set();
 const node=p=>{const key=p.map(n=>n.toFixed(4)).join(',');if(index.has(key))return index.get(key);const n=nodes.length;index.set(key,n);nodes.push(p.slice());adj.push([]);return n;};
 const edge=(a,b,road)=>{const from=node(a),to=node(b),key=[Math.min(from,to),Math.max(from,to)].join(':');if(from===to||unique.has(key))return;unique.add(key);const length=distance(a,b);edges.push({from,to,length,road:road.id,name:road.name});adj[from].push({to,length});adj[to].push({to:from,length});};
 for(const s of segments){const ts=[...new Set(s.ts)].sort((a,b)=>a-b);for(let i=1;i<ts.length;i++){const p=t=>[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];edge(p(ts[i-1]),p(ts[i]),s.road);}}
 for(const [a,b] of joins)edge(a,b,{id:'junction',name:'Junction'});
 const siteNodes={};for(const a of access){edge(a.from,a.to,{id:`access-${a.site}`,name:'Site access'});siteNodes[a.site]=node(a.from);}
 function route(from,to) {
  if(!(from in siteNodes)||!(to in siteNodes))return null;
  const start=siteNodes[from],goal=siteNodes[to],cost=Array(nodes.length).fill(Infinity),previous=Array(nodes.length).fill(-1),closed=new Set();cost[start]=0;
  while(true){let current=-1;for(let i=0;i<nodes.length;i++)if(!closed.has(i)&&Number.isFinite(cost[i])&&(current<0||cost[i]<cost[current]))current=i;
   if(current<0)return null;if(current===goal)break;closed.add(current);
   for(const e of adj[current])if(cost[current]+e.length<cost[e.to]){cost[e.to]=cost[current]+e.length;previous[e.to]=current;}
  }
  const ids=[];for(let n=goal;n!==-1;n=previous[n])ids.push(n);ids.reverse();
  return {from,to,metres:cost[goal],walkMinutes:cost[goal]/1.3/60,points:ids.map(i=>nodes[i]),nodeIds:ids,assumption:'Proposed staging metres; illustrative walking speed 1.3 m/s, not an established travel time.'};
 }
 return {nodes,edges,siteNodes,access,route};
}
