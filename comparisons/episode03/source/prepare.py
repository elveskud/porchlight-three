"""Match current Episode 3 dialogue to frozen local voices; author motion-aligned audio cues."""
from pathlib import Path
import hashlib,json,math,shutil,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'comparisons/episode03';ASSETS=OUT/'assets';SOURCE=OUT/'source';SCRIPT=ROOT/'episodes/ep03.json';script=json.loads(SCRIPT.read_text())
voices={}
for folder in ['ep03','ep03_tail']:
 for f in sorted(Path('/Users/lazaretchaava/Desktop/Blender/videos',folder,'vo').glob('*.wav')):
  if '_raw' in f.name:continue
  txt=f.with_suffix('.txt')
  if not txt.exists():continue
  who,_,say=txt.read_text().strip().partition('\n');voices.setdefault((who.strip(),say.strip()),f)
beats=[];events=[];recordings=[];cursor=0;sfx=[]
def ceil12(t):return math.ceil(t*12-1e-8)/12
if script.get('previously'):
 f=voices[('riot','Previously... '+script['previously'])]
 with wave.open(str(f)) as w: duration=w.getnframes()/w.getframerate()
 dest=ASSETS/'vo/recap.wav';shutil.copy2(f,dest);cue=Path(str(f)+'.rhubarb.json');shutil.copy2(cue,Path(str(dest)+'.rhubarb.json'))
 e={'id':'recap','who':'riot','text':'Previously... '+script['previously'],'beat':'recap','start':.15,'end':.15+duration,'voiceover':True,'silent':False,'mouthCues':json.loads(cue.read_text())['mouthCues'],'envelope':[]}
 events.append(e);recordings.append({'id':'recap','who':'riot','text':e['text'],'source':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'start':e['start'],'duration':duration});cursor=ceil12(e['end']+.5);beats.append({'id':'recap','location':'hall_outside','cast':{},'start':0,'end':cursor,'chapter':'Previously'})
for raw in script['beats']:
 b={**raw,'start':cursor};bid=b['id'];at=cursor+(.4 if bid=='s01' else 1.0 if bid in ['s04','s05'] else .55)
 for i,line in enumerate(raw.get('lines',[])):
  silent=line['say'].strip()=='...';duration=1.0 if silent else 0;f=None
  if not silent:
   f=voices[(line['who'],line['say'])]
   with wave.open(str(f)) as w:
    sr=w.getframerate();channels=w.getnchannels();width=w.getsampwidth();samples=w.readframes(w.getnframes());duration=w.getnframes()/sr
   assert width==2
   audio=np.frombuffer(samples,dtype='<i2').astype(float).reshape(-1,channels).mean(axis=1)/32768
   hop=max(1,round(sr/50));energy=np.array([np.sqrt(np.mean(audio[k:k+hop]**2)) for k in range(0,len(audio),hop)]);energy=np.minimum(1,energy/max(.01,np.percentile(energy,90)))
  e={**line,'id':f'{bid}_{i:02}','text':line['say'],'beat':bid,'start':at,'end':at+duration,'silent':silent,'mouthCues':[],'envelope':[]}
  if silent:e['caption']=False
  else:
   dest=ASSETS/'vo'/f'{e["id"]}.wav';shutil.copy2(f,dest);cue=Path(str(f)+'.rhubarb.json');assert cue.exists(),cue;e['mouthCues']=json.loads(cue.read_text())['mouthCues'];e['envelope']=[round(float(x),3) for x in energy];shutil.copy2(cue,Path(str(dest)+'.rhubarb.json'))
   recordings.append({'id':e['id'],'who':e['who'],'text':e['text'],'source':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'start':at,'duration':duration})
  if 'to' not in e:
   if bid=='s01':e['to']='bash' if e['who']=='owl' else 'owl' if e['who']=='bash' else 'bash'
   elif bid=='s04':e['to']='gus' if e['who']=='riot' and i==0 else 'pip' if e['who']=='dot' else 'dot' if i>=6 else 'riot'
   elif bid=='s05':e['to']='pip' if e['who']=='brook' and i in [3,5] else 'riot' if e['who']=='brook' else 'brook'
   else:e['to']='pip' if bid=='s07' and e['who']!='pip' else 'bash' if e['who']=='pip' else 'riot' if e['who']!='riot' else 'rocco'
  e['shot']='wide' if i%4==0 else 'two';events.append(e);pause=.65 if b.get('mood')=='soft' else .38
  if e.get('punch'):pause=.75
  if bid=='s05' and i==3:pause=.65
  if bid=='s04' and i==1:pause=1.5;b['laterCard']=e['end']+.25
  at=e['end']+pause
 b['end']=ceil12(at+max(.75,raw.get('hold',30)/30))
 if bid=='s02':b['end']=cursor+7.5
 if bid=='s06':b['end']=ceil12(max(at+1,cursor+15.0));b['notebookInsert']=[cursor+6,cursor+9.3];b['standAt']=cursor+10.1;b['walkStart']=cursor+11.5;b['walkEnd']=cursor+14.1
 if bid=='s07':b['end']=ceil12(at+1.6)
 if bid=='s08':b['end']=cursor+10.5;b['lightOff']=cursor+7.4
 beats.append(b);cursor=b['end']
