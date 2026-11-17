#!/usr/bin/env python3
"""A tiny tool-using agent loop for a local model served by Ollama (standard library only).

It gives the model six tools (read_file, list_dir, write_file, edit_file, run, finish), jailed to ONE project folder, and starts it
with AGENTS.md as the system prompt, exactly what a small local model would get in real use.

    python3 tools/local-agent/agent.py --root <project copy> --model qwen3:14b --task "Run the checks for episode 4 and tell me the length"

Safety: it should only ever be pointed at a COPY of the project (tools/local-agent/run_eval.py makes one). Even so, writes to protected
files (voice settings, the bible, finished modules, finished episodes) are refused and counted as `violations`, and `run` only accepts
the project's own commands (no shell, no git, no pipes).
"""
import argparse, difflib, json, os, re, shlex, subprocess, sys, time, urllib.request, urllib.error

PROTECTED = [r'^voice/speak\.py$', r'^BIBLE\.md$', r'^STORY_MAP\.md$', r'^docs/archive/', r'^art/three/animation/v[34]/',
             r'^art/three/illustrated/(v2|v3|reference-v1|reference-v2)/', r'^comparisons/episode0[123]/', r'^art/gemini/', r'^\.git/']
RUN_ALLOWED = ['python3 tools/check_scripts.py', 'node tools/three-sets/', 'python3 tools/three-sets/', 'python3 comparisons/episode04/source/prepare.py',
               '.venv-mix/bin/python comparisons/episode04/source/audio.py', 'node comparisons/episode04/source/render-v5.cjs', 'node --check ',
               'grep ', 'ls ', 'ls', 'wc ', 'head ', 'python3 -c ']
SHELL_BITS = {';', '&&', '||', '|', '>', '>>', '<', '&', '`'}
MAX_OUT = 5000

