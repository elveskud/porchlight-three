"""Freeze current Episode 4 dialogue, original local voices and deterministic staging clocks."""
from pathlib import Path
import os
import hashlib,json,math,shutil,wave,subprocess,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'comparisons/episode04';ASSETS=OUT/'assets';SOURCE=OUT/'source';SCRIPT=ROOT/'episodes/ep04.json';script=json.loads(SCRIPT.read_text());voices={}
sys.path.insert(0,str(ROOT/'pipeline'));import gait_plan
# Voices: the frozen recordings already live in assets/vo/<event id>.wav (with .rhubarb.json mouth tracks).
# Set VO_SOURCE=<folder holding ep04/vo/*.wav + .txt> only when re-importing from the original voice project.
if os.environ.get('VO_SOURCE'):
 for folder in ['ep04','ep04_qa']:
  for f in sorted(Path(os.environ['VO_SOURCE'],folder,'vo').glob('*.wav')):
   txt=f.with_suffix('.txt')
   if '_raw' in f.name or not txt.exists():continue
   who,_,say=txt.read_text().strip().partition('\n');voices.setdefault((who.strip(),say.strip()),f)
def voice_file(eid,line):
 frozen=ASSETS/'vo'/f'{eid}.wav'
 if frozen.exists():return frozen
 if (line['who'],line['say']) in voices:return voices[(line['who'],line['say'])]
 raise SystemExit(f'No voice recording for {eid} ({line["who"]}: {line["say"][:40]!r}). Expected {frozen} or VO_SOURCE=<folder>.')
