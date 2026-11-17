# Friendzy cartoon cast. Every builder returns a Character whose parts can be posed and keyed.
# Units: feet at y=0, Riot is ~12 units tall to the ear tips. Front view, flat cutout style.
#
#   c = riot(costume="mafia"); c.root.location = (x, y, z)
#   c.expr("shocked", frame=120)      # swap mouth, brows, pupils, eye squash
#   c.arm(1, 140, frame=120)          # right arm up 140 degrees
#   c.pose("facepalm", frame=120)     # named arm poses (see POSES)
#   c.turn(0.6, frame=120)            # look toward the viewer's right (-1..1), for talking to each other
# Riot costumes: hoodie (default), mafia, dare (Truth or Dare), coach (Alias), host (Trivia), lifeguard (Porchlight).
import math
from toon import *
from toon import _hex_shift, _mesh

FUR_OUTLINE = OL

# expression table shared by the cast:
# mouth variant, brow angle (deg, + = outer end up), brow lift, pupil offset (x, y), eye squash
EXPRESSIONS = {
    "hype":      ("grin",   12, 0.10, (0.00, 0.00), 1.00),
    "cocky":     ("smirk", -14, -0.05, (0.08, 0.00), 0.62),
    "drumroll":  ("grit",  -18, -0.10, (0.00, 0.02), 0.85),
    "shocked":   ("shock",  22, 0.38, (0.00, 0.00), 1.25),
    "laughing":  ("laugh",  16, 0.15, (0.00, 0.00), 1.0),
    "suspicious": ("flat", -20, -0.12, (0.12, 0.00), 0.45),
    "nervous":   ("wobble", 26, 0.25, (-0.10, 0.04), 1.10),
    "yelling":   ("yell",  -26, -0.08, (0.05, 0.00), 1.00),
    "happy":     ("smile",   8, 0.08, (0.00, 0.00), 1.00),
    "side_eye_l": ("flat", -20, -0.12, (-0.13, 0.00), 0.45),
    "side_eye_r": ("smirk", -14, -0.05, (0.13, 0.00), 0.62),
    "sleepy":    ("flat",    0, -0.12, (0.00, -0.03), 0.1),
    "smug":      ("smug",   -8, -0.02, (0.07, 0.01), 0.55),    # half-lidded, one corner up: "told you"
    "disgusted": ("ew",     -4, -0.06, (0.00, -0.03), 0.6),    # squinting at something gross
    "pouting":   ("pout",   24, 0.14, (0.00, 0.04), 1.15),     # big puppy eyes, lip pushed out
    "soft":      ("smile", -10, 0.04, (0.00, -0.04), 0.78),    # Porchlight: quiet, wistful; small smile, eyes a little down
    "sad":       ("pout",  -22, 0.06, (0.00, -0.07), 0.82),    # eyes down, brows up in the middle, lip out
    "embarrassed": ("wobble", -14, 0.02, (0.10, -0.04), 0.74),  # glancing away, cheeks flushed
    "scared":    ("shock", -28, 0.34, (0.00, 0.02), 1.30),     # wide eyes, brows high, tiny pupils
    "determined": ("grit",  16, -0.06, (0.00, 0.00), 0.80),    # jaw set, brows down
    "asleep":    ("flat",    0, -0.14, (0.00, -0.03), 0.10),   # eyes shut (pair with the "sleep" move)
    "deadpan":   ("flat",    2, -0.04, (0.00, 0.00), 0.62),    # Rocco's resting face: half-lidded, unimpressed
}
ARC_EYES = {"laughing"}  # expressions drawn with closed ^ ^ eyes

# arm poses per side: (shoulder deg, elbow deg, hand). Angles swing outward/up from hanging down;
# shoulder + elbow = where the forearm points (180 = straight up). ("face", hand) reaches the face with IK.
HANDS = ("paw", "open", "fist", "point", "thumbs", "peace", "three", "horns", "four", "grab", "hold")
REST = (10, 8, "paw")
POSES = {
    "idle":     {1: REST, -1: REST},
    "point":    {1: (88, 4, "point"), -1: REST},       # points to the viewer's right
    "wave":     {1: (72, 78, "open"), -1: REST},
    "cheer":    {1: (132, 22, "fist"), -1: (132, 22, "fist")},
    "shrug":    {1: (24, 82, "open"), -1: (24, 82, "open")},
    "crossed":  {1: (-18, -112, "paw"), -1: (-24, -100, "paw")},  # forearms folded across the chest
    "facepalm": {1: ("face", "open"), -1: REST},
    "mic":      {1: (16, 98, "fist"), -1: REST},       # host pose: mic held up beside the face
    "present":  {1: (42, 38, "open"), -1: REST},       # "ta-da", showing off a card or a prompt
    "explain":  {1: (24, 140, "point"), -1: REST},     # one finger up, making a point
    "thumbs":   {1: (18, 150, "thumbs"), -1: REST},    # thumbs up
}

# head turn: how far each face part slides (x head width) when looking sideways; ears go the other way
TURN = 0.38
TURN_PARTS = [("_brows_patch", 0.8), ("_eye", 1.0), ("_brow", 1.0), ("_mask", 0.8), ("_mark", 0.8),
              ("_nose", 1.1), ("_philtrum", 1.1), ("_mouth", 1.0), ("_glasses", 1.0), ("_muzzle", 0.45),
              ("_cheek", 0.45), ("_blush", 0.7), ("_hat", 0.25), ("_horn", 0.3), ("_visor", 0.25), ("_ear", -0.3)]


# body turn: chest details slide with the head (less than the face) so the torso reads as turning too
BODY_TURN_PARTS = [("_zip", 0.55), ("_pocket", 0.45), ("_string", 0.6), ("_pipe", 0.35), ("_lanyard", 0.55), ("_whistle", 0.55),
                   ("_chest", 0.5), ("_shirt", 0.5), ("_tie", 0.55), ("_lapel", 0.4), ("_btn", 0.45), ("_bow", 0.55),
                   ("_belly", 0.3), ("_hood", -0.25)]


def body_of(c):
    """The character's body empty. Blender names a second copy of a character "riot_body.001", so match the name
    without that suffix (a plain endswith("_body") missed every copy after the first: no torso bend, no stride)."""
    return c.extras.get("body") or next((o for o in c.root.children if o.name.split(".")[0].endswith("_body")), None)


