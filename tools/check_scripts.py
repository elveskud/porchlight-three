#!/usr/bin/env python3
# Checks every Porchlight script (episodes/epNN.txt) and writes the readable, timecoded version (scripts/epNN.md).
# Uses the shared parser and timing code from pipeline/templates without changing it: PLANNED below lists the
# characters, sets and props the scripts need that the pipeline doesn't have yet, and they're added here, in memory only.
# The real `make.py --check` will stop on those until they're built; this one reports them as a build list.
#   python3 tools/check_scripts.py            all episodes
#   python3 tools/check_scripts.py 2 3        just these
#   python3 tools/check_scripts.py --no-md    check only
#   python3 tools/check_scripts.py --fit      first give silent action its screen time (writes [hold] cues)
# Timecodes use the engine's estimate (2.6 words a second). Real voices change them; the order and gaps stay.
import glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BLENDER = os.path.join(ROOT, "pipeline")  # script parser + sound and face lists, copied from the old shared pipeline
MODELS = os.environ.get("FRIENDZY_MODELS", os.path.expanduser("~/Desktop/Friendzy/Models"))  # optional: real app prompts
sys.path.insert(0, os.path.join(BLENDER, "templates"))
import screenplay, episode_script as ES  # noqa: E402

CHARACTERS = {"walt": "Walt", "brook": "Mrs. Brook", "gus": "Gus", "dot": "Dot", "hal": "Big Hal", "mayor": "The Mayor",
              "preston": "Preston", "hiker": "The hiker", "owl": "The teacher (Mr. Hoot)", "pipmom": "Pip's mom",
              "pipdad": "Pip's dad", "bashmom": "Bash's mom", "bea": "Bea (Bash's littlest sister)",
              "marlo": "Marlo (Preston's assistant)", "coach": "Coach Reyes (city)", "ledger": "Ms. Ledger (city archivist)",
              "narrator": "Narrator"}
SETS = {"hall outside": "hall_outside", "classroom": "classroom", "brook porch": "brook_porch", "main street": "main_street",
        "walt dining": "walt_dining", "walt hallway": "walt_hallway", "walt garage": "walt_garage", "gym": "school_gym",
        "archive": "archive", "gus garage": "gus_garage", "bash home": "bash_home", "pip home": "pip_home", "park": "park",
        "ranger station": "ranger_station", "town line": "town_line", "festival stage": "festival_stage",
        "city street": "city_street", "city pool": "city_pool", "city archive": "city_archive", "motel": "motel",
        "memory lake": "memory_lake", "walt porch": "walt_porch"}
EXISTING_SETS = {"lake", "lake_night", "stoop_sunset", "stoop_night", "apartment", "hall", "car"}
PROPS = ("die", "box", "notebook", "tape", "lantern", "photo", "letter", "crate", "clipboard", "backpack")
NEW_PROPS = set(PROPS)

screenplay.ROSTER = tuple(screenplay.ROSTER) + tuple(CHARACTERS)
for name, s in SETS.items():
    screenplay.SETS[(name, None)] = s
screenplay.SET_NAMES.update(SETS.values())
screenplay.PROPS = tuple(screenplay.PROPS) + PROPS
ES.CARRY = tuple(ES.CARRY) + PROPS
for w in CHARACTERS:
    ES.WALK_STEP[w] = 11
screenplay.load = lambda path: screenplay.parse(open(path, encoding="utf-8").read(), path)  # never writes a .json here


SOUNDS = set(re.findall(r"^def ([a-z_]+)\(", open(os.path.join(BLENDER, "audio/sfxkit.py"), encoding="utf-8").read(), re.M))
FACES = set(re.findall(r'^\s+"([a-z_0-9]+)":', open(os.path.join(BLENDER, "characters/cast.py"), encoding="utf-8").read(), re.M))


def real_prompts():
    """Every prompt in the app, for checking that the scripts' game prompts are real."""
    return "\n".join(open(f, encoding="utf-8").read() for f in glob.glob(os.path.join(MODELS, "*.swift"))).lower()


def tc(frames):
    s = int(frames / 30)
    return f"{s // 60}:{s % 60:02d}"


def speaker(who):
    return CHARACTERS.get(who, who.title()).upper()


def line_note(l):
    bits = [l[k] for k in ("face", "do") if l.get(k)]
    if l.get("quiet"):
        bits.append("quietly")
    if l.get("to"):
        bits.append(f"to {speaker(l['to']).title()}")
    return f" *({', '.join(bits)})*" if bits else ""


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


