# Friendzy generated sound kit: every effect, sting and music bed is synthesized in code (no recordings).
# Runs with the voices venv (numpy + scipy + pyloudnorm):  ../voices/.venv/bin/python
#
#   import sfxkit as K
#   mix = K.Mix(seconds=12)
#   mix.add(K.whoosh(), 1.2); mix.add(K.slam(), 3.0); mix.voice("vo/line.wav", 4.0)
#   mix.music(K.bed("hype", bars=6), 0.0, gain=0.35)       # ducked under voices automatically
#   mix.write("audio.wav")                                  # mastered to -14 LUFS, -1 dBTP
import wave
import numpy as np
from scipy import signal

SR = 44100


# ---------- building blocks ----------

def t_(d):
    return np.arange(int(SR * d)) / SR

def rng(seed):
    return np.random.default_rng(seed)

def noise(d, seed=0):
    return rng(seed).uniform(-1, 1, int(SR * d))

def pink(d, seed=0):
    w = np.fft.rfft(noise(d, seed))
    f = np.fft.rfftfreq(int(SR * d), 1 / SR)
    w[1:] /= np.sqrt(f[1:])
    w[0] = 0
    x = np.fft.irfft(w, int(SR * d))
    return x / (np.abs(x).max() + 1e-9)

def brown(d, seed=0):
    x = np.cumsum(noise(d, seed))
    x = signal.sosfilt(signal.butter(1, 20, "hp", fs=SR, output="sos"), x)
    return x / (np.abs(x).max() + 1e-9)

