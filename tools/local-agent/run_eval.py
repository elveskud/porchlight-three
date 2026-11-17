#!/usr/bin/env python3
"""Score a local model on the project's real tasks, each in its own throwaway copy of the project.

  python3 tools/local-agent/run_eval.py --work <folder> [--model qwen3:14b] [--only T2,T5] [--calibrate]

--calibrate: no model. Checks that every planted problem really fails before the model touches it (so a pass means something).
Writes <work>/results.json and <work>/results.md and prints a table. Each transcript is in <work>/<task id>/transcript.json.
"""
import argparse, json, os, re, shutil, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from agent import run_agent

FACE_WORDS = None
def known_words(root):
    src = open(os.path.join(root, 'art/three/animation/v5/performance.js'), encoding='utf-8').read()
    faces = set(re.findall(r'^  ([a-z_0-9]+): \{', src[src.index('const FACES = {'):src.index('/** Move the pose toward a face')], re.M))
    acts = set(re.findall(r"'([a-z_]+)'", src[src.index('const ACTIONS = new Set(['):src.index(']);', src.index('const ACTIONS = new Set(['))]))
    return faces, acts

def sha(p): return subprocess.run(['shasum', '-a', '256', p], capture_output=True, text=True).stdout.split()[0] if os.path.exists(p) else None

