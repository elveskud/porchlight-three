# Series episodes from a JSON script: several beats (location, cast, lines, game moments, props, camera,
# mood, SFX) chained into one 30-60 s vertical Short or a 2-4 min horizontal YouTube episode.
#   python3 make.py episode --script examples/campfire-confessions/ep01.json --format vertical|horizontal
# The JSON shape is documented in Blender/README.md. Pure Python: shared by make.py, mix.py and the scene.
import json, os, re
import director, screenplay

FPS = 30
STANDALONE = True
FORMATS = ("vertical", "horizontal")
PARALLEL = True             # make.py may split the render over several Blender processes
TITLE = "Episode"
BANDS = {"vertical": (30, 60), "horizontal": (120, 240)}
SEATS = {  # who sits where, per location (seat indices from locations.py)
    "default": {"bash": 0, "pip": 1, "riot": 2, "rocco": 3},
    "car": {"pip": 0, "rocco": 1, "riot": 2, "bash": 3},
}
MOOD_BED = {"normal": "chill", "tense": "suspense", "party": "hype", "soft": "piano"}  # soft: emotional scenes
AMBIENCE = {"campfire": ("fire", 0.16), "lake": ("lake", 0.12), "lake_night": ("night", 0.14), "stoop_sunset": ("street", 0.1),
            "stoop_night": ("night", 0.12), "apartment": ("room", 0.08), "hall": ("hall", 0.16)}  # room tone per place
ROOM = {"hall": "hall", "apartment": "room"}  # voices get this room's echo (mix.ROOM_VERB)
ROOM_ACT = {"stoop_sunset": "street", "stoop_night": "street"}  # with "act": the street's short slapback too
RUSTLE = ("take", "double_take", "cheer", "hop", "shrug", "stretch", "hug", "cross", "highfive", "throw", "crouch", "stand", "facepalm")
SPOT_PAN = (-0.45, -0.15, 0.15, 0.45)   # with "act": standing spots 0-3, left to right -> voice pan
SPOT_GAIN = (1.0, 0.92, 0.98, 0.9)      # ...and the spots further back sound a touch further away
WALK_STEP = {"riot": 10, "bash": 13, "pip": 8, "rocco": 13}  # frames per step (roster walk), for footstep timing
MOVES = screenplay.MOVES  # every move a line can "do" (one list, shared with the plain-text scripts)
GAP, BEAT_PAD = 8, 10      # frames between lines, frames before a beat's first line
WALK, STEP = 45, 11        # walk on/off timing (motion.WALK, motion.STEP)
CHAT_IN, CHAT_EVERY = 14, 22  # group chat: first bubble, then one every N frames
CHAT_READ = 50                # frames the last bubble stays up before the beat can end
STORM_EVERY = 150             # frames between lightning flashes in a storm
SURFACE = {"lake": "sand", "lake_night": "sand", "stoop_sunset": "stone", "stoop_night": "stone", "apartment": "wood",
           "hall": "wood", "campfire": "sand"}
SILENT = 36  # frames a silent line ("...") holds: a look, a stare, a reaction without words
# prop physics timing, shared with the scene so the sounds land with the props (frames after the move starts)
THROW = {"release": 8, "flight": 20, "hops": ((10, 0.45), (6, 0.15))}
DROP = {"release": 2, "flight": 12, "hops": ((8, 0.3), (5, 0.1))}
PUTDOWN_AT, PICKUP_AT = 12, 10
WATER = ("lake", "lake_night")  # sets where a thrown prop lands in water
LINE_KEYS = ("do", "face", "camera", "target", "look", "emote", "quiet", "punch", "react", "to", "energy", "prop", "reach_px", "still_hands", "caption")


def silent(l):
    """A line with no words ("...", "!?") is acted, not voiced."""
    return l.get("silent") or not re.sub(r"[\W_]+", "", l.get("say", ""))


PORCH = {"click": 24, "black": 32, "logo": 40, "end": 105}  # "ending": "porch_light" timing, frames after the last beat
PORCH_FINALE = {"click": 130, "black": 138, "logo": 146, "end": 210}  # "ending_leaves": a long last look before the click


def load(cfg):
    path = cfg.get("script") or ""
    if not os.path.exists(path):
        raise SystemExit(f"episode: --script {path!r} not found")
    ep = screenplay.load(path)[0] if path.endswith(".txt") else json.load(open(path))  # .txt: a plain-text script
    fmt = cfg.get("format") or "vertical"
    ep["beats"] = [b for b in ep["beats"] if fmt in b.get("formats", FORMATS)]
    for bi, b in enumerate(ep["beats"]):
        b.setdefault("id", f"beat{bi}")  # line ids use the beat id, so both cuts of an episode share voices
        b.setdefault("location", "campfire")
        b.setdefault("cast", {"bash": None, "pip": None, "riot": None, "rocco": None})
        b.setdefault("camera", "wide")
        b.setdefault("mood", "normal")
        if "riot" not in b["cast"] and not (ep.get("riot_optional") and not b.get("game")):
            raise SystemExit(f"episode: beat {b.get('id')} has no Riot (he's in every beat; \"riot_optional\": true allows "
                             "beats without him, except game moments)")
        check_beat(ep, b)
    check_continuity(ep)
    check_occluders(ep)
    check_staging(ep)
    return ep


