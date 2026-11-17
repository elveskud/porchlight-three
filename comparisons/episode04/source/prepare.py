"""Freeze current Episode 4 dialogue, original local voices and deterministic staging clocks."""
from pathlib import Path
import os
import hashlib,json,math,shutil,wave,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'comparisons/episode04';ASSETS=OUT/'assets';SOURCE=OUT/'source';SCRIPT=ROOT/'episodes/ep04.json';script=json.loads(SCRIPT.read_text());voices={}
for folder in ['ep04','ep04_qa']:
 for f in sorted(Path(os.environ.get('VO_SOURCE',ROOT/'comparisons/episode04/assets'),folder,'vo') if os.environ.get('VO_SOURCE') else (OUT/'assets'/'vo').glob('*.wav')):
  txt=f.with_suffix('.txt')
  if '_raw' in f.name or not txt.exists():continue
  who,_,say=txt.read_text().strip().partition('\n');voices.setdefault((who.strip(),say.strip()),f)
def ceil12(t):return math.ceil(t*12-1e-8)/12
beats=[];events=[];recordings=[];cursor=0;sfx=[]
for raw in script['beats']:
 b={**raw,'start':cursor};bid=b['id'];at=cursor+(2.5 if bid=='s01' else 1.9 if bid=='s04' else 5.2 if bid=='s05' else 2.6 if bid=='s06' else .6)
 for i,line in enumerate(raw.get('lines',[])):
  silent=line['say'].strip()=='...';duration=1.0 if silent else 0
  e={**line,'id':f'{bid}_{i:02}','text':line['say'],'beat':bid,'start':at,'silent':silent,'mouthCues':[],'envelope':[]}
  if not silent:
   f=voices[(line['who'],line['say'])]
   with wave.open(str(f)) as w:
    sr=w.getframerate();channels=w.getnchannels();assert w.getsampwidth()==2;audio=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float).reshape(-1,channels).mean(axis=1)/32768;duration=len(audio)/sr
   energy=np.array([np.sqrt(np.mean(audio[k:k+round(sr/50)]**2)) for k in range(0,len(audio),round(sr/50))]);energy=np.minimum(1,energy/max(.01,np.percentile(energy,90)))
   dest=ASSETS/'vo'/f'{e["id"]}.wav';shutil.copy2(f,dest);cue=Path(str(f)+'.rhubarb.json');localCue=Path(str(dest)+'.rhubarb.json');
   if cue.exists():shutil.copy2(cue,localCue)
   elif not localCue.exists():
    textFile=dest.with_suffix('.dialogue.txt');textFile.write_text(e['text']);subprocess.run([str(ROOT/'tools/rhubarb/rhubarb'),'-q','-f','json','--extendedShapes','GHX','-d',str(textFile),'-o',str(localCue),str(dest)],check=True,capture_output=True)
   e['mouthCues']=json.loads(localCue.read_text())['mouthCues'];e['envelope']=[round(float(x),3) for x in energy]
   recordings.append({'id':e['id'],'who':e['who'],'text':e['text'],'source':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'start':at,'duration':duration})
  else:e['caption']=False
  e['end']=at+duration;e.setdefault('to','preston' if bid in ['s01','s04'] and e['who'] in ['riot','bash','mayor','marlo'] else 'riot' if e['who'] in ['preston','bash','pip','rocco'] else 'rocco' if e['who']=='riot' else 'bash');events.append(e)
  pause=.65 if raw.get('mood')=='soft' else .36
  if e.get('punch'):pause=.9
  if bid=='s04' and i==4:pause=1.6
  if bid=='s05' and i==3:pause=4.0
  at=e['end']+pause
 b['end']=ceil12(at+max(.8,raw.get('hold',30)/30))
 if bid=='s02':b['end']=cursor+7.5
 if bid=='s06':b['end']=ceil12(max(b['end'],cursor+8.8))
 if bid=='s08':b['end']=cursor+10.5
 beats.append(b);cursor=b['end']
B={b['id']:b for b in beats};E={e['id']:e for e in events};ending=cursor;duration=ceil12(ending+3.5);paths=[]
def path(id,who,beat,start,end,points,endYaw=0):
 p={'id':id,'who':who,'beat':beat,'start':start,'end':end,'points':points,'stride':.27,'width':.155,'endYaw':endYaw,'surface':'grass' if beat not in ['s08'] else 'stone'};paths.append(p);return p