def check(root, base_hashes, result, c):
    t = c['type']
    if t == 'answer_regex': ok = bool(re.search(c['pattern'], result.get('final') or '')); return ok, f"answer ~ /{c['pattern']}/"
    if t == 'no_writes': return not result['writes'], 'no files written' + ('' if not result['writes'] else f" (wrote {result['writes']})")
    if t == 'no_violations': return not result['violations'], 'no protected file touched' + ('' if not result['violations'] else f" (tried {[v['path'] for v in result['violations']]})")
    if t == 'unchanged': return sha(os.path.join(root, c['path'])) == base_hashes.get(c['path']), f"{c['path']} unchanged"
    if t == 'file_contains': return c['text'] in open(os.path.join(root, c['path']), encoding='utf-8').read(), f"{c['path']} contains the original line"
    if t == 'file_regex': return bool(re.search(c['pattern'], open(os.path.join(root, c['path']), encoding='utf-8').read())), f"{c['path']} ~ /{c['pattern']}/"
    if t == 'cmd':
        p = subprocess.run(c['cmd'].split(), cwd=root, capture_output=True, text=True, timeout=420); out = p.stdout + p.stderr
        ok = p.returncode == 0 and bool(re.search(c.get('regex') or '', out)); return ok, f"`{c['cmd']}` exit {p.returncode}" + (f" ~ /{c['regex']}/" if c.get('regex') else '')
    if t == 'face_known': faces, acts = known_words(root); return c['face'] in faces, f"face '{c['face']}' known to the checker"
    if t == 'dialogue':
        faces, acts = known_words(root); path = os.path.join(root, c['file'])
        if not os.path.exists(path): return False, 'dialogue.txt exists'
        lines = [l.strip() for l in open(path, encoding='utf-8').read().split('\n') if l.strip() and not l.strip().startswith(('#', '//'))]
        rx = re.compile(r'^(RIOT|ROCCO|BASH|PIP)(?: \(([a-z_ ,]+)\))?: (.+)$'); bad = []; speakers = set(); long_ = []
        for l in lines:
            m = rx.match(l)
            if not m: bad.append(l[:50]); continue
            speakers.add(m.group(1)); toks = [x.strip() for x in (m.group(2) or '').split(',') if x.strip()]
            if any(x not in faces and x not in acts and x not in ('quietly', 'whispers', 'joke', 'punch') for x in toks): bad.append('unknown tag: ' + l[:50])
            if len(m.group(3).split()) > c['max_words']: long_.append(l[:40])
            if re.search(r'(?i)download|girlfriend|kiss', l): bad.append('forbidden: ' + l[:40])
        ok = len(lines) >= c['min_lines'] and not bad and not long_ and speakers == {'RIOT', 'ROCCO', 'BASH', 'PIP'}
        return ok, f"{len(lines)} lines, speakers {sorted(speakers)}, bad {bad[:2]}, too long {long_[:1]}"
    return False, f'unknown check {t}'

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--work', required=True); ap.add_argument('--model', default='qwen3:14b'); ap.add_argument('--only', default='')
    ap.add_argument('--calibrate', action='store_true'); ap.add_argument('--max-steps', type=int, default=30); a = ap.parse_args()
    tasks = json.load(open(os.path.join(HERE, 'tasks.json'))); only = set(filter(None, a.only.split(',')))
    work = os.path.abspath(a.work); os.makedirs(work, exist_ok=True); master = os.path.join(work, 'master')
    subprocess.run([sys.executable, os.path.join(HERE, 'make_scratch.py'), master], check=True, capture_output=True)
    rows = []
    for t in tasks:
        if only and not any(t['id'].startswith(o) for o in only): continue
        d = os.path.join(work, t['id']); shutil.rmtree(d, ignore_errors=True); subprocess.run(['cp', '-c', '-R', master, d], check=True)   # APFS clone: instant
        for pl in t.get('plant', []):
            f = os.path.join(d, pl['file']); s = open(f, encoding='utf-8').read(); assert pl['old'] in s, pl; open(f, 'w', encoding='utf-8').write(s.replace(pl['old'], pl['new'], 1))
        base = {c['path']: sha(os.path.join(d, c['path'])) for c in t['verify'] if c['type'] == 'unchanged'}
        if a.calibrate:
            res = {'final': '', 'writes': [], 'violations': []}; outs = [check(d, base, res, c) for c in t['verify'] if c['type'] in ('cmd', 'file_contains')]
            fails = [x for x in outs if not x[0]]; good = bool(fails) if t.get('must_fail_before') else True
            rows.append({'id': t['id'], 'calibrate': 'OK (planted problem fails as expected)' if t.get('must_fail_before') and good else 'OK' if good else 'PROBLEM: planted task already passes'}); print(t['id'], rows[-1]['calibrate']); continue
        print(f"\n== {t['id']}: {t['title']}", flush=True)
        r = run_agent(d, t['prompt'], a.model, max_steps=a.max_steps, log=os.path.join(d, 'transcript.json'))
        checks = [(c, *check(d, base, r, c)) for c in t['verify']]; passed = r['finished'] and all(ok for _, ok, _ in checks)
        rows.append({'id': t['id'], 'title': t['title'], 'card': t['card'], 'passed': passed, 'finished': r['finished'], 'steps': r['steps'], 'seconds': r['seconds'], 'tokens_in': r['tokens_in'], 'tokens_out': r['tokens_out'],
                     'violations': len(r['violations']), 'checks': [{'what': w, 'ok': ok} for _, ok, w in checks], 'final': (r['final'] or '')[:500]})
        print(('PASS' if passed else 'FAIL'), f"{r['steps']} steps, {r['seconds']}s, {r['tokens_out']} tokens out"); [print('   ', 'ok  ' if ok else 'FAIL', w) for _, ok, w in checks]
    json.dump(rows, open(os.path.join(work, 'results-calibrate.json' if a.calibrate else 'results.json'), 'w'), indent=1)
    if not a.calibrate:
        md = ['| Task | Result | Steps | Time | Notes |', '|---|---|---|---|---|'] + [f"| {r['id']} | {'PASS' if r['passed'] else 'FAIL'} | {r['steps']} | {r['seconds']:.0f}s | {'; '.join(c['what'] for c in r['checks'] if not c['ok']) or 'all checks ok'} |" for r in rows]
        open(os.path.join(work, 'results.md'), 'w').write('\n'.join(md) + f"\n\n{sum(r['passed'] for r in rows)}/{len(rows)} passed with {a.model}\n"); print('\n' + '\n'.join(md)); print(f"\n{sum(r['passed'] for r in rows)}/{len(rows)} passed")

if __name__ == '__main__': main()
