#!/usr/bin/env python3
"""Compile staging.json and frozen/synthetic voices into a renderable v5 timeline."""
import argparse,array,hashlib,importlib.util,json,math,re,sys,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'));from validate_staging import load_script,validate,load_hooks
sys.path.insert(0,str(ROOT/'pipeline'));import gait_plan

def ceil12(t):return math.ceil(t*12-1e-8)/12

def silent_wav(path,duration):
    path.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(path),'wb') as w:
        w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(b'\0\0'*round(duration*24000))

def voice(e,path,placeholder):
    synthetic=False
    if not path.exists():
        if not placeholder:raise ValueError(f'{e["id"]}: generate {path} first, or explicitly pass --placeholder-voices for a silent review build')
        duration=len(e['text'].split())/3.1+.3;silent_wav(path,duration);synthetic=True
    with wave.open(str(path)) as w:
        sr=w.getframerate();channels=w.getnchannels();width=w.getsampwidth();frames=w.getnframes();audio=w.readframes(frames);duration=frames/sr
    if width!=2:raise ValueError(f'{path}: convert voice to 16-bit PCM WAV before preparing')
    cue=Path(str(path)+'.rhubarb.json')
    marker=Path(str(path)+'.placeholder')
    synthetic=synthetic or (marker.exists() and marker.read_text().strip()==hashlib.sha256(path.read_bytes()).hexdigest())
    if synthetic:
        if not placeholder:raise ValueError(f'{e["id"]}: this WAV is still a silent placeholder; replace it with a real recording or explicitly pass --placeholder-voices')
        print(f'WARNING PLACEHOLDER VOICE: {e["id"]} is SILENT ({duration:.2f}s); generate the real voice before delivery.',file=sys.stderr)
        marker.write_text(hashlib.sha256(path.read_bytes()).hexdigest()+'\n')
        shapes='ABCDEFGHXA';cues=[];t=0
        while t<duration:
            end=min(duration,t+.10);cues.append({'start':round(t,4),'end':round(end,4),'value':shapes[len(cues)%len(shapes)]});t=end
        cue.write_text(json.dumps({'mouthCues':cues,'placeholder':True})+'\n');envelope=[.65]*math.ceil(duration*50)
    else:
        if not cue.exists():raise ValueError(f'{e["id"]}: create {cue.name} using Rhubarb before preparing this recorded voice')
        cues=json.loads(cue.read_text())['mouthCues']
        samples=array.array('h');samples.frombytes(audio)
        if sys.byteorder!='little':samples.byteswap()
        mono=[sum(samples[i:i+channels])/channels/32768 for i in range(0,len(samples),channels)]
        win=round(sr/50);energy=[math.sqrt(sum(v*v for v in mono[k:k+win])/max(1,len(mono[k:k+win]))) for k in range(0,len(mono),win)]
        # NumPy's default percentile interpolation, retained to reproduce the baseline speech envelope.
        sorted_e=sorted(energy);rank=(len(sorted_e)-1)*.90;low=math.floor(rank);u=rank-low
        peak=max(.01,sorted_e[low]*(1-u)+sorted_e[min(low+1,len(sorted_e)-1)]*u)
        envelope=[round(min(1,x/peak),3) for x in energy]
    return duration,cues,envelope,synthetic