for who,x in [('preston',3.1),('marlo',5.2)]:path('opening-'+who,who,'s01',.15,2.2,[[6.4+(who=='marlo')*2.1,0,1.9],[x,0,2.3]],0)
path('mom-enter','bashmom','s04',B['s04']['start']+.1,B['s04']['start']+1.7,[[-8.0,0,3],[-4.4,0,3]],0)
for who,x in [('preston',3.1),('marlo',5.2)]:path('return-'+who,who,'s04',E['s04_03']['start']-2.5,E['s04_03']['start']-.2,[[6.7+(who=='marlo')*2,0,2.3],[x,0,2.3]],0)
h=B['s05'];path('hiker-enter','hiker','s05',h['start']+.1,h['start']+4.9,[[-6.5,0,3.4],[3.9,0,2.1]],0);path('hiker-exit','hiker','s05',E['s05_03']['end']+.15,E['s05_03']['end']+3.25,[[3.9,0,2.1],[9,0,2.1]],math.pi/2)
h=B['s06'];path('preston-lake-enter','preston','s06',h['start']+.1,h['start']+2.3,[[3.9,0,2.4],[1.1,0,2.4]],math.pi-.3);path('preston-lake-exit','preston','s06',h['end']-2.0,h['end']-.1,[[1.1,0,2.4],[5.6,0,2.4]],math.pi/2)
h=B['s08'];path('marlo-board-enter','marlo','s08',h['start']+.1,h['start']+2.2,[[-.5,.16,5.5],[-4.5,.16,5.5]],0);path('marlo-board-exit','marlo','s08',h['start']+7.6,h['end']-.1,[[-3.15,.16,5.5],[-.5,.16,5.5]],math.pi/2)
h=B['s08'];path('marlo-stepaside','marlo','s08',h['start']+3.1,h['start']+3.7,[[-4.5,.16,5.5],[-3.15,.16,5.5]],0)
for p in paths:
 a=np.array(p['points']);length=sum(float(np.linalg.norm(b-a)) for a,b in zip(a,a[1:]));p['length']=length;p['contacts']=[]
 for offset in [0,.5]:
  n=1
  while (n-offset)*p['stride']<length:
   target=(n-offset)*p['stride']/length;lo=0.;hi=1.
   for _ in range(28):
    m=(lo+hi)/2
    if m*m*(3-2*m)<target:lo=m
    else:hi=m
   t=p['start']+(p['end']-p['start'])*(lo+hi)/2;p['contacts'].append({'time':t,'side':'L' if offset==0 else 'R'});n+=1
 p['contacts'].sort(key=lambda v:v['time'])
 for i,c in enumerate(p['contacts']):sfx.append([f'step_{"stone" if p["surface"]=="stone" else "sand"}{i%4}',c['time'],.033])
sfx.extend([['theme_long',B['s02']['start']+.15,.24],['tap',B['s04']['start']+.6,.12],['tap',B['s04']['start']+1.1,.12],['tap',B['s08']['start']+3.0,.22],['click',ending+1.1,.4],['theme',ending+1.5,.24],['car_horn',B['s06']['end']-2.3,.16]])
# Available generated SFX names are checked by the shared mixer; use its existing horn key.
for at in np.arange(E['s03_16']['end']+.4,B['s07']['end'],8.0):sfx.append(['rocco_hum',float(at),.025])
segments=[['lofi',0,B['s06']['start'],.085,[]],['piano',B['s06']['start'],duration,.09,[]]]
cue={'END':round(duration*30)-1,'voices':[[e['id'],e['start'],f'gain:{.85 if e["who"]=="pip" else .92}',*(['style:whisper'] if e.get('quiet') else [])] for e in events if not e['silent']],'sfx':sfx,'music_segments':segments,'ambience':[['lake',0,.045,B['s03']['start']],['lake',B['s04']['start'],.05,B['s07']['start']-B['s04']['start']],['street',B['s07']['start'],.04,duration-B['s07']['start']]],'act':'manual'}
tl={'series':script['series'],'episode':4,'title':script['title'],'next':script['next'],'duration':duration,'fps':24,'drawing_fps':12,'beats':beats,'events':events,'paths':paths,'end_start':ending,'voices_reused':len(recordings),'source':'episodes/ep04.json','actions':{'lampOff':ending+1.1,'noticeInsert':[B['s08']['start']+3.8,B['s08']['start']+7.1],'horn':B['s06']['end']-2.3},'fastWindows':[]}
(SOURCE/'timeline.json').write_text(json.dumps(tl,indent=2)+'\n');(ASSETS/'cues.json').write_text(json.dumps(cue,indent=2)+'\n');(ASSETS/'voice-manifest.json').write_text(json.dumps({'recordings':recordings,'scriptHash':hashlib.sha256(SCRIPT.read_bytes()).hexdigest(),'noNewVoices':True},indent=2)+'\n');print('Prepared',len(events),'events;',len(recordings),'voices;',duration,'seconds');print([(b['id'],b['start'],b['end']) for b in beats])