def env(n, a=0.005, d=0.05, s=0.6, r=0.1, hold=None):
    """ADSR over n samples (times in seconds)."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    h = max(0, n - a - d - r) if hold is None else int(hold * SR)
    e = np.concatenate([np.linspace(0, 1, a, endpoint=False), np.linspace(1, s, d, endpoint=False),
                        np.full(h, s), np.linspace(s, 0, r)])
    return np.pad(e, (0, max(0, n - len(e))))[:n]

def decay(d, k):
    return np.exp(-t_(d) * k)

def filt(x, kind, f, order=2, q=None):
    if kind == "bp":
        lo, hi = f
        sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    else:
        sos = signal.butter(order, f, {"lp": "lowpass", "hp": "highpass"}[kind], fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def sweep_bp(x, f0, f1, width=0.6, block=512):
    """Band-pass whose centre glides f0 -> f1 (exponential) across the sound: whooshes, wahs."""
    out, zi = np.zeros_like(x), None
    n = len(x)
    for i in range(0, n, block):
        c = f0 * (f1 / f0) ** (i / max(1, n - 1))
        lo, hi = max(30, c * (1 - width / 2)), min(SR / 2 - 100, c * (1 + width / 2))
        sos = signal.butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        out[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return out

def osc(freq, d, kind="sine", phase=0.0):
    """Oscillator; freq may be a number or an array (per-sample Hz) for glides and vibrato."""
    n = int(SR * d)
    f = np.full(n, float(freq)) if np.isscalar(freq) else np.asarray(freq)[:n]
    ph = 2 * np.pi * np.cumsum(f) / SR + phase
    if kind == "sine":
        return np.sin(ph)
    if kind == "tri":
        return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == "square":
        return np.tanh(4 * np.sin(ph))
    if kind == "saw":  # band-limited-ish: sum of harmonics under Nyquist
        out = np.zeros(n)
        for h in range(1, 24):
            out += np.sin(h * ph) / h * (h * f.max() < SR / 2)
        return out * 0.6
    raise ValueError(kind)

def fm(carrier, ratio, index, d, index_decay=4.0):
    """Two-operator FM: bells, metallic hits."""
    tt = t_(d)
    mod = index * np.exp(-tt * index_decay) * np.sin(2 * np.pi * carrier * ratio * tt)
    return np.sin(2 * np.pi * carrier * tt + mod)

def glide(f0, f1, d, curve="exp"):
    n = int(SR * d)
    return f0 * (f1 / f0) ** np.linspace(0, 1, n) if curve == "exp" else np.linspace(f0, f1, n)

def reverb(x, room=0.5, wet=0.25, damp=3500):
    """Schroeder reverb: 4 parallel combs + 2 allpasses, damped. Adds a tail."""
    x = np.concatenate([x, np.zeros(int(SR * (0.4 + room * 1.6)))])
    combs = [int(SR * t) for t in (0.0297, 0.0371, 0.0411, 0.0437)]
    g = 0.72 + 0.22 * room
    acc = np.zeros_like(x)
    for dl in combs:
        a = np.zeros(dl + 1); a[0] = 1; a[dl] = -g
        acc += signal.lfilter([1], a, x)
    acc = filt(acc / 4, "lp", damp)
    for dl, gg in ((int(SR * 0.005), 0.7), (int(SR * 0.0017), 0.7)):
        b = np.zeros(dl + 1); b[0] = -gg; b[dl] = 1
        a = np.zeros(dl + 1); a[0] = 1; a[dl] = -gg
        acc = signal.lfilter(b, a, acc)
    return x * (1 - wet) + acc * wet

def norm(x, peak=0.89):
    return x / (np.abs(x).max() + 1e-9) * peak

def cat(*parts):
    return np.concatenate(parts)

def place(length, items):
    """Overlay [(signal, at_seconds, gain)] into a buffer of `length` seconds."""
    out = np.zeros(int(SR * length))
    for s_, at, gn in items:
        i = int(at * SR)
        s_ = s_[: max(0, len(out) - i)]
        out[i:i + len(s_)] += s_ * gn
    return out

def note(n):
    """MIDI note number -> Hz."""
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------- cartoon effects ----------

def pop(pitch=1.0):
    """Bubble / UI pop: fast pitch drop + tiny click."""
    d = 0.09
    body = osc(glide(950 * pitch, 260 * pitch, d), d) * env(int(SR * d), 0.001, 0.02, 0.5, 0.06)
    click = filt(noise(0.006, 3), "bp", (1500, 5000)) * 0.12
    return norm(reverb(place(d, [(body, 0, 1), (click, 0, 1)]), 0.15, 0.12))

def whoosh(d=0.38, up=True, seed=1):
    """Air whoosh: band-pass noise gliding across the spectrum, swelling and fading."""
    x = pink(d, seed)
    x = sweep_bp(x, 350, 2600, 0.7) if up else sweep_bp(x, 2600, 350, 0.7)
    return norm(x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.6)

def swish(seed=2):
    return norm(whoosh(0.18, True, seed) * 0.9)

def slam(weight=1.0):
    """Big impact: sub boom with pitch drop + body thump + snap transient + room tail."""
    d = 0.9
    sub = osc(glide(95, 38, d), d) * decay(d, 5.5)
    thump = filt(noise(d, 4), "lp", 260) * decay(d, 18) * 2.5
    snap = filt(noise(0.03, 5), "hp", 1800) * decay(0.03, 120)
    x = place(d, [(np.tanh(sub * 2.2) * weight, 0, 1.0), (thump, 0, 0.9), (snap, 0, 0.22)])
    return norm(reverb(x, 0.35, 0.16, 2500))

def stamp():
    """Rubber stamp: dull wooden thud + paper slap."""
    d = 0.35
    thud = osc(glide(180, 90, d), d) * decay(d, 22)
    slap = filt(noise(d, 6), "bp", (900, 4500)) * decay(d, 45)
    return norm(reverb(place(d, [(thud, 0, 1), (slap, 0, 0.8)]), 0.2, 0.15))

def card_flip():
    """Card flicked over: two papery ticks + a little air."""
    tick = lambda s: filt(noise(0.03, s), "bp", (1800, 6500)) * decay(0.03, 140)
    air = whoosh(0.16, False, 7) * 0.35
    return norm(place(0.2, [(tick(8), 0, 1), (tick(9), 0.045, 0.8), (air, 0.01, 1)]))

def ting(pitch=1.0):
    """Bright bell (FM): wink, idea, reveal sparkle."""
    d = 1.4
    x = fm(1568 * pitch, 3.51, 1.8, d, 7) * decay(d, 3.2) + 0.35 * fm(2349 * pitch, 2.0, 1.0, d, 9) * decay(d, 5)
    return norm(reverb(x, 0.5, 0.3, 6000))

def sparkle(seed=3):
    """Magic shimmer: quick rising run of tiny bells."""
    r = rng(seed)
    scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
    items = [(fm(note(84 + s), 2.0, 1.2, 0.5, 9) * decay(0.5, 9), i * 0.045, 0.6 + 0.4 * r.random())
             for i, s in enumerate(scale[:8])]
    return norm(reverb(place(0.9, items), 0.6, 0.35, 7000))

def boing(pitch=1.0):
    """Spring boing: wobbling pitch that settles."""
    d = 0.6
    tt = t_(d)
    f = (170 + 120 * np.exp(-tt * 6) * np.sin(2 * np.pi * 14 * tt)) * pitch
    x = osc(f, d, "tri") * env(len(tt), 0.002, 0.1, 0.6, 0.35)
    return norm(x)

def slide_whistle(up=True, d=0.55):
    f0, f1 = (500, 1600) if up else (1600, 420)
    tt = t_(d)
    f = glide(f0, f1, d) * (1 + 0.012 * np.sin(2 * np.pi * 6 * tt))
    x = osc(f, d) + 0.25 * filt(noise(d, 10), "bp", (1500, 4000)) * 0.15
    return norm(x * env(len(tt), 0.03, 0.05, 0.9, 0.12))

def snare(seed=0):
    d = 0.22
    return norm(filt(noise(d, seed), "bp", (1200, 7000)) * decay(d, 22) + 0.5 * osc(glide(220, 160, d), d) * decay(d, 30))

def drumroll(d=1.6, crash_end=True):
    """Snare roll that speeds up and swells, landing on a crash."""
    items, t, i = [], 0.0, 0
    while t < d:
        k = t / d
        items.append((snare(i), t, 0.35 + 0.65 * k))
        t += 0.075 - 0.04 * k
        i += 1
    if crash_end:
        items.append((crash(), d, 1.0))
    return norm(place(d + 2.0, items))

def crash():
    """Cymbal crash: metallic FM partials + bright noise, long decay."""
    d = 2.0
    metal = sum(fm(f, 1.41, 6, d, 2) for f in (3150, 4270, 5400)) / 3
    hiss = filt(noise(d, 11), "hp", 5000)
    return norm((metal * 0.5 + hiss) * decay(d, 2.6))

def boom(d=1.6):
    """Deep bass drop for reveals (felt more than heard on phones: has upper harmonics too)."""
    x = osc(glide(120, 32, d), d) * decay(d, 2.2)
    return norm(np.tanh(x * 3.0) + 0.3 * filt(noise(d, 12), "lp", 150) * decay(d, 6))

def scratch():
    """Record scratch: a back-and-forth pitch sweep of buzzy noise."""
    d = 0.35
    tt = t_(d)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 3.2 * tt))
    x = osc(f, d, "saw") * 0.4 + filt(noise(d, 13), "bp", (600, 3000))
    return norm(filt(x, "bp", (300, 4000)) * env(len(tt), 0.005, 0.05, 0.8, 0.06))

def tick():
    """Woodblock tick (timers)."""
    d = 0.08
    return norm(osc(1750, d) * decay(d, 70) + 0.3 * filt(noise(d, 14), "bp", (2000, 6000)) * decay(d, 120))

def clock(seconds=3.0):
    return norm(place(seconds, [(tick() * (1 if i % 2 == 0 else 0.7), i * 0.5, 1) for i in range(int(seconds * 2))]))

def fire(d=4.0, seed=15):
    """Campfire bed: soft roar + random crackles and pops."""
    r = rng(seed)
    bed = filt(brown(d, seed), "lp", 500) * 0.35
    items = [(bed, 0, 1)]
    for _ in range(int(d * 9)):
        cd = r.uniform(0.004, 0.02)
        c = filt(noise(cd, int(r.integers(1e6))), "hp", r.uniform(1500, 5000)) * decay(cd, 300)
        items.append((c, r.uniform(0, d - 0.05), r.uniform(0.2, 0.9)))
    return norm(place(d, items), 0.7)

# ---------- Porchlight room tones (one loopable bed per kind of place) ----------

def crickets(d=6.0, seed=51):
    """Summer night: soft crickets chirping in pulses over a quiet air bed."""
    r = rng(seed)
    items = [(filt(pink(d, seed), "lp", 900) * 0.08, 0, 1)]
    for k in range(5):  # a few crickets, each its own pitch and rhythm
        f, per = r.uniform(3800, 5200), r.uniform(0.45, 0.9)
        t = r.uniform(0, per)
        while t < d - 0.2:
            ch = osc(f, 0.06) * env(int(SR * 0.06), 0.002, 0.02, 0.5, 0.02) * (0.5 + 0.5 * osc(38, 0.06, "square"))
            items.append((ch * 0.12, t, 1))
            t += per * r.uniform(0.9, 1.1)
    return norm(place(d, items), 0.5)

def lake(d=6.0, seed=53):
    """Lake shore by day: gentle lapping water, a light breeze and the odd far bird."""
    r = rng(seed)
    lap = filt(brown(d, seed), "bp", (120, 900)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * t_(d)))
    items = [(lap * 0.3, 0, 1), (filt(pink(d, seed + 1), "hp", 2500) * 0.03, 0, 1)]
    for _ in range(int(d / 2.5)):
        f0 = r.uniform(2400, 3600)
        bd = r.uniform(0.12, 0.22)
        items.append((osc(glide(f0, f0 * 1.3, bd), bd) * env(int(SR * bd), 0.01, 0.05, 0.3, 0.05) * 0.06, r.uniform(0, d - 0.3), 1))
    return norm(place(d, items), 0.5)

def room(d=6.0, seed=55):
    """A cosy room at night: low fan hum and a soft air tone."""
    hum = osc(60, d) * 0.04 + osc(120, d) * 0.02
    fan = filt(pink(d, seed), "lp", 400) * (0.8 + 0.2 * np.sin(2 * np.pi * 4.0 * t_(d))) * 0.12
    return norm(hum + fan, 0.35)

def hall(d=6.0, seed=57):
    """The old hall: wind through boards, the odd creak of old wood."""
    r = rng(seed)
    wind = filt(pink(d, seed), "bp", (200, 1200)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.12 * t_(d) + 1)) * 0.3
    items = [(wind, 0, 1)]
    for _ in range(int(d / 3)):
        cd = r.uniform(0.25, 0.5)
        f0 = r.uniform(180, 320)
        creak = filt(osc(glide(f0, f0 * 0.8, cd), cd, "saw"), "bp", (300, 1500)) * env(int(SR * cd), 0.05, 0.1, 0.5, 0.15)
        items.append((creak * 0.12, r.uniform(0, d - 0.6), 1))
    return norm(place(d, items), 0.5)

def street(d=6.0, seed=59):
    """A quiet street at sunset: breeze in the trees and a far, soft town hum."""
    breeze = filt(pink(d, seed), "bp", (400, 3000)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * t_(d))) * 0.12
    town = filt(brown(d, seed + 1), "lp", 250) * 0.15
    return norm(breeze + town, 0.4)

def footstep(surface="wood", seed=61):
    """One footstep: "wood" (a soft thud and a little creak), "sand" (a soft crunchy shush), "stone" (a short scuff)."""
    r = rng(seed)
    if surface == "sand":
        d = 0.16
        return norm(filt(noise(d, seed), "bp", (900, 5000)) * decay(d, 22), 0.45)
    if surface == "stone":
        d = 0.09
        return norm(filt(noise(d, seed), "bp", (600, 4000)) * decay(d, 45) + osc(140, d) * decay(d, 60) * 0.4, 0.5)
    d = 0.32
    thud = filt(noise(d, seed), "lp", 350) * decay(d, 28) * 1.2
    f0 = r.uniform(240, 330)
    creak = filt(osc(glide(f0, f0 * 0.85, d), d, "saw"), "bp", (400, 1600)) * env(int(SR * d), 0.03, 0.08, 0.4, 0.12) * 0.25
    return norm(thud + creak, 0.6)

def door(seed=63):
    """A front door: a short creak as it opens, then a soft wooden shut."""
    r = rng(seed)
    d = 0.5
    f0 = r.uniform(380, 460)
    creak = filt(osc(glide(f0, f0 * 0.7, d), d, "saw"), "bp", (500, 2200)) * env(int(SR * d), 0.05, 0.1, 0.5, 0.2) * 0.3
    shut = filt(noise(0.2, seed), "lp", 300) * decay(0.2, 25)
    return norm(place(1.0, [(creak, 0, 1), (shut, 0.62, 1.2)]), 0.6)

def rain(d=6.0, seed=65):
    """Steady summer rain: a wide hiss with soft drips and a low roof drum."""
    r = rng(seed)
    hiss = filt(pink(d, seed), "bp", (1200, 8000)) * 0.35
    drum = filt(brown(d, seed + 1), "lp", 220) * 0.3
    items = [(hiss + drum, 0, 1)]
    for _ in range(int(d * 14)):
        dd = 0.03
        items.append((filt(noise(dd, int(r.integers(1e6))), "bp", (2000, 6000)) * decay(dd, 120), r.uniform(0, d - 0.05), r.uniform(0.1, 0.3)))
    return norm(place(d, items), 0.6)

def breath(seed=67):
    """A soft breath in before a quiet line."""
    d = 0.45
    return norm(filt(noise(d, seed), "bp", (500, 2600)) * env(int(SR * d), 0.18, 0.1, 0.5, 0.15), 0.35)

def theme():
    """The Porchlight motif: five warm plucked notes rising, settling on home (D major), with a soft pad under them."""
    notes = [(62, 0.0), (66, 0.32), (69, 0.64), (71, 0.96), (69, 1.4)]  # D F# A B A
    d = 3.2
    items = []
    for n, at in notes:
        nd = 1.4
        tone = (osc(note(n), nd, "tri") + 0.35 * osc(note(n) * 2, nd)) * decay(nd, 3.2)
        items.append((tone * 0.5, at, 1))
    pad = sum(osc(note(m), d, "sine") for m in (50, 57, 62, 66)) / 4 * env(int(SR * d), 0.6, 0.4, 0.6, 1.0) * 0.25
    items.append((pad, 0.0, 1))
    return norm(reverb(place(d, items), 0.7, 0.3), 0.7)

def bark(seed=75):
    """A dog barking far off, twice."""
    def one(f0):
        d = 0.16
        return filt(osc(glide(f0, f0 * 0.7, d), d, "saw") * 0.5 + noise(d, seed) * 0.3, "bp", (300, 1800)) * env(int(SR * d), 0.005, 0.05, 0.4, 0.06)
    return norm(filt(place(0.6, [(one(420), 0, 1), (one(380), 0.32, 0.9)]), "lp", 1500), 0.5)


def bell(seed=77):
    """A bike bell, far off: two bright rings."""
    def ring():
        d = 0.5
        return (osc(2100, d) + 0.5 * osc(3150, d) + 0.25 * osc(5200, d)) * decay(d, 7)
    return norm(filt(place(0.8, [(ring(), 0, 1), (ring(), 0.18, 0.8)]), "lp", 5000), 0.4)


def theme_long():
    """The Porchlight theme for the intro (about 12 s): the five-note motif over the lo-fi chords, then the motif
    again a step higher, landing home."""
    beat = 60 / BEDS["lofi"][0]
    under = bed("lofi", 4) * 0.55
    items = [(under, 0, 1)]
    for rep_, (shift, at) in enumerate(((0, 0.0), (5, 8 * beat), (0, 12 * beat))):
        for n_, t in [(62, 0.0), (66, 0.5), (69, 1.0), (71, 1.5), (69, 2.2)]:
            d = 1.4
            tone = (osc(note(n_ + shift), d, "tri") + 0.35 * osc(note(n_ + shift) * 2, d)) * decay(d, 3.0)
            items.append((tone * 0.55, at + t * beat, 1))
    return norm(reverb(place(16 * beat, items), 0.6, 0.25), 0.75)


def whisper(x):
    """A voice made breathy and close: the top softened, a little air added along its shape."""
    envl = signal.sosfilt(signal.butter(1, 12, "lp", fs=SR, output="sos"), np.abs(x))
    air = filt(noise(len(x) / SR + 0.01, 79), "bp", (1500, 6000))[: len(x)] * envl * 0.6  # (+0.01: int() could round one sample short)
    return filt(x, "lp", 4200) * 0.85 + air


def shout(x):
    """A voice pushed hard: a touch of drive and more bite."""
    y = np.tanh(x * 2.2) / np.tanh(2.2)
    return y + 0.25 * filt(y, "hp", 2500)


def slap(seed=69):
    """A high five: a bright, short skin-on-skin clap."""
    d = 0.14
    return norm(filt(noise(d, seed), "bp", (900, 5200)) * decay(d, 60) + filt(noise(d, seed + 1), "lp", 400) * decay(d, 40) * 0.5, 0.75)


def splash(seed=71):
    """Something small dropping into the lake: a plop, then a fizz of droplets."""
    r = rng(seed)
    plop = osc(glide(420, 180, 0.12), 0.12) * decay(0.12, 25) * 0.6
    items = [(plop, 0, 1), (filt(noise(0.35, seed), "bp", (1500, 6000)) * decay(0.35, 9) * 0.5, 0.03, 1)]
    for _ in range(6):
        dd = 0.03
        items.append((filt(noise(dd, int(r.integers(1e6))), "bp", (2500, 7000)) * decay(dd, 90), r.uniform(0.05, 0.4), r.uniform(0.2, 0.5)))
    return norm(place(0.5, items), 0.6)


def thud(seed=73):
    """A small prop landing on the ground or a table."""
    d = 0.12
    return norm(filt(noise(d, seed), "lp", 900) * decay(d, 35) + osc(160, d) * decay(d, 50) * 0.4, 0.5)


def thud_at(pitch=1.0, seed=73):
    """The same landing for a heavier or lighter body: lower and longer, or higher and shorter."""
    x = thud(seed)
    return norm(np.interp(np.arange(0, len(x), pitch), np.arange(len(x)), x))


def gasp(seed=83):
    """A quick intake of breath before a shocked face."""
    d = 0.28
    x = filt(noise(d, seed), "bp", (900, 3400)) * env(int(SR * d), 0.1, 0.05, 0.7, 0.08)
    return norm(x * np.linspace(0.5, 1.0, len(x)), 0.5)


def smack(seed=85):
    """Lips parting before a line."""
    d = 0.05
    return norm(filt(noise(d, seed), "bp", (1200, 5000)) * env(int(SR * d), 0.002, 0.03, 0.0, 0.01), 0.4)


def crowd_ooh(d=1.5, seed=87):
    """A small generated crowd going "oooh": detuned voices on a slow rising, falling vowel."""
    t = np.arange(int(SR * d)) / SR
    rnd = np.random.default_rng(seed)
    x = np.zeros_like(t)
    for _ in range(12):
        f = rnd.uniform(150, 310) * (1 + 0.05 * np.sin(2 * np.pi * t / d))
        ph = 2 * np.pi * np.cumsum(f) / SR + rnd.uniform(0, 6)
        x += sum(np.sin(ph * k) / k for k in (1, 2, 3))
    x = filt(x, "bp", (220, 900))
    return norm(x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5, 0.6)


def rustle(seed=91):
    """Clothes on a big move: a soft brush of fabric, two quick swells."""
    d = 0.32
    tt = t_(d)
    sw = np.clip(np.sin(np.pi * tt / d * 2), 0, None) ** 2 * np.where(tt < d / 2, 1.0, 0.6) + 0.15
    return norm(filt(noise(d, seed), "bp", (1500, 6000)) * sw * env(len(tt), 0.02, 0.02, 0.8, 0.1), 0.35)


ROOMS = {"rain": rain, "night": crickets, "lake": lake, "room": room, "hall": hall, "street": street}


def slurp(d=0.9):
    tt = t_(d)
    gurgle = osc(300 + 140 * np.sin(2 * np.pi * 11 * tt), d) * 0.25
    air = filt(noise(d, 16), "bp", (700, 2400))
    trem = (0.5 + 0.5 * np.sin(2 * np.pi * 8 * tt)) ** 2
    return norm((air + gurgle) * trem * env(len(tt), 0.04, 0.05, 0.9, 0.15))

def crunch(seed=17):
    d = 0.12
    r = rng(seed)
    x = sum(filt(noise(0.012, seed + i), "hp", 2000) * decay(0.012, 260) * r.uniform(0.4, 1) for i in range(1))
    items = [(filt(noise(0.015, seed + i), "hp", 1800) * decay(0.015, 220), r.uniform(0, 0.08), r.uniform(0.5, 1)) for i in range(6)]
    return norm(place(d, items))

def popper():
    """Party popper / confetti: bang + crinkly paper shower."""
    bang = filt(noise(0.05, 18), "hp", 400) * decay(0.05, 70)
    r = rng(19)
    crinkle = [(filt(noise(0.006, 20 + i), "hp", 4000) * decay(0.006, 500), 0.05 + r.uniform(0, 0.6), r.uniform(0.1, 0.5)) for i in range(40)]
    return norm(reverb(place(0.8, [(bang, 0, 1)] + crinkle), 0.3, 0.15))

def tap():
    """Soft UI tap."""
    return norm(osc(glide(1400, 900, 0.04), 0.04) * decay(0.04, 90), 0.6)

def spray(d=0.45, seed=31):
    """Spray-can hiss: a short burst of bright filtered noise."""
    return norm(filt(noise(d, seed), "bp", (2500, 9000)) * env(int(SR * d), 0.02, 0.1, 0.8, 0.2), 0.7)

def whistle(d=0.5, seed=23):
    """Referee whistle: two close high tones, trilled by the pea (~28 Hz flutter), plus breath."""
    tt = t_(d)
    trill = 1 + 0.035 * np.sin(2 * np.pi * 28 * tt)
    x = osc(2850 * trill, d) + 0.6 * osc(2990 * trill, d) + 0.25 * osc(5700 * trill, d)
    x = x * (0.75 + 0.25 * np.sin(2 * np.pi * 28 * tt))
    x += 0.18 * filt(noise(d, seed), "bp", (2400, 3600))
    return norm(reverb(x * env(len(tt), 0.01, 0.05, 0.85, 0.08), 0.35, 0.15, 7000), 0.8)

def buzzer(d=0.7):
    """Game-show 'time's up' buzzer: low rough square chord."""
    x = osc(110, d, "square") + 0.8 * osc(116.5, d, "square") + 0.4 * osc(220, d, "saw")
    return norm(filt(x, "lp", 2200) * env(int(SR * d), 0.005, 0.05, 0.9, 0.12), 0.8)


