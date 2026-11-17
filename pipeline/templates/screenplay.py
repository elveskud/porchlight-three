# Plain-text episode scripts: write an episode like a screenplay, and this turns it into the episode JSON
# (written next to the script as <name>.json, so it can be read). make.py accepts either:
#   python3 make.py episode --script episodes/ep02.txt --format horizontal
#
#   # Porchlight 2: Dare House              <- series, episode number, title
#   next: Summer Homework                    <- optional header lines: next, previously, thumb (2-4 words),
#                                               grade (summer, autumn, winter, faded), grain (on)
#
#   == Cold open | hall, night | riot        <- a scene: chapter | place, time of day | who's in it (costume)
#   [text: Maple Hollow. Late.]              <- on-screen text (the first scene's is the hook)
#   RIOT carries a flashlight.
#   RIOT (determined, whispers): Again.      <- a line; brackets: a face, a move, how it's said, who it's to
#
#   == The dare | lake, day | riot (lifeguard), rocco, bash, pip
#   BASH enters left.
#   BASH (to pip): Easy.
#   [game td: Touch the door of the haunted house. | bash | Easy!]
#
# Bracketed cues: [text: ...] [card: Later that night.] [sfx: door] [storm] [fade] [letterbox] [mood: tense]
# [hold: 2] (seconds) [camera: close riot] [chat] (then "Name: message" lines up to a blank line)
# [game nhie: prompt | target | confession] [game mlt: prompt | target] [game td: dare | player | performance]
# [intro] (the title sequence + episode card, as its own scene), [json: {...}] (anything else, merged into the scene
# as-is). "--" starts a new beat in the same scene.
# Action lines: NAME enters left|right. NAME exits left|right. NAME walks to the <spot>. NAME sits on the <spot>.
# NAME stands at <spot>. NAME is asleep. NAME carries a phone|flashlight|cup.
# Plain Python (no Blender).
import json, os, re

ROSTER = ("riot", "bash", "pip", "rocco", "owl", "gus", "dot", "brook",
          "walt", "hal", "mayor", "preston", "marlo", "hiker", "bashmom", "pipmom", "pipdad", "bea")  # characters the cast code can draw (new ones join here)
COSTUMES = ("hoodie", "mafia", "dare", "coach", "host", "lifeguard")
# place + time of day -> painted set (locations.PLATE_SETS); a set's own name works too
SETS = {("lake", "day"): "lake", ("lake", "afternoon"): "lake", ("lake", "night"): "lake_night",
        ("lake", "evening"): "lake_night", ("stoop", "sunset"): "stoop_sunset", ("stoop", "evening"): "stoop_sunset",
        ("stoop", "night"): "stoop_night", ("apartment", None): "apartment", ("hall", None): "hall",
        ("haunted house", None): "hall", ("hall outside", None): "hall_outside", ("bash home", None): "bash_home", ("classroom", None): "classroom", ("main street", None): "main_street", ("brook porch", None): "brook_porch", ("pip home", None): "pip_home", ("pip garage", None): "pip_garage", ("park", None): "park", ("gym", None): "school_gym", ("school gym", None): "school_gym",("campfire", None): "campfire", ("car", None): "car",
        ("party room", None): "party_room", ("game show", None): "game_show", ("village", "night"): "village_night",
        ("living room", "day"): "living_room_day", ("living room", "night"): "living_room_night"}
SET_NAMES = {v for v in SETS.values()}
TIMES = {"day": 0, "afternoon": 1, "sunset": 2, "evening": 2, "night": 3}  # a jump backwards = a new day
MOVES = ("glance", "take", "laugh", "cheer", "nervous", "yell", "shrug", "facepalm", "wave", "thumbs", "present", "hop",
         "double_take", "point", "munch", "fan", "shiver", "stare",
         "cross", "hips", "nod", "shake", "clap", "count", "peace", "horns", "rock", "gloom", "yawn", "stretch", "scratch", "chuckle", "crouch", "pockets", "lean", "stand", "slouch",
         "highfive", "bump", "hug", "comfort", "sip", "reach", "pickup", "putdown", "throw", "drop",
         "kneel", "trip", "chin", "cannonball", "climb", "runto", "ground", "beanbag")  # the last row: drawn poses (poses.py)