def check_staging(ep):
    """Porchlight Ep 3 review (user, 9 Nov 2026), so these never reach a render again:
    - a long [hold] where nothing happens: everyone just stands there (the user called out 4 of them). A hold over 2.5 s
      needs something to watch: an fx, an exit or a walk. Act it out with silent lines instead (NAME (stare): ...),
      or mark a truly intended still moment with [json: {"quiet_ok": true}];
    - a beat with no spoken line that runs on a hold alone (nothing happens, nobody talks);
    - someone sitting on a seat that faces away from us: their front shows through the chair back. Seats like that
      are marked "away" as a 6th value in the set JSON's spot (e.g. [172, 418, "sit", 0.42, 7.0, "away"])."""
    import os
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../characters/locations.py"), encoding="utf8").read()
    imgs = dict(re.findall(r'^\s+"(\w+)":\s+dict\(img="(\w+)"', src, re.M))
    pdir = os.path.join(os.environ.get("PORCHLIGHT_DIR") or os.path.expanduser("~/Desktop/Porchlight"), "art/hd/sets")
    spots = {}
    for b in ep["beats"]:
        where = f"episode: beat {b['id']} ({b.get('chapter') or b['location']})"
        if b.get("quiet_ok") or b.get("chapter") == "Intro":
            continue
        n = b["location"]
        if n in imgs and n not in spots:
            p = os.path.join(pdir, imgs[n] + ".json")
            spots[n] = (json.load(open(p, encoding="utf8")) if os.path.exists(p) else {}).get("spots", {})
        for who, seat in (b.get("seats") or {}).items():
            sp = spots.get(n, {}).get(seat) if isinstance(seat, str) else None
            if sp and len(sp) > 5 and sp[5] == "away":
                raise SystemExit(f"{where}: {who} sits on {seat!r}, which faces away from the camera (their front would show "
                                 "through the chair back): have them stand, or pick another seat")
        # Ep 4 review (user, 10 Nov 2026): Riot and Rocco sat on one step and the whole cast crammed on 5 park spots,
        # so people stood inside each other. Same spot, or two spots closer than 80 painting px, stops the check;
        # a crowded beat (5+ characters) must give everyone a named spot.
        sp_n = spots.get(n, {})
        staying = [w for w in b.get("cast", {})]
        placed = {}
        for who in staying:
            seat = (b.get("seats") or {}).get(who)
            if isinstance(seat, str) and seat in sp_n:
                placed[who] = seat
        names = {}
        for who, seat in placed.items():
            for w2, s2 in names.items():
                if s2 == seat or (abs(sp_n[s2][0] - sp_n[seat][0]) < 80 and abs(sp_n[s2][1] - sp_n[seat][1]) < 40):
                    raise SystemExit(f"{where}: {who} and {w2} are on top of each other ({seat!r} / {s2!r}): give them different spots "
                                     "(add a spot to the set JSON if it has too few)")
            names[who] = seat
        if sp_n and len(staying) >= 5 and len(placed) < len(staying):
            miss = [w for w in staying if w not in placed]
            raise SystemExit(f"{where}: {len(staying)} characters but {', '.join(miss)} have no named spot: write 'NAME stands at the <spot>.' "
                             f"for each (spots: {', '.join(sp_n)}), or they will be placed on top of each other")
        hold = b.get("hold", 0)
        moving = b.get("fx") or b.get("exit") or b.get("walk_to")
        spoken = [l for l in b.get("lines", []) if not silent(l)]
        if hold > 75 and not moving:
            raise SystemExit(f"{where}: [hold: {hold / 30:.0f}] with nothing happening: everyone just stands there. Act it out "
                             "with silent lines (NAME (stare): ...), add an exit/walk/fx, cut the hold to 2 s or less, or mark an "
                             "intended still moment with [json: {\"quiet_ok\": true}]")
        if not spoken and not moving and hold > 45:
            raise SystemExit(f"{where}: nobody speaks and nothing moves for {hold / 30:.0f} s: give it lines, a voice-over, "
                             "an insert or a walk")


def check_occluders(ep):
    """Porchlight occlusion standard (approved 8 Nov 2026, Porchlight OCCLUSION_PIPELINE.md): every painted set goes
    through Porchlight/tools/occluders.py (auto-cut layers + clean plate), or is reviewed and marked
    "occluders": "hand" in its JSON (its hand-cut fronts were checked against the auto cut and kept)."""
    import os
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../characters/locations.py"), encoding="utf8").read()
    imgs = dict(re.findall(r'^\s+"(\w+)":\s+dict\(img="(\w+)"', src, re.M))
    pdir = os.path.join(os.environ.get("PORCHLIGHT_DIR") or os.path.expanduser("~/Desktop/Porchlight"), "art/hd/sets")
    for n in sorted({b["location"] for b in ep["beats"]}):
        if n not in imgs:
            continue
        p = os.path.join(pdir, imgs[n] + ".json")
        spec = json.load(open(p, encoding="utf8")) if os.path.exists(p) else {}
        if not spec.get("clean") and spec.get("occluders") != "hand":
            warn(f"episode: set {n!r} ({imgs[n]}) hasn't been through the occluder pass: run Porchlight/tools/occluders.py "
                 "on it and check its sheet, or mark it \"occluders\": \"hand\" once its hand-cut fronts are reviewed")