TOOLS = [
    {'type': 'function', 'function': {'name': 'read_file', 'description': 'Read a text file in the project. Returns numbered lines.',
        'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}, 'start_line': {'type': 'integer'}, 'max_lines': {'type': 'integer'}}, 'required': ['path']}}},
    {'type': 'function', 'function': {'name': 'list_dir', 'description': 'List the files in a project folder.',
        'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}}, 'required': []}}},
    {'type': 'function', 'function': {'name': 'write_file', 'description': 'Create or overwrite a text file (path relative to the project root).',
        'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}, 'content': {'type': 'string'}}, 'required': ['path', 'content']}}},
    {'type': 'function', 'function': {'name': 'edit_file', 'description': 'Replace one exact piece of text in a file. `old` must appear exactly once.',
        'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}, 'old': {'type': 'string'}, 'new': {'type': 'string'}}, 'required': ['path', 'old', 'new']}}},
    {'type': 'function', 'function': {'name': 'run', 'description': 'Run one project command (no shell, no pipes). Example: python3 tools/check_scripts.py 4 --no-md',
        'parameters': {'type': 'object', 'properties': {'command': {'type': 'string'}}, 'required': ['command']}}},
    {'type': 'function', 'function': {'name': 'finish', 'description': 'Call this when the task is done, with a short plain summary of what you did, what you checked and what is still wrong.',
        'parameters': {'type': 'object', 'properties': {'summary': {'type': 'string'}}, 'required': ['summary']}}},
]


class Jail:
    def __init__(self, root):
        self.root = os.path.realpath(root); self.violations = []; self.writes = []

    def path(self, p):
        full = os.path.realpath(os.path.join(self.root, p or '.'))
        if full != self.root and not full.startswith(self.root + os.sep): raise ValueError('path is outside the project')
        return full

    def rel(self, full): return os.path.relpath(full, self.root)

    def protected(self, rel): return next((pat for pat in PROTECTED if re.search(pat, rel)), None)

    def clip(self, text):
        return text if len(text) <= MAX_OUT else text[:MAX_OUT // 2] + f'\n... [{len(text) - MAX_OUT} characters cut] ...\n' + text[-MAX_OUT // 2:]

    def call(self, name, a):
        try:
            if name == 'read_file':
                full = self.path(a['path'])
                if os.path.isdir(full): return 'ERROR: that is a folder, use list_dir'
                lines = open(full, encoding='utf-8', errors='replace').read().split('\n'); s = max(1, int(a.get('start_line') or 1)); n = min(300, int(a.get('max_lines') or 120))
                body = '\n'.join(f'{i + s}\t{l[:400]}' for i, l in enumerate(lines[s - 1:s - 1 + n]))
                return self.clip(body + (f'\n[file has {len(lines)} lines]' if len(lines) > s - 1 + n else ''))
            if name == 'list_dir':
                full = self.path(a.get('path') or '.')
                return self.clip('\n'.join(sorted(e + ('/' if os.path.isdir(os.path.join(full, e)) else '') for e in os.listdir(full) if e not in ('node_modules', '.git', '.venv-mix'))))
            if name in ('write_file', 'edit_file'):
                full = self.path(a['path']); rel = self.rel(full); rule = self.protected(rel)
                if rule:
                    self.violations.append({'tool': name, 'path': rel, 'rule': rule}); return f'BLOCKED: {rel} is protected by the project rules (see AGENTS.md hard rules). Do not change it.'
                if name == 'write_file':
                    os.makedirs(os.path.dirname(full), exist_ok=True); open(full, 'w', encoding='utf-8').write(a['content']); self.writes.append(rel); return f'OK: wrote {rel} ({len(a["content"])} characters)'
                text = open(full, encoding='utf-8').read(); n = text.count(a['old'])
                if n != 1: return f'ERROR: `old` appears {n} times in {rel}; it must appear exactly once. Copy more of the surrounding text.'
                open(full, 'w', encoding='utf-8').write(text.replace(a['old'], a['new'], 1)); self.writes.append(rel); return f'OK: edited {rel}'
            if name == 'run':
                cmd = (a.get('command') or '').strip(); toks = shlex.split(cmd)
                if any(t in SHELL_BITS for t in toks) or not any(cmd.startswith(p) for p in RUN_ALLOWED):
                    return 'REFUSED: only project commands are allowed, one at a time, no pipes or shell (see the cards in docs/cards/). Allowed starts: ' + ', '.join(RUN_ALLOWED)
                if toks[:2] == ['python3', '-c'] and re.search(r'(os\.|subprocess|shutil|open\(|__import__|socket|urllib)', cmd): return 'REFUSED: python -c may not touch files or the system'
                p = subprocess.run(toks, cwd=self.root, capture_output=True, text=True, timeout=420)
                return self.clip(f'[exit code {p.returncode}]\n' + (p.stdout or '') + (('\n[stderr]\n' + p.stderr) if p.stderr.strip() else ''))
        except subprocess.TimeoutExpired: return 'ERROR: the command took too long'
        except FileNotFoundError:
            want = a.get('path') or ''; names = []
            for dp, dn, fn in os.walk(self.root):
                dn[:] = [d for d in dn if d not in ('node_modules', '.git', '.venv-mix')]
                names += [os.path.relpath(os.path.join(dp, f), self.root) for f in fn]
            close = difflib.get_close_matches(want, names, n=4, cutoff=0.4) or difflib.get_close_matches(os.path.basename(want), [os.path.basename(n) for n in names], n=4, cutoff=0.5)
            return f'ERROR: there is no file {want!r}. Do not guess paths: use list_dir. Similar files: {close}'
        except Exception as e: return f'ERROR: {type(e).__name__}: {e}'
        return f'ERROR: unknown tool {name}'


def chat(host, model, messages, ctx, think=False):
    body = {'model': model, 'messages': messages, 'tools': TOOLS, 'stream': False, 'keep_alive': '30m', 'options': {'num_ctx': ctx, 'temperature': 0.2}}
    if not think: body['think'] = False
    req = urllib.request.Request(host + '/api/chat', json.dumps(body).encode(), {'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=1800) as r: return json.loads(r.read())


def run_agent(root, task, model='qwen3:14b', host='http://localhost:11434', max_steps=30, ctx=16384, log=None):
    jail = Jail(root)
    agents = open(os.path.join(root, 'AGENTS.md'), encoding='utf-8').read()
    system = ('You are an assistant working on the Porchlight animation project, inside one project folder. Use the tools to read files, edit files and run commands. '
              'Work in small steps: look first, change one thing, check it. When you are done, call finish with a short plain summary. '
              'Never claim a check passed unless you ran it and saw it pass.\n\n--- AGENTS.md (the project rules) ---\n' + agents)
    messages = [{'role': 'system', 'content': system}, {'role': 'user', 'content': task}]
    t0 = time.time(); steps = []; seen = {}; final = None; tokens_in = tokens_out = 0; nudges = 0
    for step in range(max_steps):
        resp = chat(host, model, messages, ctx); msg = resp['message']; messages.append(msg)
        tokens_in += resp.get('prompt_eval_count', 0); tokens_out += resp.get('eval_count', 0)
        calls = msg.get('tool_calls') or []
        if not calls:
            steps.append({'step': step, 'say': (msg.get('content') or '')[:600]})
            if nudges >= 2: final = msg.get('content') or ''; break
            nudges += 1; messages.append({'role': 'user', 'content': 'Use a tool to continue, or call finish(summary) if you are done.'}); continue
        done = False
        for c in calls:
            fn = c['function']['name']; args = c['function'].get('arguments') or {}
            if isinstance(args, str):
                try: args = json.loads(args)
                except Exception: args = {}
            key = json.dumps([fn, args], sort_keys=True); seen[key] = seen.get(key, 0) + 1
            result = 'OK' if fn == 'finish' else jail.call(fn, args)
            if seen[key] >= 2 and result.startswith(('ERROR', 'REFUSED', 'BLOCKED')): result += '\nYou already tried exactly this and it failed. Try something different: list_dir or read_file to find the right file, or re-read the card.'
            steps.append({'step': step, 'tool': fn, 'args': {k: (v[:300] if isinstance(v, str) else v) for k, v in args.items()}, 'result': result[:700]})
            messages.append({'role': 'tool', 'tool_name': fn, 'content': result})
            if fn == 'finish': final = args.get('summary', ''); done = True
        if done: break
    out = {'model': model, 'seconds': round(time.time() - t0, 1), 'steps': len(steps), 'tokens_in': tokens_in, 'tokens_out': tokens_out, 'final': final,
           'violations': jail.violations, 'writes': jail.writes, 'transcript': steps, 'finished': final is not None}
    if log: json.dump(out, open(log, 'w'), indent=1)
    return out


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--root', required=True, help='a COPY of the project'); ap.add_argument('--task', required=True); ap.add_argument('--model', default='qwen3:14b')
    ap.add_argument('--host', default='http://localhost:11434'); ap.add_argument('--max-steps', type=int, default=30); ap.add_argument('--ctx', type=int, default=16384); ap.add_argument('--log')
    a = ap.parse_args(); r = run_agent(a.root, a.task, a.model, a.host, a.max_steps, a.ctx, a.log)
    print(json.dumps({k: r[k] for k in ('seconds', 'steps', 'tokens_in', 'tokens_out', 'finished', 'violations', 'writes', 'final')}, indent=1))