PROPS = ("phone", "flashlight", "cup", "clipboard", "notebook")
QUIET = ("whispers", "whispering", "quietly", "softly", "quiet", "under his breath")
LONG_WORDS = 22          # lint: a line longer than this is hard to act and to read as a caption
WORDS_PER_SEC = 2.6      # length estimate for voiced lines


class ScriptError(SystemExit):
    pass


def _err(n, msg):
    raise ScriptError(f"script line {n}: {msg}")


_FACES = None


def _faces():
    """The face names in characters/cast.py EXPRESSIONS, read as text (cast.py needs Blender to import)."""
    global _FACES
    if _FACES is None:
        try:
            src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../characters/cast.py"), encoding="utf8").read()
            m = re.search(r"EXPRESSIONS = \{(.*?)\n\}", src, re.S)
            _FACES = set(re.findall(r'"(\w+)":', m.group(1))) if m else set()
        except OSError:
            _FACES = set()
    return _FACES


def _who(name, n, cast=None):
    w = name.strip().lower()
    if w not in ROSTER:
        _err(n, f"{name.strip()!r} isn't a character yet ({', '.join(ROSTER)})")
    if cast is not None and w not in cast:
        _err(n, f"{name.strip()} isn't in this scene (add them to the scene heading: {', '.join(cast)})")
    return w


def _set_for(place, n):
    p = place.strip().lower()
    if "," in p:
        where, when = (x.strip() for x in p.split(",", 1))
    else:
        where, when = p, None
    if where.replace(" ", "_") in SET_NAMES and when is None:
        return where.replace(" ", "_"), None
    for key in ((where, when), (where, None)):
        if key in SETS:
            return SETS[key], when
    known = sorted({f"{a}{', ' + b if b else ''}" for a, b in SETS})
    _err(n, f"no painted set for {place.strip()!r} yet (known: {'; '.join(known)})")


def _action(line, n, beat):
    """Interaction lines -> a silent line that does the move: "RIOT high-fives BASH.", "RIOT bumps BASH.",
    "RIOT hugs PIP.", "RIOT puts a paw on PIP's shoulder.", "RIOT picks up the phone.", "RIOT puts down the cup.",
    "RIOT throws the cup (at BASH).", "RIOT drops the phone.", "RIOT sips from the cup."."""
    rules = [
        (r"([A-Za-z]+)\s+high[- ]?fives\s+([A-Za-z]+)", "highfive", "who"),
        (r"([A-Za-z]+)\s+(?:bumps|shoulder-bumps)\s+(?:shoulders\s+with\s+)?([A-Za-z]+)", "bump", "who"),
        (r"([A-Za-z]+)\s+hugs\s+([A-Za-z]+)", "hug", "who"),
        (r"([A-Za-z]+)\s+puts\s+a\s+paw\s+on\s+([A-Za-z]+)'s\s+shoulder", "comfort", "who"),
        (r"([A-Za-z]+)\s+picks\s+up\s+(?:a|an|the|his)\s+(\w+)", "pickup", "prop"),
        (r"([A-Za-z]+)\s+puts\s+down\s+(?:a|an|the|his)\s+(\w+)", "putdown", "prop"),
        (r"([A-Za-z]+)\s+throws\s+(?:a|an|the|his)\s+(\w+)(?:\s+at\s+([A-Za-z]+))?", "throw", "prop"),
        (r"([A-Za-z]+)\s+drops\s+(?:a|an|the|his)\s+(\w+)", "drop", "prop"),
        (r"([A-Za-z]+)\s+sips(?:\s+from\s+(?:a|an|the|his)\s+(\w+))?", "sip", "prop"),
        (r"([A-Za-z]+)\s+(?:kneels|kneels\s+down|gets\s+down\s+on\s+one\s+knee)", "kneel", None),
        (r"([A-Za-z]+)\s+(?:trips|stumbles|trips\s+over)(?:\s+.*)?", "trip", None),
        (r"([A-Za-z]+)\s+(?:cannonballs|jumps\s+into\s+the\s+(?:lake|water))(?:\s+.*)?", "cannonball", None),
        (r"([A-Za-z]+)\s+climbs(?:\s+.*)?", "climb", None),
        (r"([A-Za-z]+)\s+runs\s+(?:at|toward|towards)\s+(?:the\s+)?(?:camera|us)", "runto", None),
        (r"([A-Za-z]+)\s+rests\s+(?:his\s+)?chin\s+(?:in|on)\s+(?:his\s+)?paws", "chin", None),
    ]
    for pat, move, kind in rules:
        m = re.match(pat + r"\.?$", line, re.I)
        if not m:
            continue
        l = {"who": _who(m.group(1), n, beat["cast"]), "say": "...", "silent": True, "do": move}
        if kind is None:
            l["pause"] = 6
        elif kind == "who":
            l["target"] = _who(m.group(2), n, beat["cast"])
        elif m.group(2):
            if m.group(2).lower() not in PROPS:
                _err(n, f"no prop {m.group(2)!r} ({', '.join(PROPS)})")
            l["prop"] = m.group(2).lower()
            if move == "throw" and m.lastindex >= 3 and m.group(3):
                l["target"] = _who(m.group(3), n, beat["cast"])
        if move == "hug":
            l["pause"] = 8
        return l
    return None