def compile_episode(data,script,folder,placeholder=False):
    beats=[];events=[];cursor=0;recordings=[];assets=folder/'assets';vo=assets/'vo';out=folder/'source';out.mkdir(exist_ok=True,parents=True)
    for raw in script['beats']:
        d=data['beats'][raw['id']];b={**raw,'location':d['set'],'start':cursor};at=cursor+d.get('firstLineAt',.6)
        for i,line in enumerate(raw.get('lines',[])):
            eid=f'{raw["id"]}_{i:02}';silent=line['say'].strip()=='...'
            e={**line,'id':eid,'text':line['say'],'beat':raw['id'],'start':at,'silent':silent,'mouthCues':[],'envelope':[]}
            if e.get('do') in data.get('moveAliases',{}):
                e['scriptAction']=e.pop('do');alias=data['moveAliases'][e['scriptAction']]
                if alias:e['do']=alias
            if silent:duration=d.get('silentLineDuration',1);e['caption']=False
            else:
                path=vo/f'{eid}.wav';duration,e['mouthCues'],e['envelope'],synthetic=voice(e,path,placeholder)
                recordings.append({'id':eid,'source':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'start':at,'duration':duration,'placeholder':synthetic})
            e['end']=at+duration
            default_to=next((who for who in d['actors'] if who!=e['who']),e['who'])
            e.setdefault('to',d.get('gaze',{}).get(eid,default_to));events.append(e)
            pause=d.get('pauses',{}).get(eid,.9 if e.get('punch') else .65 if raw.get('mood')=='soft' else .36)
            at=e['end']+pause
        b['end']=ceil12(at+d.get('tail',max(.8,raw.get('hold',30)/30)))
        if 'duration' in d:b['end']=cursor+d['duration']
        if 'minDuration' in d:b['end']=ceil12(max(b['end'],cursor+d['minDuration']))
        beats.append(b);cursor=b['end']
    B={b['id']:b for b in beats};E={e['id']:e for e in events};ending=cursor;duration=ceil12(ending+data.get('ending',{}).get('duration',4.2))
    def clock(v,default=0):
        if isinstance(v,(int,float)):return v
        if not v:return default
        if v.get('line'):base=E[v['line']][v.get('edge','start')]
        elif v.get('beat'):base=B[v['beat']][v.get('edge','start')]
        elif v.get('ending'):base=ending
        else:raise ValueError(f'timing anchor {v}: add line, beat, or ending')
        return base+v.get('offset',0)
    paths=[];sfx=[];leg_sizes={'preston':1.1,'marlo':.95,'bashmom':1.1,'hiker':1.25}
    for bid,d in data['beats'].items():
        for p in d.get('motion',[]):
            p=dict(p);p['beat']=bid;p['start']=clock(p['start']);p['end']=clock(p['end']);paths.append(p)
        for kind in ['enter','exit']:
            for i,m in enumerate(d.get(kind,[])):
                who=m['who'];a=d['actors'][who];home=m.get('to' if kind=='enter' else 'from',a.get('at'))
                if home is None:home=json.loads((ROOT/'art/three/sets/spots.json').read_text())[d['set']][a['seat']]['pos']
                edge=m.get('edgeX',offscreen_x(d['camera'],home[2],m['side']))
                outer=[edge,home[1],home[2]];points=[outer,*m.get('via',[]),home] if kind=='enter' else [home,*m.get('via',[]),outer]
                length=sum(math.dist(x,y) for x,y in zip(points,points[1:]));pace=m.get('pace',3.1);span=length/pace
                if kind=='enter':
                    end=E[m['arriveBeforeLine']]['start']-m.get('gap',.2) if m.get('arriveBeforeLine') else B[bid]['start']+m.get('startAt',.05)+span;start=end-span
                else:
                    start=E[m['leaveAfterLine']]['end']+m.get('gap',.15) if m.get('leaveAfterLine') else B[bid]['end']-m.get('endGap',.1)-span;end=start+span
                if start<B[bid]['start']-1e-8:raise ValueError(f'{bid}.{kind}[{i}]: increase firstLineAt by {B[bid]["start"]-start:.2f}s so {who} can arrive from off-screen before speaking')
                if end>B[bid]['end']+1e-8:raise ValueError(f'{bid}.{kind}[{i}]: increase tail by {end-B[bid]["end"]:.2f}s so {who} leaves off-screen before the cut')
                pid=m.get('id',f'{bid}-{who}-{kind}-{i}');paths.append({'id':pid,'who':who,'beat':bid,'start':start,'end':end,'points':points,'endYaw':m.get('endYaw',0),'startYaw':m.get('startYaw',0),'gait':m.get('gait')})
                a.setdefault('paths',[])
                if pid not in a['paths']:a['paths'].append(pid)
                if kind=='exit':a['hideAfter']='path'
    for p in paths:
        p.setdefault('stride',.27);p.setdefault('width',.155);p.setdefault('endYaw',0);p.setdefault('surface','grass')
        p['length']=sum(math.dist(a,b) for a,b in zip(p['points'],p['points'][1:]));leg=.97*.56*leg_sizes.get(p['who'],1)
        p['plan']=gait_plan.plan_path(p['start'],p['end'],p['length'],leg,mode=p.get('gait'));problems=gait_plan.check_plan(p['plan'],p['start'],p['end'])
        if problems:raise ValueError(f'{p["id"]}: slow this path or lengthen its duration: {problems}')
        p['stride']=2*p['plan']['step'];p['contacts']=gait_plan.contacts(p['plan'])
        for i,c in enumerate(p['contacts']):sfx.append([f'step_{"stone" if p["surface"]=="stone" else "sand"}{i%4}',c['time'],.033])
    cuts=[]
    for bid,d in data['beats'].items():
        for c in d.get('closeUps',[]):
            first=E[c['line']];last=E[c.get('to',c['line'])];who=c['who'];pad=c.get('pad',[.15,.45]);start=first['start']-pad[0];end=last['end']+pad[1]
            later=[e['start'] for e in events if not e['silent'] and e['who']!=who and e['start']>last['start']]
            earlier=[e['end'] for e in events if not e['silent'] and e['who']!=who and e['start']<first['start']]
            if later:end=min(end,math.floor(min(later)*12)/12)
            if earlier:start=max(start,math.ceil(max(earlier)*12)/12)
            if end-start<1.1:raise ValueError(f'{bid}.closeUps line {c["line"]}: remove this cut or extend it to a consecutive line by {who}; it is shorter than 1.1 seconds')
            cuts.append({'start':round(start,3),'end':round(end,3),'who':who,'kind':'close','dist':c.get('dist',4.6),'height':c.get('height',.62),'beat':bid})
    actions={k:[clock(x) for x in v] if isinstance(v,list) else clock(v) for k,v in data.get('actions',{}).items()};actions.setdefault('lampOff',ending+1.1)
    fast=sorted([[clock(a),clock(b)] for a,b in data.get('fastWindows',[]) ]);merged=[]
    for a,b in fast:
        if merged and a<=merged[-1][1]+.05:merged[-1][1]=max(merged[-1][1],b)
        else:merged.append([a,b])
    for name,at,gain in data.get('audio',{}).get('sfx',[]):sfx.append([name,clock(at),gain])
    timeline={'series':script['series'],'episode':script['episode'],'title':script['title'],'next':script.get('next'),'duration':duration,'fps':24,'drawing_fps':12,'beats':beats,'events':events,'paths':paths,'end_start':ending,'voices_reused':len(recordings),'source':f'episodes/ep{script["episode"]:02}.json','actions':actions,'fastWindows':[[round(a,4),round(b,4)] for a,b in merged],'cuts':cuts}
    cue={'END':round(duration*30)-1,'voices':[[e['id'],e['start'],f'gain:{.85 if e["who"]=="pip" else .92}',*(['style:whisper'] if e.get('quiet') else [])] for e in events if not e['silent']],'sfx':sfx,'music_segments':data.get('audio',{}).get('music_segments',[['lofi',0,duration,.05,[]]]),'ambience':data.get('audio',{}).get('ambience',[]),'act':'staging-data'}
    return timeline,cue,recordings

