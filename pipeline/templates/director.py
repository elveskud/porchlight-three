# The auto-director: makes the film-making choices a script leaves out, so a short script still plays like a
# directed episode. Episode JSON opts in with "direct": "auto"; anything the script says itself always wins.
# Pure Python (runs inside episode_script.timeline), so its choices are in cues.json and in shots.txt.
#
# Per spoken line it decides:
#   to      who the line is said to (the speaker turns to them; listeners already turn to the speaker)
#   energy  how hard it's played, from the punctuation: "!" bigger, a SHOUTED word bigger still, "..." softer
#   camera  coverage: the beat opens on its own (establishing) shot, then shot / reverse shot over the listener's
#           shoulder for two-way talk, close-ups ("cu") as an exchange heats up, close shots for someone holding
#           the floor, a two-shot or wide to re-orient; never a cut faster than MIN_SHOT, never a jump cut (same
#           people, both tight), and a cut lands on the action when a line starts with a big move
#   react   on a line that lands (punch or "!") with nobody answering, cut to the listener's face
#   snap    a shouted line snaps in on the speaker
#   creep   a shot held longer than HOLD_MAX starts a slow push, so nothing sits dead still
# Per beat: exits play on the wide; inserts ("at:") creep in; tense beats get a slight dutch angle; walks are
# followed; game cards go where the cast isn't; close-ups get a soft background (depth of field).
import re

FPS = 30
MIN_SHOT = 36        # frames: a shot shorter than this reads as a jump
SHORT_FLAG = 30      # shots.txt flags anything shorter than this
HOLD_MAX = 240       # frames on one shot before it starts to creep in
LONG_LINE = 75       # frames: a line this long earns its own close shot even in a one-person scene
TIGHT_RUN = 4        # after this many tight shots in a row, pull back to show the room
SINGLES_AFTER = 2    # a two-way exchange starts over the shoulder, then goes to close-ups as it heats up
DUTCH = 3.0          # degrees of tilt for tense beats
GAME_ROLES = ("read", "confess", "choose", "perform", "clue", "guess", "say")
ACTION = ("take", "double_take", "cheer", "hop", "yell", "facepalm")  # big moves a cut can land on
TOUCH = ("highfive", "bump", "hug", "comfort")  # two people touching: both in the frame
FLIGHT = ("throw",)                             # something flies: the wide shot
WALK = 45            # frames of a walk off (motion.WALK)


def energy(text):
    """How hard a line is played (talk() energy), from how it's written."""
    t = text.strip()
    if any(len(w) >= 3 and w.isupper() for w in re.findall(r"[A-Za-z']+", t)):
        return 1.4
    if t.endswith("!") or t.endswith("!?") or t.endswith("?!"):
        return 1.25
    if t.endswith("...") or t.endswith("…"):
        return 0.8
    return 1.0


def shows(spec, cast):
    """Who a camera spec shows."""
    kind, _, names = (spec or "wide").partition(":")
    if kind in ("close", "cu", "two", "ots"):
        return set(names.split(","))
    return set(cast)  # wide, at: (an insert shows the place; treat it as showing everyone)


def tight(spec):
    return (spec or "wide").split(":")[0] in ("close", "cu", "ots")


def jump_cut(a, b):
    """Two tight shots of the same people: cutting between them is a jump, not an edit."""
    return tight(a) and tight(b) and shows(a, ()) == shows(b, ())


def is_shot(spec):
    return spec is not None and not spec.startswith(("snap", "creep"))