def parse(text, path="script"):
    """Script text -> (episode dict, notes). Notes: lint warnings and the length estimate."""
    ep = {"series": "Porchlight", "episode": 0, "title": "", "next": "", "beats": [],
          # Porchlight defaults: the auto-director, automatic acting, the porch-light ending, the lo-fi bed, scenes
          # without Riot, Riot reading game cards off his phone, sitters on furniture
          "direct": "auto", "ending": "porch_light", "beds": {"normal": "lofi"}, "riot_optional": True,
          "riot_phone": True, "sit": "auto", "act": "auto",
          # mouths as approved for Ep 1-2: a centred smile instead of the one-sided smirk, faces square to us
          # (a 3/4 turn slides mouths off the muzzle and leaves beards behind)
          "centre_mouth": True, "face_front_all": True}
    notes, beat, scene = [], None, None
    lines = text.splitlines()
    i = 0

    def new_beat(head):
        nonlocal beat
        beat = {"id": f"s{len(ep['beats']) + 1:02d}", "location": head["location"], "cast": dict(head["cast"]),
                "lines": [], "camera": "wide"}
        last = next((b.get("chapter") for b in reversed(ep["beats"]) if b.get("chapter")), None)
        if head.get("chapter") and not head.get("_chaptered") and head["chapter"] != last:  # one chapter per name in a row
            beat["chapter"] = head["chapter"]
        head["_chaptered"] = True
        ep["beats"].append(beat)
        return beat

    while i < len(lines):
        raw = lines[i]
        n = i + 1
        line = raw.strip()
        i += 1
        if not line or line.startswith("//"):
            continue
        m = re.match(r"#\s*(.+?)\s+(\d+)\s*:\s*(.+)$", line)
        if m and not ep["beats"]:
            ep["series"], ep["episode"], ep["title"] = m.group(1).strip(), int(m.group(2)), m.group(3).strip()
            continue
        m = re.match(r"(next|previously|thumb|grade|grain|ending_leaves)\s*:\s*(.+)$", line, re.I)
        if m and not ep["beats"]:
            k, v = m.group(1).lower(), m.group(2).strip()
            if k in ("grain", "ending_leaves"):
                ep[k] = v.lower() in ("on", "yes", "true")
            else:
                ep["thumb_text" if k == "thumb" else k] = v.lower() if k == "grade" else v
            continue
        if line.startswith("=="):  # a scene heading
            parts = [p.strip() for p in line[2:].split("|")]
            if len(parts) == 2:
                parts = [None] + parts
            if len(parts) != 3:
                _err(n, "a scene heading is  == Chapter | place, time | who (costume), who ...")
            chapter, place, who = parts
            loc, when = _set_for(place, n)
            cast = {}
            for item in filter(None, (w.strip() for w in who.split(","))):
                mm = re.match(r"([A-Za-z]+)\s*(?:\((\w+)\))?$", item)
                if not mm:
                    _err(n, f"can't read {item!r} in the cast (write: riot (lifeguard), rocco)")
                w = _who(mm.group(1), n)
                cos = mm.group(2).lower() if mm.group(2) else None
                if cos and cos not in COSTUMES:
                    _err(n, f"no costume {cos!r} ({', '.join(COSTUMES)})")
                cast[w] = cos
            prev = scene
            scene = {"location": loc, "cast": cast, "chapter": chapter or place.split(",")[0].strip().title(), "when": when}
            b = new_beat(scene)
            if prev and prev.get("when") and when and TIMES.get(when, 0) != TIMES.get(prev["when"], 0):
                b["transition"] = "fade"  # time passes between these scenes: a fade through black
            continue
        if scene is None:
            _err(n, "the script needs a scene heading (== Chapter | place, time | who) before anything else")
        if line == "--":  # a new beat, same place and people
            new_beat(scene)
            continue
        m = re.match(r"\[fx\s+(.+)\]$", line)
        if m:  # [fx snow] [fx door box_px=[400,150,520,420] at=1 hinge=right]: Porchlight's bigger effects (episode_fx.py)
            name, *pairs = m.group(1).split()
            one = {"type": name}
            for kv in pairs:
                k_, _, v_ = kv.partition("=")
                try:
                    one[k_] = json.loads(v_)
                except json.JSONDecodeError:
                    one[k_] = v_.replace("_", " ") if k_ in ("head", "text") else v_
                if k_ in ("lines", "address"):  # underscores stand for spaces, so a line stays one word in the cue
                    one[k_] = [x.replace("_", " ") for x in one[k_]]
            beat.setdefault("fx", []).append(one)
            continue
        m = re.match(r"\[(\w+)(?:\s+(\w+))?\s*(?::\s*(.*))?\]$", line)
        if m:
            cue, sub, arg = m.group(1).lower(), (m.group(2) or "").lower(), (m.group(3) or "").strip()
            if cue == "text":
                beat["text"] = arg
            elif cue == "card":
                beat.setdefault("fx", []).append({"type": "card", "text": arg, "at": 0.2, "for": 2.0})
            elif cue == "sfx":
                beat.setdefault("sfx", []).append(arg)
            elif cue == "silhouette":  # the cast as dark shapes against the sky (sunset sets)
                beat["silhouette"] = True
            elif cue in ("storm", "fade", "letterbox", "whip"):
                beat[{"storm": "weather", "fade": "transition", "letterbox": "letterbox", "whip": "transition"}[cue]] = \
                    {"storm": "storm", "fade": "fade", "letterbox": True, "whip": "whip"}[cue]
            elif cue == "mood":
                beat["mood"] = arg
            elif cue == "hold":
                beat["hold"] = int(float(arg) * 30)
            elif cue == "camera":
                kind, _, rest = arg.partition(" ")
                beat["camera"] = f"{kind}:{','.join(_who(x, n, beat['cast']) for x in rest.split(','))}" if rest else kind
            elif cue == "chat":
                beat["chat"] = []
                while i < len(lines) and lines[i].strip():
                    who_, _, msg = lines[i].strip().partition(":")
                    if not msg:
                        _err(i + 1, "a chat line is  Name: message")
                    beat["chat"].append([who_.strip(), msg.strip()])
                    i += 1
            elif cue == "game":
                fields = [f.strip() for f in arg.split("|")]
                if sub == "nhie" and len(fields) == 3:
                    g = {"type": "nhie", "prompt": fields[0], "target": _who(fields[1], n, beat["cast"]), "confess": fields[2]}
                elif sub == "mlt" and len(fields) == 2:
                    g = {"type": "mlt", "prompt": fields[0], "target": _who(fields[1], n, beat["cast"])}
                elif sub == "td" and len(fields) == 3:
                    g = {"type": "td", "prompt": fields[0], "player": _who(fields[1], n, beat["cast"]), "perform": fields[2]}
                else:
                    _err(n, "[game nhie: prompt | target | confession]  [game mlt: prompt | target]  "
                            "[game td: dare | player | performance]")
                if beat.get("game"):  # one game per beat: the rest of the scene goes on in a new beat
                    new_beat(scene)
                beat["game"] = g
            elif cue == "intro":  # the title sequence: the lake at night, PORCHLIGHT, then the episode's number and title
                ep["beats"].append({"id": f"s{len(ep['beats']) + 1:02d}", "location": "lake_night", "cast": {}, "lines": [],
                                    "camera": "at:300,330,11.5", "hold": 200, "chapter": "Intro",
                                    "fx": [{"type": "title", "text": "PORCHLIGHT", "at": 0.3, "sub": "Maple Hollow"},
                                           {"type": "card", "text": f"Episode {ep['episode']}: {ep['title']}", "at": 3.6, "for": 2.4}]})
                beat = ep["beats"][-1]
            elif cue == "vo":  # [vo: rocco] heard, not seen, in this beat (a voice over other shots)
                beat.setdefault("vo", []).extend(_who(x, n, beat["cast"]) for x in arg.replace(",", " ").split())
            elif cue == "radio":  # [radio] the voice comes out of a radio
                beat["radio"] = True
            elif cue == "grade":  # [grade: autumn] this beat's colour grade
                beat["grade"] = arg
            elif cue == "json":
                try:
                    beat.update(json.loads(arg))
                except json.JSONDecodeError as e:
                    _err(n, f"[json: ...] isn't valid JSON ({e})")
            else:
                _err(n, f"unknown cue [{cue}] (text, card, sfx, storm, fade, whip, letterbox, mood, hold, camera, chat, game, intro, fx, vo, radio, grade, json)")
            continue
        m = re.match(r"([A-Za-z]+)\s*(?:\(([^)]*)\))?\s*:\s*(.+)$", line)
        if m and m.group(1).lower() in ROSTER:  # dialogue
            who = _who(m.group(1), n, beat["cast"])
            say = m.group(3).strip()
            l = {"who": who, "say": say}
            for tok in filter(None, (t.strip().lower() for t in (m.group(2) or "").split(","))):
                if tok in MOVES:
                    l["do"] = tok
                elif tok in QUIET:
                    l["quiet"] = True
                elif tok in ("joke", "punchline", "punch"):
                    l["punch"] = True
                elif tok.startswith("to "):
                    l["to"] = _who(tok[3:], n, beat["cast"])
                elif tok.startswith("looks "):  # "looks up", "looks at pip"
                    t = tok[6:].strip()
                    l["look"] = _who(t[3:], n, beat["cast"]) if t.startswith("at ") else t.replace(" ", "_")
                elif tok.startswith("reaction "):
                    l["react"] = _who(tok[9:], n, beat["cast"])
                else:
                    if _faces() and tok not in _faces():  # (12 Nov 2026: was only caught minutes into the render)
                        _err(n, f"{tok!r} isn't a face, move or cue. Faces: {', '.join(sorted(_faces()))}. "
                                "Also: 'to <name>', 'looks <dir>', 'looks at <name>', 'reaction <name>', or a move")
                    l["face"] = tok  # checked against the faces when the scene is built
            if beat.get("game"):  # lines after a game moment are its follow-ups
                beat["game"].setdefault("after", []).append(l)
            else:
                beat["lines"].append(l)
            if len(say.split()) > LONG_WORDS:
                notes.append(f"line {n}: {len(say.split())} words is long to act and to caption; split it?")
            continue
        m = re.match(r"([A-Za-z]+)\s+(enters|exits|runs in|runs off|sneaks in|sneaks off|runs out|sneaks out)\s+"
                     r"(?:from\s+|to\s+)?(?:the\s+)?(left|right)\.?$", line, re.I)
        if m:
            who = _who(m.group(1), n, beat["cast"])
            verb = m.group(2).lower()
            pace = " run" if verb.startswith("runs") else " sneak" if verb.startswith("sneaks") else ""
            key = "enter" if verb in ("enters", "runs in", "sneaks in") else "exit"
            beat.setdefault(key, {})[who] = m.group(3).lower() + pace
            continue
        m = re.match(r"([A-Za-z]+)\s+walks\s+to\s+(?:the\s+)?([\w ]+?)\.?$", line, re.I)
        if m:
            who = _who(m.group(1), n, beat["cast"])
            at = sum(len(x.get("say", "").split()) for x in beat["lines"]) / WORDS_PER_SEC + 0.5
            beat.setdefault("walk_to", {})[who] = [m.group(2).strip().lower().replace(" ", "_"), round(at, 1)]
            continue
        m = re.match(r"([A-Za-z]+)\s+(?:sits\s+on\s+the\s+(ground|floor|sand|grass)|(lies|lies\s+back|lounges)(?:\s+(?:on|in)\s+the\s+beanbag)?)\.?$", line, re.I)
        if m:  # drawn poses held for the scene: cross-legged on the ground, lying back on the beanbag
            who = _who(m.group(1), n, beat["cast"])
            beat.setdefault("pose", {})[who] = "ground" if m.group(2) else "beanbag"
            continue
        m = re.match(r"([A-Za-z]+)\s+(?:sits|stands|lies)\s+(?:on|in|at)\s+(?:the\s+)?([\w ]+?)\.?$", line, re.I)
        if m:
            who = _who(m.group(1), n, beat["cast"])
            beat.setdefault("seats", {})[who] = m.group(2).strip().lower().replace(" ", "_")
            continue
        act = _action(line, n, beat)  # touching someone or something: becomes a silent, acted line
        if act:
            (beat["game"].setdefault("after", []) if beat.get("game") else beat["lines"]).append(act)
            continue
        m = re.match(r"([A-Za-z]+)\s+is\s+asleep\.?$", line, re.I)
        if m:
            beat.setdefault("asleep", []).append(_who(m.group(1), n, beat["cast"]))
            continue
        m = re.match(r"([A-Za-z]+)\s+(?:carries|holds)\s+(?:a|an|his|the)\s+(\w+)\.?$", line, re.I)
        if m:
            beat.setdefault("carry", {})[_who(m.group(1), n, beat["cast"])] = m.group(2).lower()
            continue
        _err(n, f"can't read this line: {line!r}\n  (dialogue is  NAME: words;  actions are  NAME enters left / exits right / "
                "walks to the step / sits on the sofa / is asleep / carries a phone;  cues are in [brackets])")
    if not ep["beats"]:
        raise ScriptError("the script has no scenes (a scene starts with  == Chapter | place, time | who)")
    first = ep["beats"][0]
    first.setdefault("text", ep["title"] or "")
    if len(ep["beats"]) > 1 and first.get("chapter"):
        first.setdefault("letterbox", True)  # the cold open gets the cinematic bars
    # lint: scenes where nobody does anything physical
    for b in ep["beats"]:
        busy = b.get("enter") or b.get("exit") or b.get("walk_to") or b.get("carry") or b.get("game") or \
            b.get("asleep") or any(l.get("do") for l in b["lines"])
        if len(b["lines"]) >= 4 and not busy:
            notes.append(f"scene {b['id']} ({b.get('chapter', b['location'])}): {len(b['lines'])} lines and nobody does "
                         "anything physical; add a move, a walk or a prop?")
    words = sum(len(l["say"].split()) for b in ep["beats"] for l in b["lines"] + (b.get("game") or {}).get("after", []))
    est = words / WORDS_PER_SEC + sum(len(b["lines"]) for b in ep["beats"]) * 0.45 + len(ep["beats"]) * 1.2 + \
        sum(14 for b in ep["beats"] if b.get("game")) + 4
    notes.append(f"about {est / 60:.1f} min ({words} spoken words){'' if 110 <= est <= 250 else ' - Porchlight episodes run 2-4 min'}")
    return ep, notes


def load(path):
    """Read a .txt script, write <name>.json beside it, return the episode dict and the notes."""
    ep, notes = parse(open(path, encoding="utf-8").read(), path)
    json.dump(ep, open(os.path.splitext(path)[0] + ".json", "w"), indent=1)
    return ep, notes
