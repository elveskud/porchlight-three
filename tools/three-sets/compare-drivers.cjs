// Exact canvas-pixel regression, in one browser/GPU environment.
const fs=require('node:fs/promises');
const {open}=require('./lib.cjs');
(async()=>{
 const [oldPage='comparisons/episode04/source/render-v5.html',newPage='comparisons/episode04/render-data.html',out='comparisons/episode04/data-frame-comparison.json']=process.argv.slice(2);
 const a=await open(oldPage),b=await open(newPage);
 try{
 const times=await a.page.evaluate(()=>{const tl=episode.timeline;return [...tl.beats.map(b=>b.start+.1),...tl.beats.map(b=>(b.start+b.end)/2),...tl.cuts.slice(0,3).map(c=>(c.start+c.end)/2),tl.duration-.5];});
 const rows=[];
 for(const t of times){
   const draw=async p=>p.evaluate(t=>{episode.renderAt(t,{force:true});return episode.canvas.toDataURL('image/png');},t);
   const old=await draw(a.page),now=await draw(b.page);
   rows.push({time:t,identical:old===now});
 }
 const errors=[...a.errors,...b.errors].filter(e=>!/willReadFrequently/.test(e));
 const result={result:rows.every(r=>r.identical)&&!errors.length?'PASS':'FAIL',frames:rows.length,identical:rows.filter(r=>r.identical).length,rows,errors};
 await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.result!=='PASS')process.exitCode=1;
 }finally{await a.close();await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
