"""Build Episode 2 from the current script and existing local character recordings."""
from pathlib import Path
import hashlib,json,math,shutil,subprocess,wave
ROOT=Path(__file__).resolve().parents[3]; OUT=ROOT/'comparisons/episode02'; ASSETS=OUT/'assets'; SOURCE=OUT/'source'
SHARED=Path(os.environ.get('VO_SOURCE', ROOT/'comparisons/episode02/assets')); script=json.loads((ROOT/'episodes/ep02.json').read_text())
voices={}
for f in sorted((SHARED/'vo').glob('*.wav')):
 if '_raw' in f.name:continue
 text=f.with_suffix('.txt')
 if not text.exists():continue
 who,_,say=text.read_text().strip().partition('\n');voices[(who.strip(),say.strip())]=f
beats=[];events=[];recordings=[];cursor=0;sfx=[]
# 30-fps units are only used by the existing audio mixer, not by Three.js.
def add_line(b,line,id,at):
 say=line['say'];silent=say.strip()=='...';who=line['who'];p=None
 if not silent:
  p=voices[(who,say)]
  with wave.open(str(p)) as w: duration=w.getnframes()/w.getframerate()
 else:duration=.85
 e={**line,'id':id,'text':say,'start':at,'end':at+duration,'beat':b['id'],'silent':silent,'mouthCues':[]}
 if silent:e['caption']=False
 else:
  dest=ASSETS/'vo'/f'{id}.wav';shutil.copy2(p,dest)
  cue=Path(str(p)+'.rhubarb.json')
  if cue.exists():e['mouthCues']=json.loads(cue.read_text()).get('mouthCues',[]);shutil.copy2(cue,Path(str(dest)+'.rhubarb.json'))
  assert e['mouthCues'],f'Missing mouth cues: {p.name}'
  recordings.append({'id':id,'who':who,'text':say,'source':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'start':at,'duration':duration,'quiet':line.get('quiet',False)})
 events.append(e);return e
for raw in script['beats']:
 b={**raw,'start':cursor};bid=b['id'];at=cursor+(.35 if bid=='s01' else 1.3 if bid in ['s03','s06','s08'] else .5)
 if bid=='s05':at=cursor+1.9
 for i,line in enumerate(raw.get('lines',[])):
  if bid=='s05' and line['who']=='rocco':at=max(at,max(e['end'] for e in events if e['beat']==bid)+1.35)
  if bid=='s08' and i==0:at=cursor+2.3
  if bid=='s08' and i==1:at=max(at,cursor+7.3)
  e=add_line(b,line,f'{bid}_{i:02}',at);at=e['end']+line.get('pause',12)/30
  if bid=='s04b' and i==0:at=max(at,cursor+5.9)
  at=max(at,e['start']+.15)
 if raw.get('game'):
  g={**raw['game']};e=add_line(b,{'who':g['player'],'say':'Dare.','caption':False},bid+'_choose',at+.3);at=e['end']+.55;g['cardStart']=at
  e=add_line(b,{'who':'riot','say':g['prompt'],'caption':False},bid+'_read',at+.3);g['cardEnd']=e['end']+.35;at=e['end']+.65
  e=add_line(b,{'who':g['player'],'say':g['perform'],'role':'perform'},bid+'_perform',at);at=e['end']+.5
  for i,line in enumerate(g['after']):
   e=add_line(b,line,f'{bid}_after{i:02}',at);at=max(e['end']+line.get('pause',12)/30,e['start']+.15)
  at=max(at,max(e['end'] for e in events if e['beat']==bid))
  b['game']=g;sfx.extend([['card_flip',g['cardStart'],.18],['tap',g['cardEnd'],.1]])
 if bid=='s02':at=cursor+7.5
 b['end']=math.ceil((at+max(.7,raw.get('hold',30)/30))*12)/12
 if bid=='s02':b['end']=cursor+7.5
 if bid=='s08':b['end']=math.ceil((at+1.4)*12)/12
 if bid=='s04b':b['end']=math.ceil(max(at+.8,cursor+10.5)*12)/12;b['doorOpen']=cursor+5;sfx.append(['door',b['doorOpen'],.24])
 if bid=='s05':b['dieStart']=cursor+.15;b['dieStop']=cursor+1.45;b['end']=math.ceil(max(b['end'],at+1.7)*12)/12;sfx.extend([['tap',cursor+.25,.22],['tap',cursor+.65,.16],['tap',cursor+1.05,.10]])
 if bid=='s08':sfx.extend([['tap',cursor+1.5,.12],['rustle',cursor+6.0,.1],['tap',cursor+7,.12]])
 beats.append(b);cursor=b['end']
ending=cursor;duration=math.ceil((ending+3.5)*12)/12
by={b['id']:b for b in beats};sfx.extend([['theme_long',by['s02']['start']+.35,.25],['click',ending+1.1,.4],['theme',ending+1.5,.25]])
for bid in ['s03','s04','s06']:
 b=by[bid]
 for i in range(4):sfx.append([f'step_{"sand" if bid=="s06" else "stone"}{i}',b['start']+.3+i*.28,.12])
for e in events:
 if e.get('do')=='munch':sfx.append(['crunch',e['start']+.2,.14])
 if e['who']=='rocco' and e['beat']=='s05':sfx.append(['step_stone1',e['end']+.7,.16])
timeline={'series':'Porchlight','episode':2,'title':script['title'],'next':script['next'],'fps':24,'drawing_fps':12,'duration':duration,'end_start':ending,'beats':beats,'events':events,'audio':'../assets/audio.wav','voices_reused':len(recordings),'source':'episodes/ep02.json','actions':{'doorOpen':by['s04b']['doorOpen'],'dieStart':by['s05']['dieStart'],'dieStop':by['s05']['dieStop'],'drawerClose':by['s08']['start']+7,'lampOff':ending+1.1}}
(SOURCE/'timeline.json').write_text(json.dumps(timeline,indent=2)+'\n')
(ASSETS/'voice-manifest.json').write_text(json.dumps({'recordings':recordings,'scriptHash':hashlib.sha256((ROOT/'episodes/ep02.json').read_bytes()).hexdigest(),'noNewVoices':True},indent=2)+'\n')
segments=[['lofi',0,by['s02']['start'],.10,[]],['suspense',by['s03']['start'],by['s06']['start'],.11,[[by['s04b']['start']+4,by['s05']['end']]]],['piano',by['s06']['start'],by['s08']['start'],.11,[]],['lofi',by['s08']['start'],duration,.07,[[by['s08']['start'],by['s08']['start']+6]]]]
cue={'END':round(duration*30)-1,'voices':[[e['id'],e['start'],f'gain:{.86 if e["who"]=="pip" else .9}',*(['style:whisper'] if e.get('quiet') else [])] for e in events if not e['silent']],'sfx':sfx,'music_segments':segments,'ambience':[['lake',0,.08,by['s01']['end']],['night',by['s03']['start'],.065,by['s08']['start']-by['s03']['start']]],'act':'manual'}
(ASSETS/'cues.json').write_text(json.dumps(cue,indent=2)+'\n')
print('Prepared',len(events),'events,',len(recordings),'reused voice lines,',duration,'seconds')
print('Scenes:',[(b['id'],round(b['start'],2),round(b['end'],2)) for b in beats])