ending=cursor;duration=ceil12(ending+3.5);by={b['id']:b for b in beats}
# Scene actions are shared with the picture, so impacts and footsteps have matching times.
paths=[{'id':'dot-enter','who':'dot','beat':'s04','start':next(e['start'] for e in events if e['id']=='s04_05')-1.8,'end':next(e['start'] for e in events if e['id']=='s04_05')-.15,'points':[[3.8,.05,3.4],[2.8,.05,3.1],[1.6,.05,2.6]],'ground':.05,'surface':'stone'},
 {'id':'dot-exit','who':'dot','beat':'s04','start':by['s04']['end']-1.7,'end':by['s04']['end']-.1,'points':[[1.6,.05,2.6],[3,.05,3.2],[3.8,.05,3.4]],'ground':.05,'surface':'stone'},
 {'id':'pip-door','who':'pip','beat':'s06','start':by['s06']['walkStart'],'end':by['s06']['walkEnd'],'points':[[1.25,0,-1.5],[2.7,0,-2.0],[3.8,0,-3.1]],'ground':0,'surface':'wood'},
 {'id':'pip-box','who':'pip','beat':'s08','start':by['s08']['start']+.3,'end':by['s08']['start']+2.4,'points':[[-2.7,0,3.35],[0,0,2.8],[.65,0,1.9]],'ground':0,'surface':'stone'},
 {'id':'pip-switch','who':'pip','beat':'s08','start':by['s08']['start']+5.1,'end':by['s08']['start']+7.0,'points':[[.65,0,1.9],[-1.0,0,2.8],[-2.7,0,3.35]],'ground':0,'surface':'stone'},
 {'id':'pip-exit','who':'pip','beat':'s08','start':by['s08']['start']+7.8,'end':by['s08']['start']+10.1,'points':[[-2.7,0,3.35],[-4.1,0,3.4],[-4.1,0,4.5]],'ground':0,'surface':'stone'}]
# Turn around a planted left foot, then begin walking from that exact resulting root position.
w=.28*.95*.56;anchor=np.array([1.3-w,-1.55]);destination=np.array([2.7,-2.0]);delta=destination-anchor;yaw=math.atan2(delta[0],delta[1])-math.asin(w/float(np.linalg.norm(delta)));pivot_end=[float(anchor[0]+w*math.cos(yaw)),0,float(anchor[1]-w*math.sin(yaw))]
by['s06']['pivot']={'start':by['s06']['walkStart']-.5,'end':by['s06']['walkStart'],'position':[1.3,0,-1.55],'toYaw':yaw}
next(p for p in paths if p['id']=='pip-door')['points'][0]=pivot_end
# Numerical arc length and inverse smooth easing match locomotion.js.
for path in paths:
 pts=np.array(path['points'],float);length=sum(float(np.linalg.norm(b-a)) for a,b in zip(pts,pts[1:]));path['length']=round(length,6);stride=.31*(.78 if path['who']=='dot' else 1.0);path['stride']=stride;steps=[]
 for offset in [0,.5]:
  n=1
  while (n-offset)*stride<length:
   d=(n-offset)*stride;lo=0.;hi=1.
   for _ in range(30):
    mid=(lo+hi)/2
    if mid*mid*(3-2*mid)<d/length:lo=mid
    else:hi=mid
   time=path['start']+(path['end']-path['start'])*(lo+hi)/2;steps.append({'time':round(time,6),'side':'L' if offset==0 else 'R'});n+=1
 path['contacts']=sorted(steps,key=lambda x:x['time'])
 for i,step in enumerate(path['contacts']):sfx.append([f'step_{path["surface"]}{i%4}',step['time'],.055])
sfx.extend([['theme_long',by['s02']['start']+.25,.24],['click',by['s08']['lightOff'],.28],['click',ending+1.1,.4],['theme',ending+1.5,.24],['rustle',by['s06']['start']+5.6,.08],['tap',by['s06']['start']+8.8,.08]])
for e in events:
 if e['id'] in ['s05_09']:sfx.append(['breath',e['start']+.15,.06])
segments=[['lofi',0,by['s05']['start'],.085,[]],['piano',by['s05']['start'],duration,.10,[[by['s05']['start']+15,by['s05']['start']+18],[by['s08']['start']+3,by['s08']['end']]]]]
cue={'END':round(duration*30)-1,'voices':[[e['id'],e['start'],f'gain:{.85 if e["who"] in ["pip","dot"] else .92}',*(['style:whisper'] if e.get('quiet') else [])] for e in events if not e['silent']],'sfx':sfx,'music_segments':segments,'ambience':[['street',by['s03']['start'],.045,by['s05']['start']-by['s03']['start']],['lake',by['s05']['start'],.05,by['s06']['start']-by['s05']['start']],['night',by['s07']['start'],.045,duration-by['s07']['start']]],'act':'manual'}
tl={'series':'Porchlight','episode':3,'title':script['title'],'next':script['next'],'duration':duration,'fps':24,'drawing_fps':12,'fast_drawing_fps':24,'beats':beats,'events':events,'paths':paths,'end_start':ending,'voices_reused':len(recordings),'audio':'../assets/audio.wav','source':'episodes/ep03.json','actions':{'notebookInsert':by['s06']['notebookInsert'],'standAt':by['s06']['standAt'],'garageOff':by['s08']['lightOff'],'lampOff':ending+1.1},'fastWindows':[[p['start'],p['start']+.3] for p in paths]}
(SOURCE/'timeline.json').write_text(json.dumps(tl,indent=2)+'\n');(ASSETS/'cues.json').write_text(json.dumps(cue,indent=2)+'\n');(ASSETS/'voice-manifest.json').write_text(json.dumps({'recordings':recordings,'scriptHash':hashlib.sha256(SCRIPT.read_bytes()).hexdigest(),'noNewVoices':True},indent=2)+'\n')
print('Prepared',len(events),'events,',len(recordings),'reused voice lines,',duration,'seconds');print([(b['id'],round(b['start'],2),round(b['end'],2)) for b in beats])
