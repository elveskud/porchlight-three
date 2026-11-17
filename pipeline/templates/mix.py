# Builds a video's soundtrack from its cues.json (generated SFX + music bed + voices) and masters it.
#   ../voices/.venv/bin/python mix.py <video dir>
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "../audio"))
import sfxkit as K

SOUNDS = {
    "pop": K.pop, "whoosh": K.whoosh, "swish": K.swish, "slam": K.slam, "stamp": K.stamp, "card_flip": K.card_flip,
    "ting": K.ting, "sparkle": K.sparkle, "boing": K.boing, "slide_up": lambda: K.slide_whistle(True),
    "slide_down": lambda: K.slide_whistle(False), "drumroll": K.drumroll, "crash": K.crash, "boom": K.boom,
    "scratch": K.scratch, "tick": K.tick, "slurp": K.slurp, "crunch": K.crunch, "popper": K.popper, "tap": K.tap,
    "sting_dun_dun_dunnn": K.dun_dun_dunnn, "sting_fanfare": K.fanfare, "sting_sad_trombone": K.sad_trombone,
    "sting_suspense": lambda: K.suspense(3.0), "whistle": K.whistle, "buzzer": K.buzzer,
    "click": K.tap, "thunk": lambda: K.slam(0.5), "spray": K.spray,
    "drumroll_short": lambda: K.drumroll(0.55),
    "thud_big": lambda: K.thud_at(0.7), "thud_small": lambda: K.thud_at(1.4), "gasp": K.gasp, "smack": K.smack, "crowd_ooh": K.crowd_ooh,
    "door": K.door, "slap": K.slap, "splash": K.splash, "thud": K.thud, "rustle": K.rustle, "bark": K.bark, "bell": K.bell,
    "theme_long": K.theme_long,
    "breath": K.breath, "theme": K.theme,
    **{f"step_{k}{i}": (lambda k=k, i=i: K.footstep(k, 61 + i)) for k in ("wood", "sand", "stone") for i in range(4)},  # surfaces
    **{f"rise{k}": (lambda k=k: K.ting(0.8 + 0.2 * k)) for k in range(1, 5)},  # each phone a step higher
}

def seamless(make, d=8.0, fade=1.0):
    """A loop of `d` seconds that repeats without a click or a jump: render a little extra and blend that tail
    into the start (equal power), so the loop's end runs straight into its beginning."""
    x = make(d + fade)
    n, f = int(d * K.SR), int(fade * K.SR)
    loop = x[:n].copy()
    u = np.linspace(0, 1, f, endpoint=False)
    loop[:f] = x[:f] * np.sin(0.5 * np.pi * u) + x[n:n + f] * np.cos(0.5 * np.pi * u)
    return loop


out = sys.argv[1]
cues = json.load(open(os.path.join(out, "cues.json")))
length = (cues["END"] + 1) / 30
mix = K.Mix(length)
for name, at, gain in cues.get("sfx", []):
    mix.add(SOUNDS[name](), at, gain)
XFADE = 0.5  # room tones overlap by this much at a change of place, one fading out while the next fades in
for name, at, gain, *span in cues.get("ambience", []):  # optional 4th value: how long it lasts
    d = span[0] if span else length
    if name in K.ROOMS and span:
        d += XFADE  # starts XFADE/2 early and ends XFADE/2 late, so neighbouring tones overlap
    amb = {"fire": K.fire, "road": lambda d: K.norm(K.filt(K.brown(d, 3), "lp", 160), 0.7),
           "hum": K.suspense, **{k: (lambda d, k=k: np.tile(seamless(K.ROOMS[k]), int(d / 8.0) + 2)[: int(d * K.SR)]) for k in K.ROOMS}}[name](d)
    if name in K.ROOMS:  # room tones ease in and out, so changing places is a soft crossfade, not a hard cut
        n_ = len(amb)
        t_ = np.arange(n_) / K.SR
        # equal-power fades: two unrelated tones crossing keep the same overall level (a linear fade dips in the middle)
        amb = amb * np.sin(0.5 * np.pi * np.clip(t_ / XFADE, 0, 1)) * np.sin(0.5 * np.pi * np.clip((n_ / K.SR - t_) / XFADE, 0, 1))
        at = max(0.0, at - XFADE / 2)
    mix.add(amb, at, gain)