def direct_beat(b, B):
    """Fill in the beat's direction (see the top of this file). b: the beat from the JSON, B: its timeline entry
    (events with frames). Returns the shot list rows [(frame, spec, why)], ending with (beat end, None, None)."""
    cast = list(b["cast"])
    evs = [e for e in B["events"] if e.get("role") not in GAME_ROLES and not e.get("previously") and "_after" not in e["id"]]
    cam0 = b.get("camera") or "wide"
    locked = bool(b.get("move")) or cam0.split(":")[0] != "wide"  # the script framed this beat itself
    rows = [(B["start"], cam0, "the beat's own shot")]
    if b.get("mood") == "tense":
        B["dutch"] = DUTCH
    if cam0.startswith("at:") and not b.get("move"):
        B["creep_insert"] = True
    if b.get("walk_to"):
        B["follow"] = True
    if b.get("game"):
        B["card_side"] = "auto"
    cur, last_cut, run = cam0, B["start"], 0
    prev_who, pair, pair_run = None, None, 0
    for i, e in enumerate(evs):
        who = e["who"]
        nxt = next((x["who"] for x in evs[i + 1:] if x["who"] != who), None)
        if not e.get("to"):
            look = e.get("look")
            e["to"] = look if look in cast and look != who else (
                prev_who if prev_who and prev_who != who else nxt or next((w for w in cast if w != who), None))
            if e["to"] is None:
                del e["to"]
        e.setdefault("energy", energy(e["text"]))
        to = e.get("to")
        this_pair = frozenset((who, to)) if to and prev_who == to else None
        pair_run = pair_run + 1 if this_pair and this_pair == pair else (1 if this_pair else 0)
        pair = this_pair
        shout = e["energy"] >= 1.4 and not e.get("quiet")
        if who in b.get("vo", ()):  # heard, not seen: the shot stays as it is
            rows.append((e["start"], cur, "voice over"))
            continue
        if e.get("camera"):  # the script chose this shot
            cur, last_cut = e["camera"], e["start"]
            run = run + 1 if tight(cur) else 0
            rows.append((e["start"], cur, "script"))
        elif not locked and i > 0 and not e.get("quiet") and not e.get("punch") and not shout:
            want, why, at = None, "", e["start"] - 3
            if e.get("do") in TOUCH and e.get("target") in cast:
                want, why, at = f"two:{who},{e['target']}", f"a {e['do']}: both in the frame", e["start"] - 3
            elif e.get("do") in FLIGHT:
                want, why = "wide", "something flies: the whole set"
            elif e.get("do") in ACTION:  # cut on the action: land on the move as it starts
                want, why, at = f"close:{who}", f"cut on the action ({e['do']})", e["start"] + 2
            elif len(cast) == 1:
                if (e["end"] - e["start"]) >= LONG_LINE and not tight(cur):
                    want, why = f"close:{who}", "a long line: closer"
            elif run >= TIGHT_RUN:
                want, why = ("wide" if len(cast) > 2 else f"two:{who},{to}"), "re-orient after close shots"
            elif to and prev_who == to and pair_run > SINGLES_AFTER:
                want, why = f"cu:{who}", f"close-ups: the exchange heats up ({who} to {to})"
            elif to and prev_who == to:
                want, why = f"ots:{to},{who}", f"shot / reverse shot ({who} to {to})"
            else:
                want, why = f"close:{who}", f"{who} takes the floor"
            too_soon = at - last_cut < MIN_SHOT
            if want and too_soon and who not in shows(cur, cast):  # can't hold, can't cut yet: one shot for both
                want, why = (f"two:{prev_who},{who}" if prev_who and prev_who != who else "wide"), "quick exchange: hold both"
            elif want and too_soon:
                want = None
            if want and (want == cur or jump_cut(want, cur)):
                want = None  # already there, or a jump cut: hold the shot
            if want:
                e["camera"], e["cut"] = want, True
                if at != e["start"] - 3:
                    e["cut_at"] = at
                if want == "wide":
                    e["favor"] = who  # the wide leans a little toward whoever is talking
                cur, last_cut = want, at
                run = run + 1 if tight(want) else 0
                rows.append((at, want, why))
        elif shout and not e.get("camera"):
            e["snap"] = True
            run += 1
            rows.append((e["start"] - 4, f"snap in on {who}", "a shouted line"))
        elif e.get("quiet") or e.get("punch"):
            run += 1  # these push in on the speaker themselves
        if not e.get("cut") and e["start"] - last_cut > HOLD_MAX and not e.get("quiet") and not e.get("snap"):
            e["creep"] = cur  # a long hold starts a slow push
            last_cut = e["start"]
            rows.append((e["start"], f"creep in ({cur})", f"held over {HOLD_MAX // FPS} s"))
        lands = e.get("punch") or e["text"].rstrip().endswith("!")
        if lands and not e.get("react") and to and len(cast) > 1 and not nxt and i == len(evs) - 1:
            e["react"], e["react_shot"] = to, "cu"
            rows.append((e["end"] + 2, f"cu:{to}", f"reaction: {to} takes it in"))
        if e.get("react"):  # the reaction shot is now the shot; the next line needn't cut away from it at once
            cur, last_cut = f"{e.get('react_shot', 'close')}:{e['react']}", e["end"] + 2
            run += 1
        prev_who = who
    if b.get("exit") and cur != "wide":  # exits play on the wide, so the walk off reads
        f = B["end"] - WALK - 8
        B["exit_wide"] = f
        rows.append((f, "wide", "the walk off"))
    rows.sort(key=lambda r: r[0])
    real = [(f, s) for f, s, _ in rows if is_shot(s)]
    # close-ups get a soft background (depth of field), from their cut to the next one
    B["dof"] = [(f0, f1, s[3:]) for (f0, s), (f1, _) in zip(real, real[1:] + [(B["end"], None)]) if s.startswith("cu:")]
    rows.append((B["end"], None, None))
    return rows


def shot_list(rows_by_beat):
    """shots.txt: every camera decision with its length, so a director's pass can be read (and argued with)
    before any render. Shots under a second are flagged."""
    out = []
    for bid, rows in rows_by_beat:
        out.append(f"[{bid}]")
        real = [f for f, s, _ in rows if is_shot(s)] + [rows[-1][0]]
        length = {f: f1 - f for f, f1 in zip(real, real[1:])}
        for fr, spec, why in rows:
            if spec is None:
                continue
            ln = length.get(fr) if is_shot(spec) else None
            lt = f"{ln / FPS:4.1f}s" if ln is not None else "     "
            flag = "  <- under a second" if ln is not None and ln < SHORT_FLAG else ""
            out.append(f"  {fr // FPS // 60}:{fr // FPS % 60:02d}.{fr % FPS:02d} {lt}  {spec:24s} {why}{flag}")
    return "\n".join(out) + "\n"
