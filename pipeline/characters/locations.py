# Friendzy sets. Each builder draws a 9:16 location and returns a Location with seat anchors.
# Layering (z): background < -1, characters around 0..6, foreground props >= 10, so seated
# characters slot between the seat back and the seat front.
#
#   loc = locations.living_room("night")
#   loc.seat(cast.riot(), 2)       # sit Riot on the third seat
#   camera(sc, *loc.cam)           # default framing (x, y, ortho)
import json, os, random, re
from toon import *

W = 9.0  # half width of every set (camera frame is ~6.75 half-wide at the default zoom)


class Location:
    def __init__(self, name):
        self.name = name
        self.root = empty(name)
        self.seats = []   # (x, hip_y, scale, z)
        self.cam = (0.6, 9.5, 25)  # nudged left of TikTok's right-hand buttons (see refs/loc_*_guide.png)
        self.parallax = []  # (layer empty, factor): 1 = moves with the world, 0.3 = far away (CamAnim uses it)
        self.extras = {}
        LIVE.append(self)  # ambient() animates every set built in this scene

    def seat(self, c, i):
        x, hip, s, z = self.seats[i]
        c.root.location = (x, hip - 3.2 * s, z)
        c.root.scale = (s, s, 1)
        self.cast = getattr(self, "cast", []) + [c]
        return c


LIVE = []
PARALLAX_FRONTS = False  # episodes with "act": foreground front pieces get depth parallax
PARALLAX_LAYERS = False  # episodes with "act": painted sets with depth layers (tools/depth_layers.py) use them
CAST_LIGHT_MAX = 1.0  # cap on a set's light on the cast (episodes with "act" keep night faces readable: 0.35)


# ---------- ambient light: the set lights the cast, and that light is alive ----------

def _wobble(fr, seed, speed=1.0):
    """Smooth pseudo-random -1..1 (sum of incommensurate sines)."""
    rnd = random.Random(seed)
    return sum(math.sin(fr * w * speed + rnd.uniform(0, 6.28)) for w in (0.9, 1.7, 2.9)) / 2.2


def pulse(name, f0, f1, fn):
    """Animate the opacity of every translucent overlay under the object called `name` (glows, beams):
    alpha = base alpha * fn(frame). The overlays get their own materials so nothing else changes."""
    root = bpy.data.objects.get(name)
    if root is None:
        return
    mats = {}
    for o in [root] + list(root.children_recursive):
        if o.type == "MESH" and o.material_slots and o.material_slots[0].material:
            m = o.material_slots[0].material
            if m.diffuse_color[3] < 1:
                mats.setdefault(m.name, m.copy())
                o.material_slots[0].material = mats[m.name]
    for m in mats.values():
        a0 = m.diffuse_color[3]
        for fr in range(f0, f1 + 1):
            m.diffuse_color[3] = max(0.0, min(1.0, a0 * fn(fr)))
            m.keyframe_insert("diffuse_color", index=3, frame=fr)


def sway(name, f0, f1, dx, speed, phase=0.0):
    o = bpy.data.objects.get(name)
    if o is None:
        return
    x0 = o.location.x
    for fr in range(f0, f1 + 1):
        o.location.x = x0 + dx * math.sin(fr * speed + phase)
        o.keyframe_insert("location", index=0, frame=fr)


def embers(prefix, f0, f1, rise=3.2, life=46):
    """Sparks drift up from the fire, sway, shrink and start again (staggered, so there's always one rising)."""
    for i in range(12):
        o = bpy.data.objects.get(f"{prefix}{i}")
        if o is None:
            break
        p0 = Vector(o.location)
        off = (i * 17) % life
        for fr in range(f0, f1 + 1):
            t = ((fr + off) % life) / life
            o.location = p0 + Vector((0.35 * math.sin(fr * 0.15 + i), rise * t - 1.2, 0))
            s = max(0.0001, math.sin(math.pi * t) * 1.3)
            o.scale = (s, s, 1)
            o.keyframe_insert("location", frame=fr)
            o.keyframe_insert("scale", frame=fr)


FOREGROUND = {  # dark, out-of-focus shapes in the bottom corners, nearer than the cast: (kind, side)
    "campfire": (("grass", -1), ("grass", 1)), "living_room_day": (("plant", -1),), "living_room_night": (("plant", -1),),
    "party_room": (("balloon", 1),), "village_night": (("grass", 1),), "game_show": (), "car": (),
}


def foreground(L):
    """Build the set's foreground pieces at the bottom corners of its default framing. They are drawn soft and
    dark (out of focus) and returned as a parallax layer that moves faster than the set when the camera moves."""
    if getattr(L, "cam_h", None):  # widened for 16:9: the default framing is the horizontal one
        cx, cy, o = L.cam_h
        w, h = o * 16 / 9 / 2, o / 2
    else:
        cx, cy, o = L.cam
        w, h = o * 1080 / 1920 / 2, o / 2
    g = empty(f"{L.name}_fg", L.root, (0, 0), 25)
    col = "#0B0B14"
    for i, (kind, s) in enumerate(FOREGROUND.get(L.name, ())):
        x, y = cx + s * (w - 0.6), cy - h + 0.2
        p = empty(f"{L.name}_fg{i}", g, (x, y), 0.0)
        if kind == "grass":
            for j in range(7):
                bx = -s * 0.5 * j
                ht = 2.2 + 1.4 * ((j * 37) % 5) / 4
                shape(f"{L.name}_fg{i}_b{j}", [(bx - 0.35, -0.5, "s"), (bx + 0.35, -0.5, "s"), (bx - s * 0.6 + 0.1 * j, ht, "s")],
                      col, p, 0.001 * j, ol=0, smooth=1)
        elif kind == "plant":
            for j, ang in enumerate((60, 80, 100, 120, 140)):
                a = rad(ang - (0 if s < 0 else 90))
                tip = (math.cos(a) * 3.2 * -s, math.sin(a) * 3.2)
                shape(f"{L.name}_fg{i}_l{j}", [(0, -0.4), (tip[0] * 0.5 - 0.5, tip[1] * 0.5), tip, (tip[0] * 0.5 + 0.5, tip[1] * 0.5 + 0.3)],
                      "#10301C", p, 0.001 * j, ol=0, smooth=2)
        elif kind == "balloon":
            shape(f"{L.name}_fg{i}_b", ell(-0.6 * s, 1.0, 1.5, 1.85), "#5A0F3A", p, 0.0, ol=0)
            shape(f"{L.name}_fg{i}_k", [(-0.75 * s, -0.9), (-0.45 * s, -0.9), (-0.6 * s, -0.6)], "#5A0F3A", p, 0.0, ol=0, smooth=0)
    return g


def ambient(f0, f1):
    """Bring every set built in this scene to life over [f0, f1]. Called by motion.CamAnim.bake, so every
    template gets it; runs once per set. Adds wall shadows behind the cast on sets with a wall behind them,
    and returns the new foreground parallax layers [(layer, factor)] for the camera."""
    import cast
    fg = []
    for L in LIVE:
        if getattr(L, "_ambient", False):
            continue
        L._ambient = True
        n = L.name
        if n.startswith("living_room") or n == "party_room":
            for c in getattr(L, "cast", ()):
                cast.wall_shadow(c)
        elif CRAFT and n not in PLATE_SETS:  # a soft shadow from each character onto whoever sits behind or beside them
            for c in getattr(L, "cast", ()):
                cast.wall_shadow(c, 0.16)
        if n in PLATE_SETS:  # painted sets: a living set, soft contact shadows, the set's light on the cast
            plate_life(L, f0, f1)
            for c in getattr(L, "cast", ()):
                if getattr(L, "life", {}).get("wall_shadow"):  # a wall close behind them: soft shadows on it
                    cast.wall_shadow(c, L.life["wall_shadow"])
                if c.extras.get("spot_kind", "stand") == "stand":  # sitters are on furniture, not the floor
                    ground_shadow(c, *PLATE_SETS[n].get("shadow", (0.1, 1.0, 0.0)))
                else:  # sitting: the cushion dips under them (a soft dark hollow around the hips)
                    g = empty(f"{c.name}_dip", c.root, (0, 3.0), -0.9)
                    for i in range(6):
                        k = 1 - i / 6
                        light(f"{c.name}_dip{i}", ell(0, 0, 2.3 * k, 0.55 * k, n=40), "#2A1408", 0.07, g, i * 1e-3)
                if c.extras.get("silhouette"):  # a silhouette against the sky takes no light from the set
                    continue
                col_, amt_ = PLATE_SETS[n].get("cast", ("#FFFFFF", 0.0))
                light_cast(c, col_, min(amt_, CAST_LIGHT_MAX))
                if c.extras.get("spot_depth"):  # air between us and them: further back = a touch lighter and bluer
                    light_cast(c, PLATE_SETS[n].get("haze", "#CFE0F2"), 0.0025 * c.extras["spot_depth"])
                x = c.root.location.x - L.root.location.x
                for lx, ly, col, radius, strength in getattr(L, "lamps", ()):  # warm light from nearby lamps
                    d = math.hypot(x - lx, (c.root.location.y + 4.0 * c.root.scale.y) - ly)
                    if d < radius:
                        light_cast(c, col, strength * (1 - d / radius))
        if FOREGROUND.get(n) and not getattr(L, "cam_h", None):  # vertical only: 16:9 frames the cast down to the bottom edge
            fg.append((foreground(L), 1.35))
        if n == "campfire":  # firelight flickers over the cast; embers rise
            pulse("cf_fireglow", f0, f1, lambda fr: 1 + 0.55 * _wobble(fr, 1, 1.6))
            pulse("cf_firecore", f0, f1, lambda fr: 1 + 0.4 * _wobble(fr, 2, 2.1))
            embers("cf_spark", f0, f1)
        elif n.startswith("living_room"):  # the lamp breathes; the window light drifts like passing clouds
            pulse("lr_lampglow", f0, f1, lambda fr: 1 + 0.15 * _wobble(fr, 3, 0.25))
            pulse("lr_beam", f0, f1, lambda fr: 1 + 0.25 * _wobble(fr, 4, 0.12))
        elif n == "village_night":  # the street lamp buzzes and now and then dips
            pulse("vn_lampglow", f0, f1, lambda fr: (1 + 0.12 * _wobble(fr, 5, 1.2)) * (0.45 if fr % 97 in (0, 1, 4) else 1))
            pulse("vn_moonbeam", f0, f1, lambda fr: 1 + 0.2 * _wobble(fr, 6, 0.1))
        elif n == "game_show":  # spotlights breathe, the stage glow pulses with the show
            for s in (-1, 1):
                pulse(f"gs_beam{s}", f0, f1, lambda fr, s=s: 1 + 0.3 * _wobble(fr, 7 + s, 0.4))
            pulse("gs_stageglow", f0, f1, lambda fr: 1 + 0.25 * math.sin(fr * 0.21))
        elif n == "party_room":  # coloured beams sweep across the couch
            for k in (0, 1):
                sway(f"pr_beam{k}", f0, f1, 2.2, 0.045 + 0.012 * k, phase=3.0 * k)
                pulse(f"pr_beam{k}", f0, f1, lambda fr, k=k: 1 + 0.35 * _wobble(fr, 9 + k, 0.5))
    return fg


def layer(L, name, prefixes, factor):
    """Regroup the set's objects whose names start with any prefix under one parallax layer."""
    g = empty(f"{L.name}_{name}", L.root, (0, 0), 0)
    for o in list(L.root.children):
        if o is not g and any(o.name.startswith(p) for p in prefixes):
            o.parent = g
    L.parallax.append((g, factor))
    return g


def frame_size(L):
    _, _, o = L.cam
    return o * 1080 / 1920 / 2 + 1.0, o / 2 + 1.0


def rrect(x0, y0, x1, y1, r, n=6):
    pts = []
    for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        pts += [(cx + r * math.cos(rad(a0 + 90 * i / n)), cy + r * math.sin(rad(a0 + 90 * i / n))) for i in range(n + 1)]
    return pts


def box(name, x0, y0, x1, y1, color, parent, z, r=0.0, ol=OL):
    pts = rrect(x0, y0, x1, y1, r) if r else rect(x0, y0, x1, y1)
    return shape(name, pts, color, parent, z, ol=ol, smooth=0)


def star(cx, cy, r0, r1, n=4, rot=0.0):
    return [(cx + math.cos(rot + math.pi * i / n) * (r0 if i % 2 == 0 else r1),
             cy + math.sin(rot + math.pi * i / n) * (r0 if i % 2 == 0 else r1), "s") for i in range(2 * n)]


def phone(name, parent, x, y, z, s=1.0):
    p = empty(name, parent, (x, y), z)
    box(f"{name}_body", -0.55 * s, -0.95 * s, 0.55 * s, 0.95 * s, OFFBLACK, p, 0.0, r=0.18 * s)
    box(f"{name}_screen", -0.45 * s, -0.82 * s, 0.45 * s, 0.82 * s, ORANGE, p, 0.01, r=0.1 * s, ol=0)
    text(f"{name}_logo", "F", 0.9 * s, CHALK, p, (0, -0.05 * s), 0.02)
    return p


# ---------- 1. Game Night HQ ----------

ROOM = {
    "day":   dict(wall="#FBDDBB", wall2="#F2C79C", floor="#C98B5A", plank="#B07548", sky="#9ED8FF", couch="#6C4AB6",
                  couch_d="#5A3B9E", table="#8A5A3B", lamp="#FFE89A", frame="#FFFFFF", plant="#2FA866"),
    "night": dict(wall="#2A2F55", wall2="#232849", floor="#3A2E3F", plank="#31263A", sky="#101633", couch="#3E2C70",
                  couch_d="#33245E", table="#4A3336", lamp="#4D4A5E", frame="#8C8FB0", plant="#1F5A49"),
}