_warned = set()


def warn(msg):
    if msg not in _warned:
        _warned.add(msg)
        print("WARNING " + msg)


def check_continuity(ep):
    """Things that only show across beats or in the voices (Porchlight ep 2 notes, 8 Nov 2026):
    - someone who walks off can't be back in the next beat of the same place without walking on again;
    - one-word voiced lines come out garbled from the voice model: say so, so the take gets checked;
    - a group laugh has no laugh sound: say so, so it's voiced or switched off."""
    beats = ep["beats"]
    for b0, b1 in zip(beats, beats[1:]):
        if b0["location"] != b1["location"]:
            continue
        back = [w for w in (b0.get("exit") or {}) if w in b1["cast"] and w not in (b1.get("enter") or {})]
        if back:
            raise SystemExit(f"episode: beat {b1['id']}: {', '.join(back)} walked off at the end of beat {b0['id']} but "
                             "is in this beat's cast with no entrance: drop them from \"cast\", or give them an \"enter\"")
    for b in beats:
        said = [l for l in b.get("lines", []) if not silent(l)] + [l for l in (b.get("game") or {}).get("after", []) if not silent(l)]
        for l in said:
            if len(re.sub(r"[^A-Za-z ]+", " ", l["say"]).split()) <= 1 and l.get("caption", True) is not False:
                warn(f"episode: beat {b['id']}: {l['who']}'s one-word line {l['say']!r}: the voice model often garbles "
                     "single words: the voice check after voicing listens to it and retakes it if garbled")
        g = b.get("game")
        if g and g.get("laugh", g["type"] != "feature") and not g.get("laugh_voiced"):
            warn(f"episode: beat {b['id']}: the {g['type']} game ends in a group laugh with no laugh sound: voice the laughs "
                 "as \"after\" lines (\"caption\": false, \"do\": \"laugh\") and set \"laugh\": false")


DIRECTIONS = {f"{ud}{'_' if ud and lr else ''}{lr}" for ud in ("", "up", "down") for lr in ("", "left", "right")} - {""}
CARRY = ("phone", "flashlight", "cup", "clipboard", "notebook")
FX_MORE = ("clouds", "snow", "fog", "breath", "rain", "leaves", "echo", "crowd", "porch_ring", "swarm", "door", "die", "hop", "lantern",
           "lake_fill", "insert", "paw", "tail", "grade_shift")  # episode_fx.py
FX = ("lamp_on", "title", "card", "label", "critter", "flashlight") + FX_MORE