if cues.get("music"):
    mood, at, gain, drop0, drop1 = cues["music"]
    bed = K.bed(mood, 8)
    reps = int(np.ceil(length * K.SR / len(bed))) + 1
    m = np.tile(bed, reps)[: int(length * K.SR)]
    if cues.get("hit") is not None:  # slide the bed so a beat falls exactly on the video's first big hit
        beat_n = len(bed) / (8 * 4)
        m = np.roll(m, int(cues["hit"] * K.SR % beat_n))
    t = np.arange(len(m)) / K.SR
    env = np.ones_like(t)
    env *= np.clip((drop0 - t) / 0.3, 0, 1) + np.clip((t - drop1) / 0.6, 0, 1)  # music drops out for the tense beat
    env *= np.clip(t / 0.4, 0, 1) * np.clip((length - t) / 0.8, 0, 1)
    if cues.get("hit") is not None:  # the music stops dead on the hit for a beat, then drops back in
        env *= np.clip(np.abs(t - cues["hit"] - 0.14) / 0.14, 0, 1) ** 0.5
    mix.music(m * env, at, gain, loop=False)
for mood, a, b, gain, drops in cues.get("music_segments", []):  # episodes: one bed per run of same-mood beats
    bed = K.bed(mood, 16 if mood == "lofi" else 8)  # lofi: 16 bars (~49 s) so the loop doesn't wear thin
    n = int((b - a) * K.SR)
    m = np.tile(bed, n // len(bed) + 2)[:n]
    t = np.arange(n) / K.SR + a
    env = np.clip((t - a) / 0.3, 0, 1) * np.clip((b - t) / 0.5, 0, 1)
    for d0, d1 in drops:
        env *= np.clip((d0 - t) / 0.3, 0, 1) + np.clip((t - d1) / 0.6, 0, 1)
    mix.music(m * env, a, gain, loop=False)
ROOM_VERB = {"hall": (0.85, 0.32), "room": (0.3, 0.1), "street": (0.12, 0.07)}  # voices take the place's echo (size, wet)
for line_id, at, *extra in cues["voices"]:  # extra: a room, and "pan:x", "gain:x", "style:whisper|shout"
    sig = K.read_wav(os.path.join(out, "vo", f"{line_id}.wav"))
    opts = dict(e.split(":", 1) for e in extra if ":" in e)
    style = opts.get("style")
    if style == "whisper":
        sig = K.whisper(sig)
    elif style == "shout":
        sig = K.shout(sig)
    room = next((e for e in extra if e in ROOM_VERB), None)
    if room:
        sig = K.reverb(sig, *ROOM_VERB[room])
    if "radio" in extra:  # a small speaker: only the middle of the voice
        sig = K.filt(sig, "bp", (350, 2800))
    mix.voice(sig, at, float(opts.get("gain", 1.0)), float(opts.get("pan", 0.0)))
if cues.get("act") == "auto":  # far-off town life under the outdoor tones: a dog, a bike bell, now and then
    rnd = __import__("random").Random(len(cues.get("ambience", [])) * 7 + 3)
    for name, at, gain, *span in cues.get("ambience", []):
        if name in ("street", "lake") and span:
            t = at + rnd.uniform(3, 8)
            while t < at + span[0] - 2:
                mix.add(SOUNDS[rnd.choice(("bark", "bell"))](), t, rnd.uniform(0.04, 0.08))
                t += rnd.uniform(9, 16)
lufs = mix.write(os.path.join(out, "audio.wav"))
print(f"MIX {length:.2f}s  {lufs:.1f} LUFS")
