#!/usr/bin/env python3
"""Create a starter staging file from the script; never overwrite authored staging."""
import argparse,json,sys
from pathlib import Path
from validate_staging import ROOT,load_script

PRELOAD=['park','apartment','lake','lake_night','stoop_sunset','stoop_night','main_street']

def make_staging(script,spots):
    beats={}
    for raw in script['beats']:
        sid=raw['location'];cast=list(raw.get('cast',{}))
        for line in raw.get('lines',[]):
            if line.get('who') and line['who'] not in cast:cast.append(line['who'])
        actors={}
        for i,who in enumerate(cast):
            available=spots.get(sid,{})
            if f'table_{who}' in available:actors[who]={'seat':f'table_{who}'}
            elif f'group_{who}' in available:actors[who]={'seat':f'group_{who}'}
            else:actors[who]={'at':[round((i-(len(cast)-1)/2)*1.2,3),0,1.1]}
        camera={'pos':[0,2.5,8],'target':[0,1.3,0],'fov':45,'flatten':False}
        beat={'set':sid,'firstLineAt':.6,'camera':camera,'actors':actors}
        if raw.get('chapter')=='Intro':
            beat['camera']={'pos':[1.2,3.2,11.5],'target':[-3.4,3.7,-16],'fov':50,'flatten':False};beat['duration']=7.5
        if sid.startswith('stoop_'):beat['camera']={'pos':[-.6,2.7,9],'target':[1.9,1.65,-.6],'fov':43,'flatten':False}
        beats[raw['id']]=beat
    return {'episode':script['episode'],'cast':list(dict.fromkeys(who for b in beats.values() for who in b['actors'])),
            'preloadSets':PRELOAD,'beats':beats,'moveAliases':{'cheer':'wave'},
            'hookModule':'../../art/three/episode/default-props.js',
            'ending':{'set':'stoop_night','camera':{'pos':[2.5,2.6,1.8],'target':[3.25,2.55,-.65],'fov':37,'flatten':False}}}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('episode',type=int);parser.add_argument('--output',type=Path);args=parser.parse_args()
    target=args.output or ROOT/f'comparisons/episode{args.episode:02}/staging.json'
    if target.exists():print(f'FAIL {target}: file exists; edit it, or choose a fresh --output path. No file was replaced.');return 1
    data=make_staging(load_script(args.episode),json.loads((ROOT/'art/three/sets/spots.json').read_text()))
    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(data,indent=2)+'\n')
    print(f'PASS initialized {target}: exact script beats, sets and cast. Review cameras, entrances, seating and prop hooks before rendering.')
    return 0
if __name__=='__main__':sys.exit(main())