def check_beat(ep, b):
    """Catch typos in the episode JSON now, with a clear message, instead of minutes into a render."""
    where = f"episode: beat {b['id']}"
    cast_ = set(b["cast"])

    def who_ok(w, what):
        if w not in cast_:
            raise SystemExit(f"{where}: {what} {w!r} is not in this beat's cast ({', '.join(sorted(cast_)) or 'empty'})")

    def camera_ok(spec, what):
        kind, _, names = (spec or "wide").partition(":")
        if kind in ("close", "cu", "two", "ots"):
            for w in names.split(","):
                who_ok(w, f"{what} {spec!r}:")
        elif kind not in ("wide", "at"):
            raise SystemExit(f"{where}: {what} {spec!r} (wide, close:who, cu:who, two:a,b, ots:a,b, at:px,py,size)")

    camera_ok(b.get("camera"), "camera")
    if b.get("move"):
        camera_ok(b["move"], "move")
    beds = {**MOOD_BED, **ep.get("beds", {})}
    if b["mood"] not in beds:
        raise SystemExit(f"{where}: mood {b['mood']!r} ({', '.join(beds)})")
    for key in ("enter", "exit", "walk_to", "carry"):
        for w in b.get(key) or {}:
            who_ok(w, f'"{key}":')
    for w in b.get("asleep", []):
        who_ok(w, '"asleep":')
    for w, p_ in (b.get("pose") or {}).items():
        who_ok(w, '"pose":')
        if p_ not in ("ground", "beanbag", "kneel", "climb"):
            raise SystemExit(f'{where}: "pose" {p_!r} for {w} (ground, beanbag, kneel, climb)')
    for w, what in (b.get("carry") or {}).items():
        if what not in CARRY:
            raise SystemExit(f"{where}: carry {what!r} ({', '.join(CARRY)})")
    for key in ("enter", "exit"):
        for w, sd in (b.get(key) or {}).items():
            words = str(sd).split()
            if not words or words[0] not in ("left", "right") or any(x not in ("walk", "run", "sneak") for x in words[1:]):
                raise SystemExit(f'{where}: "{key}" side {sd!r} for {w} (left or right, optionally with run or sneak: "left run")')
    for fx in b.get("fx", []):
        if fx.get("type") not in FX:
            raise SystemExit(f"{where}: fx type {fx.get('type')!r} ({', '.join(FX)})")
    if b.get("weather") not in (None, "storm"):
        raise SystemExit(f"{where}: weather {b['weather']!r} (only \"storm\")")
    if b.get("transition") not in (None, "fade", "whip", "spray", "dark"):
        raise SystemExit(f"{where}: transition {b['transition']!r} (\"fade\", \"whip\", \"spray\" or \"dark\")")
    g = b.get("game") or {}
    for key in ("target", "player", "describer", "guesser", "who"):
        if key in g:
            who_ok(g[key], f"game {key}")
    lines_ = b.get("lines", []) + b.get("after", []) + g.get("after", [])
    for l in lines_:
        who_ok(l["who"], "line by")
        if not str(l.get("say", "")).strip() and not l.get("silent"):
            raise SystemExit(f"{where}: a line by {l['who']} has nothing to say (\"say\" is empty)")
        if l.get("do") and l["do"] not in MOVES:
            raise SystemExit(f"{where}: do {l['do']!r} ({', '.join(MOVES)})")
        if l.get("prop") and l["prop"] not in CARRY:
            raise SystemExit(f"{where}: prop {l['prop']!r} ({', '.join(CARRY)})")
        if l.get("do") == "reach" and not l.get("reach_px"):
            raise SystemExit(f"{where}: {l['who']}'s reach needs \"reach_px\": [x, y] (a point on the painting)")
        if l.get("do") in ("highfive", "bump", "hug", "comfort") and not (l.get("target") or l.get("to")):
            raise SystemExit(f"{where}: {l['who']}'s {l['do']} needs someone to do it with (\"target\")")
        if l.get("look") and l["look"] not in cast_ and l["look"] not in DIRECTIONS:
            raise SystemExit(f"{where}: look {l['look']!r} (someone in the beat, or {', '.join(sorted(DIRECTIONS))})")
        for key in ("target", "react", "to"):
            if l.get(key):
                who_ok(l[key], f"line {key}")
        if l.get("camera"):
            camera_ok(l["camera"], "line camera")


def hook(cfg):
    ep = load(cfg)
    return cfg.get("hook", "").replace("\\n", "\n") or ep["beats"][0].get("text", "")


def length(cfg):
    lo, hi = BANDS[cfg.get("format") or "vertical"]
    return lo, hi


def notes(cfg):
    ep = load(cfg)
    return f"series={ep['series']} ep={ep['episode']}"


def _game_lines(bid, g):
    """The spoken lines a game moment expands into: (id, who, text, role)."""
    p = f"{bid}_"
    t = g["type"]
    if t == "nhie":
        out = [(p + "read", "riot", g["prompt"], "read"), (p + "confess", g["target"], g["confess"], "confess")]
    elif t == "mlt":
        out = [(p + "read", "riot", g["prompt"], "read")]
    elif t == "td":
        pl = g.get("player", "riot")
        out = [(p + "choose", pl, g.get("choice", "dare").capitalize() + ".", "choose"),
               (p + "read", "riot", g["prompt"], "read"), (p + "perform", pl, g["perform"], "perform")]
    elif t == "alias":
        out = [(p + "clue", g["describer"], g["clue"], "clue"), (p + "guess", g["guesser"], g["guess"], "guess")]
    elif t == "feature":  # an app feature: the presenter's line while a REAL screenshot fills the frame
        import features
        features.shot(g["feature"])  # refuses features without a real screenshot
        out = [(p + "say", g.get("who", "riot"), g["say"], "say")]
    else:
        raise SystemExit(f"episode: unknown game type {t!r} (nhie, mlt, td, alias, feature)")
    return out + [(f"{p}after{k:02d}", l["who"], l["say"], "after") for k, l in enumerate(g.get("after", [])) if not silent(l)]


def lines(cfg):
    ep = load(cfg)
    out = []
    if ep.get("previously"):
        out.append(("prev", "riot", "Previously... " + ep["previously"]))
    for b in ep["beats"]:
        for li, l in enumerate(b.get("lines", [])):
            if not silent(l):
                out.append((f"{b['id']}_{li:02d}", l["who"], l["say"]))
        if b.get("game"):
            out += [(i, w, t) for i, w, t, _ in _game_lines(b["id"], b["game"])]
        for li, l in enumerate(b.get("after", [])):
            if not silent(l):
                out.append((f"{b['id']}_z{li:02d}", l["who"], l["say"]))
    if ep.get("ending") != "porch_light":  # the porch-light ending is silent
        out.append(("end", "riot", f"Next time on {ep['series']}: {ep['next']}!" if ep.get("next") else f"{ep['series']}. Free on Friendzy."))
    return out