def offscreen_x(c,z,side):
    # Same head-point projection as edges.cjs. Camera-local right determines screen side, including reverse lake shots.
    pos=c['pos'];target=c['target'];sub=lambda a,b:[x-y for x,y in zip(a,b)];norm=lambda a:[x/math.sqrt(sum(y*y for y in a)) for x in a]
    forward=norm(sub(target,pos));right=norm([-forward[2],0,forward[0]]);up=[right[1]*forward[2]-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]-right[1]*forward[0]]
    # Flatten preserves the target plane framing. Use full transformed camera to agree at other depths.
    fov=c.get('fov',45);flat=c.get('flatten',True)
    if flat:
        scale=flat if isinstance(flat,(int,float)) and not isinstance(flat,bool) else 1.3
        ft=c.get('flatTarget',target);distance=max(2,sum((ft[i]-pos[i])*forward[i] for i in range(3)));pos=[pos[i]-forward[i]*distance*(scale-1) for i in range(3)];fov=math.degrees(2*math.atan(math.tan(math.radians(fov)/2)/scale))
    sign=-1 if side=='left' else 1;direction=sign*(1 if right[0]>=0 else -1);x=target[0]
    for _ in range(1600):
        delta=sub([x,1.1,z],pos);depth=sum(a*b for a,b in zip(delta,forward));ndc=sum(a*b for a,b in zip(delta,right))/(depth*math.tan(math.radians(fov)/2)*16/9)
        if sign*ndc>1.12:return x+direction*.5
        x+=direction*.25
    raise ValueError('camera: move camera so an x-axis entrance at this depth can leave the frame')

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('staging',type=Path);p.add_argument('--placeholder-voices',action='store_true');args=p.parse_args()
    folder=args.staging.resolve().parent
    try:
        data=json.loads(args.staging.read_text());script=load_script(data['episode']);errors=validate(data,script,hook_names=load_hooks(data,folder))
        if errors:raise ValueError('\n'.join(errors))
        timeline,cues,recordings=compile_episode(data,script,folder,args.placeholder_voices)
        errors=validate(data,script,hook_names=load_hooks(data,folder),timeline=timeline)
        if errors:raise ValueError('\n'.join(errors))
        out=folder/'source';assets=folder/'assets/data';assets.mkdir(exist_ok=True,parents=True)
        (folder/'render-data.html').write_text((ROOT/'art/three/episode/render.html').read_text())
        (out/'timeline-data.json').write_text(json.dumps(timeline,indent=2)+'\n');(out/'staging-compiled.json').write_text(json.dumps(data,indent=2)+'\n')
        (assets/'cues.json').write_text(json.dumps(cues,indent=2)+'\n');(assets/'voice-manifest.json').write_text(json.dumps({'recordings':recordings,'placeholder':any(r['placeholder'] for r in recordings)},indent=2)+'\n')
        if not (assets/'vo').exists():(assets/'vo').symlink_to('../vo')
        script_path=ROOT/f'episodes/ep{data["episode"]:02}.json'
        if not script_path.exists():script_path.write_text(json.dumps(script,indent=2)+'\n')
        print(f'PASS prepared Episode {data["episode"]}: {len(timeline["events"])} events, {len(timeline["paths"])} paths, {timeline["duration"]:.3f}s; placeholder={any(r["placeholder"] for r in recordings)}')
    except (ValueError,OSError,KeyError,TypeError) as e:print(f'FAIL {args.staging}: {e}',file=sys.stderr);return 1
    return 0
if __name__=='__main__':sys.exit(main())