def living_room(variant="day"):
    P = ROOM[variant]
    L = Location(f"living_room_{variant}")
    r = L.root
    box("lr_wall", -W, -3, W, 23, P["wall"], r, -9, ol=0)
    box("lr_wainscot", -W, 1.2, W, 5.2, P["wall2"], r, -8.9, ol=0)
    stroke("lr_rail", [(-W, 5.2), (W, 5.2)], 0.12, OUTLINE, r, -8.8)
    box("lr_floor", -W, -3, W, 1.3, P["floor"], r, -8.7)
    for x in range(-8, 9, 3):
        stroke(f"lr_plank{x}", [(x, -3), (x + 0.6, 1.3)], 0.05, P["plank"], r, -8.6)

    # window with curtains
    win = empty("lr_window", r, (-3.0, 15.4), -8)
    box("lr_win_frame", -2.5, -3.0, 2.5, 3.0, P["frame"], win, 0.0, r=0.15)
    box("lr_win_glass", -2.2, -2.7, 2.2, 2.7, P["sky"], win, 0.01, ol=0)
    if variant == "night":
        shape("lr_moon", ell(0.9, 1.3, 0.75, 0.75), "#FFF4C2", win, 0.02, ol=0)
        shape("lr_moon_bite", ell(1.25, 1.55, 0.62, 0.62), P["sky"], win, 0.03, ol=0)
        rnd = random.Random(3)
        for i in range(9):
            shape(f"lr_wstar{i}", star(rnd.uniform(-1.9, 1.9), rnd.uniform(-2.4, 2.4), 0.14, 0.05), "#FFF4C2", win, 0.02, ol=0)
    else:
        for i, (x, y, s) in enumerate(((-0.9, 1.2, 1.0), (1.0, -0.6, 0.8))):
            for j, (dx, dy, rr) in enumerate(((0, 0, 0.5), (0.55, 0.12, 0.42), (-0.5, -0.05, 0.38))):
                shape(f"lr_cloud{i}{j}", ell(x + dx * s, y + dy * s, rr * s * 1.3, rr * s), "#FFFFFF", win, 0.02, ol=0)
    stroke("lr_win_v", [(0, -2.7), (0, 2.7)], 0.16, P["frame"], win, 0.04)
    stroke("lr_win_h", [(-2.2, 0), (2.2, 0)], 0.16, P["frame"], win, 0.04)
    stroke("lr_rod", [(-3.6, 3.35), (3.6, 3.35)], 0.16, OUTLINE, win, 0.05)
    for s in (-1, 1):
        shape(f"lr_curtain{s}", mx([(2.0, 3.3, "s"), (3.4, 3.3, "s"), (3.3, 0.5), (3.6, -3.4, "s"), (2.4, -3.4, "s"), (2.6, 0.2)], s),
              ORANGE if variant == "day" else "#A3480F", win, 0.06)

    # FRIENDZY poster
    post = empty("lr_poster", r, (3.6, 15.6), -8)
    post.rotation_euler.z = rad(-4)
    box("lr_poster_frame", -2.1, -2.9, 2.1, 2.9, OFFBLACK, post, 0.0)
    box("lr_poster_bg", -1.85, -2.65, 1.85, 2.65, ORANGE if variant == "day" else "#8F3C0A", post, 0.01, ol=0)
    t = text("lr_poster_txt", "FRIENDZY", 1.05, YELLOW if variant == "day" else "#A08A2A", post, (0, 0.9), 0.02)
    t.rotation_euler.z = rad(8)
    text("lr_poster_sub", "LET THE\nCHAOS BEGIN", 0.55, CHALK if variant == "day" else "#9A96A8", post, (0, -1.3), 0.02)

    # floor lamp + plant
    lamp = empty("lr_lamp", r, (-5.4, 1.3), -6)
    stroke("lr_lamp_pole", [(0, 0), (0, 9.0)], 0.18, OUTLINE, lamp, 0.0)
    shape("lr_lamp_base", ell(0, 0.1, 0.9, 0.22), OUTLINE, lamp, 0.01, ol=0)
    shape("lr_lamp_shade", [(-1.2, 8.6, "s"), (1.2, 8.6, "s"), (0.75, 10.4, "s"), (-0.75, 10.4, "s")], P["lamp"], lamp, 0.02, smooth=0)
    if variant == "day":
        shape("lr_lamp_glow", ell(0, 8.2, 1.6, 0.5), "#FFF1C4", lamp, -0.5, ol=0)

    # couch: back behind the cast, seat + arms in front
    box("lr_couch_back", -6.6, 4.4, 6.6, 9.6, P["couch"], r, -3, r=0.9)
    for x in (-2.2, 2.2):
        stroke(f"lr_couch_seam{x}", [(x, 5.0), (x, 9.2)], 0.07, P["couch_d"], r, -2.9)
    box("lr_couch_seat", -6.6, 2.0, 6.6, 4.7, P["couch"], r, 10, r=0.5)
    for x in (-2.2, 2.2):
        stroke(f"lr_seat_seam{x}", [(x, 2.3), (x, 4.5)], 0.07, P["couch_d"], r, 10.05)
    for s in (-1, 1):
        box(f"lr_arm{s}", 5.8 * s - 0.95, 2.0, 5.8 * s + 0.95, 7.0, P["couch"], r, 10.5, r=0.75)
        box(f"lr_leg{s}", 5.6 * s - 0.25, 1.3, 5.6 * s + 0.25, 2.1, OFFBLACK, r, 9.9, ol=0)

    # coffee table with the phone, popcorn and juice
    tb = empty("lr_table", r, (0, 0), 12)
    box("lr_table_top", -4.4, 0.8, 4.4, 1.5, P["table"], tb, 0.0, r=0.2)
    for s in (-1, 1):
        box(f"lr_table_leg{s}", 3.7 * s - 0.25, -1.6, 3.7 * s + 0.25, 0.85, P["table"], tb, -0.05)
    L.extras["phone"] = phone("lr_phone", tb, -1.4, 1.75, 0.1, 0.55)
    pop = empty("lr_popcorn", tb, (1.6, 1.5), 0.1)
    rnd = random.Random(5)
    for i in range(10):
        shape(f"lr_kernel{i}", ell(rnd.uniform(-0.75, 0.75), rnd.uniform(0.75, 1.2), 0.3, 0.26), "#FFF7DD", pop, 0.0 + i * 0.001, ol=0.05)
    shape("lr_bucket", [(-1.0, 0.95, "s"), (1.0, 0.95, "s"), (0.75, -0.2, "s"), (-0.75, -0.2, "s")], "#FFFFFF", pop, 0.02, smooth=0)
    for x in (-0.55, 0.0, 0.55):
        shape(f"lr_bucket_s{x}", [(x - 0.14, 0.95, "s"), (x + 0.14, 0.95, "s"), (x * 0.8 + 0.1, -0.2, "s"), (x * 0.8 - 0.1, -0.2, "s")],
              RED, pop, 0.03, ol=0, smooth=0)
    jb = empty("lr_juice", tb, (3.3, 1.5), 0.1)
    box("lr_juice_box", -0.4, 0.0, 0.4, 1.2, "#FFD600" if variant == "day" else "#8C7A1E", jb, 0.0, r=0.05)
    stroke("lr_juice_straw", [(0.15, 1.2), (0.2, 1.75), (0.45, 1.95)], 0.08, "#FF4757", jb, -0.01)

    if variant == "night":  # moonlight patch on the floor
        shape("lr_moonlight", [(-5.0, 1.3, "s"), (-1.5, 1.3, "s"), (0.6, -2.8, "s"), (-4.0, -2.8, "s")], "#3E4570", r, -8.65, ol=0, smooth=0)

    L.seats = [(-4.7, 4.6, 0.72, 0.0), (-1.55, 4.6, 0.72, 1.5), (1.55, 4.6, 0.72, 3.0), (4.7, 4.6, 0.72, 4.5)]

    # atmosphere: light through the window, lamp glow, edge vignette; the back wall is a parallax layer
    layer(L, "back", ("lr_wall", "lr_wainscot", "lr_rail", "lr_window", "lr_poster", "lr_lamp", "lr_floor", "lr_plank", "lr_moonlight"), 0.85)
    w, h = frame_size(L)
    if variant == "night":
        light("lr_tint", rect(-30, -30, 30, 40), "#1B2560", 0.16, r, 15, smooth=0)
        light("lr_beam", [(-5.4, 18.4, "s"), (-0.6, 18.4, "s"), (4.2, -3.0, "s"), (-2.4, -3.0, "s")], "#BFD4FF", 0.09, r, 15.5, smooth=0)
        vignette("lr_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.2)
    else:
        light("lr_beam", [(-5.4, 18.4, "s"), (-0.6, 18.4, "s"), (5.0, 1.6, "s"), (-1.0, 1.6, "s")], "#FFF3C4", 0.12, r, 15.5, smooth=0)
        L.extras["glow"] = glow("lr_lampglow", (-5.4, 10.6), 3.4, 3.0, "#FFE08A", 0.05, 6, r, 16)
        vignette("lr_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.08)
    return L


def widen(L, half=24.0):
    """16:9 framing: extend the set sideways to x = +-half (far layers keep their parallax), swap the 9:16
    vignette for a 16:9 one, and set L.cam_h, the default horizontal framing (ortho = frame height).
    The 9:16 parts are untouched, so vertical videos never call this. In 16:9 the seats spread out (SPREAD apart)
    so close-ups can put their frame edges in the gaps between characters (layout.clean_close)."""
    {"campfire": _widen_campfire, "living_room_day": _widen_living_room, "living_room_night": _widen_living_room,
     "game_show": _widen_game_show, "village_night": _widen_village_night, "party_room": _widen_party_room,
     "car": _widen_car, **{n: _widen_plate for n in PLATE_SETS}}[L.name](L, half)
    for o in list(L.root.children):
        if o.name.endswith("_vig"):
            set_visible(o, False)
    x, y, o = L.cam_h
    vignette(f"{L.name}_vig_h", x, y, o * 16 / 9 / 2 + 1.0, o / 2 + 1.0, L.root, 30, 0.14 if "night" in L.name or L.name == "campfire" else 0.06)
    return L


SPREAD = 5.2        # 16:9 seat spacing (9:16 seats touch at 3.15)
BODY_HALF = 2.25    # half width of a seated character's body (tails and floppy ears may reach past it)


def _spread_seats(L):
    L.seats = [((i - 1.5) * SPREAD, hip, s, z) for i, (_, hip, s, z) in enumerate(L.seats)]
    L.seat_half = BODY_HALF


def _group(L, suffix):
    return bpy.data.objects.get(f"{L.name}_{suffix}") or L.root


def _widen_campfire(L, half):
    far, mid = _group(L, "far"), _group(L, "mid")
    r = L.root
    y0 = -3
    for i, (y, col) in enumerate(((6, "#2A3A6E"), (11, "#22305C"), (16, "#1A2448"), (23, "#141A36"))):
        for s in (-1, 1):
            box(f"cfw_sky{i}{s}", min(s * W, s * half), y0, max(s * W, s * half), y, col, far, -9.5 + i * 0.01, ol=0)
        y0 = y
    rnd = random.Random(12)
    for i in range(40):
        s = (-1, 1)[i % 2]
        x, y = s * rnd.uniform(W, half), rnd.uniform(11, 22.5)
        sz = rnd.uniform(0.06, 0.16)
        shape(f"cfw_star{i}", star(x, y, sz * 1.8, sz * 0.6) if sz > 0.12 else ell(x, y, sz * 0.6, sz * 0.6, n=8), "#FFF4C2", far, -9.3, ol=0)
    for s in (-1, 1):
        shape(f"cfw_hills{s}", mx([(W - 0.2, 6), (W - 0.2, 12.4), (13, 11.4), (17, 12.8), (21, 11.9), (half, 12.5), (half, 6)], s), "#1A2D3B", far, -9.0, ol=0)
    for i, (x, h) in enumerate(((-11.0, 8.4), (-13.6, 10.2), (-16.8, 7.8), (-20.5, 9.4), (10.6, 7.2), (12.9, 9.8), (16.2, 8.1), (19.8, 10.4))):
        t = empty(f"cfw_pine{i}", far, (x, 8.5), -8.8 + i * 0.01)
        for k in range(3):
            yk, w_ = h * (0.12 + 0.27 * k), 1.7 - 0.45 * k
            shape(f"cfw_pine{i}_{k}", [(-w_, yk, "s"), (w_, yk, "s"), (0, yk + h * 0.42, "s")], "#10202A", t, k * 0.001, ol=0, smooth=0)
    for s in (-1, 1):
        box(f"cfw_ground{s}", min(s * (W - 0.1), s * half), -3, max(s * (W - 0.1), s * half), 8.6, "#26362B", r, -8.5, ol=0)
    # a backpack and a cooler by the log so the edges aren't empty
    bp = empty("cfw_pack", r, (-15.0, 2.4), 9.0)  # 16:9 wide frame is x +-12: edge props sit fully outside it
    box("cfw_pack_b", -1.0, 0.0, 1.0, 2.4, "#3D6DFF", bp, 0.0, r=0.45)
    box("cfw_pack_p", -0.7, 0.3, 0.7, 1.2, "#2E56D6", bp, 0.01, r=0.25)
    cl = empty("cfw_cooler", r, (15.2, 2.2), 9.0)
    box("cfw_cooler_b", -1.4, 0.0, 1.4, 1.9, RED, cl, 0.0, r=0.25)
    box("cfw_cooler_lid", -1.5, 1.7, 1.5, 2.3, "#FFFFFF", cl, 0.01, r=0.15)
    # extra string lights out to the new pines
    for s in (-1, 1):
        pts = [(s * x, 15.4 - 1.2 * math.sin(math.pi * (x - 7.4) / 9.0)) for x in [7.4 + 9.0 * i / 10 for i in range(11)]]
        stroke(f"cfw_wire{s}", pts, 0.06, OUTLINE, mid, 0.0)
        for i, (x, y) in enumerate(pts[1:-1:2]):
            shape(f"cfw_bulb{s}{i}", ell(x, y - 0.35, 0.18, 0.26), (YELLOW, ORANGE, CORAL)[i % 3], mid, 0.01, ol=0.04)
    # a longer log for the spread-out seats, drawn over the 9:16 one
    lg = empty("cfw_log", r, (0, 0), 10.2)
    box("cfw_log_body", -10.6, 2.6, 10.6, 4.6, "#7A4E2D", lg, 0.0, r=0.9)
    for x in (-8.0, -4.5, -0.5, 3.2, 6.6):
        stroke(f"cfw_log_grain{x}", [(x, 3.2), (x + 1.4, 3.35), (x + 2.2, 3.25)], 0.06, "#5E3A1F", lg, 0.01)
    for s in (-1, 1):
        shape(f"cfw_log_end{s}", ell(10.5 * s, 3.6, 0.55, 1.0), "#C69C6D", lg, 0.02)
        shape(f"cfw_log_ring{s}", ell(10.5 * s, 3.6, 0.28, 0.55), "#A87B4E", lg, 0.03, ol=0.04)
    _spread_seats(L)
    L.cam_h = (0.3, 8.8, 13.5)  # the group fills ~60% of the height


def _widen_living_room(L, half):
    back = _group(L, "back")
    night = "night" in L.name
    P = ROOM["night" if night else "day"]
    for s in (-1, 1):
        x0, x1 = min(s * W, s * half), max(s * W, s * half)
        box(f"lrw_wall{s}", x0, -3, x1, 23, P["wall"], back, -9, ol=0)
        box(f"lrw_wainscot{s}", x0, 1.2, x1, 5.2, P["wall2"], back, -8.9, ol=0)
        stroke(f"lrw_rail{s}", [(x0, 5.2), (x1, 5.2)], 0.12, OUTLINE, back, -8.8)
        box(f"lrw_floor{s}", x0, -3, x1, 1.3, P["floor"], back, -8.7)
        for x in range(10, int(half) + 1, 3):
            stroke(f"lrw_plank{s}{x}", [(s * x, -3), (s * x + 0.6, 1.3)], 0.05, P["plank"], back, -8.6)
    # left: a door; right: a bookshelf and a plant
    dr = empty("lrw_door", back, (-15.0, 1.3), -8.5)  # fully outside the x +-12 wide frame
    box("lrw_door_frame", -2.1, 0, 2.1, 9.4, P["frame"], dr, 0.0, r=0.1)
    box("lrw_door_body", -1.8, 0, 1.8, 9.1, P["table"], dr, 0.01)
    shape("lrw_door_knob", ell(1.2, 4.5, 0.22, 0.22), YELLOW, dr, 0.02, ol=0.04)
    sh = empty("lrw_shelf", back, (15.4, 1.3), -8.5)
    box("lrw_shelf_body", -2.4, 0, 2.4, 10.0, P["table"], sh, 0.0)
    for k, y in enumerate((2.4, 5.0, 7.6)):
        stroke(f"lrw_shelf_board{k}", [(-2.2, y), (2.2, y)], 0.14, OUTLINE, sh, 0.01)
        for j in range(5):
            col = (ORANGE, "#3D6DFF", RED, YELLOW, "#22B573")[(j + k) % 5]
            box(f"lrw_book{k}{j}", -1.9 + j * 0.75, y + 0.08, -1.35 + j * 0.75, y + 1.6 - (j % 2) * 0.3, col if not night else "#4D4A5E", sh, 0.02)
    pl = empty("lrw_plant", back, (19.2, 1.3), -8.4)
    shape("lrw_pot", [(-0.9, 0, "s"), (0.9, 0, "s"), (1.1, 1.6, "s"), (-1.1, 1.6, "s")], ORANGE, pl, 0.0, smooth=0)
    for k, a in enumerate((-35, -12, 10, 32)):
        lf = empty(f"lrw_leaf{k}", pl, (0, 1.5), 0.01)
        lf.rotation_euler.z = rad(a)
        shape(f"lrw_leaf{k}_s", [(0, 0), (0.7, 2.2, "s"), (0, 4.0), (-0.7, 2.2, "s")], P["plant"], lf, 0.0, ol=0.05)
    # a longer couch for the spread-out seats; the 9:16 arms would sit in front of the outer characters
    for o in ("lr_arm-1", "lr_arm1", "lr_leg-1", "lr_leg1"):
        if o in bpy.data.objects:
            set_visible(bpy.data.objects[o], False)
    r = L.root
    box("lrw_couch_back", -11.0, 4.4, 11.0, 9.6, P["couch"], r, -2.99, r=0.9)
    box("lrw_couch_seat", -11.0, 2.0, 11.0, 4.7, P["couch"], r, 10.01, r=0.5)
    for x in (-5.2, 0.0, 5.2):
        stroke(f"lrw_couch_seam{x}", [(x, 5.0), (x, 9.2)], 0.07, P["couch_d"], r, -2.9)
        stroke(f"lrw_seat_seam{x}", [(x, 2.3), (x, 4.5)], 0.07, P["couch_d"], r, 10.05)
    for s in (-1, 1):
        box(f"lrw_arm{s}", 11.0 * s - 0.95, 2.0, 11.0 * s + 0.95, 7.0, P["couch"], r, 10.5, r=0.75)
        box(f"lrw_leg{s}", 10.8 * s - 0.25, 1.3, 10.8 * s + 0.25, 2.1, OFFBLACK, r, 9.9, ol=0)
    _spread_seats(L)
    L.cam_h = (0.0, 8.6, 13.5)  # the group fills ~60% of the height (centred: the long couch is +-11.95)


def _widen_car(L, half):
    """16:9 car: the cabin extends sideways (shell, roof, dashboard, a door with a window each side). The two rows
    don't spread (it's a car), so 16:9 shots use plain framings rather than clean_close."""
    r = L.root
    shell = "#3A3F4B"
    for s in (-1, 1):
        x0, x1 = min(s * (W - 0.1), s * half), max(s * (W - 0.1), s * half)
        box(f"carw_roof{s}", x0, 17.2, x1, 23, "#D9D4CC", r, -7)
        box(f"carw_wall{s}", x0, -3, x1, 17.2, shell, r, -7)
        dw = empty(f"carw_door{s}", r, (11.6 * s, 0), -6.8)
        box(f"carw_door{s}_panel", -2.4, 1.0, 2.4, 15.4, "#4A505E", dw, 0.0, r=0.6)
        box(f"carw_door{s}_win", -1.8, 9.0, 1.8, 14.6, "#B5E3FF", dw, 0.01, r=0.5)
        stroke(f"carw_door{s}_shine", [(-0.9, 13.4), (0.4, 11.4)], 0.2, "#FFFFFF", dw, 0.02)
        box(f"carw_door{s}_handle", -0.9, 7.2, 0.9, 7.7, "#9A9AA6", dw, 0.02, r=0.2)
        box(f"carw_dash{s}", x0, -3, x1, 2.6, "#2B2F38", r, 12.01)
    L.cam_h = (0.0, 8.4, 12.0)


def mood_tint(L, color="#B0102A", alpha=0.45, name="mood"):
    """A full-set colour wash over the cast (evil-laugh red, spooky blue...), hidden until you switch it on
    with set_visible(tint, True, frame). Sits above the set's own light layers, below the HUD."""
    t = empty(f"{L.name}_{name}", L.root, (0, 0), 17)
    light(f"{L.name}_{name}_wash", rect(-30, -30, 30, 40), color, alpha, t, 0.0, smooth=0)
    light(f"{L.name}_{name}_dark", rect(-30, -30, 30, 40), OFFBLACK, alpha * 0.25, t, 0.01, smooth=0)
    set_visible(t, False)
    return t


# ---------- 2. Road Trip ----------

def car():
    L = Location("car")
    r = L.root
    # outside through the rear window: sky, hills, road
    out = empty("car_outside", r, (0, 0), -9)  # the view through the rear window (parallax layer, see drive())
    box("car_sky", -W, 6, W, 23, "#8FD3FF", out, 0.0, ol=0)
    shape("car_sun", ell(3.0, 17.5, 1.1, 1.1), "#FFE27A", out, 0.01, ol=0)
    for i, (x, w_, h, col) in enumerate(((-6, 6, 3.0, "#7CC97A"), (3.5, 7, 2.4, "#5FB86A"))):
        shape(f"car_hill{i}", [(x - w_, 10.5), (x - w_ * 0.4, 10.5 + h * 0.8), (x, 10.5 + h), (x + w_ * 0.5, 10.5 + h * 0.6), (x + w_, 10.5)],
              col, out, 0.02 + i * 0.01, ol=0)
    box("car_ground", -W, 6, W, 10.7, "#6DBF6A", out, 0.04, ol=0)
    shape("car_road", [(-0.25, 10.7, "s"), (0.25, 10.7, "s"), (3.8, 6, "s"), (-3.8, 6, "s")], "#5C5F6B", out, 0.05, ol=0, smooth=0)
    for i, (y0, y1) in enumerate(((10.3, 9.9), (9.4, 8.6), (8.0, 6.8))):
        w0, w1 = 0.03 + (10.7 - y0) * 0.02, 0.03 + (10.7 - y1) * 0.02
        shape(f"car_dash{i}", [(-w0, y0, "s"), (w0, y0, "s"), (w1, y1, "s"), (-w1, y1, "s")], "#FFFFFF", out, 0.06, ol=0, smooth=0)
    for i, x in enumerate((-5.5, -3.2, 4.2, 6.3)):
        t = empty(f"car_tree{i}", out, (x, 10.5), 0.07)
        stroke(f"car_trunk{i}", [(0, 0), (0, 0.8)], 0.22, "#7A4E2D", t, 0.0)
        shape(f"car_crown{i}", ell(0, 1.4, 0.75, 0.9), "#2FA866", t, 0.01, ol=0.06)

    # cabin shell with a window cut-out (drawn as four panels + rounded window frame)
    shell = "#3A3F4B"
    box("car_roof", -W, 17.2, W, 23, "#D9D4CC", r, -7)
    stroke("car_roof_line", [(-W, 17.2), (W, 17.2)], 0.1, OUTLINE, r, -6.9)
    box("car_wallL", -W, -3, -5.4, 17.2, shell, r, -7)
    box("car_wallR", 5.4, -3, W, 17.2, shell, r, -7)
    box("car_wall_low", -W, -3, W, 6.3, shell, r, -7.05)
    stroke("car_win_rim", rrect(-5.4, 6.3, 5.4, 17.2, 0.3) + [(-5.4 + 0.3, 6.3)], 0.32, OFFBLACK, r, -6.9)
    for s in (-1, 1):
        sw = empty(f"car_sidewin{s}", r, (7.2 * s, 12.0), -6.8)
        box(f"car_sidewin{s}_g", -1.2, -2.8, 1.2, 2.8, "#B5E3FF", sw, 0.0, r=0.5)
        stroke(f"car_sidewin{s}_shine", [(-0.6, 1.8), (0.4, 0.4)], 0.18, "#FFFFFF", sw, 0.01)

    # back bench (behind back row), front seats (between rows), dashboard (in front)
    box("car_bench", -5.4, 4.5, 5.4, 10.6, "#E8603C", r, -3, r=0.8)
    for x in (-1.8, 1.8):
        stroke(f"car_bench_seam{x}", [(x, 5.0), (x, 10.2)], 0.07, "#C84A2A", r, -2.95)
    box("car_bench_seat", -5.4, 3.9, 5.4, 6.6, "#E8603C", r, 1.0, r=0.6)  # hides the back row's legs
    stroke("car_bench_seat_seam", [(-5.0, 6.1), (5.0, 6.1)], 0.07, "#C84A2A", r, 1.05)
    for s in (-1, 1):
        fs = empty(f"car_frontseat{s}", r, (3.9 * s, 0), 3.2)
        box(f"car_fs{s}_back", -1.9, 2.0, 1.9, 9.3, "#E8603C", fs, 0.0, r=0.9)
        box(f"car_fs{s}_head", -1.2, 9.6, 1.2, 11.4, "#E8603C", fs, 0.01, r=0.6)
        stroke(f"car_fs{s}_post1", [(-0.6, 9.2), (-0.6, 9.7)], 0.12, "#9A9AA6", fs, -0.01)
        stroke(f"car_fs{s}_post2", [(0.6, 9.2), (0.6, 9.7)], 0.12, "#9A9AA6", fs, -0.01)
        stroke(f"car_fs{s}_seam", [(0, 2.6), (0, 8.7)], 0.07, "#C84A2A", fs, 0.02)
    dash = empty("car_dash", r, (0, 0), 12)
    shape("car_dashboard", [(-W, -3, "s"), (W, -3, "s"), (W, 2.6, "s"), (6.0, 3.3), (0, 3.55), (-6.0, 3.3), (-W, 2.6, "s")],
          "#2B2F38", dash, 0.0)
    stroke("car_dash_line", [(-8.5, 2.3), (0, 2.75), (8.5, 2.3)], 0.08, "#454B57", dash, 0.01)
    wheel = empty("car_wheel", dash, (3.9, 3.4), 0.2)
    ring = ell(0, 0, 2.0, 1.05, n=48)
    shape("car_wheel_ring", ring, "#1C1E24", wheel, 0.0)
    shape("car_wheel_hole", ell(0, 0.08, 1.62, 0.72, n=48), "#2B2F38", wheel, 0.01, ol=0.06)
    stroke("car_wheel_spoke", [(-1.65, -0.05), (0, -0.25), (1.65, -0.05)], 0.28, "#1C1E24", wheel, 0.02)
    shape("car_wheel_hub", ell(0, -0.25, 0.5, 0.32), ORANGE, wheel, 0.03, ol=0.06)
    phone("car_phone", dash, -2.6, 1.6, 0.2, 0.75)
    # rear-view mirror with a Riot air freshener
    mir = empty("car_mirror", r, (0, 17.6), 13)
    stroke("car_mirror_arm", [(0, 1.2), (0, 0.4)], 0.18, OUTLINE, mir, 0.0)
    box("car_mirror_glass", -1.6, -0.35, 1.6, 0.45, "#1C1E24", mir, 0.01, r=0.3)
    fr = empty("car_freshener", mir, (0, -0.35), 0.02)
    stroke("car_fresh_string", [(0, 0), (0, -1.0)], 0.04, OUTLINE, fr, 0.0)
    shape("car_fresh_tag", [(0, -1.0, "s"), (0.55, -1.45), (0.62, -2.0, "s"), (0.25, -2.3), (0, -2.75, "s"), (-0.25, -2.3),
                            (-0.62, -2.0, "s"), (-0.55, -1.45)], ORANGE, fr, 0.01)
    for s in (-1, 1):
        shape(f"car_fresh_mask{s}", ell(0.24 * s, -1.85, 0.17, 0.1, rot=rad(15) * s), YELLOW, fr, 0.02, ol=0)
    L.extras["freshener"] = fr

    L.seats = [(-1.15, 6.4, 0.56, -1.5), (1.15, 6.4, 0.56, -1.0), (-3.9, 3.0, 0.78, 6.0), (3.9, 3.0, 0.78, 7.5)]

    L.parallax.append((out, 0.3))
    w, h = frame_size(L)
    light("car_sun", [(1.0, 17.0, "s"), (5.4, 17.0, "s"), (6.5, 2.0, "s"), (2.8, 2.0, "s")], "#FFF1C4", 0.08, r, 16, smooth=0)
    vignette("car_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.1)
    return L


def drive(L, f0, f1, speed=1.0):
    """Road-trip motion through the rear window: trees and road dashes stream away toward the horizon,
    the cabin bumps gently, the air freshener swings."""
    trees = [o for o in L.root.children_recursive if o.name.startswith("car_tree") and o.type == "EMPTY"]
    dashes = [o for o in L.root.children_recursive if re.fullmatch(r"car_dash\d+", o.name)]
    vp = Vector((0.0, 10.6))
    for i, t in enumerate(trees):
        side = -1 if t.location.x < 0 else 1
        start = Vector((side * 5.6, 6.2))
        for fr in range(f0, f1 + 1):
            k = ((fr - f0) * 0.012 * speed + i * 0.27) % 1.0
            e = 1 - (1 - k) ** 2
            p = start.lerp(vp + Vector((side * 1.2, 0)), e)
            t.location.x, t.location.y = p.x, p.y
            sc_ = 1.5 * (1 - e) + 0.2
            t.scale = (sc_, sc_, 1)
            t.keyframe_insert("location", frame=fr)
            t.keyframe_insert("scale", frame=fr)
    for i, d in enumerate(dashes):
        for fr in range(f0, f1 + 1):
            d.location.y = -((fr - f0) * 0.05 * speed + i * 0.6) % 1.8 + 0.9
            d.keyframe_insert("location", frame=fr)
    fr_ = L.extras.get("freshener")
    for fr in range(f0, f1 + 1):
        bump = 0.03 * math.sin(fr * 1.9) + 0.02 * math.sin(fr * 3.7)
        for name in ("car_dash", "car_mirror"):
            o = bpy.data.objects.get(name)
            if o:
                if "by" not in o:
                    o["by"] = o.location.y
                o.location.y = o["by"] + bump
                o.keyframe_insert("location", frame=fr)
        if fr_:
            fr_.rotation_euler.z = rad(9) * math.sin(fr * 0.18) + rad(3) * math.sin(fr * 0.53)
            fr_.keyframe_insert("rotation_euler", frame=fr)


# ---------- 3. Campfire ----------

def campfire():
    import cast
    if CRAFT and not getattr(cast, "NO_FIRE_RIM", False):  # the cast catches the fire on one edge (rig.fire_on_cast)
        cast.RIM = ("#FFB347", 0.07)
    L = Location("campfire")
    r = L.root
    y0 = -3
    for i, (y, col) in enumerate(((6, "#2A3A6E"), (11, "#22305C"), (16, "#1A2448"), (23, "#141A36"))):
        box(f"cf_sky{i}", -W, y0, W, y, col, r, -9.5 + i * 0.01, ol=0)
        y0 = y
    rnd = random.Random(11)
    for i in range(34):
        x, y = rnd.uniform(-W, W), rnd.uniform(11, 22.5)
        s = rnd.uniform(0.06, 0.16)
        shape(f"cf_star{i}", star(x, y, s * 1.8, s * 0.6) if s > 0.12 else ell(x, y, s * 0.6, s * 0.6, n=8), "#FFF4C2", r, -9.3, ol=0)
    shape("cf_moon", ell(4.6, 19.6, 1.3, 1.3), "#FFF4C2", r, -9.2, ol=0)
    shape("cf_moon_c1", ell(4.2, 19.9, 0.25, 0.25), "#EFE2A8", r, -9.19, ol=0)
    shape("cf_moon_c2", ell(5.0, 19.1, 0.18, 0.18), "#EFE2A8", r, -9.19, ol=0)
    shape("cf_hills", [(-W, 6), (-W, 11.5), (-5, 12.6), (-1.5, 11.6), (2.5, 12.9), (6, 11.8), (W, 12.4), (W, 6)], "#1A2D3B", r, -9.0, ol=0)
    for i, (x, h) in enumerate(((-8.2, 7.5), (-6.4, 9.2), (-4.8, 6.4), (5.4, 8.6), (7.4, 10.0), (3.6, 6.0))):
        t = empty(f"cf_pine{i}", r, (x, 8.5), -8.8 + i * 0.01)
        for k in range(3):
            y0 = h * (0.12 + 0.27 * k)
            w_ = 1.7 - 0.45 * k
            shape(f"cf_pine{i}_{k}", [(-w_, y0, "s"), (w_, y0, "s"), (0, y0 + h * 0.42, "s")], "#10202A", t, k * 0.001, ol=0, smooth=0)
    box("cf_ground", -W, -3, W, 8.6, "#26362B", r, -8.5, ol=0)
    for i, (rx, ry, col) in enumerate(((7.5, 3.4, "#36402C"), (5.4, 2.4, "#4D4630"), (3.4, 1.5, "#6B5634"))):
        shape(f"cf_glow{i}", ell(0, 0.6, rx, ry), col, r, -8.4 + i * 0.01, ol=0)

    # string lights between the outer pines
    sl = empty("cf_lights", r, (0, 0), -7.5)
    pts = [(x, 17.2 - 2.4 * (1 - (x / 7.4) ** 2)) for x in [-7.4 + 14.8 * i / 20 for i in range(21)]]
    stroke("cf_wire", pts, 0.06, OUTLINE, sl, 0.0)
    for i, (x, y) in enumerate(pts[1:-1:2]):
        col = (YELLOW, ORANGE, CORAL)[i % 3]
        shape(f"cf_bulb{i}", ell(x, y - 0.35, 0.18, 0.26), col, sl, 0.01, ol=0.04)

    # orange tent
    tent = empty("cf_tent", r, (-3.4, 11.9), -8.95)
    tent.scale = (0.55, 0.55, 1)
    shape("cf_tent_body", [(-2.6, 0, "s"), (2.6, 0, "s"), (0, 4.6, "s")], ORANGE, tent, 0.0, smooth=0)
    shape("cf_tent_door", [(-0.9, 0, "s"), (0.9, 0, "s"), (0, 3.2, "s")], "#7A2E00", tent, 0.01, ol=0, smooth=0)
    shape("cf_tent_flap", [(0, 3.2, "s"), (0.9, 0, "s"), (1.5, 0, "s")], "#FF8A2E", tent, 0.02, ol=0.05, smooth=0)
    stroke("cf_tent_pole", [(0, 4.6), (0, 5.2)], 0.1, OUTLINE, tent, 0.03)

    # log the cast sits on (front), with end rings
    lg = empty("cf_log", r, (0, 0), 10)
    box("cf_log_body", -6.4, 2.6, 6.4, 4.6, "#7A4E2D", lg, 0.0, r=0.9)
    for x in (-4.0, -0.5, 2.8):
        stroke(f"cf_log_grain{x}", [(x, 3.2), (x + 1.4, 3.35), (x + 2.2, 3.25)], 0.06, "#5E3A1F", lg, 0.01)
    for s in (-1, 1):
        shape(f"cf_log_end{s}", ell(6.3 * s, 3.6, 0.55, 1.0), "#C69C6D", lg, 0.02)
        shape(f"cf_log_ring{s}", ell(6.3 * s, 3.6, 0.28, 0.55), "#A87B4E", lg, 0.03, ol=0.04)

    # the fire (foreground)
    fire = empty("cf_fire", r, (0, -0.4), 12)
    rnd = random.Random(2)
    for i in range(8):
        a = math.pi * i / 7
        shape(f"cf_stone{i}", ell(math.cos(a) * 2.6, -math.sin(a) * 0.55 - 0.1, 0.62, 0.42), "#8A8E99" if i % 2 else "#6E727D", fire, 0.0 + i * 0.001)
    for s in (-1, 1):
        lg2 = empty(f"cf_firelog{s}", fire, (0, 0.2), 0.02)
        lg2.rotation_euler.z = rad(14) * s
        box(f"cf_firelog{s}_b", -2.0, -0.32, 2.0, 0.32, "#6A3F22", lg2, 0.0, r=0.3)
    flames = empty("cf_flames", fire, (0, 0.4), 0.05)
    for k, (col, sc_) in enumerate(((RED, 1.0), (ORANGE, 0.74), (YELLOW, 0.48), ("#FFF6D0", 0.24))):
        pts = [(0, 0)]
        for i, (x, h) in enumerate(((-1.6, 2.2), (-0.8, 3.6), (0.0, 4.6), (0.9, 3.4), (1.6, 2.0))):
            pts += [(x * sc_ - 0.35 * sc_, h * sc_ * 0.45), (x * sc_, h * sc_, "s")]
        pts += [(1.9 * sc_, 0.3 * sc_), (1.2 * sc_, -0.25), (-1.2 * sc_, -0.25), (-1.9 * sc_, 0.3 * sc_)]
        shape(f"cf_flame{k}", pts, col, flames, 0.01 * k, ol=OL if k == 0 else 0, smooth=2)
    L.extras["flames"] = flames
    for i in range(5):
        x, y = rnd.uniform(-1.8, 1.8), rnd.uniform(4.8, 7.5)
        shape(f"cf_spark{i}", ell(x, y, 0.09, 0.09, n=8), YELLOW, fire, 0.1, ol=0)

    L.seats = [(-4.7, 4.3, 0.72, 0.0), (-1.55, 4.3, 0.72, 1.5), (1.55, 4.3, 0.72, 3.0), (4.7, 4.3, 0.72, 4.5)]

    # atmosphere: firelight washing over the cast (flicker it with motion.flicker(loc.extras["glow"]...)),
    # a hot core around the flames, night vignette; sky and trees are far parallax layers
    layer(L, "far", ("cf_sky", "cf_star", "cf_moon", "cf_hills", "cf_pine", "cf_tent"), 0.35)
    layer(L, "mid", ("cf_lights",), 0.6)
    L.extras["glow"] = glow("cf_fireglow", (0, 1.2), 10.5, 8.5, "#FF8A3D", 0.045, 7, r, 9.5)
    glow("cf_firecore", (0, 0.6), 4.2, 3.4, "#FFB45C", 0.07, 5, r, 13)
    w, h = frame_size(L)
    vignette("cf_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.22)
    return L


# ---------- 4. Game-show stage (Trivia) ----------
# The backdrops below are drawn +-WIDE wide from the start, so their 16:9 version (widen) only has to
# spread the seats and swap the front furniture.
WIDE = 24.0
PODIUM = {"bash": RED, "pip": "#3D6DFF", "rocco": "#22B573"}


def _podium(name, parent, x, color, host=False):
    p = empty(name, parent, (x, 0), 10)
    w = 1.15 if host else 1.4
    top = 4.6 if host else 5.2
    box(f"{name}_body", -w, 0.6, w, top, "#6A3FD0" if host else color, p, 0.0, r=0.25)
    box(f"{name}_trim", -w, top - 0.45, w, top, YELLOW, p, 0.01, r=0.2)
    if host:
        text(f"{name}_q", "?", 1.6, YELLOW, p, (0, 2.5), 0.02)
    else:
        box(f"{name}_screen", -0.95, 2.9, 0.95, 4.2, OFFBLACK, p, 0.02, r=0.15, ol=0.05)
        shape(f"{name}_star", star(0, 1.75, 0.55, 0.22, 5, math.pi / 2), "#FFFFFF", p, 0.02, ol=0.04, smooth=0)
        shape(f"{name}_buzzer", [(-0.42, top, "s"), (0.42, top, "s"), (0.32, top + 0.38), (0, top + 0.5), (-0.32, top + 0.38)], RED, p, -0.01, ol=0.05)
        p["buzzer"] = bpy.data.objects[f"{name}_buzzer"].name
    return p


def game_show():
    """Riot's Trivia stage: a light-bulb TRIVIA NIGHT sign, spotlights, three contestant podiums with buzzers and
    score screens (extras['screens'][seat]) and a host lectern on seat 2. extras['bulbs'] chase-light, extras['buzzers']."""
    L = Location("game_show")
    r = L.root
    box("gs_back", -WIDE, -3, WIDE, 23, "#2A1B5E", r, -9.5, ol=0)
    for i in range(-12, 13):
        box(f"gs_panel{i}", i * 2.0 - 0.95, 4.0, i * 2.0 + 0.95, 23, "#3A2580" if i % 2 else "#311F6E", r, -9.4, ol=0)
    sign = empty("gs_sign", r, (0.4, 17.4), -8)
    box("gs_sign_frame", -5.8, -2.1, 5.8, 2.1, YELLOW, sign, 0.0, r=0.6)
    box("gs_sign_bg", -5.3, -1.6, 5.3, 1.6, OFFBLACK, sign, 0.01, r=0.4, ol=0)
    text("gs_sign_t", "TRIVIA NIGHT", 1.55, YELLOW, sign, (0, 0.2), 0.02)
    text("gs_sign_sub", "FRIENDZY", 0.6, ORANGE, sign, (0, -1.05), 0.02)
    bulbs = []
    for i in range(22):
        t = i / 22
        x, y = ((-5.55 + 11.1 * (t * 2)), 1.85) if t < 0.5 else ((5.55 - 11.1 * ((t - 0.5) * 2)), -1.85)
        bulbs.append(shape(f"gs_bulb{i}", ell(x, y, 0.17, 0.17, n=12), "#FFF6D0" if i % 2 else ORANGE, sign, 0.03, ol=0.03))
    L.extras["bulbs"] = bulbs
    for s in (-1, 1):  # side screens with question marks
        sc_ = empty(f"gs_side{s}", r, (s * 10.5, 15.0), -8.2)
        box(f"gs_side{s}_f", -2.2, -2.6, 2.2, 2.6, OFFBLACK, sc_, 0.0, r=0.3)
        box(f"gs_side{s}_s", -1.9, -2.3, 1.9, 2.3, "#3F87C7", sc_, 0.01, r=0.2, ol=0)
        text(f"gs_side{s}_q", "?", 3.2, "#FFFFFF", sc_, (0, 0), 0.02)
    box("gs_floor", -WIDE, -3, WIDE, 3.2, "#1C1440", r, -8.7)
    stroke("gs_edge", [(-WIDE, 3.2), (WIDE, 3.2)], 0.14, YELLOW, r, -8.6)
    for i in range(-11, 12):
        stroke(f"gs_floorline{i}", [(i * 2.2, -3), (i * 1.4, 3.2)], 0.05, "#2B2160", r, -8.65)
    who = ("bash", "pip", None, "rocco")
    L.seats = [(-4.7, 4.9, 0.72, 0.0), (-1.55, 4.9, 0.72, 1.5), (1.55, 4.9, 0.72, 3.0), (4.7, 4.9, 0.72, 4.5)]
    pods, screens, buzzers = [], [], []
    for i, (x, *_rest) in enumerate(L.seats):
        p = _podium(f"gs_pod{i}", r, x, PODIUM.get(who[i], ORANGE), host=who[i] is None)
        pods.append(p)
        scr = empty(f"gs_pod{i}_scr", p, (0, 3.55), 0.05)
        screens.append(scr)
        buzzers.append(bpy.data.objects[p["buzzer"]] if "buzzer" in p else None)
    L.extras.update(podiums=pods, screens=screens, buzzers=buzzers)
    layer(L, "back", ("gs_back", "gs_panel", "gs_sign", "gs_side"), 0.85)
    for s in (-1, 1):
        light(f"gs_beam{s}", [(s * 7.2, 23, "s"), (s * 5.6, 23, "s"), (s * 0.8, 0.5, "s"), (s * 4.6, 0.5, "s")], "#FFF3C4", 0.09, r, 15.5, smooth=0)
    glow("gs_stageglow", (0, 4.0), 9.0, 3.0, "#B48CFF", 0.04, 6, r, 9.5)
    w, h = frame_size(L)
    vignette("gs_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.14)
    return L


def _widen_game_show(L, half):
    _spread_seats(L)
    for p, (x, *_rest) in zip(L.extras["podiums"], L.seats):
        p.location.x = x
    sign = bpy.data.objects["gs_sign"]  # into the band above the heads
    sign.location.y, sign.scale = 14.2, (0.72, 0.72, 1)
    for s_ in (-1, 1):
        bpy.data.objects[f"gs_side{s_}"].location = (s_ * 16.0, 13.6, bpy.data.objects[f"gs_side{s_}"].location.z)  # outside x +-12
    L.cam_h = (0.3, 8.9, 13.5)


# ---------- 5. Night village square (Mafia) ----------

def village_night():
    """Mafia's town square at night: moon, rooftops with lit windows (extras['windows'], switch them off as night
    falls), a clock tower, a street lamp (extras['glow']) and a long wooden bench the cast sits on."""
    L = Location("village_night")
    r = L.root
    y0 = -3
    for i, (y, col) in enumerate(((7, "#26305E"), (12, "#1F2752"), (17, "#182043"), (23, "#121833"))):
        box(f"vn_sky{i}", -WIDE, y0, WIDE, y, col, r, -9.5 + i * 0.01, ol=0)
        y0 = y
    rnd = random.Random(21)
    for i in range(60):
        x, y = rnd.uniform(-WIDE, WIDE), rnd.uniform(13, 22.5)
        sz = rnd.uniform(0.05, 0.15)
        shape(f"vn_star{i}", star(x, y, sz * 1.8, sz * 0.6) if sz > 0.11 else ell(x, y, sz * 0.6, sz * 0.6, n=8), "#FFF4C2", r, -9.3, ol=0)
    shape("vn_moon", ell(4.8, 19.4, 1.6, 1.6), "#FFF4C2", r, -9.2, ol=0)
    shape("vn_moon_c", ell(4.3, 19.8, 0.32, 0.32), "#EFE2A8", r, -9.19, ol=0)
    tw = empty("vn_tower", r, (-0.6, 7.0), -9.0)  # clock tower behind the square
    box("vn_tower_b", -1.4, 0, 1.4, 10.2, "#2C2650", tw, 0.0)
    shape("vn_tower_roof", [(-1.8, 10.2, "s"), (1.8, 10.2, "s"), (0, 12.6, "s")], "#3B2E66", tw, 0.01, smooth=0)
    shape("vn_clock", ell(0, 8.2, 0.95, 0.95), "#FFF1C4", tw, 0.02, ol=0.07)
    stroke("vn_clock_h", [(0, 8.2), (0, 8.85)], 0.09, OFFBLACK, tw, 0.03)
    stroke("vn_clock_m", [(0, 8.2), (0.5, 8.2)], 0.07, OFFBLACK, tw, 0.03)
    windows = []
    houses = [(-20, 5.0, 6.5), (-14.5, 4.6, 8.0), (-9.4, 4.8, 6.8), (-4.6, 4.2, 7.4), (3.6, 4.4, 7.0), (8.4, 4.6, 8.4),
              (13.6, 4.8, 6.6), (19.0, 5.2, 7.8)]
    for i, (x, w_, h) in enumerate(houses):
        hs = empty(f"vn_house{i}", r, (x, 7.0), -8.6 + i * 0.01)
        col = ("#3B2F5E", "#33295A", "#40325F")[i % 3]
        box(f"vn_house{i}_b", -w_ / 2, 0, w_ / 2, h * 0.62, col, hs, 0.0)
        shape(f"vn_house{i}_roof", [(-w_ / 2 - 0.4, h * 0.62, "s"), (w_ / 2 + 0.4, h * 0.62, "s"), (0, h, "s")], "#5A2E3E", hs, 0.01, smooth=0)
        for k, (wx, wy) in enumerate(((-w_ / 4, h * 0.22), (w_ / 4, h * 0.22), (-w_ / 4, h * 0.45), (w_ / 4, h * 0.45))):
            if (i + k) % 3 == 2:
                continue
            windows.append(box(f"vn_win{i}_{k}", wx - 0.4, wy - 0.45, wx + 0.4, wy + 0.45, "#FFD66B", hs, 0.02, ol=0.05))
    L.extras["windows"] = windows
    box("vn_ground", -WIDE, -3, WIDE, 7.2, "#3A3550", r, -8.5, ol=0)
    for i in range(70):
        x, y = rnd.uniform(-WIDE, WIDE), rnd.uniform(-2.6, 6.6)
        shape(f"vn_stone{i}", ell(x, y, rnd.uniform(0.3, 0.6), rnd.uniform(0.15, 0.26)), "#45405E", r, -8.45, ol=0)
    lamp = empty("vn_lamp", r, (-7.6, 1.2), -6)
    stroke("vn_lamp_pole", [(0, 0), (0, 9.6)], 0.2, OUTLINE, lamp, 0.0)
    box("vn_lamp_head", -0.7, 9.4, 0.7, 10.8, "#FFE08A", lamp, 0.01, r=0.2)
    shape("vn_lamp_cap", [(-0.95, 10.8, "s"), (0.95, 10.8, "s"), (0, 11.6, "s")], OFFBLACK, lamp, 0.02, smooth=0)
    bench = empty("vn_bench", r, (0, 0), 10)
    box("vn_bench_seat", -6.6, 2.7, 6.6, 3.5, "#8A5A3B", bench, 0.0, r=0.2)
    box("vn_bench_front", -6.6, 3.5, 6.6, 4.6, "#7A4E2D", bench, 0.01, r=0.25)
    for x in (-5.8, 0.0, 5.8):
        box(f"vn_bench_leg{x}", x - 0.3, 0.8, x + 0.3, 2.8, OFFBLACK, bench, -0.01, ol=0)
    L.seats = [(-4.7, 4.3, 0.72, 0.0), (-1.55, 4.3, 0.72, 1.5), (1.55, 4.3, 0.72, 3.0), (4.7, 4.3, 0.72, 4.5)]
    layer(L, "far", ("vn_sky", "vn_star", "vn_moon", "vn_tower"), 0.35)
    layer(L, "mid", ("vn_house",), 0.6)
    L.extras["glow"] = glow("vn_lampglow", (-7.6, 10.1), 4.0, 4.0, "#FFD66B", 0.05, 6, r, 9.5)
    light("vn_tint", rect(-60, -30, 60, 40), "#1B2560", 0.14, r, 15, smooth=0)
    light("vn_moonbeam", [(3.0, 23, "s"), (6.6, 23, "s"), (2.4, -3, "s"), (-2.2, -3, "s")], "#BFD4FF", 0.06, r, 15.5, smooth=0)
    w, h = frame_size(L)
    vignette("vn_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.22)
    return L


def _widen_village_night(L, half):
    set_visible(bpy.data.objects["vn_bench"], False)
    bench = empty("vnw_bench", L.root, (0, 0), 10.2)
    box("vnw_bench_seat", -11.0, 2.7, 11.0, 3.5, "#8A5A3B", bench, 0.0, r=0.2)
    box("vnw_bench_front", -11.0, 3.5, 11.0, 4.6, "#7A4E2D", bench, 0.01, r=0.25)
    for x in (-10.0, -5.2, 0.0, 5.2, 10.0):
        box(f"vnw_bench_leg{x}", x - 0.3, 0.8, x + 0.3, 2.8, OFFBLACK, bench, -0.01, ol=0)
    _spread_seats(L)
    L.cam_h = (0.3, 8.8, 13.5)


# ---------- 6. Party room (room games: every phone joins with a code) ----------

def party_room():
    """The room-games set: a party room with a disco ball (extras['disco']), bunting, balloons, a wall TV showing a
    room code (extras['tv'], extras['code']) and a long orange couch. The cast hold their own phones (props.phone)."""
    L = Location("party_room")
    r = L.root
    box("pr_wall", -WIDE, -3, WIDE, 23, "#2E2457", r, -9.5, ol=0)
    for i in range(-12, 13):
        stroke(f"pr_stripe{i}", [(i * 2.0, 5.2), (i * 2.0, 23)], 0.08, "#352A63", r, -9.45)
    box("pr_wainscot", -WIDE, 1.2, WIDE, 5.2, "#251D48", r, -9.4, ol=0)
    stroke("pr_rail", [(-WIDE, 5.2), (WIDE, 5.2)], 0.12, OUTLINE, r, -9.35)
    box("pr_floor", -WIDE, -3, WIDE, 1.3, "#1F1A3A", r, -9.3)
    cols = (ORANGE, "#3D6DFF", RED, "#22B573", YELLOW, "#B48CFF")
    for i in range(-14, 15):  # light-up dance floor strip
        box(f"pr_tile{i}", i * 1.7 - 0.8, -2.8, i * 1.7 + 0.8, 1.1, cols[i % 6], r, -9.25, ol=0.04)
    tv = empty("pr_tv", r, (0.4, 15.6), -8.5)
    box("pr_tv_f", -4.4, -2.7, 4.4, 2.7, OFFBLACK, tv, 0.0, r=0.3)
    box("pr_tv_s", -4.0, -2.3, 4.0, 2.3, ORANGE, tv, 0.01, r=0.15, ol=0)
    text("pr_tv_t", "ROOM CODE", 0.7, CHALK, tv, (0, 1.2), 0.02)
    L.extras["code"] = text("pr_tv_code", "RIOT", 1.9, YELLOW, tv, (0, -0.5), 0.02)
    L.extras["tv"] = tv
    for s in (-1, 1):  # bunting from the corners to the TV
        pts = [(s * x, 21.0 - 1.6 * math.sin(math.pi * (x - 5.0) / 14.0)) for x in [5.0 + 14.0 * i / 14 for i in range(15)]]
        stroke(f"pr_string{s}", pts, 0.05, CHALK, r, -8.4)
        for i, (x, y) in enumerate(pts[:-1]):
            shape(f"pr_flag{s}{i}", [(x - 0.4 * s, y), (x + 0.4 * s, y), (x, y - 1.0)], cols[i % 6], r, -8.39, ol=0.04, smooth=0)
    disco = empty("pr_disco", r, (0.4, 21.0), -8.3)
    stroke("pr_disco_cord", [(0, 0.9), (0, 3.0)], 0.06, OUTLINE, disco, -0.01)
    shape("pr_disco_ball", ell(0, 0, 0.95, 0.95), "#C9CDD8", disco, 0.0, ol=0.06)
    for k in range(-2, 3):
        stroke(f"pr_disco_h{k}", [(-0.9 * math.cos(math.asin(k / 2.6)), k * 0.35), (0.9 * math.cos(math.asin(k / 2.6)), k * 0.35)], 0.03, "#8D93A6", disco, 0.01)
        stroke(f"pr_disco_v{k}", [(k * 0.35, -0.9 * math.cos(math.asin(k / 2.6))), (k * 0.35, 0.9 * math.cos(math.asin(k / 2.6)))], 0.03, "#8D93A6", disco, 0.01)
    L.extras["disco"] = disco
    rnd = random.Random(8)
    for i, (x, y) in enumerate(((-8.2, 14.0), (-7.0, 15.4), (-9.4, 15.8), (8.6, 14.4), (9.8, 15.6), (7.6, 16.0), (-15, 14.6), (15.5, 14.8))):
        b = empty(f"pr_balloon{i}", r, (x, y), -8.0 + i * 0.01)
        shape(f"pr_balloon{i}_b", ell(0, 0, 0.85, 1.05), cols[(i + 2) % 6], b, 0.0, ol=0.06)
        stroke(f"pr_balloon{i}_s", [(0, -1.05), (0.25, -3.0), (-0.1, -5.5)], 0.04, CHALK, b, -0.01)
    box("pr_couch_back", -6.6, 4.4, 6.6, 9.4, "#E2672A", r, -3, r=0.9)
    box("pr_couch_seat", -6.6, 2.0, 6.6, 4.7, "#F07A36", r, 10, r=0.5)
    for s in (-1, 1):
        box(f"pr_arm{s}", 6.4 * s - 0.9, 2.0, 6.4 * s + 0.9, 6.6, "#E2672A", r, 10.5, r=0.7)
    tb = empty("pr_table", r, (0, 0), 12)
    box("pr_table_top", -3.6, 0.8, 3.6, 1.5, "#4A3A80", tb, 0.0, r=0.2)
    for s in (-1, 1):
        box(f"pr_table_leg{s}", 3.0 * s - 0.2, -1.6, 3.0 * s + 0.2, 0.85, "#4A3A80", tb, -0.05)
    pz = empty("pr_pizza", tb, (-1.0, 1.55), 0.1)
    box("pr_pizza_box", -1.3, 0, 1.3, 0.35, "#F2D6A2", pz, 0.0, r=0.05)
    jb = empty("pr_cups", tb, (1.6, 1.5), 0.1)
    for k, x in enumerate((-0.45, 0.45)):
        box(f"pr_cup{k}", x - 0.3, 0.0, x + 0.3, 0.9, RED if k else "#3D6DFF", jb, 0.0, r=0.05)
    L.seats = [(-4.7, 4.6, 0.72, 0.0), (-1.55, 4.6, 0.72, 1.5), (1.55, 4.6, 0.72, 3.0), (4.7, 4.6, 0.72, 4.5)]
    layer(L, "back", ("pr_wall", "pr_stripe", "pr_wainscot", "pr_rail", "pr_floor", "pr_tile", "pr_tv", "pr_string", "pr_flag",
                      "pr_disco", "pr_balloon"), 0.85)
    for k, (col, x) in enumerate((("#FF4FD8", -6.0), ("#4FE3FF", 6.6))):
        light(f"pr_beam{k}", [(x - 1.0, 23, "s"), (x + 1.0, 23, "s"), (x * 0.2 + 3.0, -3, "s"), (x * 0.2 - 3.0, -3, "s")], col, 0.07, r, 15.5, smooth=0)
    w, h = frame_size(L)
    vignette("pr_vig", L.cam[0], L.cam[1], w, h, r, 30, 0.1)
    return L


def _widen_party_room(L, half):
    for n in ("pr_couch_back", "pr_couch_seat", "pr_arm-1", "pr_arm1"):
        set_visible(bpy.data.objects[n], False)
    r = L.root
    box("prw_couch_back", -11.0, 4.4, 11.0, 9.4, "#E2672A", r, -2.99, r=0.9)
    box("prw_couch_seat", -11.0, 2.0, 11.0, 4.7, "#F07A36", r, 10.01, r=0.5)
    for s in (-1, 1):
        box(f"prw_arm{s}", 11.0 * s - 0.9, 2.0, 11.0 * s + 0.9, 6.6, "#E2672A", r, 10.51, r=0.7)
    tv = L.extras["tv"]  # into the band above the heads
    tv.location.y, tv.scale = 13.5, (0.68, 0.68, 1)
    _spread_seats(L)
    L.cam_h = (0.0, 8.6, 13.5)  # centred: the long couch is +-11.9


# ---------- Porchlight: painted sets (Gemini paintings upscaled to 4K, in the cast's style) ----------
# Each painting is one flat background plate; the cast stands on its ground line. 16:9 only (episodes are horizontal).
# Spec: painting file, ground line and standing spots in the painting's own 1024x572 pixels, cast scale, light tint.
# the Porchlight project folder (paintings, fronts, critters); set PORCHLIGHT_DIR if it lives somewhere else
PORCHLIGHT_DIR = os.environ.get("PORCHLIGHT_DIR") or os.path.expanduser("~/Desktop/Porchlight")
PLATE_DIR = os.path.join(PORCHLIGHT_DIR, "art/hd/sets")
PLATE_SETS = {
    # cast: the set's light on the characters (colour, how much of it); night is blue, lamps and sunset are warm
    "lake":         dict(img="lake_day_v3", ground=520, xs=(250, 420, 600, 780), s=0.48, tint=("#FFB560", 0.06), cast=("#FFD9A0", 0.06), shadow=(0.11, 1.0, 0.0)),
    "lake_night":   dict(img="lake_night_v2", ground=520, xs=(250, 420, 600, 780), s=0.48, tint=("#1B2560", 0.10), cast=("#22306A", 0.42), shadow=(0.05, 1.0, 0.0), haze="#2A3570"),
    "stoop_sunset": dict(img="stoop_sunset_v2", ground=515, xs=(200, 370, 540, 680), s=0.48, tint=("#FF9A50", 0.07), cast=("#FF8A3C", 0.18), shadow=(0.13, 2.3, -1.0), haze="#FFC890"),
    "stoop_night":  dict(img="stoop_night_v2", ground=515, xs=(200, 370, 540, 680), s=0.48, tint=("#1B2560", 0.08), cast=("#2A3570", 0.36), shadow=(0.05, 1.0, 0.0), haze="#2A3570"),
    "apartment":    dict(img="apartment_night_v2", ground=545, xs=(200, 400, 620, 820), s=0.48, tint=("#FFB060", 0.05), cast=("#FFB060", 0.12), shadow=(0.08, 1.0, 0.0), haze="#E8CFA8"),
    "hall":         dict(img="hall_inside_night_v2", ground=540, xs=(250, 420, 600, 770), s=0.48, tint=("#1B2560", 0.08), cast=("#26325E", 0.45), shadow=(0.06, 1.0, 0.0), haze="#2A3570"),
    "hall_outside": dict(img="hall_outside_sunset", ground=520, xs=(250, 400, 650, 800), s=0.48, tint=("#FF9A50", 0.07), cast=("#FF8A3C", 0.18), shadow=(0.13, 2.3, 1.0), haze="#FFC890"),
    # occlusion test set (Porchlight/tools/occluders.py: auto-cut lamp posts, tree, building corner + clean plate)
    "town_square":  dict(img="town_square_night", ground=540, xs=(250, 420, 600, 780), s=0.48, tint=("#1B2560", 0.06), cast=("#2A3570", 0.30), shadow=(0.05, 1.0, 0.0), haze="#2A3570"),
    "bash_home":    dict(img="bash_room_night", ground=530, xs=(260, 430, 560, 760), s=0.48, tint=("#1B2560", 0.08), cast=("#2A3570", 0.36), shadow=(0.06, 1.0, 0.0), haze="#2A3570"),
    "classroom":    dict(img="classroom_day", ground=530, xs=(380, 500, 620, 740), s=0.48, tint=("#FFD890", 0.05), cast=("#FFD890", 0.10), shadow=(0.10, 1.4, 0.6), haze="#F2E2B8"),
    "main_street":  dict(img="main_street_day", ground=530, xs=(360, 500, 640, 780), s=0.48, tint=("#FFE0A0", 0.04), cast=("#FFF0D0", 0.06), shadow=(0.12, 1.6, -0.8), haze="#DDE8F2"),
    "brook_porch":  dict(img="brook_porch_summer", ground=530, xs=(360, 490, 620, 740), s=0.48, tint=("#FFE0A0", 0.04), cast=("#FFF0D0", 0.06), shadow=(0.10, 1.2, 0.4), haze="#E0ECF4"),
    "pip_home":     dict(img="pip_room_night", ground=545, xs=(380, 520, 660, 800), s=0.48, tint=("#1B2560", 0.06), cast=("#4A4A80", 0.28), shadow=(0.06, 1.0, 0.0), haze="#2A3570"),
    "pip_garage":   dict(img="pip_garage_one_box", ground=540, xs=(300, 420, 620, 740), s=0.48, tint=("#1B2560", 0.08), cast=("#3A4A7A", 0.34), shadow=(0.07, 1.0, 0.0), haze="#2A3570"),
    "school_gym":   dict(img="school_gym", ground=455, xs=(380, 465, 560, 645), s=0.40, depth=(0, 24, 6, 30), tint=("#FFD9A0", 0.05), cast=("#FFE6B8", 0.08), shadow=(0.10, 1.0, 0.0), haze="#F2E2B8"),  # Eps 6, 16, 32 (12 Nov 2026)
    "park":         dict(img="park_day", ground=505, xs=(300, 440, 580, 720), s=0.48, tint=("#FFE0A0", 0.04), cast=("#FFF0D0", 0.06), shadow=(0.12, 1.6, -0.8), haze="#DDE8F2"),
}
PLATE_O = 13.5    # default frame height (ortho), same as the Friendzy sets' 16:9 framing
PLATE_BLEED = 1.08  # the painting is a little bigger than the frame, so close-ups and camera drift stay inside it


def plate_xy(name, px, py):
    """Painting pixel (1024x572 space) -> set units."""
    h = PLATE_O * PLATE_BLEED
    return ((px / 1024 - 0.5) * h * 16 / 9, PLATE_O / 2 - h / 2 + (1 - py / 572) * h)


class PlateLocation(Location):
    """A painted set. Besides the four standing spots it has named spots from the painting's JSON (art/hd/sets):
    "stand" (feet on a surface, e.g. inside the tower) and "sit" (hips on a seat: thighs foreshortened, no floor shadow)."""
    def seat(self, c, i):
        Location.seat(self, c, i)
        import roster
        h = roster.profile(c.name)["height"]  # heights from the roster: Bash biggest, Pip smallest
        c.root.scale = (c.root.scale.x * h, c.root.scale.y * h, 1)
        kind = self.spot_kind[i]
        c.extras["spot_kind"] = kind
        c.extras["spot_depth"] = self.spot_depth[i] if i < len(self.spot_depth) else 0
        if kind == "sit":  # front-view sitting: the knees come toward us, so the legs read much shorter
            for side_, leg in c.legs.items():
                leg.scale.y = 0.5
                leg.rotation_euler.z = 0.16 * side_  # knees a little apart
                fill = next((o for o in leg.children if "hex" in o), None)
                if fill is not None:  # the knee comes toward us: a round bump in front of the hoodie hem
                    knee = shape(f"{c.name}_knee{side_}", ell(0.05 * side_, -0.15, 0.62, 0.5), fill["hex"], leg, 0.45)
                    knee.scale.y = 2.0  # undo the leg's 0.5 squash so the knee stays round
        return c


def plate(name):
    """A painted Porchlight set: the 4K plate, four standing spots on its ground line, the named spots and front pieces
    from its JSON (sofa fronts, tower railing, foreground plants), and its light tint.
    Depth bands: seats 0.5-1, front pieces 2-3, standing spots 4-7, foreground plants 9."""
    sp = PLATE_SETS[name]
    L = PlateLocation(name)
    h = PLATE_O * PLATE_BLEED
    ppu = 2160 / h
    plate_png = os.path.join(PLATE_DIR, sp["img"] + ".png")
    if not os.path.exists(plate_png):
        raise SystemExit(f"painted set {name!r}: {plate_png} not found (set PORCHLIGHT_DIR to the Porchlight folder)")
    spec_path = os.path.join(PLATE_DIR, sp["img"] + ".json")
    spec = json.load(open(spec_path)) if os.path.exists(spec_path) else {}
    lay = spec.get("layers") if PARALLAX_LAYERS else None
    lay_png = {k: os.path.join(PLATE_DIR, "layers", f"{sp['img']}_{k}.png") for k in ("far", "mid", "near")}
    if lay and all(os.path.exists(p_) for p_ in lay_png.values()):
        # depth layers (Blender/tools/depth_layers.py): the far layer trails the camera, the mid layer (the ground
        # the cast stands on) stays put, the near layer runs ahead; a push-in grows them by different amounts too
        far_ = img(f"{name}_plate", lay_png["far"], L.root, (1920, 1080), ppu, -9.5, loc=(0, PLATE_O / 2))
        img(f"{name}_mid", lay_png["mid"], L.root, (1920, 1080), ppu, -9.38, loc=(0, PLATE_O / 2))
        near_ = img(f"{name}_near", lay_png["near"], L.root, (1920, 1080), ppu, -9.36 if lay.get("near_behind") else 9.1,
                    loc=(0, PLATE_O / 2))
        for o_, k_ in ((far_, "far"), (near_, "near")):
            o_["depth_zoom"] = 1
            L.parallax.append((o_, float(lay.get(k_, 0.82 if k_ == "far" else 1.22))))
    else:
        clean_png = os.path.join(PLATE_DIR, spec["clean"] + ".png") if spec.get("clean") else None
        if clean_png and os.path.exists(clean_png):  # occluders.py: the plate with its cut-out occluders painted out
            plate_png = clean_png
        img(f"{name}_plate", plate_png, L.root, (1920, 1080), ppu, -9.5, loc=(0, PLATE_O / 2))
    s = sp["s"]
    # depth staging: spots step back alternately (painting px up from the ground line), smaller and further back
    depth = sp.get("depth", (0, 30, 8, 38))
    L.seats, L.spot_depth = [], []
    for i, px in enumerate(sp["xs"]):
        dy = depth[i % len(depth)]
        L.spot_depth.append(dy)
        k = s * (1 - 0.004 * dy)
        L.seats.append((plate_xy(name, px, 0)[0], plate_xy(name, 0, sp["ground"] - dy)[1] + 3.2 * k, k, 7.0 - dy / 10))
    L.spot_kind = ["stand"] * len(L.seats)
    L.spot_names = {f"s{i}": i for i in range(len(L.seats))}
    for spot, sv in spec.get("spots", {}).items():
        px, py, kind, sc_, z = sv[:5]  # optional 6th value "away": a seat facing away from us (nobody sits there)
        x, y = plate_xy(name, px, py)
        if len(sv) > 5 and sv[5] == "away":
            L.spot_away = getattr(L, "spot_away", set()) | {len(L.seats)}
        L.spot_names[spot] = len(L.seats)
        L.seats.append((x, y + (3.2 * sc_ if kind == "stand" else 0.0), sc_, z))
        L.spot_kind.append(kind)
    L.life = spec.get("life", {})
    L.light_from = spec.get("light_from", "left")  # which side the painting's light comes from (shading on the cast)
    L.rim = spec.get("rim")  # rim light colour on the cast; None: the scene picks (moonlight at night, warm at sunset)
    L.lamps = []
    for px, py, col, r_px, strength in spec.get("lamps", []):  # [px, py, colour, radius in painting px, strength]
        lx, ly = plate_xy(name, px, py)
        L.lamps.append((lx, ly, col, r_px * h / 572, strength))
        glow(f"{name}_lamp{len(L.lamps)}", (lx, ly), r_px * h / 572 * 0.5, r_px * h / 572 * 0.5, col, 0.012, 40, L.root, 9.0)
    for fr in spec.get("fronts", []):
        path = os.path.join(PLATE_DIR, "..", "fronts", f"{sp['img']}_{fr['name']}.png")
        if os.path.exists(path):  # made by Porchlight/tools/fronts.py
            o = img(f"{name}_front_{fr['name']}", path, L.root, (1920, 1080), ppu, fr["z"], loc=(0, PLATE_O / 2))
            if PARALLAX_FRONTS and fr["z"] >= 8.5:  # foreground pieces (plants in front of everyone) slide a little
                L.parallax.append((o, 1.15))       # faster than the painting as the camera moves: 2.5D depth
    L.seat_half = BODY_HALF * s / 0.72
    L.cam = L.cam_h = (0.0, PLATE_O / 2, PLATE_O)
    light(f"{name}_tint", rect(-60, -30, 60, 40), sp["tint"][0], sp["tint"][1], L.root, 15, smooth=0)
    L.extras["plate"] = sp
    return L


LIFE = {  # particle looks for painted sets: colour, size (units), glow radius, drift speed, blinks
    "fireflies": ("#D8FF7A", 0.07, 0.45, 0.025, True),
    "dust":      ("#E8F0FF", 0.035, 0.0, 0.008, False),
}


def plate_life(L, f0, f1, step=2):
    """Bring a painted set to life from its JSON "life": particles (fireflies, dust) drifting in an area, water
    shimmer (short glints that fade in and out), twinkling bulbs, and a breeze on the foreground plants."""
    life = getattr(L, "life", {})
    name = L.name
    rnd = random.Random(len(name))
    frames = range(f0, f1 + 1, step)
    for kind in ("fireflies", "dust"):
        if kind not in life:
            continue
        col, size, gr, speed, blink = LIFE[kind]
        (x0, y0), (x1, y1) = plate_xy(name, *life[kind]["area"][:2]), plate_xy(name, *life[kind]["area"][2:])
        for i in range(life[kind].get("n", 8)):
            g = empty(f"{name}_{kind}{i}", L.root, (0, 0), 9.5)
            shape(f"{name}_{kind}{i}_dot", ell(0, 0, size, size, n=10), col, g, 0.0, ol=0)
            if gr:
                glow(f"{name}_{kind}{i}_glow", (0, 0), gr, gr, col, 0.05, 6, g, -0.01)
            bx, by, ph = rnd.uniform(x0, x1), rnd.uniform(min(y0, y1), max(y0, y1)), rnd.uniform(0, 100)
            for fr in frames:
                g.location.x = bx + 1.6 * _wobble(fr * speed * 10 + ph, i + 7, 0.1)
                g.location.y = by + 0.9 * _wobble(fr * speed * 10 + ph, i + 31, 0.13)
                on = (0.5 + 0.5 * math.sin(fr * 0.07 + ph)) if blink else 0.6 + 0.4 * math.sin(fr * 0.03 + ph)
                k = max(0.0001, on)
                g.scale = (k, k, 1)
                g.keyframe_insert("location", frame=fr)
                g.keyframe_insert("scale", frame=fr)
    for sk in ("shimmer", "shore"):  # glints on open water; "shore": a moving foam line where water meets sand
        if sk not in life:
            continue
        sh = life[sk]
        (x0, y0), (x1, y1) = plate_xy(name, *sh["area"][:2]), plate_xy(name, *sh["area"][2:])
        for i in range(sh.get("n", 20)):
            bx, by = rnd.uniform(x0, x1), rnd.uniform(min(y0, y1), max(y0, y1))
            w = rnd.uniform(0.25, 0.6)
            g = empty(f"{name}_{sk}{i}", L.root, (bx, by), 1.2)
            light(f"{name}_{sk}{i}_s", rect(-w, -0.025, w, 0.025), sh.get("color", "#FFFFFF"), sh.get("alpha", 0.55), g, 0.0, smooth=0)
            per, ph = rnd.uniform(50, 90), rnd.uniform(0, 100)
            for fr in frames:
                t = ((fr + ph) % per) / per
                k = max(0.0001, math.sin(math.pi * t))
                g.scale = (k, k, 1)
                g.location.x = bx + 0.3 * t
                g.keyframe_insert("scale", frame=fr)
                g.keyframe_insert("location", index=0, frame=fr)
    if "dapple" in life:  # light through leaves / off the water: soft blobs drifting over the ground and the cast
        dp = life["dapple"]
        (x0, y0), (x1, y1) = plate_xy(name, *dp["area"][:2]), plate_xy(name, *dp["area"][2:])
        for i in range(dp.get("n", 10)):
            bx, by = rnd.uniform(x0, x1), rnd.uniform(min(y0, y1), max(y0, y1))
            rx = rnd.uniform(0.5, 1.2)
            g = empty(f"{name}_dapple{i}", L.root, (bx, by), 8.5)
            light(f"{name}_dapple{i}_s", ell(0, 0, rx, rx * 0.45, n=24), dp.get("color", "#1A1208"), dp.get("alpha", 0.08), g, 0.0)
            ph = rnd.uniform(0, 100)
            for fr in frames:
                g.location.x = bx + 0.35 * _wobble(fr + ph, i + 71, 0.05)
                g.location.y = by + 0.12 * _wobble(fr + ph, i + 91, 0.06)
                g.keyframe_insert("location", frame=fr)
    if "birds" in life:  # little V-shaped birds crossing the sky, flapping, now and then
        bd = life["birds"]
        (x0, y0), (x1, y1) = plate_xy(name, *bd["area"][:2]), plate_xy(name, *bd["area"][2:])
        for i in range(bd.get("n", 3)):
            g = empty(f"{name}_bird{i}", L.root, (x0, y0), -9.0)
            w = empty(f"{name}_bird{i}_w", g, (0, 0), 0.0)
            stroke(f"{name}_bird{i}_s", [(-0.28, 0.12), (-0.1, 0.0), (0.0, -0.04), (0.1, 0.0), (0.28, 0.12)], 0.05, "#2A2A3A", w, 0.0)
            by, per, ph = rnd.uniform(min(y0, y1), max(y0, y1)), rnd.uniform(300, 520), rnd.uniform(0, 1)
            for fr in frames:
                u = (fr / per + ph) % 1.0  # absolute frames: parallel render jobs agree
                g.location.x = x0 + (x1 - x0) * u
                g.location.y = by + 0.4 * math.sin(u * 9 + i)
                w.scale.y = 0.4 + 0.6 * abs(math.sin(fr * 0.5 + i))  # wing flap
                g.keyframe_insert("location", frame=fr)
                w.keyframe_insert("scale", index=1, frame=fr)
    if "moths" in life:  # moths circling the lamps at night
        for j, (px, py) in enumerate(life["moths"]):
            cx_, cy_ = plate_xy(name, px, py)
            for i in range(3):
                g = empty(f"{name}_moth{j}_{i}", L.root, (cx_, cy_), 9.6)
                shape(f"{name}_moth{j}_{i}_s", ell(0, 0, 0.05, 0.035, n=8), "#F4ECD8", g, 0.0, ol=0)
                ph, r_ = rnd.uniform(0, 6.28), rnd.uniform(0.25, 0.6)
                for fr in frames:
                    a_ = fr * 0.21 + ph
                    g.location.x = cx_ + r_ * math.cos(a_) + 0.1 * math.sin(fr * 0.9 + i)
                    g.location.y = cy_ + 0.6 * r_ * math.sin(a_ * 1.3)
                    g.keyframe_insert("location", frame=fr)
    if "steam" in life:  # thin wisps rising from mugs, bowls, chimneys
        for j, (px, py) in enumerate(life["steam"]):
            cx_, cy_ = plate_xy(name, px, py)
            for i in range(3):
                g = empty(f"{name}_steam{j}_{i}", L.root, (cx_, cy_), 9.4)
                light(f"{name}_steam{j}_{i}_s", ell(0, 0, 0.12, 0.2, n=16), "#FFFFFF", 0.25, g, 0.0)
                off_ = i * 20
                for fr in frames:
                    t_ = ((fr + off_) % 60) / 60
                    g.location.x = cx_ + 0.12 * math.sin(fr * 0.12 + i * 2)
                    g.location.y = cy_ + 1.1 * t_
                    k_ = max(0.0001, math.sin(math.pi * t_))
                    g.scale = (k_ * (1 + t_), k_ * (1 + t_), 1)
                    g.keyframe_insert("location", frame=fr)
                    g.keyframe_insert("scale", frame=fr)
    if "leaves" in life:  # a leaf now and then, drifting down and sideways
        lv = life["leaves"]
        (x0, y0), (x1, y1) = plate_xy(name, *lv["area"][:2]), plate_xy(name, *lv["area"][2:])
        for i in range(lv.get("n", 3)):
            g = empty(f"{name}_leaf{i}", L.root, (x0, y0), 9.7)
            shape(f"{name}_leaf{i}_s", [(0, 0.12), (0.09, 0), (0, -0.12, "s"), (-0.09, 0)], lv.get("color", "#6A9A3A"), g, 0.0, ol=0.02)
            bx, per, ph = rnd.uniform(x0, x1), rnd.uniform(160, 260), rnd.uniform(0, 1)
            for fr in frames:
                u = (fr / per + ph) % 1.0  # absolute frames: parallel render jobs agree
                g.location.x = bx + 1.5 * u + 0.4 * math.sin(u * 12)
                g.location.y = max(y0, y1) - (abs(y1 - y0)) * u
                g.rotation_euler.z = math.sin(u * 10 + i) * 1.2
                g.keyframe_insert("location", frame=fr)
                g.keyframe_insert("rotation_euler", index=2, frame=fr)
    if "twinkle" in life:
        for i, (px, py) in enumerate(life["twinkle"]):
            x, y = plate_xy(name, px, py)
            g = empty(f"{name}_bulb{i}", L.root, (x, y), 1.1)
            glow(f"{name}_bulb{i}_g", (0, 0), 0.22, 0.22, "#FFE7A0", 0.06, 8, g, 0.0)
            ph = rnd.uniform(0, 100)
            for fr in frames:
                k = 0.75 + 0.25 * math.sin(fr * 0.09 + ph) + 0.15 * _wobble(fr, i + 3, 0.4)
                g.scale = (k, k, 1)
                g.keyframe_insert("scale", frame=fr)
    for fname in life.get("sway", []):  # a light breeze: foreground plants drift a touch side to side
        o = bpy.data.objects.get(f"{name}_front_{fname}")
        if o is None:
            continue
        x0_ = o.location.x
        ph = rnd.uniform(0, 6)
        for fr in frames:
            o.location.x = x0_ + 0.04 * math.sin(fr * 0.05 + ph) + 0.015 * _wobble(fr, len(fname), 0.2)
            o.keyframe_insert("location", index=0, frame=fr)
    more_life(L, life, frames, rnd)
    for i in range(len(getattr(L, "lamps", ()))):  # lamp glows breathe very slightly, like a real bulb
        o = bpy.data.objects.get(f"{name}_lamp{i + 1}")
        if o is not None:
            _keys(o, frames, lambda fr, o=o, i=i: setattr(o, "scale", (1 + 0.035 * _wobble(fr, 40 + i, 0.6),) * 2 + (1,)), ("scale",))


def _area(name, spec):
    (x0, y0), (x1, y1) = plate_xy(name, *spec["area"][:2]), plate_xy(name, *spec["area"][2:])
    return x0, min(y0, y1), x1, max(y0, y1)


def _keys(o, frames, fn, paths=("location", "scale")):
    """Key o on every frame in frames: fn(fr) sets its transforms."""
    for fr in frames:
        fn(fr)
        for p_ in paths:
            o.keyframe_insert(p_, frame=fr)


def more_life(L, life, frames, rnd):
    """The rest of a painted set's life, each from its JSON "life" (positions in painting pixels, so every effect
    sits where the painting has room for it). All motion is a function of the absolute frame, so parallel render
    jobs agree where they meet.
      clouds {area, n}: soft clouds drifting        ripples {area, n}: long slow light lines on water
      townsfolk {path: [x0, y, x1], n}: tiny far-off walkers     bike {path: [x0, y, x1]}: a bike now and then
      stars {area, n}: twinkling        moon [x, y, r]: a soft breathing glow      porchlights [[x, y], ...]: far lights
      dragonflies {area, n}      fish {area}: a ring now and then      pollen {area, n}: drifting seeds
      fog {area, n}: low drifting fog      flicker [[x, y, r], ...]: a TV's light on a wall
      heat {area}: shimmer over hot sand      puddles [[x, y, w], ...]: wet ground catching the light"""
    name = L.name
    h_ = PLATE_O * PLATE_BLEED / 572  # set units per painting px
    if "clouds" in life:
        x0, y0, x1, y1 = _area(name, life["clouds"])
        for i in range(life["clouds"].get("n", 3)):
            g = empty(f"{name}_cloud{i}", L.root, (x0, y0), -9.3)
            w = rnd.uniform(1.2, 2.2)
            for j, (dx, dy, r) in enumerate(((-0.6, 0, 0.55), (0, 0.18, 0.75), (0.65, 0.02, 0.5))):
                light(f"{name}_cloud{i}_{j}", ell(dx * w, dy * w, r * w, r * w * 0.6, n=28), "#FFFFFF", 0.55, g, j * 1e-3)
            by, ph, sp = rnd.uniform(y0, y1), rnd.uniform(0, 1), life["clouds"].get("speed", 0.0015)
            _keys(g, frames, lambda fr, g=g, by=by, ph=ph, sp=sp: setattr(g, "location", (x0 + (x1 - x0) * ((fr * sp + ph) % 1.0), by, -9.3)), ("location",))
    if "ripples" in life:
        x0, y0, x1, y1 = _area(name, life["ripples"])
        for i in range(life["ripples"].get("n", 8)):
            g = empty(f"{name}_ripple{i}", L.root, (0, 0), 1.15)
            wv = rnd.uniform(0.8, 1.6)
            stroke(f"{name}_ripple{i}_s", [(-wv, 0), (-wv / 2, 0.04), (0, 0), (wv / 2, -0.04), (wv, 0)], 0.035, "#FFFFFF", g, 0.0)
            bx, by, per, ph = rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(90, 150), rnd.uniform(0, 1)
            def rp(fr, g=g, bx=bx, by=by, per=per, ph=ph):
                u = (fr / per + ph) % 1.0
                k = max(0.0001, math.sin(math.pi * u))
                g.location = (bx + 0.6 * u, by, 1.15)
                g.scale = (k, 1, 1)
            _keys(g, frames, rp)
    if "townsfolk" in life:
        x0p, yp, x1p = life["townsfolk"]["path"]
        (x0, y_), (x1, _) = plate_xy(name, x0p, yp), plate_xy(name, x1p, yp)
        cols = ("#6A6F86", "#7D6A5E", "#5E7A6A", "#8A6F7E")
        for i in range(life["townsfolk"].get("n", 2)):
            sz = life["townsfolk"].get("size", 30) * h_ / 4.0
            g = empty(f"{name}_folk{i}", L.root, (x0, y_), -9.2)
            col = cols[i % len(cols)]
            shape(f"{name}_folk{i}_b", ell(0, 1.4, 0.9, 1.3), col, g, 0.0, ol=0)
            shape(f"{name}_folk{i}_h", ell(0, 3.2, 0.75, 0.7), col, g, 0.001, ol=0)
            for s_ in (-1, 1):
                shape(f"{name}_folk{i}_e{s_}", ell(0.45 * s_, 3.9, 0.22, 0.38), col, g, 0.0005, ol=0)
            g.scale = (sz, sz, 1)
            per, ph, d = rnd.uniform(500, 800), rnd.uniform(0, 1), 1 if i % 2 == 0 else -1
            def fk(fr, g=g, per=per, ph=ph, d=d, sz=sz):
                u = (fr / per + ph) % 1.0
                xa, xb = (x0, x1) if d > 0 else (x1, x0)
                g.location = (xa + (xb - xa) * u, y_ + 0.06 * sz * abs(math.sin(fr * 0.35)), -9.2)
                g.scale = (sz * d, sz, 1)
            _keys(g, frames, fk)
    if "bike" in life:
        x0p, yp, x1p = life["bike"]["path"]
        (x0, y_), (x1, _) = plate_xy(name, x0p, yp), plate_xy(name, x1p, yp)
        g = empty(f"{name}_bike", L.root, (x0, y_), -9.15)
        sz = life["bike"].get("size", 30) * h_ / 3.0
        for s_ in (-1, 1):
            stroke(f"{name}_bike_w{s_}", [(1.0 * s_ + math.cos(2 * math.pi * j / 20) * 0.55, 0.55 + math.sin(2 * math.pi * j / 20) * 0.55) for j in range(21)], 0.12, "#3A3F55", g, 0.0)
        stroke(f"{name}_bike_f", [(-1.0, 0.55), (-0.1, 1.5), (1.0, 0.55), (0.1, 0.6), (-1.0, 0.55)], 0.12, "#3A3F55", g, 0.0)
        shape(f"{name}_bike_r", ell(-0.1, 2.4, 0.5, 0.8), "#6A5F80", g, 0.001, ol=0)
        g.scale = (sz, sz, 1)
        per = life["bike"].get("every", 900)
        def bk(fr):
            u = (fr % per) / 120.0
            g.location = (x0 + (x1 - x0) * min(1.0, u), y_, -9.15)
            g.scale = (sz if u < 1.0 else 0.0001, sz, 1)
        _keys(g, frames, bk)
    if "stars" in life:
        x0, y0, x1, y1 = _area(name, life["stars"])
        for i in range(life["stars"].get("n", 18)):
            g = empty(f"{name}_star{i}", L.root, (rnd.uniform(x0, x1), rnd.uniform(y0, y1)), -9.35)
            shape(f"{name}_star{i}_s", ell(0, 0, 0.045, 0.045, n=8), "#FFF6D8", g, 0.0, ol=0)
            ph, sp = rnd.uniform(0, 6.28), rnd.uniform(0.04, 0.11)
            _keys(g, frames, lambda fr, g=g, ph=ph, sp=sp: setattr(g, "scale", (max(0.2, 0.7 + 0.5 * math.sin(fr * sp + ph)),) * 2 + (1,)), ("scale",))
    if "moon" in life:
        mx_, my_ = plate_xy(name, *life["moon"][:2])
        r_ = life["moon"][2] * h_
        g = empty(f"{name}_moonglow", L.root, (mx_, my_), -9.36)
        glow(f"{name}_moonglow_g", (0, 0), r_ * 2.2, r_ * 2.2, "#E8EEFF", 0.02, 30, g, 0.0)
        _keys(g, frames, lambda fr: setattr(g, "scale", (1 + 0.06 * math.sin(fr * 0.02),) * 2 + (1,)), ("scale",))
    for i, (px, py) in enumerate(life.get("porchlights", [])):
        g = empty(f"{name}_farlight{i}", L.root, plate_xy(name, px, py), -9.3)
        glow(f"{name}_farlight{i}_g", (0, 0), 0.16, 0.16, "#FFD27A", 0.08, 6, g, 0.0)
        ph = rnd.uniform(0, 6.28)
        _keys(g, frames, lambda fr, g=g, ph=ph: setattr(g, "scale", ((0.85 + 0.15 * math.sin(fr * 0.13 + ph)) * (0.3 if (fr + int(ph * 40)) % 211 < 3 else 1),) * 2 + (1,)), ("scale",))
    if "dragonflies" in life:
        x0, y0, x1, y1 = _area(name, life["dragonflies"])
        for i in range(life["dragonflies"].get("n", 2)):
            g = empty(f"{name}_fly{i}", L.root, (x0, y0), 9.4)
            shape(f"{name}_fly{i}_b", rect(-0.2, -0.025, 0.2, 0.025), "#2A6A7A", g, 0.0, ol=0, smooth=0)
            wg = empty(f"{name}_fly{i}_w", g, (0, 0), 0.001)
            light(f"{name}_fly{i}_wl", ell(0, 0.08, 0.1, 0.13), "#E8F8FF", 0.6, wg, 0.0)
            bx, by, ph = rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(0, 100)
            def df(fr, g=g, wg=wg, bx=bx, by=by, ph=ph):
                t = fr * 0.02 + ph  # darts: holds still, then zips to a new spot
                hop = math.floor(t)
                u = min(1.0, (t - hop) * 4)
                xa = bx + 1.2 * _wobble(hop, i + 5, 1.0)
                xb = bx + 1.2 * _wobble(hop + 1, i + 5, 1.0)
                g.location = (xa + (xb - xa) * u, by + 0.5 * _wobble(hop + u, i + 9, 1.0), 9.4)
                wg.scale = (1, 0.3 + 0.7 * abs(math.sin(fr * 2.1)), 1)
                wg.keyframe_insert("scale", frame=fr)
            _keys(g, frames, df, ("location",))
    if "fish" in life:
        x0, y0, x1, y1 = _area(name, life["fish"])
        for k in range(3):
            g = empty(f"{name}_fish{k}", L.root, (0, 0), 1.18)
            stroke(f"{name}_fish{k}_s", [(math.cos(2 * math.pi * j / 32), 0.25 * math.sin(2 * math.pi * j / 32)) for j in range(33)], 0.03, "#E8F4FF", g, 0.0)
            per = life["fish"].get("every", 420) + k * 97
            px_, py_ = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
            def fs(fr, g=g, per=per, px_=px_, py_=py_):
                u = (fr % per) / 45.0
                g.location = (px_, py_, 1.18)
                g.scale = ((0.15 + 0.9 * u) if u < 1 else 0.0001, (0.15 + 0.9 * u) if u < 1 else 0.0001, 1)
            _keys(g, frames, fs)
    if "pollen" in life:
        x0, y0, x1, y1 = _area(name, life["pollen"])
        for i in range(life["pollen"].get("n", 10)):
            g = empty(f"{name}_pollen{i}", L.root, (x0, y0), 9.3)
            shape(f"{name}_pollen{i}_s", ell(0, 0, 0.04, 0.04, n=8), "#FFF8E0", g, 0.0, ol=0)
            bx, by, ph, per = rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(0, 1), rnd.uniform(400, 700)
            def pl(fr, g=g, bx=bx, by=by, ph=ph, per=per):
                u = (fr / per + ph) % 1.0
                g.location = (bx + (x1 - x0) * 0.3 * u + 0.3 * math.sin(fr * 0.04 + ph * 6), by + 0.4 * math.sin(fr * 0.03 + ph * 9), 9.3)
            _keys(g, frames, pl, ("location",))
    if "fog" in life:
        x0, y0, x1, y1 = _area(name, life["fog"])
        for i in range(life["fog"].get("n", 4)):
            g = empty(f"{name}_fog{i}", L.root, (0, 0), 8.6)
            light(f"{name}_fog{i}_s", ell(0, 0, rnd.uniform(3.0, 5.0), rnd.uniform(0.5, 0.9), n=40), "#B8C4E0", 0.07, g, 0.0)
            by, ph, sp = rnd.uniform(y0, y1), rnd.uniform(0, 1), rnd.uniform(0.0006, 0.0012)
            _keys(g, frames, lambda fr, g=g, by=by, ph=ph, sp=sp: setattr(g, "location", (x0 + (x1 - x0) * ((fr * sp + ph) % 1.0), by, 8.6)), ("location",))
    for i, (px, py, r) in enumerate(life.get("flicker", [])):
        g = empty(f"{name}_tv{i}", L.root, plate_xy(name, px, py), 1.3)
        glow(f"{name}_tv{i}_g", (0, 0), r * h_, r * h_ * 0.7, "#9FC4FF", 0.02, 20, g, 0.0)
        _keys(g, frames, lambda fr, g=g: setattr(g, "scale", ((0.8 + 0.25 * (_wobble(fr, 61, 1.3) > 0.2) + 0.1 * _wobble(fr, 67, 2.0)),) * 2 + (1,)), ("scale",))
    if "heat" in life:
        x0, y0, x1, y1 = _area(name, life["heat"])
        for i in range(6):
            g = empty(f"{name}_heat{i}", L.root, (0, 0), 1.25)
            light(f"{name}_heat{i}_s", [(x, 0.05 * math.sin(x * 4)) for x in [v / 10 for v in range(-15, 16)]] +
                  [(x, 0.05 * math.sin(x * 4) - 0.04) for x in [v / 10 for v in range(15, -16, -1)]], "#FFFFFF", 0.05, g, 0.0, smooth=0)
            bx, ph = rnd.uniform(x0, x1), rnd.uniform(0, 1)
            def ht(fr, g=g, bx=bx, ph=ph):
                u = (fr / 140 + ph) % 1.0
                g.location = (bx, y0 + (y1 - y0) * u, 1.25)
                g.scale = (1, max(0.0001, math.sin(math.pi * u)), 1)
            _keys(g, frames, ht)
    for i, (px, py, w) in enumerate(life.get("puddles", [])):
        x_, y_ = plate_xy(name, px, py)
        g = empty(f"{name}_puddle{i}", L.root, (x_, y_), -0.85)
        light(f"{name}_puddle{i}_s", ell(0, 0, w * h_ / 2, w * h_ / 9, n=36), "#9FB8D8", 0.35, g, 0.0)
        gl_ = empty(f"{name}_puddle{i}_gl", g, (0, 0), 0.01)
        light(f"{name}_puddle{i}_gls", rect(-w * h_ / 8, -0.02, w * h_ / 8, 0.02), "#FFFFFF", 0.6, gl_, 0.0, smooth=0)
        ph = rnd.uniform(0, 6.28)
        def pd(fr, gl_=gl_, ph=ph, w=w):
            gl_.location.x = w * h_ / 5 * math.sin(fr * 0.02 + ph)
            gl_.scale = (0.6 + 0.4 * abs(math.sin(fr * 0.05 + ph)), 1, 1)
        _keys(gl_, frames, pd)


def light_cast(c, color, amount):
    """Relight a character for a painted set: every flat colour moves `amount` toward the set's light colour.
    Each character gets its own material copies, so the same character on a day set keeps its colours."""
    if amount <= 0:
        return
    tr, tg, tb = (lin(int(color[i:i + 2], 16) / 255) for i in (1, 3, 5))
    for o in [c.root] + list(c.root.children_recursive):
        for slot in getattr(o, "material_slots", ()):
            m = slot.material
            if not m or m.name.startswith("img:"):
                continue
            key = f"{m.name}~{color}{amount:.2f}"
            n = bpy.data.materials.get(key)
            if not n:
                n = m.copy()
                n.name = key
                r, g, b, a = m.diffuse_color
                n.diffuse_color = (r + (tr - r) * amount, g + (tg - g) * amount, b + (tb - b) * amount, a)
            slot.material = n


def _widen_plate(L, half):
    pass  # painted sets are already 16:9


def ground_shadow(c, alpha=0.1, stretch=1.0, dx=0.0):
    """Soft shadow under a standing character on a painted set; follows the character. The time of day shapes it:
    `stretch` > 1 and a sideways `dx` make a long low-sun shadow, a small `alpha` a faint night one."""
    g = empty(f"{c.name}_gshadow", c.root, (dx * 2.4 * (stretch - 1), 0.05), -0.9)
    for i in range(6):
        k = 1 - i / 6
        light(f"{c.name}_gshadow{i}", ell(0, 0, 2.4 * k * stretch, 0.33 * k, n=40), "#3A2410", alpha, g, i * 1e-3)
    return g