class Character:
    def __init__(self, name):
        self.name = name
        self.root = empty(name)
        self.eyes, self.pupils, self.brows = [], [], []
        self.mouths, self.arms, self.legs = {}, {}, {}
        self.elbows, self.hands, self.hand_state = {}, {}, {}
        self.eye_states = []  # (open eye group, closed arc) per eye
        self.extras = {}
        self.palette = []     # (label, hex) for the reference sheet
        self.sleeve_cel, self.cel_on = {}, {}
        self.lids = []

    def expr(self, name, frame=None, face=True, pupils=True):
        """face=False leaves brows and eye squash alone and pupils=False the pupils (motion.Anim.bake keys those
        every frame)."""
        mouth, ang, lift, (px, py), sq = EXPRESSIONS[name]
        for k, m in self.mouths.items():
            set_visible(m, k == mouth, frame)
        for side, b in (self.brows if face else ()):
            b.rotation_euler.z = rad(ang) * side
            b.location.y = b["y0"] + lift
            if frame is not None:
                b.keyframe_insert("rotation_euler", frame=frame)
                b.keyframe_insert("location", frame=frame)
        for side, p in (self.pupils if pupils else ()):
            p.location.x, p.location.y = p["x0"] + px, p["y0"] + py
            if frame is not None:
                p.keyframe_insert("location", frame=frame)
        for e in (self.eyes if face else ()):
            e.scale.y = sq
            if frame is not None:
                e.keyframe_insert("scale", frame=frame)
        arc = name in ARC_EYES
        for o, a in self.eye_states:
            set_visible(o, not arc, frame)
            set_visible(a, arc, frame)
        self.current = name

    def arm(self, side, deg, frame=None, elbow=None):
        """Shoulder (and optionally elbow) angle in degrees, outward/up from hanging down."""
        a = self.arms[side]
        a.rotation_euler.z = rad(deg) * side
        if elbow is not None:
            self.elbows[side].rotation_euler.z = rad(elbow) * side
        if frame is not None:
            a.keyframe_insert("rotation_euler", frame=frame)
            self.elbows[side].keyframe_insert("rotation_euler", frame=frame)
        self.relight(side, frame)

    def relight(self, side, frame=None):
        """Show the sleeve shading that matches where this arm is pointing (see sleeve_light)."""
        bands = self.sleeve_cel.get(side)
        if not bands:
            return
        ang = self.arms[side].rotation_euler.z + self.elbows[side].rotation_euler.z / 2
        k = round((math.atan2(CEL_LIGHT[1], CEL_LIGHT[0]) - ang) / (math.pi / 3)) % 6
        prev = self.cel_on.get(side)
        if k == prev:
            return
        for i, b in enumerate(bands):
            if b is not None and (prev is None or i in (prev, k)):
                set_visible(b, i == k, frame)
        self.cel_on[side] = k

    def hand(self, side, name, frame=None):
        for k, h in self.hands[side].items():
            set_visible(h, k == name, frame)
        self.hand_state[side] = name

    def ik(self, side, target):
        """Two-bone IK: raw (shoulder, elbow) z-rotations that put the hand centre on target (body space).
        The elbow bends outward, away from the body."""
        a = self.arms[side]
        S = Vector((a["x0"], a["y0"]))
        v = Vector(target) - S
        L1, L2 = a["L1"], a["L2"]
        d = min(max(v.length, abs(L1 - L2) + 0.01), L1 + L2 - 0.01)
        phi = math.atan2(v.x, -v.y)
        alpha = math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
        best = None
        for sgn in (1, -1):
            r1 = phi + sgn * alpha
            E = S + L1 * Vector((math.sin(r1), -math.cos(r1)))
            w = Vector(target) - E
            r2 = math.atan2(w.x, -w.y) - r1
            score = E.x * side
            if best is None or score > best[0]:
                best = (score, r1, r2)
        return best[1], best[2]

    def reach(self, side, target, front=True, frame=None, hand="open"):
        """Put a hand on target (x, y in body space) with two-bone IK."""
        a = self.arms[side]
        r1, r2 = self.ik(side, target)
        a.rotation_euler.z, self.elbows[side].rotation_euler.z = r1, r2
        a.location.z = 0.7 if front else a["z0"]
        self.hand(side, hand, frame)
        if frame is not None:
            a.keyframe_insert("rotation_euler", frame=frame)
            a.keyframe_insert("location", frame=frame)
            self.elbows[side].keyframe_insert("rotation_euler", frame=frame)
        self.relight(side, frame)

    def pose(self, name, frame=None):
        head = self.extras["head"].location
        for side, v in getattr(self, "poses", POSES)[name].items():
            a = self.arms[side]
            if v[0] == "face":
                self.reach(side, (head.x + 0.35 * side, head.y + 1.95), True, frame, v[1])
                continue
            sh, el, hd = v
            a.location.z = a["z0"] + (0.25 if el < -30 else 0)
            self.arm(side, sh, elbow=el)
            self.hand(side, hd, frame)
            if frame is not None:
                for p in ("rotation_euler", "location"):
                    a.keyframe_insert(p, frame=frame)
                self.elbows[side].keyframe_insert("rotation_euler", frame=frame)

    def turn(self, t, frame=None):
        """Slide the face toward one side to suggest a 3/4 view; the far eye narrows a little."""
        head_ = self.extras["head"]
        if "k_turn" in head_:  # the outline of the face follows the look (rig.face)
            head_["k_turn"] = t
            head_.update_tag()  # (a custom property set from Python doesn't wake the drivers by itself)
            if frame is not None:
                head_.keyframe_insert('["k_turn"]', frame=frame)
        for o in self.extras["head"].children:
            k = next((f for key, f in TURN_PARTS if key in o.name), None)
            if k is None:
                continue
            if "bx" not in o:
                o["bx"] = o.location.x
            o.location.x = o["bx"] + TURN * t * k * (0.0 if "k_turn" in head_ else 1.0)  # (a real turn does this now: rig.turn3d)
            if frame is not None:
                o.keyframe_insert("location", frame=frame)
        body = body_of(self)
        for o in (body.children if body is not None else ()):  # cheap 3/4 body: the chest details turn with the head
            k = next((f for key, f in BODY_TURN_PARTS if key in o.name), None)
            if k is None:
                continue
            if "bx" not in o:
                o["bx"] = o.location.x
            o.location.x = o["bx"] + TURN * t * k
            if frame is not None:
                o.keyframe_insert("location", frame=frame)
        for side, p in self.pupils:
            e = p.parent.parent
            e.scale.x = 1 - 0.22 * max(0.0, -t * side)
            if frame is not None:
                e.keyframe_insert("scale", frame=frame)

    def blink(self, frame, length=4):
        for e in self.eyes:
            s = e.scale.y
            for f, v in ((frame, s), (frame + length // 2, 0.08), (frame + length, s)):
                e.scale.y = v
                e.keyframe_insert("scale", frame=f)


# ---------- acting extras (built on demand by motion.Anim.bake) ----------

def face_box(c):
    """(half width, top y) of the face shape in head space."""
    f = bpy.data.objects.get(f"{c.name}_face")
    if f is None:
        return 2.2, 3.3
    xs = [v.co.x for v in f.data.vertices]
    ys = [v.co.y for v in f.data.vertices]
    return (max(xs) - min(xs)) / 2, max(ys)


def face_fx(c):
    """Expression colour and emotion marks on the head, all hidden until motion drives them:
    flush (red face when yelling), pale (blue dread lines down the forehead when shocked),
    vein (anger cross), sparkle (hype), gloom (rain cloud over the head). Each wash has its own material."""
    if "fx" in c.extras:
        return c.extras["fx"]
    import props
    head = c.extras["head"]
    hw, top = face_box(c)
    fx = {}
    fx["flush"] = light(f"{c.name}_blush_flush", ell(0, 0.95, hw * 0.92, 1.05), "#E8192C", 0.0001, head, 0.02)
    pale = empty(f"{c.name}_blush_pale", head, (0, 0), 0.02)  # dread: blue lines down the forehead
    for i, x in enumerate((-0.6, -0.2, 0.2, 0.6)):
        stroke(f"{c.name}_blush_pale_l{i}", [(x * hw * 0.6, top - 0.25), (x * hw * 0.6, top - 0.95 + 0.12 * (i % 2))], 0.07, "#3A4A9A", pale, 0.002)
    fx["pale"] = pale
    for key, kind, xy, s in (("vein", "anger", (hw * 0.75, top + 0.2), 0.75), ("sparkle", "sparkle", (-hw * 1.05, top + 0.5), 0.9)):
        g = props.emote(f"{c.name}_fx_{key}", kind, (0, 0), 0, s)
        g.parent = head
        g.location = (xy[0], xy[1], 0.09)
        fx[key] = g
    gl = empty(f"{c.name}_fx_gloom", head, (0, top + 1.6), 0.09)
    for i, (x, y, rx, ry) in enumerate(((-0.95, 0.35, 0.85, 0.65), (0.0, 0.7, 1.05, 0.85), (1.0, 0.4, 0.85, 0.65))):
        shape(f"{c.name}_fx_gloom_c{i}", ell(x, y, rx, ry), "#9AA1BC", gl, 0.001 * i, ol=0.08)
    shape(f"{c.name}_fx_gloom_base", rect(-1.75, -0.1, 1.75, 0.35), "#9AA1BC", gl, 0.004, ol=0, smooth=0)
    for i, x in enumerate((-1.1, -0.4, 0.3, 1.0)):  # rain: short teardrop streaks
        stroke(f"{c.name}_fx_gloom_r{i}", [(x, -0.35 - 0.2 * (i % 2)), (x - 0.15, -1.15 - 0.2 * (i % 2))], 0.11, "#4F8FFF", gl, -0.01, w1=0.05)
    fx["gloom"] = gl
    tears = empty(f"{c.name}_fx_tears", head, (0, 0), 0.09)  # tears of laughter at the outer eye corners
    for e in c.eyes:
        s = 1 if e.location.x > 0 else -1
        t = empty(f"{c.name}_fx_tear{s}", tears, (e.location.x + s * 0.42, e.location.y - 0.1), 0.0)
        shape(f"{c.name}_fx_tear{s}_d", [(0, 0.12, "s"), (0.16, -0.12), (0, -0.3), (-0.16, -0.12)], "#7FD3FF", t, 0.0, ol=0.04)
    fx["tears"] = tears
    z = props.emote(f"{c.name}_fx_zzz", "zzz", (0, 0), 0, 0.8)
    z.parent = head
    z.location = (hw * 0.9, top + 0.6, 0.09)
    fx["zzz"] = z
    fx["flush"].material_slots[0].material = fx["flush"].material_slots[0].material.copy()
    for k in ("pale", "vein", "sparkle", "gloom", "tears", "zzz"):
        set_visible(fx[k], False)
    c.extras["fx"] = fx
    return fx


def wall_shadow(c, alpha=0.3):
    """A soft drop shadow of the torso and head on the wall / couch back behind the character (light from the
    top-left), parented to the body and head so it moves, leans and jumps with them."""
    if "shadow" in c.extras:
        return
    body = body_of(c)
    hw, _ = face_box(c)
    light(f"{c.name}_wshadow_body", ell(0.75, 4.55, 2.05, 1.95), "#1A1030", alpha, body, -1.6)
    light(f"{c.name}_wshadow_head", ell(0.8, 1.05, hw * 1.05, 2.05), "#1A1030", alpha, c.extras["head"], -2.0)
    c.extras["shadow"] = True


def repivot(o):
    """Move a hanging stroke's origin to its top point, so rotating it swings it from where it's attached."""
    if o.get("piv"):
        return
    top = max((v.co for v in o.data.vertices), key=lambda v: v.y).copy()
    top.z = 0
    for v in o.data.vertices:
        v.co -= top
    o.location += top
    for ch in o.children:  # an outline or shading on the part stays where it was drawn
        ch.location -= top
    o["piv"] = 1


# ---------- cel shading ----------

CEL_SKIP = ("_ol", "_eye", "_pupil", "_lid", "_m_", "_brow", "_nose", "_philtrum", "_tongue", "_teeth", "_drop",
            "_blush", "_mark", "_star", "_sparkle", "_btn", "_knot", "_shine", "_cel", "_hem", "_cuff", "_string", "_bridge")


CEL_LIGHT = (-0.6, 0.8)  # where the cel light comes from (top-left); a set lit from the right flips it before building
RIM = None               # (colour, width): a thin bright edge on the lit side (moonlight, sunset); None = no rim


def edge_band(pts, d, along):
    """The strip along the edge of a dense polygon that faces `along`: wide where it faces it squarely, nothing where
    it doesn't. Plain geometry, so it works on the long thin sleeves where the boolean in crescent() can fail."""
    P, n = [Vector(p[:2]) for p in pts], len(pts)
    a = Vector(along).normalized()
    nrm = []
    for i in range(n):
        e = (P[(i + 1) % n] - P[i - 1]).normalized()
        nrm.append(Vector((e.y, -e.x)))
    on = [nrm[i].dot(a) > 0.2 and abs(nrm[i].y) < 0.55 for i in range(n)]  # the long sides only, never around the shoulder
    if not any(on) or all(on):
        return None
    start = next(i for i in range(n) if on[i] and not on[i - 1])
    run = []
    i = start
    while on[i % n] and len(run) < n:
        run.append(i % n)
        i += 1
    outer = [tuple(P[i]) for i in run]
    inner = [tuple(P[i] - nrm[i] * d * nrm[i].dot(a)) for i in reversed(run)]
    return outer + inner


def sleeve_light(c, o, side, lum, hexv):
    """A sleeve changes direction a lot, so its shading is drawn six times, one per way the light can fall on it, and
    Character.relight shows the one that matches the arm. The light stays on the same side of the screen."""
    pts = [(v.co.x, v.co.y) for v in o.data.vertices]
    bands = []
    for k in range(6):
        ang = math.radians(60 * k)
        L = (math.cos(ang), math.sin(ang))
        pl = edge_band(pts, 0.1 if lum < 0.16 else 0.24, L if lum < 0.16 else (-L[0], -L[1]))
        if pl is None:
            bands.append(None)
            continue
        col = _hex_shift(hexv, 1.45) if lum < 0.16 else _hex_shift(hexv, 0.84 if lum > 0.7 else 0.8, 0.45 if lum > 0.7 else 0.1)
        b = _mesh(f"{o.name}_cel{k}", ccw(pl), col, o, 0.0015)
        b.hide_render = b.hide_viewport = True
        bands.append(b)
    c.sleeve_cel[side] = bands


def cel(c):
    """Shadow crescents on the side of every big coloured shape away from the light (CEL_LIGHT: top-left unless a
    set says otherwise); very dark shapes get a lighter rim on the lit side instead. With RIM, the big shapes also
    get a thin bright edge on the lit side (night and sunset sets)."""
    lx, ly = CEL_LIGHT
    mouth_parts = {id(x) for m in c.mouths.values() for x in m.children_recursive}
    for o in list(c.root.children_recursive):
        if o.type != "MESH" or "hex" not in o or any(k in o.name for k in CEL_SKIP) or id(o) in mouth_parts:
            continue
        xs = [v.co.x for v in o.data.vertices]
        ys = [v.co.y for v in o.data.vertices]
        size = math.sqrt((max(xs) - min(xs)) * (max(ys) - min(ys)))
        if size < 0.75:
            continue
        hexv = o["hex"]
        lum = sum(int(hexv[i:i + 2], 16) for i in (1, 3, 5)) / 765
        if CRAFT and "_upper" in o.name:
            sleeve_light(c, o, 1 if o.name.split(".")[0].endswith("1") and not o.name.split(".")[0].endswith("-1") else -1, lum, hexv)
            continue
        d = min(max(0.11 * size, 0.1), 0.42)
        if lum < 0.16:   # charcoal / black: lit rim on the lit side
            band = crescent(o, _hex_shift(hexv, 1.9), d * 0.7, toward=(-lx, -ly))
        elif lum < 0.95:  # warm shadows: light colours pick up saturation instead of going grey
            band = crescent(o, _hex_shift(hexv, 0.84 if lum > 0.7 else 0.8, 0.45 if lum > 0.7 else 0.1), d, toward=(lx, ly))
        else:
            band = None
        if band is not None:  # new objects start visible: match the fill (hidden hands, costume bits...)
            band.hide_render, band.hide_viewport = o.hide_render, o.hide_viewport
        if RIM and size > 1.4 and lum >= 0.16:  # the light's own colour catching the edge that faces it
            rim_ = crescent(o, RIM[0], RIM[1], toward=(-lx, -ly), z=0.0018)
            if rim_ is not None:
                rim_.hide_render, rim_.hide_viewport = o.hide_render, o.hide_viewport
    if CRAFT:
        import rig
        rig.attach(c)
        for side in c.arms:
            c.relight(side)


# ---------- shared parts ----------

def capsule(x0, y0, x1, y1, r, n=8):
    """Rounded stick from (x0, y0) to (x1, y1): fingers, thumbs."""
    d = Vector((x1 - x0, y1 - y0))
    a = math.atan2(d.y, d.x)
    pts = [(x1 + r * math.cos(a - math.pi / 2 + math.pi * i / n), y1 + r * math.sin(a - math.pi / 2 + math.pi * i / n)) for i in range(n + 1)]
    pts += [(x0 + r * math.cos(a + math.pi / 2 + math.pi * i / n), y0 + r * math.sin(a + math.pi / 2 + math.pi * i / n)) for i in range(n + 1)]
    return pts


def build_hands(c, side, parent, fur):
    """Hand variants at the wrist (pointing down the forearm). Drawn for the right hand with the thumb on
    the inner side; the left hand is mirrored. The index finger sits off-centre on purpose (never reads rude)."""
    n = f"{c.name}_hand{side}"
    root = empty(n, parent, (0, -1.15), -0.012)
    root.scale.x = side
    hands = {}
    def variant(key):
        g = empty(f"{n}_{key}", root)
        hands[key] = g
        return g
    g = variant("paw")
    shape(f"{n}_paw", ell(0, -0.33, 0.5, 0.45), fur, g, 0.0)
    g = variant("open")
    for i, ang in enumerate((-30, -10, 10, 30)):
        bx, by = -0.15 + 0.1 * i, -0.45
        tx, ty = bx + math.sin(rad(ang)) * 0.48, by - math.cos(rad(ang)) * 0.48
        shape(f"{n}_open_f{i}", capsule(bx, by, tx, ty, 0.13), fur, g, -0.004 + i * 0.0005)
    shape(f"{n}_open_thumb", capsule(-0.28, -0.25, -0.62, -0.45, 0.13), fur, g, -0.003)
    shape(f"{n}_open_palm", ell(0, -0.32, 0.43, 0.38), fur, g, 0.0)
    g = variant("fist")
    shape(f"{n}_fist", ell(0, -0.32, 0.46, 0.42), fur, g, 0.0)
    for i, x in enumerate((-0.12, 0.08, 0.27)):
        stroke(f"{n}_fist_k{i}", [(x - 0.09, -0.6), (x, -0.5), (x + 0.09, -0.6)], 0.045, OUTLINE, g, 0.01)
    shape(f"{n}_fist_thumb", capsule(-0.36, -0.12, -0.12, -0.36, 0.13), fur, g, 0.005)
    g = variant("point")
    shape(f"{n}_point_f", capsule(-0.2, -0.5, -0.22, -1.1, 0.13), fur, g, -0.004)
    shape(f"{n}_point_fist", ell(0.03, -0.32, 0.44, 0.4), fur, g, 0.0)
    for i, x in enumerate((0.1, 0.28)):
        stroke(f"{n}_point_k{i}", [(x - 0.08, -0.6), (x, -0.5), (x + 0.08, -0.6)], 0.045, OUTLINE, g, 0.01)
    g = variant("thumbs")  # sideways fist, finger lines stacked, thumb straight out along the forearm
    shape(f"{n}_thumbs_t", capsule(-0.18, -0.35, -0.2, -1.05, 0.17), fur, g, -0.004)
    shape(f"{n}_thumbs_fist", ell(0.08, -0.32, 0.42, 0.44), fur, g, 0.0)
    for i, y in enumerate((-0.12, -0.3, -0.48)):
        stroke(f"{n}_thumbs_k{i}", [(0.05, y), (0.42, y - 0.02)], 0.045, OUTLINE, g, 0.01)
    # finger signs: a fist with some fingers out (peace = 2, three = 3, horns = index + pinky)
    for key, fingers in (("peace", ((-0.22, -0.4), (0.0, -0.06))), ("three", ((-0.24, -0.28), (-0.04, -0.04), (0.16, 0.2))),
                         ("horns", ((-0.22, -0.3), (0.3, 0.32)))):
        g = variant(key)
        for i, (bx, tx) in enumerate(fingers):
            shape(f"{n}_{key}_f{i}", capsule(bx, -0.5, tx, -1.08, 0.13), fur, g, -0.004 + i * 0.0005)
        shape(f"{n}_{key}_fist", ell(0.03, -0.32, 0.45, 0.4), fur, g, 0.0)
        stroke(f"{n}_{key}_k", [(0.1 if key != "horns" else -0.02, -0.6), (0.2 if key != "horns" else 0.12, -0.52)], 0.045, OUTLINE, g, 0.01)
    g = variant("four")  # counting: four fingers up, the thumb folded across the palm
    for i, (bx, tx) in enumerate(((-0.27, -0.42), (-0.09, -0.12), (0.09, 0.12), (0.27, 0.42))):
        shape(f"{n}_four_f{i}", capsule(bx, -0.5, tx, -1.05, 0.12), fur, g, -0.004 + i * 0.0005)
    shape(f"{n}_four_palm", ell(0.0, -0.32, 0.45, 0.4), fur, g, 0.0)
    shape(f"{n}_four_thumb", capsule(-0.32, -0.32, -0.08, -0.4, 0.1), fur, g, 0.005)
    g = variant("grab")  # reaching to take something: fingers half curled, thumb apart
    shape(f"{n}_grab_palm", ell(0, -0.3, 0.44, 0.38), fur, g, 0.0)
    for i, x in enumerate((-0.2, 0.0, 0.2)):
        shape(f"{n}_grab_f{i}", capsule(x, -0.55, x + 0.12, -0.92, 0.12), fur, g, 0.003 + i * 0.0005)
        stroke(f"{n}_grab_k{i}", [(x + 0.04, -0.62), (x + 0.12, -0.7)], 0.04, OUTLINE, g, 0.01)
    shape(f"{n}_grab_thumb", capsule(-0.32, -0.28, -0.62, -0.62, 0.13), fur, g, 0.004)
    g = variant("hold")  # wrapped around a prop: the palm behind it, the fingers across the front (props sit at z 0.06)
    shape(f"{n}_hold_palm", ell(0, -0.35, 0.46, 0.42), fur, g, 0.0)
    for i, y in enumerate((-0.3, -0.52, -0.72)):  # fingers curl round the near side only, so the prop still shows
        shape(f"{n}_hold_f{i}", capsule(-0.42, y, 0.0, y - 0.03, 0.11), fur, g, 0.1 + i * 0.001)
    shape(f"{n}_hold_thumb", capsule(-0.4, -0.08, -0.1, -0.22, 0.12), fur, g, 0.104)
    for k, h in hands.items():
        set_visible(h, k == "paw")
    c.hands[side] = hands
    c.hand_state[side] = "paw"
    c.extras[f"hand{side}"] = root
    return root


def smooth_w(y):
    """A sleeve's slight swell above the elbow."""
    return max(0.0, 1 - abs(y + 0.7) / 0.9)


def build_arm(c, side, parent, shoulder, sleeve, cuff, fur, pipe=None, z=0.15):
    """Two-part arm: upper sleeve (rotates at the shoulder) + forearm (rotates at the elbow) + hands."""
    n, s = c.name, side
    a = empty(f"{n}_arm{s}", parent, shoulder, z)
    if CRAFT:  # one sleeve from shoulder to cuff, enough points to bend (rig.sleeve)
        ys = [0.1 - 2.43 * i / 44 for i in range(45)]
        wide = lambda y: 0.44 + 0.04 * smooth_w(y)
        side_r = [(wide(y), y) for y in ys]
        top = [(0.42 * math.cos(math.pi * i / 10), 0.1 + 0.2 * math.sin(math.pi * i / 10)) for i in range(1, 10)]
        pts = side_r[::-1] + [] if False else top[::-1] + [(-wide(y), y) for y in ys[:-1]] + [(-0.38, -2.33), (0.4, -2.33)] + side_r[-2::-1]
        shape(f"{n}_upper{s}", mx(ccw(pts), s), sleeve, a, 0.0, smooth=0)
        if pipe:
            stroke(f"{n}_upperpipe{s}", mx([(0.25, 0.05 - 2.2 * i / 24) for i in range(25)], s), 0.06, pipe, a, 0.01)
        el = empty(f"{n}_elbow{s}", a, (0, -1.35), 0.02)
    else:
        shape(f"{n}_upper{s}", mx([(-0.42, 0.3), (0.45, 0.25), (0.5, -0.7), (0.45, -1.3), (0.0, -1.62), (-0.42, -1.3), (-0.44, -0.7)], s), sleeve, a, 0.0)
        if pipe:
            stroke(f"{n}_upperpipe{s}", mx([(0.25, 0.05), (0.24, -1.25)], s), 0.06, pipe, a, 0.01)
        el = empty(f"{n}_elbow{s}", a, (0, -1.35), 0.02)
        shape(f"{n}_fore{s}", mx([(-0.41, 0.25), (0.42, 0.25), (0.44, -0.55), (0.39, -0.98, "s"), (-0.37, -0.98, "s"), (-0.41, -0.55)], s), sleeve, el, 0.0)
        if pipe:
            stroke(f"{n}_forepipe{s}", mx([(0.24, 0.1), (0.22, -0.85)], s), 0.06, pipe, el, 0.01)
    shape(f"{n}_cuff{s}", mx(rect(-0.42, -1.18, 0.44, -0.85), s), cuff, el, 0.012, ol=0.05, smooth=0)
    build_hands(c, s, el, fur)
    a["x0"], a["y0"], a["z0"], a["L1"], a["L2"] = shoulder[0], shoulder[1], z, 1.35, 1.48
    c.arms[s], c.elbows[s] = a, el
    return a


def add_eye(c, head, side, pos, rx, ry, z, tilt=0.0, pupil_r=None, lid=True, white="#FFFFFF"):
    e = empty(f"{c.name}_eye{side}", head, pos, z)
    arc = empty(f"{c.name}_eye{side}_arc", e, (0, 0), 0.03)
    stroke(f"{c.name}_eye{side}_arc_s", [(-rx * 0.95, -ry * 0.25), (-rx * 0.4, ry * 0.55), (rx * 0.4, ry * 0.55), (rx * 0.95, -ry * 0.25)],
           0.14, OUTLINE, arc, 0.0)
    set_visible(arc, False)
    e_open = empty(f"{c.name}_eye{side}_open", e)
    c.eye_states.append((e_open, arc))
    e, e_root = e_open, e
    shape(f"{c.name}_eye{side}_white", ell(0, 0, rx, ry, rot=rad(tilt) * side), white, e, 0.0, ol=0.06)
    p = empty(f"{c.name}_pupil{side}", e, (0, -ry * 0.08), 0.01)
    p["x0"], p["y0"] = 0.0, -ry * 0.08
    r = pupil_r or min(rx, ry) * 0.62
    shape(f"{c.name}_pupil{side}_d", ell(0, 0, r * 0.92, r), OUTLINE, p, 0.0, ol=0)
    shape(f"{c.name}_pupil{side}_s", ell(r * 0.32, r * 0.35, r * 0.3, r * 0.3, n=14), "#FFFFFF", p, 0.004, ol=0)
    if lid:
        stroke(f"{c.name}_lid{side}", mx([(-rx * 1.05, ry * 0.15), (0, ry * 1.05), (rx * 1.1, ry * 0.35)], side),
               0.11, OUTLINE, e, 0.02)
    c.eyes.append(e_root)
    c.pupils.append((side, p))
    return e_root


def add_brow(c, head, side, pivot, path, w0, w1, z, color=OUTLINE):
    b = empty(f"{c.name}_brow{side}", head, pivot, z)
    b["y0"] = pivot[1]
    stroke(f"{c.name}_brow{side}_s", mx(path, side), w0, color, b, 0.0, w1=w1)
    c.brows.append((side, b))
    return b


def add_mouths(c, head, pos, z, w=1.0, inner="#7A1020", tongue="#F0606E", teeth=True):
    m = empty(f"{c.name}_mouth", head, pos, z)
    s = lambda pts: [(x * w, y * w) + tuple(r) for x, y, *r in pts]

    def group(key):
        g = empty(f"{c.name}_m_{key}", m)
        c.mouths[key] = g
        return g

    # big cocky open grin, a little higher on the right
    g = group("grin")
    top = [(-0.95, 0.30, "s"), (-0.45, 0.16), (0.25, 0.18), (1.0, 0.42, "s")]
    bot = [(0.75, 0.0), (0.2, -0.38), (-0.45, -0.3)]
    shape(f"{c.name}_grin", s(top + bot), inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_grin_tongue", s(ell(0.05, -0.22, 0.38, 0.14)), tongue, g, 0.004, ol=0)
    if teeth:
        shape(f"{c.name}_grin_teeth", s([(-0.8, 0.26, "s"), (-0.45, 0.15), (0.25, 0.17), (0.86, 0.36, "s"),
                                         (0.7, 0.2), (0.25, 0.02), (-0.45, 0.0), (-0.75, 0.12)]), "#FFFFFF", g, 0.008, ol=0)

    g = group("smirk")
    stroke(f"{c.name}_smirk", s([(-0.7, 0.1), (-0.1, -0.05), (0.55, 0.08), (0.95, 0.42)]), 0.13, OUTLINE, g, 0.0)

    g = group("smile")
    stroke(f"{c.name}_smile", s([(-0.75, 0.22), (-0.3, -0.12), (0.3, -0.12), (0.75, 0.22)]), 0.13, OUTLINE, g, 0.0)

    g = group("smug")  # closed, lopsided: flat on the left, curling up on the right, with a dimple
    stroke(f"{c.name}_smug", s([(-0.6, 0.02), (-0.1, -0.04), (0.4, 0.0), (0.72, 0.28)]), 0.13, OUTLINE, g, 0.0)
    stroke(f"{c.name}_smug_d", s([(0.78, 0.4), (0.86, 0.22)]), 0.07, OUTLINE, g, 0.0)

    g = group("ew")  # wavy frown with the tongue poking out at one corner
    shape(f"{c.name}_ew_t", s(ell(0.32, -0.2, 0.2, 0.17)), tongue, g, -0.004, ol=0.06)
    stroke(f"{c.name}_ew", s([(-0.65, -0.18), (-0.35, 0.04), (0.0, -0.06), (0.3, 0.06), (0.62, -0.16)]), 0.12, OUTLINE, g, 0.0)

    g = group("pout")  # small pushed-out lower lip
    stroke(f"{c.name}_pout", s([(-0.38, -0.05), (0.0, 0.08), (0.38, -0.05)]), 0.11, OUTLINE, g, 0.0)
    shape(f"{c.name}_pout_lip", s(ell(0, -0.2, 0.3, 0.14)), "#E86A7A", g, 0.002, ol=0.06)

    g = group("flat")
    stroke(f"{c.name}_flat", s([(-0.5, 0.0), (0.0, 0.02), (0.5, -0.02)]), 0.12, OUTLINE, g, 0.0)

    g = group("wobble")
    stroke(f"{c.name}_wobble", s([(-0.65, -0.02), (-0.4, 0.1), (-0.15, -0.06), (0.1, 0.1), (0.35, -0.06), (0.62, 0.06)]),
           0.11, OUTLINE, g, 0.0)

    g = group("grit")
    shape(f"{c.name}_grit", s([(-0.75, 0.15, "s"), (0.75, 0.15, "s"), (0.6, -0.25, "s"), (-0.6, -0.25, "s")]),
          "#FFFFFF", g, 0.0, ol=0.07, smooth=2)
    stroke(f"{c.name}_grit_l", s([(-0.68, -0.05), (0.68, -0.05)]), 0.05, OUTLINE, g, 0.01)
    for x in (-0.3, 0.0, 0.3):
        stroke(f"{c.name}_grit_v{x}", s([(x, 0.13), (x, -0.23)]), 0.045, OUTLINE, g, 0.01)

    g = group("shock")
    shape(f"{c.name}_shock", s(ell(0, -0.15, 0.36, 0.52)), inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_shock_t", s(ell(0, -0.48, 0.24, 0.13)), tongue, g, 0.004, ol=0)

    g = group("yell")
    shape(f"{c.name}_yell", s([(-0.8, 0.3, "s"), (0.8, 0.3, "s"), (0.55, -0.45), (0, -0.7), (-0.55, -0.45)]),
          inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_yell_t", s(ell(0, -0.48, 0.38, 0.16)), tongue, g, 0.004, ol=0)
    if teeth:
        shape(f"{c.name}_yell_teeth", s([(-0.7, 0.27, "s"), (0.7, 0.27, "s"), (0.62, 0.12, "s"), (-0.62, 0.12, "s")]),
              "#FFFFFF", g, 0.008, ol=0, smooth=0)

    # lip-sync visemes (Rhubarb's mouth shapes A-H): talking mouths, smaller than the shouting ones
    g = group("vA")  # M B P: lips pressed
    stroke(f"{c.name}_vA", s([(-0.55, 0.03), (-0.2, -0.03), (0.2, -0.03), (0.55, 0.03)]), 0.14, OUTLINE, g, 0.0)
    g = group("vB")  # K S T, most consonants: teeth together, lips a little apart
    shape(f"{c.name}_vB", s([(-0.5, 0.12, "s"), (0.5, 0.12, "s"), (0.42, -0.14), (0, -0.2), (-0.42, -0.14)]), inner, g, 0.0, ol=0.07)
    if teeth:
        shape(f"{c.name}_vB_t", s([(-0.4, 0.1, "s"), (0.4, 0.1, "s"), (0.36, -0.1, "s"), (-0.36, -0.1, "s")]), "#FFFFFF", g, 0.006, ol=0, smooth=0)
        stroke(f"{c.name}_vB_l", s([(-0.36, 0.0), (0.36, 0.0)]), 0.035, "#B8B0C0", g, 0.008)
    g = group("vC")  # EH AE: open
    shape(f"{c.name}_vC", s([(-0.6, 0.18, "s"), (0.6, 0.18, "s"), (0.45, -0.22), (0, -0.36), (-0.45, -0.22)]), inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_vC_tg", s(ell(0, -0.24, 0.3, 0.1)), tongue, g, 0.004, ol=0)
    if teeth:
        shape(f"{c.name}_vC_t", s([(-0.52, 0.16, "s"), (0.52, 0.16, "s"), (0.46, 0.05, "s"), (-0.46, 0.05, "s")]), "#FFFFFF", g, 0.006, ol=0, smooth=0)
    g = group("vD")  # AA: wide open
    shape(f"{c.name}_vD", s([(-0.7, 0.22, "s"), (0.7, 0.22, "s"), (0.5, -0.4), (0, -0.62), (-0.5, -0.4)]), inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_vD_tg", s(ell(0, -0.42, 0.36, 0.13)), tongue, g, 0.004, ol=0)
    if teeth:
        shape(f"{c.name}_vD_t", s([(-0.6, 0.2, "s"), (0.6, 0.2, "s"), (0.53, 0.07, "s"), (-0.53, 0.07, "s")]), "#FFFFFF", g, 0.006, ol=0, smooth=0)
    g = group("vE")  # AO ER: rounded
    shape(f"{c.name}_vE", s(ell(0, -0.1, 0.36, 0.38)), inner, g, 0.0, ol=0.08)
    shape(f"{c.name}_vE_tg", s(ell(0, -0.32, 0.22, 0.1)), tongue, g, 0.004, ol=0)
    g = group("vF")  # UW OW W: puckered
    shape(f"{c.name}_vF", s(ell(0, -0.05, 0.19, 0.23)), inner, g, 0.0, ol=0.1)
    g = group("vG")  # F V: top teeth on the lower lip
    shape(f"{c.name}_vG", s([(-0.48, 0.1, "s"), (0.48, 0.1, "s"), (0.4, -0.1), (-0.4, -0.1)]), inner, g, 0.0, ol=0.07)
    if teeth:
        shape(f"{c.name}_vG_t", s([(-0.34, 0.1, "s"), (0.34, 0.1, "s"), (0.3, -0.08, "s"), (-0.3, -0.08, "s")]), "#FFFFFF", g, 0.006, ol=0.03, smooth=0)
    g = group("vH")  # L: open, tongue up behind the teeth
    shape(f"{c.name}_vH", s([(-0.55, 0.16, "s"), (0.55, 0.16, "s"), (0.42, -0.22), (0, -0.34), (-0.42, -0.22)]), inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_vH_tg", s(ell(0, 0.0, 0.26, 0.13)), tongue, g, 0.004, ol=0)

    g = group("laugh")
    shape(f"{c.name}_laugh", s([(-0.95, 0.3, "s"), (0.95, 0.3, "s"), (0.6, -0.4), (0, -0.62), (-0.6, -0.4)]),
          inner, g, 0.0, ol=0.07)
    shape(f"{c.name}_laugh_t", s(ell(0, -0.4, 0.42, 0.17)), tongue, g, 0.004, ol=0)
    if teeth:
        shape(f"{c.name}_laugh_teeth", s([(-0.85, 0.27, "s"), (0.85, 0.27, "s"), (0.75, 0.1, "s"), (-0.75, 0.1, "s")]),
              "#FFFFFF", g, 0.008, ol=0, smooth=0)
    return m


def hoodie_torso(c, body, color, trim, w_bot=1.65, w_top=1.75, y0=3.05, y1=6.35, z=0.0):
    pts = mirror([(0, y0 - 0.05), (w_bot, y0, "s"), (w_bot + 0.12, y0 + 1.2), (w_top + 0.1, y1 - 0.9),
                  (w_top - 0.1, y1 - 0.25), (w_top - 0.6, y1 + 0.05), (0, y1 + 0.1)])
    t = shape(f"{c.name}_torso", pts, color, body, z)
    shape(f"{c.name}_hem", [(-w_bot + 0.05, y0 + 0.02, "s"), (w_bot - 0.05, y0 + 0.02, "s"),
                            (w_bot + 0.02, y0 + 0.38, "s"), (-w_bot - 0.02, y0 + 0.38, "s")], trim, body, z + 0.01, ol=0, smooth=0)
    return t


# ---------- Riot ----------

RIOT_FUR, RIOT_FUR_D, RIOT_CREAM, RIOT_EAR = "#FF6B00", "#D9530A", "#F7E6C8", "#A3122A"


def riot(costume="hoodie"):
    c = Character("riot")
    root = c.root
    body = empty("riot_body", root, (0, 0), 0.0)

    # tail (behind everything)
    tail = empty("riot_tail", body, (1.05, 3.35), -0.6)
    tpts = chaikin([(0, -0.35), (1.3, -0.75), (2.6, -0.45), (3.55, 0.45), (3.95, 1.75), (3.75, 2.95),
                    (3.25, 3.75, "s"), (3.0, 2.95), (2.6, 1.85), (2.05, 1.05), (1.1, 0.55), (0.0, 0.45)], 3)
    shape("riot_tail_fur", tpts, RIOT_FUR, tail, 0.0, smooth=0)
    shape("riot_tail_tip", cap(tpts, (3.0, 2.0), (0.25, 1.0), teeth=3, depth=0.5), RIOT_CREAM, tail, 0.01, ol=0, smooth=0)
    c.extras["tail"] = tail

    # legs + feet
    for s in (-1, 1):
        leg = empty(f"riot_leg{s}", body, (0.72 * s, 3.2), -0.1)
        shape(f"riot_leg{s}_f", [(-0.42, 0.2), (0.42, 0.2), (0.36, -2.6), (-0.36, -2.6)], RIOT_FUR, leg, 0.0)
        shape(f"riot_foot{s}", ell(0.25 * s, -2.85, 0.78, 0.4), RIOT_FUR, leg, 0.02)
        for k in (-0.2, 0.15):
            stroke(f"riot_toe{s}{k}", [(0.25 * s + k + 0.2 * s, -2.65), (0.25 * s + k + 0.22 * s, -2.95)], 0.05, OUTLINE, leg, 0.03)
        c.legs[s] = leg

    shape("riot_belly", ell(0, 3.15, 1.25, 0.6), RIOT_CREAM, body, -0.05)

    # costume torso
    if costume == "mafia":
        suit, stripe = "#2B2B33", "#555563"
        hoodie_torso(c, body, suit, suit)
        for x in (-1.2, -0.75, 0.75, 1.2):
            stroke(f"riot_pin{x}", [(x, 3.2), (x * 1.04, 6.0)], 0.035, stripe, body, 0.02)
        shape("riot_shirt", [(-0.55, 6.4, "s"), (0.55, 6.4, "s"), (0.0, 4.5, "s")], "#FFFFFF", body, 0.03, ol=0.05, smooth=0)
        shape("riot_tie", [(-0.17, 6.3, "s"), (0.17, 6.3, "s"), (0.22, 5.0), (0.0, 4.7, "s"), (-0.22, 5.0)], RED, body, 0.05, ol=0.04, smooth=1)
        for s in (-1, 1):
            shape(f"riot_lapel{s}", mx([(0.55, 6.45, "s"), (1.1, 6.3, "s"), (0.75, 5.5, "s"), (0.95, 5.3, "s"), (0.05, 4.4, "s")], s),
                  "#1F1F25", body, 0.04, ol=0.05, smooth=0)
        for y in (4.0, 3.55):
            shape(f"riot_btn{y}", ell(0.12, y, 0.08, 0.08, n=12), "#111111", body, 0.04, ol=0)
        sleeve, cuff = suit, "#FFFFFF"
    elif costume == "host":
        blazer, lapel = "#6A3FD0", "#4E2AA3"
        hoodie_torso(c, body, blazer, blazer)
        shape("riot_shirt", [(-0.55, 6.4, "s"), (0.55, 6.4, "s"), (0.0, 4.6, "s")], "#FFFFFF", body, 0.03, ol=0.05, smooth=0)
        for s in (-1, 1):
            shape(f"riot_lapel{s}", mx([(0.55, 6.45, "s"), (1.15, 6.3, "s"), (0.8, 5.5, "s"), (1.0, 5.3, "s"), (0.05, 4.5, "s")], s),
                  lapel, body, 0.04, ol=0.05, smooth=0)
            shape(f"riot_bow{s}", mx([(0.05, 6.2, "s"), (0.6, 6.45, "s"), (0.6, 5.85, "s")], s), RED, body, 0.06, ol=0.05, smooth=0)
        shape("riot_bow_knot", ell(0, 6.15, 0.16, 0.18), "#B30F1F", body, 0.07, ol=0.04)
        for y in (4.1, 3.6):
            shape(f"riot_btn{y}", ell(0.15, y, 0.11, 0.11, n=12), YELLOW, body, 0.04, ol=0.03)
        for i, (x, y) in enumerate(((-1.15, 4.6), (1.2, 5.1), (-0.9, 3.7), (1.05, 3.9))):
            shape(f"riot_sparkle{i}", [(x + math.cos(math.pi * k / 4) * (0.22 if k % 2 == 0 else 0.07),
                                        y + math.sin(math.pi * k / 4) * (0.22 if k % 2 == 0 else 0.07), "s") for k in range(8)],
                  YELLOW, body, 0.035, ol=0, smooth=0)
        sleeve, cuff = blazer, "#FFFFFF"
    elif costume == "lifeguard":  # Porchlight: the lake lifeguard (red tank top, bare arms, red shorts)
        tank = "#D7262E"
        hoodie_torso(c, body, tank, "#FFFFFF")
        shape("riot_chest", [(-0.75, 6.42, "s"), (0.75, 6.42, "s"), (0.0, 5.3, "s")], RIOT_CREAM, body, 0.03, ol=0.05, smooth=1)
        for s in (-1, 1):  # bare shoulders through the armholes
            shape(f"riot_shoulder{s}", mx([(1.0, 6.3), (1.8, 6.15), (1.95, 5.5), (1.55, 5.2)], s), RIOT_FUR, body, 0.02, ol=0.05)
        shape("riot_shorts", mirror([(0, 2.45, "s"), (1.6, 2.3, "s"), (1.7, 3.25, "s"), (0, 3.3)]), tank, body, -0.04)
        stroke("riot_shorts_split", [(0, 2.45), (0, 2.95)], 0.06, OUTLINE, body, -0.035)
        sleeve, cuff = RIOT_FUR, RIOT_FUR
    else:
        hoodie_torso(c, body, CHARCOAL, ORANGE)
        stroke("riot_zip", [(0, 3.45), (0, 6.3)], 0.07, ORANGE, body, 0.02)
        for s in (-1, 1):
            stroke(f"riot_pipe{s}", mx([(1.55, 3.5), (1.5, 5.0), (1.2, 6.25)], s), 0.07, ORANGE, body, 0.02)
            stroke(f"riot_pocket{s}", mx([(0.45, 4.25), (0.85, 3.75)], s), 0.06, ORANGE, body, 0.02)
        shape("riot_hood", mirror([(0, 6.1), (1.0, 6.05), (1.75, 6.45), (1.5, 6.95), (0, 7.0)]), CHARCOAL, body, -0.2)
        for s in (-1, 1):
            stroke(f"riot_string{s}", [(0.32 * s, 6.25), (0.38 * s, 5.4)], 0.07, ORANGE, body, 0.03)
        sleeve, cuff = CHARCOAL, ORANGE

    # arms
    for s in (-1, 1):
        build_arm(c, s, body, (1.6 * s, 6.0), sleeve, cuff, RIOT_FUR, pipe=None if costume in ("mafia", "host", "lifeguard") else ORANGE)

    # head
    head = empty("riot_head", body, (0, 6.15), 0.4)
    c.extras["head"] = head
    for s in (-1, 1):
        px, py = 1.3 * s, 2.6  # pivot at the ear base so ears can flick and spring
        ear = empty(f"riot_ear{s}", head, (px, py), -0.1)
        local = lambda pts: move(mx(pts, s), -px, -py)
        shape(f"riot_ear{s}_fur", local([(0.4, 2.7), (1.05, 4.4), (2.25, 5.65, "s"), (2.3, 4.2), (2.15, 2.3)]), RIOT_FUR, ear, 0.0)
        shape(f"riot_ear{s}_in", local([(0.85, 3.05), (1.4, 4.3), (2.15, 5.05, "s"), (2.0, 3.8), (1.85, 2.7)]), RIOT_EAR, ear, 0.005, ol=0)
        shape(f"riot_ear{s}_tuft", local([(0.95, 2.8), (1.05, 3.3), (1.3, 3.75, "s"), (1.35, 3.25), (1.6, 3.55, "s"),
                                          (1.7, 3.0), (1.92, 2.75)]), RIOT_CREAM, ear, 0.01, ol=0, smooth=2)
        c.extras[f"ear{s}"] = ear

    shape("riot_face", mirror([(0, -0.3, "s"), (0.5, -0.15), (1.05, 0.12), (1.6, 0.35), (2.45, 0.42, "s"),
                               (1.95, 0.75), (2.6, 1.0, "s"), (2.0, 1.25), (2.05, 1.8), (1.85, 2.45), (1.4, 2.95),
                               (0.8, 3.25), (0.3, 3.35), (0, 3.62, "s")]), RIOT_FUR, head, 0.0)
    shape("riot_muzzle", mirror([(0, -0.16, "s"), (0.5, -0.02), (1.0, 0.22), (1.55, 0.42), (2.3, 0.5, "s"),
                                 (1.85, 0.78), (2.45, 1.02, "s"), (1.9, 1.14), (1.35, 1.2), (0.78, 1.38), (0.4, 1.75), (0, 1.85)]),
          RIOT_CREAM, head, 0.01, ol=0)
    for s in (-1, 1):
        shape(f"riot_mark{s}", ell(0.55 * s, 2.95, 0.12, 0.07, rot=rad(-25) * s), RIOT_CREAM, head, 0.012, ol=0)
        shape(f"riot_mask{s}", mx([(0.3, 1.85), (0.65, 1.48), (1.35, 1.46), (1.85, 1.8), (2.25, 2.65, "s"),
                                   (1.5, 2.55), (0.75, 2.4), (0.35, 2.15)], s), YELLOW, head, 0.015, ol=0.04)
        add_eye(c, head, s, (1.05 * s, 1.93), 0.42, 0.3, 0.03, tilt=8, pupil_r=0.2)
        add_brow(c, head, s, (1.15 * s, 2.62), [(-0.7, -0.12), (0.0, 0.0), (0.72, 0.22)], 0.24, 0.09, 0.05)

    shape("riot_nose", [(-0.34, 1.62), (0.34, 1.62), (0.28, 1.36), (0, 1.16, "s"), (-0.28, 1.36)], OUTLINE, head, 0.06, ol=0)
    shape("riot_nose_s", ell(-0.12, 1.5, 0.09, 0.05, n=12), "#FFFFFF", head, 0.065, ol=0)
    stroke("riot_philtrum", [(0, 1.18), (0, 0.98)], 0.07, OUTLINE, head, 0.06)
    add_mouths(c, head, (0.05, 0.72), 0.06, w=0.95)

    if costume == "mafia":
        hat = empty("riot_hat", head, (0, 3.05), 0.3)
        shape("riot_hat_crown", [(-1.35, 0.15, "s"), (1.35, 0.15, "s"), (1.2, 1.55), (0.6, 1.85), (0.0, 1.6, "s"),
                                 (-0.6, 1.85), (-1.2, 1.55)], "#1A1A1A", hat, 0.0)
        shape("riot_hat_band", rect(-1.36, 0.15, 1.36, 0.6), "#3C3C44", hat, 0.01, ol=0)
        shape("riot_hat_brim", [(-2.6, 0.0), (-1.6, 0.35), (1.6, 0.35), (2.6, 0.0), (2.5, -0.25), (0, -0.05), (-2.5, -0.25)],
              "#1A1A1A", hat, 0.02)
        c.extras["hat"] = hat
        g = empty("riot_glasses", head, (0, 1.98), 0.08)
        for s in (-1, 1):
            shape(f"riot_lens{s}", ell(1.05 * s, 0, 0.55, 0.48), "#1A1A1A", g, 0.0, ol=0.07)
            stroke(f"riot_lens{s}_shine", [(1.05 * s - 0.3, 0.15), (1.05 * s - 0.05, 0.3)], 0.08, "#8A8A99", g, 0.01)
        stroke("riot_bridge", [(-0.5, 0.12), (0, 0.22), (0.5, 0.12)], 0.09, OUTLINE, g, 0.0)
        c.extras["glasses"] = g


    if costume == "dare":  # Truth or Dare: little devil horns, mischief
        for s in (-1, 1):
            shape(f"riot_horn{s}", mx([(0.35, 3.05), (0.95, 3.15), (1.2, 3.75), (1.05, 4.45, "s"), (0.8, 3.75), (0.45, 3.45)], s),
                  RED, head, 0.02)
            stroke(f"riot_horn{s}_shine", mx([(0.85, 3.4), (0.98, 3.85)], s), 0.07, "#FF7A86", head, 0.03)
        c.extras["horns"] = head

    if costume in ("coach", "lifeguard"):  # Alias: visor, whistle, clipboard; the lifeguard gets visor + whistle
        vis = empty("riot_visor", head, (0, 0), 0.2)
        shape("riot_visor_band", [(-2.05, 2.95), (-1.2, 3.25), (1.2, 3.25), (2.05, 2.95), (2.0, 2.68), (1.2, 2.95), (-1.2, 2.95), (-2.0, 2.68)],
              "#24345E", vis, 0.0, smooth=1)
        shape("riot_visor_brim", [(-1.75, 2.9), (1.75, 2.9), (1.45, 2.5), (0, 2.38), (-1.45, 2.5)], "#2F4A8A", vis, 0.01)
        stroke("riot_visor_stripe", [(-1.5, 2.8), (0, 2.6), (1.5, 2.8)], 0.08, ORANGE, vis, 0.02)
        c.extras["visor"] = vis
        stroke("riot_lanyard", [(-0.62, 6.35), (-0.25, 5.6), (0, 5.35), (0.25, 5.6), (0.62, 6.35)], 0.07, ORANGE, body, 0.05)
        shape("riot_whistle", [(-0.42, 5.3, "s"), (0.1, 5.3, "s"), (0.3, 5.1), (0.1, 4.85, "s"), (-0.42, 4.85, "s")], "#C9CED8", body, 0.06, ol=0.05, smooth=1)
        shape("riot_whistle_hole", ell(-0.15, 5.08, 0.08, 0.08, n=10), OUTLINE, body, 0.07, ol=0)
        if costume == "lifeguard":  # a glint on the metal, so it reads as shiny in the sun
            shape("riot_whistle_glint", [(0.02 + 0.13 * math.cos(math.pi * k / 4) * (1 if k % 2 == 0 else 0.3),
                                          5.2 + 0.13 * math.sin(math.pi * k / 4) * (1 if k % 2 == 0 else 0.3), "s") for k in range(8)],
                  "#FFFFFF", body, 0.075, ol=0, smooth=0)
    if costume == "coach":
        clip = empty("riot_clipboard", c.extras["hand-1"], (0.35, 0.05), -0.02)
        shape("riot_board", rect(-0.95, -1.25, 0.95, 1.25), "#B07548", clip, 0.0, smooth=0)
        shape("riot_paper", rect(-0.75, -1.05, 0.75, 0.95), "#FFFFFF", clip, 0.01, ol=0, smooth=0)
        for i in range(4):
            stroke(f"riot_line{i}", [(-0.55, 0.55 - i * 0.38), (0.5, 0.55 - i * 0.38)], 0.05, "#9AA3B5", clip, 0.02)
        shape("riot_clip", rect(-0.35, 0.95, 0.35, 1.35), "#C9CED8", clip, 0.02, ol=0.04, smooth=0)
        c.extras["clipboard"] = clip

    if costume == "host":  # Trivia: mic in the right paw
        mic = empty("riot_mic", c.extras["hand1"], (-0.05, -0.3), 0.03)
        shape("riot_mic_handle", [(-0.13, -0.4, "s"), (0.13, -0.4, "s"), (0.17, 0.9, "s"), (-0.17, 0.9, "s")], OUTLINE, mic, 0.0, smooth=0)
        shape("riot_mic_head", ell(0, 1.2, 0.36, 0.36), "#C9CED8", mic, 0.01)
        stroke("riot_mic_band", [(-0.2, 0.92), (0.2, 0.92)], 0.12, RED, mic, 0.02)
        c.extras["mic"] = mic

    c.pose("mic" if costume == "host" else "idle")
    if costume == "host":
        c.extras["mic"].rotation_euler.z = -(c.arms[1].rotation_euler.z + c.elbows[1].rotation_euler.z)  # keep the mic upright
    c.expr({"mafia": "cocky", "dare": "cocky"}.get(costume, "hype"))
    c.palette = [("Fur", RIOT_FUR), ("Cream", RIOT_CREAM), ("Eye mask", YELLOW), ("Inner ear", RIOT_EAR),
                 ("Hoodie", CHARCOAL), ("Outline", OUTLINE)]
    cel(c)
    return c


# ---------- friends ----------

def friend_body(c, fur, hoodie, trim, wb=1.65, wt=1.75, head_y=6.15, string="#FFFFFF"):
    """Shared hoodie body for the friends. Returns (body, head) empties."""
    n = c.name
    body = empty(f"{n}_body", c.root, (0, 0), 0.0)
    for s in (-1, 1):
        leg = empty(f"{n}_leg{s}", body, (0.72 * s, 3.2), -0.1)
        shape(f"{n}_leg{s}_f", [(-0.45, 0.2), (0.45, 0.2), (0.4, -2.6), (-0.4, -2.6)], fur, leg, 0.0)
        shape(f"{n}_foot{s}", ell(0.2 * s, -2.85, 0.72, 0.38), fur, leg, 0.02)
        c.legs[s] = leg
    hoodie_torso(c, body, hoodie, trim, w_bot=wb, w_top=wt)
    stroke(f"{n}_zip", [(0, 3.45), (0, 6.3)], 0.06, trim, body, 0.02)
    shape(f"{n}_pocket", [(-0.95, 3.5), (0.95, 3.5), (0.75, 4.5), (-0.75, 4.5)], hoodie, body, 0.015, ol=0.05)
    shape(f"{n}_hood", mirror([(0, 6.1), (1.0, 6.05), (wt, 6.45), (wt - 0.25, 6.95), (0, 7.0)]), hoodie, body, -0.2)
    for s in (-1, 1):
        stroke(f"{n}_string{s}", [(0.32 * s, 6.25), (0.38 * s, 5.4)], 0.07, string, body, 0.03)
    for s in (-1, 1):
        build_arm(c, s, body, ((wt - 0.12) * s, 6.0), hoodie, trim, fur)
        c.arm(s, 10, elbow=8)
    head = empty(f"{n}_head", body, (0, head_y), 0.4)
    c.extras["head"] = head
    return body, head


def bear():
    """Bash — the loud one. Accuses everybody, first to get voted out."""
    FUR, MUZ, IN = "#8A5A3B", "#E2BF94", "#C98E6A"
    c = Character("bash")
    body, head = friend_body(c, FUR, RED, "#B30F1F", wb=1.85, wt=1.95)
    for s in (-1, 1):
        ear = empty(f"bash_ear{s}", head, (1.35 * s, 2.75), -0.05)
        shape(f"bash_ear{s}_f", ell(0.2 * s, 0.3, 0.72, 0.68), FUR, ear, 0.0)
        shape(f"bash_ear{s}_in", ell(0.2 * s, 0.25, 0.4, 0.38), IN, ear, 0.01, ol=0)
        c.extras[f"ear{s}"] = ear
    shape("bash_face", mirror([(0, -0.15), (1.0, 0.0), (1.8, 0.55), (2.25, 1.45), (2.1, 2.45), (1.45, 3.15), (0, 3.4)]), FUR, head, 0.0)
    shape("bash_muzzle", ell(0, 0.72, 1.12, 0.72), MUZ, head, 0.01, ol=0)
    for s in (-1, 1):
        add_eye(c, head, s, (0.85 * s, 1.95), 0.3, 0.34, 0.03)
        add_brow(c, head, s, (0.85 * s, 2.5), [(-0.45, -0.05), (0.0, 0.05), (0.45, 0.05)], 0.26, 0.2, 0.05)
    shape("bash_nose", ell(0, 1.2, 0.42, 0.28), OUTLINE, head, 0.06, ol=0)
    shape("bash_nose_s", ell(-0.15, 1.3, 0.12, 0.06, n=12), "#FFFFFF", head, 0.065, ol=0)
    add_mouths(c, head, (0, 0.52), 0.06, w=0.85)
    c.expr("happy")
    c.palette = [("Fur", FUR), ("Muzzle", MUZ), ("Inner ear", IN), ("Hoodie", RED), ("Trim", "#B30F1F"), ("Outline", OUTLINE)]
    cel(c)
    return c


def bunny():
    """Pip — the nervous one. Sweats through every round, totally innocent."""
    FUR, IN, MUZ = "#EEE8F2", "#F6A6BF", "#FFFFFF"
    c = Character("pip")
    body, head = friend_body(c, FUR, "#3D6DFF", "#2246B8", wb=1.5, wt=1.6)
    shape("pip_tail", ell(1.6, 3.4, 0.55, 0.5), "#FFFFFF", body, -0.5)
    ears = {}
    for s in (-1, 1):
        ear = empty(f"pip_ear{s}", head, (0.65 * s, 2.7), -0.05)
        shape(f"pip_ear{s}_f", [(-0.5, 0.0), (0.5, 0.0), (0.55, 1.8), (0.3, 3.1), (0.0, 3.35), (-0.3, 3.1), (-0.55, 1.8)], FUR, ear, 0.0)
        shape(f"pip_ear{s}_in", [(-0.24, 0.3), (0.24, 0.3), (0.26, 1.8), (0.12, 2.8), (0.0, 2.95), (-0.12, 2.8), (-0.26, 1.8)], IN, ear, 0.005, ol=0)
        ear.rotation_euler.z = rad(-10) * s
        ears[s] = ear
        c.extras[f"ear{s}"] = ear
    ears[1].rotation_euler.z = rad(-48)  # one floppy ear
    shape("pip_face", mirror([(0, -0.1), (0.9, 0.05), (1.6, 0.6), (1.85, 1.45), (1.65, 2.35), (1.0, 2.95), (0, 3.1)]), FUR, head, 0.0)
    for s in (-1, 1):
        shape(f"pip_cheek{s}", ell(0.55 * s, 0.75, 0.72, 0.55), MUZ, head, 0.01, ol=0)
        shape(f"pip_blush{s}", ell(1.25 * s, 1.15, 0.28, 0.14), "#F7B8CB", head, 0.012, ol=0)
        add_eye(c, head, s, (0.72 * s, 1.85), 0.4, 0.46, 0.03, lid=False)
        add_brow(c, head, s, (0.72 * s, 2.55), [(-0.3, 0.0), (0.3, 0.0)], 0.17, 0.17, 0.05)
    shape("pip_nose", [(-0.2, 1.3), (0.2, 1.3), (0, 1.1, "s")], "#F07A9B", head, 0.06, ol=0.04, smooth=1)
    add_mouths(c, head, (0, 0.82), 0.06, w=0.6)
    for k, g in c.mouths.items():  # buck teeth hang from the top lip of whichever mouth is showing
        if k == "grit":
            continue
        if k in ("vA", "vF"):  # lips pressed / puckered: teeth hidden
            continue
        top = {"grin": 0.1, "yell": 0.17, "laugh": 0.17, "shock": 0.2, "vB": 0.07, "vC": 0.11, "vD": 0.13,
               "vE": 0.17, "vG": 0.07, "vH": 0.1}.get(k, 0.02)
        is_open = k in ("grin", "yell", "laugh", "shock") or k.startswith("v")
        shape(f"pip_teeth_{k}", [(-0.21, top, "s"), (0.21, top, "s"), (0.21, top - 0.32, "s"), (-0.21, top - 0.32, "s")],
              "#FFFFFF", g, 0.02 if is_open else -0.01, ol=0.04, smooth=1)
        stroke(f"pip_teeth_{k}_l", [(0, top - 0.02), (0, top - 0.29)], 0.035, OUTLINE, g, 0.03)
    sweat = empty("pip_sweat", head, (0, 0), 0.1)
    for i, (x, y, r) in enumerate(((1.95, 2.6, 0.22), (-2.0, 2.1, 0.17), (2.15, 1.75, 0.14))):
        shape(f"pip_drop{i}", [(x, y + r * 1.9, "s"), (x + r, y), (x, y - r), (x - r, y)], "#7FD3FF", sweat, 0.0, ol=0.04)
    c.extras["sweat"] = sweat
    c.expr("nervous")
    c.palette = [("Fur", FUR), ("Inner ear", IN), ("Blush", "#F7B8CB"), ("Nose", "#F07A9B"), ("Hoodie", "#3D6DFF"), ("Sweat", "#7FD3FF")]
    cel(c)
    return c


def raccoon():
    """Rocco — the snacker. Never stops eating, never notices anything."""
    FUR, DARK, WHITE = "#8D8F9C", "#34343E", "#F4F2F6"
    c = Character("rocco")
    body, head = friend_body(c, FUR, "#22B573", "#178752", wb=1.75, wt=1.8)
    tail = empty("rocco_tail", body, (1.2, 3.4), -0.6)
    tp = chaikin([(0, -0.3), (1.2, -0.4), (2.3, 0.2), (2.9, 1.2), (3.0, 2.3), (2.55, 2.9), (2.25, 2.2),
                  (2.0, 1.3), (1.2, 0.5), (0, 0.35)], 3)
    shape("rocco_tail_f", tp, FUR, tail, 0.0, smooth=0)
    for i, (p, n) in enumerate((((1.1, 0), (1, 0)), ((2.3, 0.6), (0.7, 0.7)), ((2.85, 1.7), (0.1, 1.0)))):
        band = cap(cap(tp, p, n), (p[0] + n[0] * 0.45, p[1] + n[1] * 0.45), (-n[0], -n[1]))
        shape(f"rocco_stripe{i}", band, DARK, tail, 0.01, ol=0, smooth=0)
    shape("rocco_tail_tip", cap(tp, (2.7, 2.35), (0.0, 1.0)), DARK, tail, 0.01, ol=0, smooth=0)
    c.extras["tail"] = tail
    for s in (-1, 1):
        px, py = 1.5 * s, 2.6
        ear = empty(f"rocco_ear{s}", head, (px, py), -0.05)
        shape(f"rocco_ear{s}_f", move(mx([(0.9, 2.6), (1.25, 3.85, "s"), (2.05, 3.3), (2.0, 2.4)], s), -px, -py), FUR, ear, 0.0)
        shape(f"rocco_ear{s}_in", move(mx([(1.15, 2.85), (1.35, 3.5, "s"), (1.8, 3.15), (1.8, 2.6)], s), -px, -py), DARK, ear, 0.01, ol=0)
        c.extras[f"ear{s}"] = ear
    shape("rocco_face", mirror([(0, -0.2, "s"), (0.6, -0.05), (1.3, 0.3), (2.2, 0.55, "s"), (1.8, 0.85), (2.35, 1.2, "s"),
                                (1.95, 1.45), (2.0, 2.3), (1.5, 2.95), (0.6, 3.25), (0, 3.3)]), FUR, head, 0.0)
    shape("rocco_brows_patch", mirror([(0, 2.1), (0.6, 2.35), (1.5, 2.45), (1.6, 2.8), (0.8, 2.95), (0, 2.9)]), WHITE, head, 0.008, ol=0)
    shape("rocco_mask", mirror([(0, 1.55), (0.55, 1.45), (1.3, 1.35), (2.15, 1.5, "s"), (1.75, 2.35), (1.0, 2.42), (0.4, 2.2), (0, 2.1)]),
          DARK, head, 0.01, ol=0)
    shape("rocco_muzzle", mirror([(0, -0.08, "s"), (0.6, 0.05), (1.15, 0.35), (1.3, 0.85), (0.8, 1.4), (0.35, 1.5), (0, 1.48)]),
          WHITE, head, 0.012, ol=0)
    for s in (-1, 1):
        add_eye(c, head, s, (0.95 * s, 1.92), 0.33, 0.3, 0.03, lid=False)
        add_brow(c, head, s, (0.95 * s, 2.62), [(-0.35, 0.0), (0.35, 0.02)], 0.15, 0.12, 0.05)
    shape("rocco_nose", ell(0, 1.3, 0.32, 0.2), OUTLINE, head, 0.06, ol=0)
    add_mouths(c, head, (0, 0.62), 0.06, w=0.7)
    # chip bag in the left paw
    bag = empty("rocco_chips", c.extras["hand-1"], (-0.1, -0.1), 0.05)
    shape("rocco_bag", [(-0.75, -0.9, "s"), (0.75, -0.9, "s"), (0.85, 0.6), (0.6, 0.85, "s"), (0.35, 0.65, "s"), (0.1, 0.9, "s"),
                        (-0.15, 0.65, "s"), (-0.4, 0.9, "s"), (-0.65, 0.65, "s"), (-0.85, 0.6)], RED, bag, 0.0, smooth=1)
    shape("rocco_bag_star", [(math.cos(rad(90 + 36 * i)) * (0.38 if i % 2 == 0 else 0.17),
                              -0.05 + math.sin(rad(90 + 36 * i)) * (0.38 if i % 2 == 0 else 0.17), "s") for i in range(10)],
          YELLOW, bag, 0.01, ol=0.03, smooth=0)
    c.extras["chips"] = bag
    c.expr("happy")
    c.palette = [("Fur", FUR), ("Mask", DARK), ("White", WHITE), ("Hoodie", "#22B573"), ("Trim", "#178752"), ("Chip bag", RED)]
    cel(c)
    return c