def _runs(spans):
    """[[tone, start s, gain, seconds]] with back-to-back beats in the same tone joined into one, so the room sound
    only crossfades where the place really changes. spans: [((tone, gain), start frame, end frame)] in order."""
    out = []
    for (tone, gain), a, b in spans:
        if out and out[-1][0] == (tone, gain) and out[-1][2] == a:
            out[-1][2] = b
        else:
            out.append([(tone, gain), a, b])
    return [[tone, round(a / FPS, 3), gain, round((b - a) / FPS, 3)] for (tone, gain), a, b in out]


def timeline(cfg, dur):
    """dur: {line id: seconds}. Returns the beat plan (frames) for the scene, the mix and the chapters."""
    ep = load(cfg)
    f = lambda s: int(round(s * FPS))
    s = lambda fr: round(fr / FPS, 3)
    wide = (cfg.get("format") or "vertical") == "horizontal"
    GAP, BEAT_PAD, LAUGH = (12, 16, 52) if wide else (8, 10, 40)  # the long cut breathes a little more
    t = 0
    beats, voices, sfx, music, shots = [], [], [], [], []

    act = ep.get("act") == "auto"

    def voice_opts(B_, who, ev_extra, text):
        """With "act": where the voice sits (pan, distance), and how it's said (whisper, shout)."""
        if not act:
            return []
        opts = []
        seat = (B_.get("seats") or {}).get(who, SEATS["default"].get(who))
        if isinstance(seat, int) and 0 <= seat < 4:
            opts += [f"pan:{SPOT_PAN[seat]}", f"gain:{SPOT_GAIN[seat]}"]
        if B_.get("radio"):
            opts.append("radio")
        if ev_extra.get("quiet"):
            opts.append("style:whisper")
        elif director.energy(text) >= 1.4:
            opts.append("style:shout")
        return opts

    def say(lid, who, text, at, extra=None, quiet_line=False):
        if quiet_line:  # acted, not voiced: no voice, no caption
            ev = dict(id=lid, who=who, text=text, start=at, end=at + SILENT, silent=True, caption=False)
            ev.update(extra or {})
            return ev
        ev = dict(id=lid, who=who, text=text, start=at, end=at + f(dur[lid]))
        ev.update(extra or {})
        room = ROOM.get(cur_loc[0]) or (ROOM_ACT.get(cur_loc[0]) if act else None)
        voices.append([lid, s(at)] + ([room] if room else []) + voice_opts(cur_beat[0], who, extra or {}, text))
        return ev

    def spoken(b, bi, t):
        evs = []
        for li, l in enumerate(b.get("lines", [])):
            t += l.get("pause", GAP if li else 0)
            ev = say(f"{b['id']}_{li:02d}", l["who"], l["say"], t, {k: l[k] for k in LINE_KEYS if k in l}, silent(l))
            evs.append(ev)
            t = ev["end"]
        return evs, t

    cur_loc, cur_beat = [None], [None]
    punches = [0]
    for bi, b in enumerate(ep["beats"]):
        cur_loc[0], cur_beat[0] = b["location"], b
        start = t
        B = dict(id=b.get("id", f"beat{bi}"), index=bi, start=start, location=b["location"],
                 cast={w: v for w, v in b["cast"].items() if w not in b.get("vo", [])}, grade=b.get("grade"), vo=b.get("vo", []),
                 camera=b["camera"], mood=b["mood"], text=b.get("text", ""), prop=b.get("prop"),
                 chapter=b.get("chapter"), seats=b.get("seats"), fx=b.get("fx", []), enter=b.get("enter", {}),
                 exit=b.get("exit", {}), move=b.get("move"), carry=b.get("carry", {}), asleep=b.get("asleep", []), pose=b.get("pose", {}), chat=b.get("chat", []),
                 weather=b.get("weather"), walk_to=b.get("walk_to", {}), transition=b.get("transition"), face_front=b.get("face_front", []), silhouette=bool(b.get("silhouette")),
                 letterbox=b.get("letterbox", False), events=[], game=None)
        t += BEAT_PAD if bi else 4
        if bi == 0 and ep.get("previously"):   # cold open first (the hook), then the recap
            evs, t = spoken(b, bi, t)
            B["events"] += evs
            t += GAP
            ev = say("prev", "riot", "Previously... " + ep["previously"], t, {"previously": ep["previously"]})
            B["events"].append(ev)
            if "riot" not in B["cast"]:  # a cold open without Riot: he reads the recap as a voice-over
                B["vo"] = list(B["vo"]) + ["riot"]
            t = ev["end"]
        else:
            evs, t = spoken(b, bi, t)
            B["events"] += evs
        g = b.get("game")
        if g:
            G = dict(g)
            gl = _game_lines(b["id"], g)
            ids = {role: lid for lid, _, _, role in gl if role != "after"}
            t += GAP
            if g["type"] in ("nhie", "mlt"):
                G["card_in"] = t
                t += 8
                ev = say(ids["read"], "riot", g["prompt"], t, {"role": "read", "caption": False})
                B["events"].append(ev)
                G["read"], G["read_end"] = ev["start"], ev["end"]
                G["stare"] = ev["end"] + (26 if g["type"] == "nhie" else 10)
                G["card_out"] = G["stare"] - 4
                sfx += [["card_flip", s(G["card_in"]), 0.6], ["whoosh", s(G["stare"] - 2), 0.45]]
                t = G["stare"] + (20 if g["type"] == "nhie" else 14)
                if g["type"] == "nhie":
                    sfx.append(["sting_suspense", s(G["stare"]), 0.35])
                    ev = say(ids["confess"], g["target"], g["confess"], t, {"role": "confess"})
                    B["events"].append(ev)
                    G["confess"], t = ev["start"], ev["end"]
                    sfx.append(["boing", s(G["confess"] - 3), 0.3])
                else:
                    sfx.append(["slam", s(G["stare"] + 4), 0.25])
                G["drop"] = [G["stare"] - 2, t]
            elif g["type"] == "td":
                pl = g.get("player", "riot")
                G["choice_in"] = t
                t += 10
                ev = say(ids["choose"], pl, g.get("choice", "dare").capitalize() + ".", t, {"role": "choose"})
                B["events"].append(ev)
                G["tap"] = ev["end"] + 1
                G["mystery"] = G["tap"] + 7
                G["flip"] = G["mystery"] + 16
                ev = say(ids["read"], "riot", g["prompt"], G["flip"] + 6, {"role": "read", "caption": False})
                B["events"].append(ev)
                G["read_end"] = ev["end"]
                G["card_out"] = ev["end"] + 2
                ev = say(ids["perform"], pl, g["perform"], ev["end"] + 8, {"role": "perform"})
                B["events"].append(ev)
                G["perform"], G["perform_end"] = ev["start"], ev["end"]
                t = ev["end"] + 4
                sfx += [["pop", s(G["choice_in"]), 0.4], ["slam", s(G["tap"]), 0.3], ["drumroll_short", s(G["mystery"] + 1), 0.4],
                        ["card_flip", s(G["flip"]), 0.6], ["boom", s(G["perform"] - 2), 0.4], ["scratch", s(t), 0.4]]
                G["drop"] = [G["perform"] - 4, t + 6]
            elif g["type"] == "feature":
                G["screen_in"] = t
                t += 8
                ev = say(ids["say"], g.get("who", "riot"), g["say"], t, {"role": "say"})
                B["events"].append(ev)
                G["screen_out"] = ev["end"] + 24
                t = G["screen_out"] + 4
                sfx += [["whoosh", s(G["screen_in"]), 0.4], ["ting", s(G["screen_in"] + 6), 0.4]]
            elif g["type"] == "alias":
                G["timer_in"] = t
                G["card_in"] = t + 6
                t += 14
                ev = say(ids["clue"], g["describer"], g["clue"], t, {"role": "clue"})
                B["events"].append(ev)
                t = ev["end"] + GAP
                ev = say(ids["guess"], g["guesser"], g["guess"], t, {"role": "guess"})
                B["events"].append(ev)
                G["tick"] = ev["end"] + 2
                G["card_out"] = G["tick"] + 22
                t = G["tick"] + 10
                sfx += [["whistle", s(G["timer_in"]), 0.35], ["card_flip", s(G["card_in"]), 0.5], ["ting", s(G["tick"]), 0.5]]
            for k, l in enumerate(g.get("after", [])):
                t += l.get("pause", GAP)
                ev = say(f"{b['id']}_after{k:02d}", l["who"], l["say"], t, {kk: l[kk] for kk in LINE_KEYS if kk in l}, silent(l))
                B["events"].append(ev)
                t = ev["end"]
            laughs = g.get("laugh", g["type"] != "feature")  # JSON "laugh": false skips the group laugh
            G["laughs"] = laughs
            G["laugh"] = t + 3
            t = G["laugh"] + (LAUGH if laughs else 6)
            G["laugh_end"] = t
            if laughs:
                sfx.append(["popper", s(G["laugh"] + 2), 0.4])
            B["game"] = G
        for li, l in enumerate(b.get("after", [])):
            t += l.get("pause", GAP)
            ev = say(f"{b['id']}_z{li:02d}", l["who"], l["say"], t, {k: l[k] for k in LINE_KEYS if k in l}, silent(l))
            B["events"].append(ev)
            t = ev["end"]
        t += b.get("hold", 20 if b["mood"] == "party" else 10) + (10 if wide else 0)
        if b.get("chat"):  # every bubble pops in, and the last one stays up long enough to read
            t = max(t, start + CHAT_IN + (len(b["chat"]) - 1) * CHAT_EVERY + CHAT_READ)
        if b.get("exit"):  # time for the walk off
            t += WALK + 6
        for k in range(len(b.get("chat", []))):  # group-chat bubbles pop in one by one
            sfx.append(["pop", s(start + CHAT_IN + k * CHAT_EVERY), 0.35])
        if b.get("exit_sfx"):  # e.g. "door": plays as the walk off ends
            sfx.append([b["exit_sfx"], s(t - 10), 0.4])
        for fx_ in b.get("fx", []):  # the looping storm: the same thunder each time round
            if fx_.get("type") == "rain":
                every_ = int(fx_.get("loop", 5) * FPS)
                stop_ = start + int(fx_.get("freeze", fx_.get("stop_at", 1e4)) * FPS)
                for k in range(0, (t - start) // every_ + 1):
                    if start + k * every_ + 24 < min(t, stop_):
                        sfx.append(["boom", s(start + k * every_ + 24), 0.45])
        if b.get("weather") == "storm":  # thunder a beat after each lightning flash (episode_scene.LIGHTNING)
            for k in range(0, (t - start) // STORM_EVERY + 1):
                sfx.append(["boom", s(start + 40 + k * STORM_EVERY + 18), 0.45])
        steps = SURFACE.get(b["location"])
        for k, (who, (spot, sec)) in enumerate(b.get("walk_to", {}).items()):  # footsteps for walks between spots
            for i in range(1, WALK // STEP + 1):
                sfx.append([f"step_{steps or 'stone'}{(i + k) % 4}", s(start + f(sec) + i * STEP), 0.25])
        for side_, walks in (("in", b.get("enter", {})), ("out", b.get("exit", {}))):  # footsteps on the set's surface
            for k, (who, how) in enumerate(walks.items()):
                w0 = start + 2 if side_ == "in" else t - WALK - 4
                pace = str(how).split()[-1]
                step, gain = {"run": (7, 0.3), "sneak": (16, 0.12)}.get(pace, (STEP, 0.25))  # pace
                if act:  # each step on the character's own foot contact (his walk's step length, the pace's speed)
                    step = max(4, round(WALK_STEP.get(who, 11) * {"run": 0.6, "sneak": 1.5}.get(pace, 1.0)))
                for i in range(1, WALK // step + 1):
                    sfx.append([f"step_{steps or 'stone'}{(i + k) % 4}", s(w0 + i * step + (0 if act else k * 3)), gain])
        for ev in B["events"]:  # a soft musical hit on punchlines; a breath before quiet lines
            if ev.get("punch"):  # (with "act" the sting changes each time: never the same twice in a row)
                sfx.append([("ting", "rise2", "rise3")[punches[0] % 3] if act else "ting", s(ev["end"] + 2), 0.2])
                punches[0] += 1
            if ev.get("quiet"):
                sfx.append(["breath", s(max(0, ev["start"] - 14)), 0.25])
            elif ep.get("act") == "auto" and ev["text"].lstrip().startswith("..."):  # a sigh before a "..." line
                sfx.append(["breath", s(max(0, ev["start"] - 16)), 0.3])
        for ev in B["events"]:  # foley tied to moves: chips crunch, a high five slaps, props land where they fall
            d_, f_ = ev.get("do"), ev["start"] + 2
            if d_ == "munch":
                sfx += [["crunch", s(ev["start"] + 10), 0.3], ["crunch", s(ev["start"] + 22), 0.25]]
            elif d_ == "highfive":
                sfx.append(["slap", s(f_ + 8), 0.45])
            elif d_ == "bump":
                sfx.append(["thunk", s(f_ + 8), 0.3])
            elif d_ == "sip":
                sfx.append(["slurp", s(f_ + 10), 0.2])
            elif d_ == "cannonball":  # the spring, then the splash (or a thump on dry land)
                sfx.append(["swish", s(f_ + 6), 0.3])
                sfx.append(["splash" if b["location"] in WATER else "thud", s(f_ - 2 + 30), 0.6])
            elif d_ == "trip":
                sfx.append(["thud", s(f_ + 10), 0.35])
                sfx.append(["rustle", s(f_ + 4), 0.2])
            elif d_ == "putdown":
                sfx.append(["thud", s(f_ + PUTDOWN_AT), 0.3])
            elif d_ in ("throw", "drop"):
                P = THROW if d_ == "throw" else DROP
                if d_ == "throw":
                    sfx.append(["swish", s(f_ + P["release"] - 2), 0.35])
                land = f_ + P["release"] + P["flight"]
                wet = d_ == "throw" and b["location"] in WATER
                sfx.append(["splash" if wet else "thud", s(land), 0.4])
                if not wet:
                    for hop, (n_, _) in enumerate(P["hops"]):
                        land += n_
                        sfx.append(["thud", s(land), 0.25 / (hop + 1)])
        if act:  # phone taps between lines; a cushion as someone flops into a seat
            for who_, what_ in (b.get("carry") or {}).items():
                if what_ == "phone":
                    evs_ = B["events"]
                    gaps_ = [(start + 4, evs_[0]["start"] - 6)] if evs_ else [(start + 4, t - 4)]
                    gaps_ += [(e1["end"] + 4, e2["start"] - 6) for e1, e2 in zip(evs_, evs_[1:])]
                    gaps_ += [(evs_[-1]["end"] + 4, t - 8)] if evs_ else []
                    for g0_, g1_ in gaps_:
                        for k_ in range(max(0, (g1_ - g0_) // 7)):
                            sfx.append(["tap", s(g0_ + k_ * 7), 0.08])
            for who_, side__ in (b.get("enter") or {}).items():
                seat_ = (b.get("seats") or {}).get(who_)
                if isinstance(seat_, str) and any(k_ in seat_ for k_ in ("sofa", "couch", "beanbag", "chair", "bench", "step", "seat")):
                    sfx.append(["thud", s(start + 4 + WALK + 12), 0.18])
        if act:  # clothes rustle on the big moves
            for ev in B["events"]:
                if ev.get("do") in RUSTLE:
                    sfx.append(["rustle", s(ev["start"] + 2), 0.16])
        if act:  # the intro's title gets the full theme; emotes pop with a soft sound
            for fx_ in b.get("fx", []):
                if fx_.get("type") == "title":
                    sfx.append(["theme_long", s(start + f(fx_.get("at", 0.5))), 0.35])
            for ev in B["events"]:
                if ev.get("emote"):
                    sfx.append(["pop", s(ev["start"] + 1), 0.12])
        for name in b.get("sfx", []):  # names from mix.SOUNDS; "name@0.5" = 0.5 s into the beat
            n, _, off = name.partition("@")
            sfx.append([n, s(start + f(float(off or 0.1))), 0.4])
        B["end"] = t
        if ep.get("direct") == "auto":  # the auto-director fills in the shots, looks and energy the script left out
            shots.append((B["id"], director.direct_beat(b, B)))
        beats.append(B)
    end = t
    if ep.get("ending") == "porch_light":  # Porchlight: hold on the porch light, click, black, small Friendzy logo
        end_vo = end
        porch_ = PORCH_FINALE if ep.get("ending_leaves") else PORCH
        END = end + porch_["end"]
        sfx.append(["click", s(end + porch_["click"]), 0.5])
        sfx.append(["theme", s(end + porch_["logo"] - 4), 0.35])  # the motif under the logo
    else:
        end_vo = end + 4
        END = end_vo + f(dur["end"]) + 14
        voices.append(["end", s(end_vo)])
        sfx += [["sting_fanfare", s(end), 0.45], ["slam", s(end), 0.25]]
    # music: one segment per run of beats with the same mood; tense game beats drop it out
    for B in beats:
        bed = {**MOOD_BED, **ep.get("beds", {})}[B["mood"]]  # an episode may pick its own beds, e.g. {"normal": "lofi"}
        drops = [B["game"]["drop"]] if B["game"] and "drop" in B["game"] else []
        drops += [[e["start"] - 20, e["end"] + 30] for e in B["events"] if e.get("quiet")]  # quiet lines: the music steps back
        if music and music[-1][0] == bed and music[-1][2] == B["start"]:
            music[-1][2] = B["end"]
            music[-1][4] += drops
        else:
            music.append([bed, B["start"], B["end"], 0.16 if bed != "suspense" else 0.2, drops])
    music[-1][2] = END
    stills = sorted({B["start"] + 15 for B in beats} | {f_ + 12 for _, rows in shots for f_, sp, _w in rows if sp and ":" in sp and
                                                        not sp.startswith(("snap", "creep")) and f_ + 12 < END} | {END - 20})
    music_s = [[m, s(a), s(b), g, [[s(x), s(y)] for x, y in d]] for m, a, b, g, d in music]
    # YouTube chapters: first at 0:00, each at least 10 s (short ones merge into the one before)
    chapters = []
    for B in beats:
        if B["chapter"]:
            at = 0 if not chapters else B["start"]
            if chapters and at - chapters[-1][0] < 10 * FPS:
                continue
            chapters.append([at, B["chapter"]])
    if chapters and END - chapters[-1][0] < 10 * FPS and len(chapters) > 1:
        chapters.pop()
    return {"beats": beats, "end": end, "end_vo": end_vo, "END": END, "voices": voices, "sfx": sfx,
            "music_segments": music_s,
            "ambience": _runs([(AMBIENCE[B["location"]], B["start"], B["end"]) for B in beats if B["location"] in AMBIENCE])
                        + _runs([(("rain", 0.3), B["start"], B["end"]) for B in beats if B.get("weather") == "storm"]),
            "chapters": [[s(a), name] for a, name in chapters], "series": ep["series"], "episode": ep["episode"],
            "title": ep.get("title", ""), "next": ep.get("next", ""), "ending": ep.get("ending", "card"),
            "riot_phone": ep.get("riot_phone", False), "centre_mouth": ep.get("centre_mouth", False), "face_front_all": ep.get("face_front_all", False), "cu_vignette": ep.get("cu_vignette", True), "sit": ep.get("sit"), "act": ep.get("act"), "colour": ep.get("colour", "match"), "grain": ep.get("grain", False), "grade": ep.get("grade"), "ending_leaves": ep.get("ending_leaves", False), "still_frames": stills, "shots": director.shot_list(shots) if shots else ""}