# ---------- music stings (synth brass / strings) ----------

def brass(midi, d, bright=1.0):
    """Synth brass note: detuned saws through a filter that opens on the attack ('bwah')."""
    f = note(midi)
    tt = t_(d)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt) * np.clip(tt * 3 - 0.3, 0, 1)
    x = osc(f * vib, d, "saw") + osc(f * 1.006 * vib, d, "saw") * 0.8 + osc(f / 2 * vib, d, "saw") * 0.4
    cutoff = 600 + 3800 * bright * env(len(tt), 0.05, 0.25, 0.45, 0.2)
    out = np.zeros_like(x)
    for i in range(0, len(x), 512):  # time-varying low-pass
        sos = signal.butter(2, min(cutoff[i], SR / 2 - 100), "lowpass", fs=SR, output="sos")
        out[i:i + 512] = signal.sosfilt(sos, x[i:i + 512])
    return out * env(len(tt), 0.03, 0.1, 0.85, 0.12)

def chord(notes, d, bright=1.0):
    return sum(brass(n, d, bright) for n in notes) / len(notes)

def timpani(midi=40, d=1.2):
    f = note(midi)
    tt = t_(d)
    return osc(f * (1 + 0.08 * np.exp(-tt * 20)), d) * decay(d, 3.5) + 0.3 * filt(noise(d, 21), "lp", 300) * decay(d, 25)