LEG_SIZE={'preston':1.10,'marlo':.95,'bashmom':1.10,'hiker':1.25}  # actor height scale; leg length = .97*.56*size
def ceil12(t):return math.ceil(t*12-1e-8)/12
beats=[];events=[];recordings=[];cursor=0;sfx=[]
for raw in script['beats']:
 b={**raw,'start':cursor};bid=b['id'];at=cursor+(3.0 if bid=='s01' else 1.9 if bid=='s04' else 6.0 if bid=='s05' else 2.6 if bid=='s06' else .6)
 for i,line in enumerate(raw.get('lines',[])):
  silent=line['say'].strip()=='...';duration=1.0 if silent else 0
  e={**line,'id':f'{bid}_{i:02}','text':line['say'],'beat':bid,'start':at,'silent':silent,'mouthCues':[],'envelope':[]}
  if not silent:
   f=voice_file(e['id'],line)
   with wave.open(str(f)) as w:
    sr=w.getframerate();channels=w.getnchannels();assert w.getsampwidth()==2;audio=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float).reshape(-1,channels).mean(axis=1)/32768;duration=len(audio)/sr
   energy=np.array([np.sqrt(np.mean(audio[k:k+round(sr/50)]**2)) for k in range(0,len(audio),round(sr/50))]);energy=np.minimum(1,energy/max(.01,np.percentile(energy,90)))
   dest=ASSETS/'vo'/f'{e["id"]}.wav'
   if f.resolve()!=dest.resolve():shutil.copy2(f,dest)
   cue=Path(str(f)+'.rhubarb.json');localCue=Path(str(dest)+'.rhubarb.json');
   if cue.exists() and cue.resolve()!=localCue.resolve():shutil.copy2(cue,localCue)
   elif not localCue.exists():
    textFile=dest.with_suffix('.dialogue.txt');textFile.write_text(e['text']);subprocess.run([str(ROOT/'tools/rhubarb/rhubarb'),'-q','-f','json','--extendedShapes','GHX','-d',str(textFile),'-o',str(localCue),str(dest)],check=True,capture_output=True)
   e['mouthCues']=json.loads(localCue.read_text())['mouthCues'];e['envelope']=[round(float(x),3) for x in energy]
   recordings.append({'id':e['id'],'who':e['who'],'text':e['text'],'source':str(dest.relative_to(ROOT)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'start':at,'duration':duration})
  else:e['caption']=False
  e['end']=at+duration;e.setdefault('to','preston' if bid in ['s01','s04'] and e['who'] in ['riot','bash','mayor','marlo'] else 'riot' if e['who'] in ['preston','bash','pip','rocco'] else 'rocco' if e['who']=='riot' else 'bash');events.append(e)
  pause=.65 if raw.get('mood')=='soft' else .36
  if e.get('punch'):pause=.9
  if bid=='s04' and i==4:pause=1.6
  if bid=='s05' and i==3:pause=4.0
  at=e['end']+pause
 b['end']=ceil12(at+max(.8,raw.get('hold',30)/30))
 if bid=='s02':b['end']=cursor+7.5
 if bid=='s06':b['end']=ceil12(max(b['end'],cursor+9.6))
 if bid=='s08':b['end']=cursor+10.5
 beats.append(b);cursor=b['end']
B={b['id']:b for b in beats};E={e['id']:e for e in events};ending=cursor;duration=ceil12(ending+4.2);paths=[]
def path(id,who,beat,start,end,points,endYaw=0,startYaw=None,gait=None):
 p={'id':id,'who':who,'beat':beat,'start':start,'end':end,'points':points,'stride':.27,'width':.155,'endYaw':endYaw,'surface':'grass' if beat not in ['s08'] else 'stone'}
 if gait:p['gait']=gait   # 'walk' forces a walking cycle (quiet or in-character moments); otherwise the planner picks walk or run by speed
 if startYaw is not None:p['startYaw']=startYaw   # facing before the walk; the body turns into the walking direction during the first step
 paths.append(p);return p
# All entrances start OFF-SCREEN and all exits end OFF-SCREEN (edges measured per camera, 17 Nov review: nobody may pop in or vanish
# inside the picture). Runs are quick: about 3 units a second. Camera edges: s01 right 10.3 · s04 left -11.3, right 12.3 · s05 right 11.3 ·
# s06 +x 7 · s08 +x 1. Entrances that begin at a cut (a beat's first drawing) may start in frame only if the actor is simply standing there.
PACE=3.1
def plen(points):return sum(math.dist(a,b) for a,b in zip(points,points[1:]))
# From the right the runners swing round the front of the Mayor's bench (z 2.0): they pass at z 3.5 and come in to z 2.3 near the easel.
for who,x0,xm,x in [('preston',11.6,6.4,3.1),('marlo',13.6,7.6,5.2)]:
 m=[[x0,0,3.7],[xm,0,3.5],[x,0,2.3]];path('opening-'+who,who,'s01',.05,.05+plen(m)/PACE,m,0)
m=[[-12.8,0,3],[-4.4,0,3]];path('mom-enter','bashmom','s04',B['s04']['start']+.05,B['s04']['start']+.05+plen(m)/PACE,m,0)
for who,x0,xm,x in [('preston',13.2,6.4,3.1),('marlo',15.0,7.6,5.2)]:
 m=[[x0,0,3.7],[xm,0,3.5],[x,0,2.3]];arrive=E['s04_03']['start']-.2;path('return-'+who,who,'s04',arrive-plen(m)/PACE,arrive,m,0)
h=B['s05'];m=[[12.2,0,3.7],[3.9,0,2.1]];path('hiker-enter','hiker','s05',h['start']+.1,h['start']+.1+plen(m)/1.5,m,0,gait='walk')
m=[[3.9,0,2.1],[6.5,0,3.5],[12.2,0,3.5]];path('hiker-exit','hiker','s05',E['s05_03']['end']+.15,E['s05_03']['end']+.15+plen(m)/1.7,m,math.pi/2,startYaw=0,gait='walk')
h=B['s06'];path('preston-lake-enter','preston','s06',h['start']+.1,h['start']+2.55,[[3.9,0,2.4],[1.1,0,2.4]],math.pi-.3)
m=[[1.1,0,2.4],[7.8,0,2.4]];path('preston-lake-exit','preston','s06',h['end']-2.55,h['end']-.1,m,math.pi/2,startYaw=math.pi-.3)
h=B['s08'];path('marlo-board-enter','marlo','s08',h['start']+.65,h['start']+2.2,[[-.5,.16,5.5],[-4.5,.16,5.5]],0)   # waits a moment, then a quick jog (about 2.6 units a second)
m=[[-3.15,.16,5.5],[2.2,.16,5.5]];path('marlo-board-exit','marlo','s08',h['end']-.1-plen(m)/2.5,h['end']-.1,m,math.pi/2,startYaw=0)
path('marlo-stepaside','marlo','s08',h['start']+3.1,h['start']+3.7,[[-4.5,.16,5.5],[-3.15,.16,5.5]],0,startYaw=math.pi)
for p in paths:
 a=np.array(p['points']);length=sum(float(np.linalg.norm(b-a)) for a,b in zip(a,a[1:]));p['length']=length
 leg=.97*.56*LEG_SIZE.get(p['who'],1.0)
 p['plan']=gait_plan.plan_path(p['start'],p['end'],length,leg,mode=p.get('gait'))   # footsteps: speed profile + every landing
 problems=gait_plan.check_plan(p['plan'],p['start'],p['end'])
 if problems:raise SystemExit(f"Gait plan for {p['id']}: {problems}")
 p['stride']=2*p['plan']['step'];p['contacts']=gait_plan.contacts(p['plan'])   # contacts = real landing times (footstep sounds)
 for i,c in enumerate(p['contacts']):sfx.append([f'step_{"stone" if p["surface"]=="stone" else "sand"}{i%4}',c['time'],.033])
sfx.extend([['theme_long',B['s02']['start']+.15,.24],['tap',B['s04']['start']+.6,.12],['tap',B['s04']['start']+1.1,.12],['tap',B['s08']['start']+3.0,.22],['click',ending+1.1,.4],['theme',ending+1.5,.24],['car_horn',B['s06']['end']-2.8,.16]])
# Available generated SFX names are checked by the shared mixer; use its existing horn key.
for at in np.arange(E['s03_16']['end']+.4,B['s07']['end'],8.0):sfx.append(['rocco_hum',float(at),.025])
segments=[['lofi',0,B['s06']['start'],.085,[]],['piano',B['s06']['start'],duration,.09,[]]]
cue={'END':round(duration*30)-1,'voices':[[e['id'],e['start'],f'gain:{.85 if e["who"]=="pip" else .92}',*(['style:whisper'] if e.get('quiet') else [])] for e in events if not e['silent']],'sfx':sfx,'music_segments':segments,'ambience':[['lake',0,.045,B['s03']['start']],['lake',B['s04']['start'],.05,B['s07']['start']-B['s04']['start']],['street',B['s07']['start'],.04,duration-B['s07']['start']]],'act':'manual'}
# One-frame ("ones") windows: moments where the action is fast enough to need 24 drawings a second. Everything else is on twos.
def windows(items,gap=.05):
 items=sorted(items);out=[]
 for a,b in items:
  if out and a<=out[-1][1]+gap:out[-1][1]=max(out[-1][1],b)
  else:out.append([round(a,4),round(b,4)])
 return out
reveal=E['s01_01']['start']-.55;beeAt=E['s05_03']['end']+3.25;horn=B['s06']['end']-2.8;lampOff=ending+1.1
fast=[(reveal-.05,reveal+.75),(beeAt,beeAt+.9),(horn,horn+.8),(B['s08']['start']+2.9,B['s08']['start']+3.4),(lampOff-.1,lampOff+.5)]
fast+=[(B['s04']['start']+k*math.pi/7-.08,B['s04']['start']+k*math.pi/7+.12) for k in range(1,5)]   # Rocco's hammer strokes
# Close-up cuts (user asked for a few, 17 Nov; "not too much"). Each is a medium close-up on one speaker held for the line plus a beat,
# then the wide shot returns. Times follow the script events, so they stay right if the voices change.
def cut(first,last,who,dist=4.6,height=.62,pad=(.15,.45)):
 a=E[first]['start']-pad[0];b=E[last]['end']+pad[1]
 # Cut back to the wide shot BEFORE anyone else speaks: the speaker must always be in frame (the renderer checks this).
 later=[e['start'] for e in events if not e['silent'] and e['who']!=who and e['start']>E[last]['start']]
 if later:b=min(b,math.floor(min(later)*12)/12)   # a drawing is held for 1/12 s: end on a drawing boundary so the next speaker is never inside the close-up
 earlier=[e['end'] for e in events if not e['silent'] and e['who']!=who and e['start']<E[first]['start']]
 if earlier:a=max(a,math.ceil(max(earlier)*12)/12)   # ...and start after the previous speaker has finished
 return {'start':round(a,3),'end':round(b,3),'who':who,'kind':'close','dist':dist,'height':height,'beat':E[first]['beat']}
# (the first close-up starts as the cloth drops)
cuts=[cut('s01_01','s01_01','riot',pad=(.55,.8)),cut('s03_16','s03_17','rocco'),cut('s04_12','s04_12','riot'),cut('s05_04','s05_04','rocco',pad=(.2,.9)),
      cut('s06_00','s06_00','preston',pad=(.3,1.2)),cut('s07_01','s07_01','riot',dist=4.2),cut('s07_02','s07_02','rocco',dist=4.2)]
for c in cuts:assert c['end']-c['start']>=1.1,c   # a close-up shorter than about a second reads as a glitch
tl={'series':script['series'],'episode':4,'title':script['title'],'next':script['next'],'duration':duration,'fps':24,'drawing_fps':12,'beats':beats,'events':events,'paths':paths,'end_start':ending,'voices_reused':len(recordings),'source':'episodes/ep04.json','actions':{'lampOff':lampOff,'noticeInsert':[B['s08']['start']+3.8,B['s08']['start']+7.1],'horn':horn},'fastWindows':windows(fast),'cuts':cuts}
# v5 files live next to the v4 ones: the delivered v4 film (timeline.json, cues.json, audio.wav) is never overwritten.
V5=ASSETS/'v5';V5.mkdir(exist_ok=True)
if not (V5/'vo').exists():(V5/'vo').symlink_to('../vo')
(SOURCE/'timeline-v5.json').write_text(json.dumps(tl,indent=2)+'\n');(V5/'cues.json').write_text(json.dumps(cue,indent=2)+'\n');(V5/'voice-manifest.json').write_text(json.dumps({'recordings':recordings,'scriptHash':hashlib.sha256(SCRIPT.read_bytes()).hexdigest(),'noNewVoices':True},indent=2)+'\n')
print('Prepared v5:',len(events),'events;',len(recordings),'voices;',duration,'seconds;',len(tl['fastWindows']),'one-frame windows');print([(p['id'],p['plan']['mode'],len(p['plan']['steps'])) for p in paths])