def to_markdown(path, ep, cues):
    """The readable script: every scene and line with its timecode, stage directions from the // notes."""
    src = open(path, encoding="utf-8").read().splitlines()
    head = [f"# Porchlight — Episode {ep['episode']}: \"{ep['title']}\"", ""]
    head.append(f"**Length (estimate):** {tc(cues['END'])}. **Next:** {ep.get('next') or '—'}. **Thumbnail:** {ep.get('thumb_text', '—')}")
    if ep.get("previously"):
        head.append(f"**Previously:** {ep['previously']}")
    head += ["", "Timecodes come from the engine's estimate; the voices will shift them slightly. Made from "
             f"`episodes/ep{ep['episode']:02d}.txt`, which is the file to edit.", ""]
    head += ["| Time | Scene | Place |", "|---|---|---|"]
    ids = {b["id"]: b for b in ep["beats"]}
    out, beats = [], cues["beats"]
    bi = -1
    said = {i: t for i, _, t in ES.lines({"template": "episode", "format": "horizontal", "script": path})}
    starts = {}  # spoken words -> when, in script order
    for B in beats:
        for e in B.get("events", []):
            if e.get("id") in said:
                starts.setdefault(clean(said[e["id"]]), []).append(e["start"])

    def at(text):
        q = starts.get(clean(text))
        return f"`{tc(q.pop(0))}` " if q else ""

    pending = []
    for raw in src:
        line = raw.strip()
        if line.startswith("=="):
            bi += 1
            B = beats[min(bi, len(beats) - 1)]
            parts = [p.strip() for p in line[2:].split("|")]
            head.append(f"| {tc(B['start'])} | {parts[0]} | {parts[1]} |")
            out += ["", f"## {tc(B['start'])} — {parts[0]}", f"*{parts[1]}. With: {parts[2] if len(parts) > 2 and parts[2] else 'nobody'}.*", ""]
        elif line == "[intro]":
            bi += 1
            B = beats[min(bi, len(beats) - 1)]
            head.append(f"| {tc(B['start'])} | Intro | title and theme |")
            out += ["", f"## {tc(B['start'])} — Intro", "*The Porchlight title and theme, then the episode card.*", ""]
        elif line == "--":
            bi += 1
        elif line.startswith("//"):
            out.append(f"*{line[2:].strip()}*\n")
        elif line.startswith("[game"):
            fields = [f.strip() for f in line.strip("[]").split(":", 1)[1].split("|")]
            out.append(f"{at(fields[0])}> **Friendzy card:** {fields[0]}\n")
            if line.startswith(("[game nhie", "[game td")):
                out.append(f"{at(fields[2])}**{speaker(fields[1].lower())}:** {fields[2]}\n")
            elif line.startswith("[game mlt"):
                out.append(f"*Everyone points at {speaker(fields[1].lower()).title()}.*\n")
        elif line.startswith("[json:") and '"game"' in line:
            g = json.loads(line[6:-1].strip())["game"]
            label = g.get("word") or g.get("feature") or g.get("type")
            out.append(f"> **Friendzy:** {g['type']} — {label}\n")
            for k in ("clue", "guess", "say"):
                if g.get(k):
                    out.append(f"{at(g[k])}**{speaker(g.get({'clue': 'describer', 'guess': 'guesser'}.get(k, 'who'), 'riot'))}:** {g[k]}\n")
        elif line.startswith("[chat"):
            out.append("> **Group chat:**")
            pending = ["chat"]
        elif pending == ["chat"]:
            if line:
                out.append(f"> {line}  ")
            else:
                pending = []
                out.append("")
        elif re.match(r"\[(text|card): ", line):
            out.append(f"> **On screen:** {line[1:-1].split(':', 1)[1].strip()}\n")
        elif line.startswith("[storm"):
            out.append("*Storm: rain, thunder, lightning.*\n")
        elif line.startswith("[sfx"):
            out.append(f"*Sound: {line[1:-1].split(':', 1)[1].strip()}.*\n")
        elif line.startswith("[") or not line or re.match(r"(#|next:|previously:|thumb:|grade:|grain:)", line):
            continue
        else:
            m = re.match(r"([A-Za-z]+)\s*(?:\(([^)]*)\))?\s*:\s*(.+)$", line)
            if m and m.group(1).lower() in screenplay.ROSTER:
                note = f" *({m.group(2)})*" if m.group(2) else ""
                out.append(f"{at(m.group(3))}**{speaker(m.group(1).lower())}**{note}: {m.group(3)}\n" if m.group(3) != "..." else f"*{m.group(1).title()}: a silent beat{' (' + m.group(2) + ')' if m.group(2) else ''}.*\n")
            else:
                out.append(f"*{line}*\n")
    return "\n".join(head + out) + "\n"


def fit_holds(path):
    """Silent action is written as // notes, which the engine doesn't time. Give each beat a [hold] long enough to play
    it: about 3 words of note a second when nobody speaks, 8 when it runs alongside dialogue. Safe to run again."""
    lines = open(path, encoding="utf-8").read().split("\n")
    out, beat = [], []

    def flush():
        if not beat:
            return
        notes = sum(len(x.split()) - 1 for x in beat if x.strip().startswith("//"))
        spoken = any(re.match(r"[A-Za-z]+\s*(\([^)]*\))?\s*:\s*\S", x.strip()) and not x.strip().endswith(": ...") for x in beat)
        have = [float(m.group(1)) for x in beat for m in [re.match(r"\[hold:\s*([\d.]+)\]", x.strip())] if m]
        need = max(have + [min(8, round(notes / 8)) if spoken else min(16, max(3, round(notes / 3)))])
        kept = [x for x in beat if not re.match(r"\[hold:", x.strip())]
        while kept and not kept[-1].strip():
            kept.pop()
        if notes or have:
            kept.append(f"[hold: {need:g}]")
        out.extend(kept + [""])
        beat.clear()

    for line in lines:
        t = line.strip()
        if t.startswith("==") or t == "--" or t == "[intro]":
            flush()
            out.append(line)
            if t == "[intro]":
                out.append("")
        else:
            beat.append(line)
    flush()
    open(path, "w", encoding="utf-8").write("\n".join(out).rstrip("\n") + "\n")