def dun_dun_dunnn():
    """Dramatic reveal sting (minor): two short stabs and a long held chord with timpani."""
    stab = lambda: chord([45, 52, 57, 60], 0.28, 0.8)
    long_ = chord([44, 51, 56, 59], 1.6, 1.0)  # drops a semitone: tension
    x = place(2.6, [(stab(), 0, 0.9), (timpani(33), 0, 0.8), (stab(), 0.36, 0.9), (timpani(33), 0.36, 0.8),
                    (long_, 0.78, 1.0), (timpani(32, 1.8), 0.78, 1.0)])
    return norm(reverb(x, 0.7, 0.3))

def fanfare():
    """Win / celebration: bright major arpeggio into a held chord."""
    seq = [(60, 0.0), (64, 0.12), (67, 0.24), (72, 0.36)]
    items = [(brass(n, 0.3, 1.2), t, 0.8) for n, t in seq]
    items.append((chord([60, 64, 67, 72], 1.3, 1.2), 0.5, 1.0))
    items.append((crash() * 0.4, 0.5, 1.0))
    return norm(reverb(place(2.4, items), 0.6, 0.28))

def sad_trombone():
    """'Wah wah wah waaah': descending brass with a wobbling last note."""
    items, t = [], 0.0
    for midi, d in ((58, 0.32), (57, 0.32), (56, 0.32), (55, 1.0)):
        x = brass(midi, d, 0.6)
        if d > 0.5:
            tt = t_(d)
            x = x * (1 + 0.25 * np.sin(2 * np.pi * 6 * tt) * np.clip(tt * 2 - 0.2, 0, 1))
        items.append((x, t, 1))
        t += d + 0.02
    return norm(reverb(place(t + 0.6, items), 0.4, 0.2))

