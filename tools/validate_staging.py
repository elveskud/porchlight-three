#!/usr/bin/env python3
"""Validate actionable staging names and dialogue/camera continuity, without a browser."""
import argparse, importlib.util, json, math, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SIDES={'left','right'}

def load_script(number):
    path=ROOT/f'episodes/ep{number:02}.json'
    if path.exists():return json.loads(path.read_text())
    spec=importlib.util.spec_from_file_location('porchlight_script_checker',ROOT/'tools/check_scripts.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module.screenplay.parse((ROOT/f'episodes/ep{number:02}.txt').read_text(),str(ROOT/f'episodes/ep{number:02}.txt'))[0]

def names():
    sets=set(re.findall(r"set\('([a-z_0-9]+)'",(ROOT/'art/three/sets/catalog.js').read_text()))
    actors={'riot','rocco','bash','pip','preston','marlo','mayor','bashmom','hiker','brook','gus','dot','owl'}
    actors.update(re.findall(r"'([a-z_]+)'",(ROOT/'art/three/animation/v5/characters/index.js').read_text().split('export const CHARACTERS')[1].split('];')[0]))
    return sets,actors

def validate(data,script,spots=None,hook_names=None,timeline=None):
    errors=[];sets,actors=names();spots=spots if spots is not None else json.loads((ROOT/'art/three/sets/spots.json').read_text())
    def fail(where,fix):errors.append(f'{where}: {fix}')
    raw={b['id']:b for b in script['beats']};beats=data.get('beats',{})
    if data.get('episode')!=script['episode']:fail('episode',f"set episode to {script['episode']}")
    for bid in raw.keys()-beats.keys():fail('beats',f'add beat {bid} from the script')
    for bid in beats.keys()-raw.keys():fail(f'beats.{bid}',f'remove this beat; script beat ids are {", ".join(raw)}')
    if hook_names is None:hook_names=set(data.get('availableHooks',[]))
    def vector(value):return isinstance(value,list) and len(value)==3 and all(isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n) for n in value)
    events={e['id']:e for e in (timeline or {}).get('events',[])}
    for bid,b in beats.items():
        if bid not in raw:continue
        where=f'beats.{bid}';sid=b.get('set')
        if sid not in sets:fail(where+'.set',f'replace {sid!r} with a catalog set id: {", ".join(sorted(sets))}')
        lines={f'{bid}_{i:02}':line for i,line in enumerate(raw[bid].get('lines',[]))}
        camera=b.get('camera',{})
        for field in ['pos','target']:
            if not isinstance(camera.get(field),list) or len(camera[field])!=3 or not all(isinstance(n,(float,int)) and math.isfinite(n) for n in camera[field]):fail(where+'.camera',f'add {field}: [x, y, z] with three finite numbers')
        if not isinstance(camera.get('fov',45),(int,float)) or not 1<camera.get('fov',45)<150:fail(where+'.camera.fov','set fov to a finite angle between 1 and 150 degrees')
        staged=b.get('actors',{})
        for who,a in staged.items():
            w=where+'.actors.'+who
            if who not in actors:fail(w,f'replace {who!r} with a registered actor id')
            if 'at' in a and not vector(a['at']):fail(w+'.at','replace at with [x, y, z] containing three finite numbers')
            if a.get('seat'):
                if not isinstance(a['seat'],str):fail(w+'.seat','replace seat with a named seat string from spots.json')
                elif a['seat'] not in spots.get(sid,{}):fail(w+'.seat',f'replace {a["seat"]!r} with a named seat from spots.json for {sid}: {", ".join(spots.get(sid,{})) or "add a measured seat first"}')
            elif a.get('seated'):fail(w,f'add seat: "<named seat>" from spots.json for {sid}; seated actors must name a seat')
            elif not a.get('at'):fail(w,'add at: [x, y, z] or seat: "<named seat>"')
        for lid,line in lines.items():
            if line.get('say','').strip()!='...' and line.get('who') not in staged:fail(where+'.actors',f'add actor {line.get("who")} because line {lid} speaks in this beat')
        motion_ids={m.get('id') for m in b.get('motion',[])}
        motion_ids.update(m.get('id',f'{bid}-{m.get("who")}-{kind}-{i}') for kind in ['enter','exit'] for i,m in enumerate(b.get(kind,[])))
        for who,a in staged.items():
            for pid in a.get('paths',[]):
                if pid not in motion_ids:fail(where+'.actors.'+who+'.paths',f'add motion with id {pid!r} in this beat or remove that path reference')
        for i,m in enumerate(b.get('motion',[])):
            if m.get('who') not in staged:fail(f'{where}.motion[{i}].who',f'add actor {m.get("who")} to this beat first')
        for kind in ['enter','exit']:
            for i,m in enumerate(b.get(kind,[])):
                w=f'{where}.{kind}[{i}]'
                if m.get('side') not in SIDES:fail(w+'.side','add side: "left" or side: "right" so the path starts/ends off-screen')
                for field in ['to' if kind=='enter' else 'from']:
                    if field in m and not vector(m[field]):fail(w+'.'+field,'replace this position with [x, y, z] containing three finite numbers')
                if m.get('who') not in staged:fail(w+'.who',f'add actor {m.get("who")} to this beat\'s actors first')
                key='arriveBeforeLine' if kind=='enter' else 'leaveAfterLine'
                if m.get(key) and m[key] not in lines:fail(w+'.'+key,f'replace {m[key]!r} with a line id from {bid}: {", ".join(lines)}')
        for name in b.get('hooks',[]):
            if name not in hook_names:fail(where+'.hooks',f'export hook {name!r} from props.js and include it in hookNames, or remove it from staging')
        for i,c in enumerate(b.get('closeUps',[])):
            w=f'{where}.closeUps[{i}]';first=c.get('line');last=c.get('to',first);who=c.get('who')
            for key,lid in [('line',first),('to',last)]:
                if lid not in lines:fail(w+'.'+key,f'replace {lid!r} with a line id from {bid}: {", ".join(lines)}')
            if first not in lines or last not in lines:continue
            ids=list(lines);a=ids.index(first);z=ids.index(last)
            if z<a:fail(w+'.to',f'set to to {first} or a later line in the same beat')
            if who not in staged:fail(w+'.who',f'add actor {who} to this beat\'s actors first')
            if any(lines[lid].get('who')!=who and lines[lid].get('say')!='...' for lid in ids[a:z+1]):fail(w+'.to',f'end the close-up before the next speaker; set to to {first} or the last consecutive line by {who}')
            if c.get('duration',1.1)<1.1:fail(w+'.duration','set duration to at least 1.1 seconds, or remove the close-up')
            if first in events and last in events:
                pad=c.get('pad',[.15,.45]);start=c.get('start',events[first]['start']-pad[0]);end=c.get('end',events[last]['end']+pad[1])
                later=[e['start'] for e in events.values() if not e.get('silent') and e['who']!=who and e['start']>events[last]['start']]
                if later and 'end' not in c:end=min(end,math.floor(min(later)*12)/12)
                earlier=[e['end'] for e in events.values() if not e.get('silent') and e['who']!=who and e['start']<events[first]['start']]
                if earlier and 'start' not in c:start=max(start,math.ceil(max(earlier)*12)/12)
                if later and end>min(later):fail(w+'.end',f'end the close-up at or before {min(later):.3f} seconds, before the next speaker')
                if end-start<1.1:fail(w,'extend this close-up to at least 1.1 seconds without crossing the next speaker, or remove it')
    return errors

def load_hooks(data,folder):
    if not data.get('hookModule'):return set()
    path=(folder/data['hookModule']).resolve()
    if not path.is_file():return set()
    text=path.read_text();m=re.search(r'export const hookNames\s*=\s*\[([^]]*)\]',text)
    return set(re.findall(r"['\"]([^'\"]+)['\"]",m[1])) if m else set()

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('staging',type=Path);parser.add_argument('--timeline',type=Path);args=parser.parse_args()
    try:
        data=json.loads(args.staging.read_text());script=load_script(int(data['episode']));timeline=json.loads(args.timeline.read_text()) if args.timeline else None
        errors=validate(data,script,hook_names=load_hooks(data,args.staging.parent),timeline=timeline)
    except (OSError,ValueError,KeyError,TypeError) as e:print(f'FAIL {args.staging}: repair the staging JSON or referenced file: {e}');return 1
    for e in errors:print(f'FAIL {args.staging}: {e}')
    if not errors:print(f'PASS {args.staging}: beat ids, sets, actors, seats, lines, hooks, entrances and close-ups')
    return bool(errors)
if __name__=='__main__':sys.exit(main())