def timing(path):
    cfg = {"template": "episode", "format": "horizontal", "script": path}
    lines = ES.lines(cfg)
    dur = {i: max(0.6, len(t.split()) / 2.6 + 0.3) for i, _, t in lines}
    return ES.timeline(cfg, dur), len(lines)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    write = "--no-md" not in sys.argv
    wanted = {int(a) for a in args}
    prompts = real_prompts()
    used = {"chars": {}, "sets": {}, "props": {}}
    bad = total = 0
    rows = []
    for path in sorted(glob.glob(os.path.join(ROOT, "episodes/ep[0-9][0-9].txt"))):
        n = int(re.search(r"ep(\d+)", path).group(1))
        if wanted and n not in wanted:
            continue
        problems = []
        if "--fit" in sys.argv:
            fit_holds(path)
        try:
            ep, notes = screenplay.parse(open(path, encoding="utf-8").read(), path)
            cues, _ = timing(path)
        except SystemExit as e:
            print(f"ep{n:02d}: STOPPED: {e}")
            bad += 1
            continue
        sec = (cues["END"] + 1) / 30
        if not 175 <= sec <= 240:
            problems.append(f"length {sec:.0f} s is outside 175-240 s")
        raw = open(path, encoding="utf-8").read()
        problems += [f"broken fx cue: {x[:50]}" for x in re.findall(r"^\[fx .*$", raw, re.M) if x.count("[") != x.count("]")]
        problems += [f"fx options in a note: {x[:50]}" for x in re.findall(r"^// \w+=.*\]$", raw, re.M)]
        problems += [x for x in notes if not x.startswith("about ") and "(The town listens)" not in x]  # voice over: nobody's there
        for b in ep["beats"]:
            g = b.get("game") or {}
            p = g.get("prompt") or g.get("word")
            if p and f'"{p.lower()}"' not in prompts:
                problems.append(f"prompt isn't in the app: {p!r}")
            for snd in b.get("sfx", []):
                if snd not in SOUNDS:
                    problems.append(f"no sound {snd!r}")
            for l in b["lines"] + g.get("after", []):
                if l.get("face") and l["face"] not in FACES:
                    problems.append(f"no face {l['face']!r} ({l['say'][:40]})")
            for w in b["cast"]:
                if w in CHARACTERS:
                    used["chars"].setdefault(w, set()).add(n)
            if b["location"] not in EXISTING_SETS:
                used["sets"].setdefault(b["location"], set()).add(n)
            for what in (b.get("carry") or {}).values():
                if what in NEW_PROPS:
                    used["props"].setdefault(what, set()).add(n)
        if not ep.get("next") and n != 40:
            problems.append("no next:")
        if ep.get("episode") != n:
            problems.append("episode number doesn't match the file name")
        rows.append((n, ep["title"], sec))
        total += sec
        print(f"ep{n:02d} {sec:4.0f} s  {ep['title']}" + "".join(f"\n      - {p}" for p in problems))
        bad += bool(problems)
        if write:
            open(os.path.join(ROOT, f"scripts/ep{n:02d}.md"), "w", encoding="utf-8").write(to_markdown(path, ep, cues))
    if rows:
        print(f"{len(rows)} episodes, {total / 60:.0f} min in all, {total / len(rows):.0f} s on average; {bad} with something to look at")
    if len(rows) >= 40 and write:
        ranges = lambda eps: ", ".join(str(e) for e in sorted(eps))
        out = ["# What the 40 scripts need built", "", "Written by `tools/check_scripts.py` from the scripts themselves. None of this exists in the pipeline yet.", "",
               "## Characters", "| Character | Episodes |", "|---|---|"]
        out += [f"| {CHARACTERS[w]} | {ranges(e)} |" for w, e in sorted(used["chars"].items(), key=lambda kv: min(kv[1]))]
        out += ["", "## Sets", "| Set | Episodes |", "|---|---|"]
        out += [f"| `{w}` | {ranges(e)} |" for w, e in sorted(used["sets"].items(), key=lambda kv: min(kv[1]))]
        out += ["", "## Props held in the paw", "| Prop | Episodes |", "|---|---|"]
        out += [f"| {w} | {ranges(e)} |" for w, e in sorted(used["props"].items(), key=lambda kv: min(kv[1]))]
        open(os.path.join(ROOT, "scripts/BUILD_LIST.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