def suspense(d=4.0):
    """Low pad drone with a slow tremolo and a rising tension tone."""
    tt = t_(d)
    pad = chord([38, 45, 50], d, 0.3) * (0.7 + 0.3 * np.sin(2 * np.pi * 4 * tt))
    rise = osc(glide(note(74), note(78), d), d) * 0.08 * np.linspace(0, 1, len(tt))
    return norm(reverb(pad + rise, 0.8, 0.35))


# ---------- music beds ----------

def kick():
    d = 0.35
    return osc(glide(150, 45, 0.12, "exp").tolist() + [45] * int(SR * 0.23), d) * decay(d, 9) * 1.2

def hat(open_=False, seed=22):
    d = 0.25 if open_ else 0.05
    return filt(noise(d, seed), "bp", (6000, 11000)) * decay(d, 14 if open_ else 90) * 0.5

def bass_note(midi, d):
    x = osc(note(midi), d, "saw") * 0.5 + osc(note(midi), d, "square") * 0.3
    return filt(x, "lp", 700) * env(int(SR * d), 0.005, 0.08, 0.7, 0.05)

def keys(notes, d):
    x = sum(osc(note(n), d, "tri") + 0.3 * osc(note(n) * 2, d) for n in notes) / len(notes)
    return x * env(int(SR * d), 0.01, 0.2, 0.4, 0.1)

BEDS = {  # mood: (bpm, chord roots, chord shape, swing)
    "hype":     (118, [57, 53, 48, 55], [0, 4, 7], False),   # A F C G   (bright, party)
    "suspense": (92, [45, 45, 46, 44], [0, 3, 7], False),    # minor, creeping
    "chill":    (96, [50, 55, 57, 52], [0, 4, 7, 11], True), # maj7, campfire
    "lofi":     (78, [50, 55, 50, 55, 47, 52, 45, 50], [0, 4, 7, 11, 14], True),  # Porchlight: an 8-chord warm summer loop
    "piano":    (64, [50, 47, 43, 45], [0, 4, 7, 12], False),  # Porchlight: soft, for the emotional scenes (D Bm G A)
}


def piano_bed(bars=4):
    """No drums: slow broken chords on a soft piano-like pluck, a quiet low note under each bar."""
    bpm, roots, shape, _ = BEDS["piano"]
    beat = 60 / bpm
    length = bars * 4 * beat
    items = []
    for bar in range(bars):
        root = roots[bar % len(roots)]
        t0 = bar * 4 * beat
        notes = [root + s for s in shape] + [root + shape[1] + 12]
        for k in range(8):  # eighth-note arpeggio, up and back down
            n_ = notes[[0, 1, 2, 3, 4, 3, 2, 1][k]]
            d = beat * 1.6
            tone = (osc(note(n_), d, "tri") + 0.25 * osc(note(n_) * 2, d)) * decay(d, 2.2)
            items.append((tone * 0.32, t0 + k * beat / 2, 1))
        items.append((osc(note(root - 12), 4 * beat) * decay(4 * beat, 0.6) * 0.3, t0, 1))
    return norm(reverb(place(length, items), 0.6, 0.25), 0.7)

def crackle(d, seed=41):
    """Vinyl crackle: a soft noise floor with sparse little pops."""
    r = rng(seed)
    x = filt(pink(d, seed), "bp", (900, 5000)) * 0.04
    for _ in range(int(d * 9)):
        i = int(r.uniform(0, d) * SR)
        x[i:i + 40] += r.uniform(-0.25, 0.25) * np.exp(-np.arange(len(x[i:i + 40])) / 6.0)
    return x

def bed(mood="hype", bars=4):
    """Loopable music bed: drums + bass + chords, `bars` bars of 4/4. Duck it under voices in the Mix."""
    if mood == "piano":
        return piano_bed(bars)
    bpm, roots, shape, swing = BEDS[mood]
    beat = 60 / bpm
    length = bars * 4 * beat
    items = []
    for bar in range(bars):
        root = roots[bar % len(roots)]
        t0 = bar * 4 * beat
        for b in range(4):
            tb = t0 + b * beat
            if mood != "suspense" or b == 0:
                items.append((kick(), tb, 0.9 if mood != "lofi" else 0.55))
            if mood == "lofi" and b == 2:  # boom-bap: a lazy second kick just after beat 3
                items.append((kick(), tb + beat * 0.5, 0.4))
            if b in (1, 3) and mood != "suspense":
                items.append((filt(snare(bar * 4 + b), "lp", 6000 if mood != "lofi" else 2600) * 0.5, tb, 0.45 if mood != "lofi" else 0.3))
            for e in range(2):
                off = beat / 2 * e + (beat * 0.08 if swing and e else 0)
                items.append((hat(e == 1 and b == 3, 30 + bar * 8 + b * 2 + e), tb + off, {"suspense": 0.05, "lofi": 0.05}.get(mood, 0.12)))
            items.append((bass_note(root - 12, beat * 0.9), tb, 0.5 if mood != "suspense" else 0.35))
        items.append((keys([root + s for s in shape], 4 * beat * 0.95), t0, 0.45))
        if mood == "suspense":
            items.append((suspense(4 * beat) * 0.4, t0, 1))
    if mood == "lofi":  # muffled, warm, a little dusty
        return norm(filt(place(length, items), "lp", 3000) + crackle(length), 0.8)
    return norm(filt(place(length, items), "lp", 9000), 0.8)


# ---------- mixing & mastering ----------

def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        x = x.reshape(-1, w.getnchannels()).mean(axis=1)
        sr = w.getframerate()
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    return x


class Mix:
    """Timeline mixer. sfx/stings via add(), dialogue via voice() (optionally panned), music via music() (auto-ducked
    under voices). write() masters the stereo file to -14 LUFS (TikTok/Reels/YouTube loudness) with a -1 dBTP ceiling."""

    def __init__(self, seconds):
        n = int(SR * seconds)
        self.sfx, self.vo, self.mus = np.zeros(n), np.zeros(n), np.zeros(n)
        self.vo_side = np.zeros(n)  # the voices' left-right difference (stereo panning); zero = centred

    def _put(self, buf, sig, at, gain):
        i = int(at * SR)
        sig = sig[: max(0, len(buf) - i)]
        buf[i:i + len(sig)] += sig * gain

    def add(self, sig, at, gain=0.6):
        self._put(self.sfx, sig, at, gain)

    def voice(self, path_or_sig, at, gain=1.0, pan=0.0):
        """pan: -1 (left) .. 1 (right), where the speaker stands; 0 = centre."""
        sig = read_wav(path_or_sig) if isinstance(path_or_sig, str) else path_or_sig
        self._put(self.vo, sig, at, gain)
        if pan:
            self._put(self.vo_side, sig, at, gain * pan)

    def music(self, sig, at=0.0, gain=0.3, loop=True):
        if loop:
            reps = int(np.ceil((len(self.mus) - int(at * SR)) / len(sig))) + 1
            sig = np.tile(sig, max(reps, 1))
        self._put(self.mus, sig, at, gain)

    def write(self, path, lufs=-14.0, duck=0.65):
        import pyloudnorm
        envl = np.abs(self.vo)
        envl = signal.sosfilt(signal.butter(1, 6, "lp", fs=SR, output="sos"), envl)
        envl = np.clip(envl / (envl.max() + 1e-9) * 3, 0, 1)
        rest = self.sfx * (1 - 0.35 * envl) + self.mus * (1 - duck * envl)
        side = 0.5 * self.vo_side  # a panned voice: louder on its side, softer on the other (centred voices unchanged)
        st = np.stack([self.vo - side + rest, self.vo + side + rest], axis=1)
        meter = pyloudnorm.Meter(SR)
        # measured as the stereo file it becomes (two identical channels read 3 dB louder than one: measuring the
        # mono mix used to leave every file at about -11 LUFS while QA said -14)
        loud = meter.integrated_loudness(st) if np.abs(st).max() > 0 else lufs
        st = st * 10 ** ((lufs - loud) / 20)
        ceiling = 10 ** (-1 / 20)
        st = np.where(np.abs(st) > ceiling * 0.8, np.sign(st) * (ceiling * 0.8 + (ceiling * 0.2) * np.tanh(
            (np.abs(st) - ceiling * 0.8) / (ceiling * 0.2))), st)  # soft limiter
        pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
        with wave.open(path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        return meter.integrated_loudness(st)


def save(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
