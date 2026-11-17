# Listens to an episode's generated voice lines and flags the ones the voice model garbled.
#   Blender/voices/.asr-venv/Scripts/python.exe Blender/voices/check_voices.py Blender/videos/ep02 [line_id ...]
# Speech recognition (faster-whisper, base.en) transcribes each vo/<id>.wav and compares it with the words in
# vo/<id>.txt. A line is flagged when the words don't match, when it's too long or too short for its words
# (Chatterbox pads short lines with mumbles), or when it trails off into a quiet tail.
# Laughs and screams are skipped (pass "--all" to check them too): recognition can't judge those, your ears can.
# First run downloads the model (~140 MB); behind Avast's HTTPS scanning set SSL_CERT_FILE to the CA bundle first.
# Setup once: python -m venv Blender/voices/.asr-venv && Blender/voices/.asr-venv/Scripts/python -m pip install faster-whisper
# Fixing a flagged line without touching speak.py: make more takes of it (the take is seeded by the text's length,
# so the same words with a space before or after give a new take), check them with this script, copy the good one
# over vo/<id>.wav and leave vo/<id>.txt as it is, then render with --reuse-voices.
import difflib, os, re, sys, wave
import numpy as np
from faster_whisper import WhisperModel

NONWORDS = re.compile(r"^(a+h*|ah+|aa+h+|eek|whoa|ha|hah|he|hee|heh|hm+|huh|ow+|oh+|uh+|um+|wa+h+)$")


DIGITS = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight",
          "9": "nine", "10": "ten"}


def words(s):
    return [DIGITS.get(w, w) for w in re.sub(r"[^a-z0-9' ]+", " ", s.lower()).split()]


def same(w, g):  # spelling (metres / meters) and small recognition slips don't count
    return w == g or (len(w) > 3 and (w in g or g in w)) or difflib.SequenceMatcher(None, w, g).ratio() >= 0.8


def audio(p):
    w = wave.open(p)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if w.getnchannels() > 1:
        x = x.reshape(-1, w.getnchannels()).mean(1)
    return x, sr


def tail_ms(x, sr):
    hop = sr // 100
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    e = 20 * np.log10(e / (e.max() + 1e-9) + 1e-9)
    loud = np.where(e > -20)[0]
    return int(len(e) - 1 - loud[-1]) * 10 if len(loud) else 0


def main():
    args = [a for a in sys.argv[1:] if a != "--all"]
    check_all = "--all" in sys.argv
    vo = os.path.join(args[0], "vo")
    only = set(args[1:])
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    bad = 0
    for f in sorted(os.listdir(vo)):
        if not f.endswith(".wav") or (only and f[:-4] not in only):
            continue
        lid = f[:-4]
        tp = os.path.join(vo, lid + ".txt")
        if not os.path.exists(tp):
            continue
        text = open(tp, encoding="utf8").read().split("\n", 1)[-1].strip()
        want = words(text)
        if not want or (not check_all and all(NONWORDS.match(w) for w in want)):
            continue
        x, sr = audio(os.path.join(vo, f))
        x16 = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)
        x16 = np.concatenate([np.zeros(8000, np.float32), x16, np.zeros(8000, np.float32)])
        heard = " ".join(s.text.strip() for s in model.transcribe(x16, language="en", beam_size=5)[0])
        got = words(heard)
        missing = [w for w in want if not any(same(w, g) for g in got)]
        dur = len(x) / sr
        syl = sum(max(1, len(re.findall(r"[aeiouy]+", w))) for w in want)
        why = []
        if missing:
            why.append("missing " + " ".join(missing))
        if dur > 0.45 * syl + 0.6 + 0.5 * len(re.findall(r"[.!?]+\s", text)):  # (a pause between sentences is fine)
            why.append(f"too long ({dur:.2f}s for {syl} syllables)")
        if dur < 0.12 * syl:
            why.append(f"too short ({dur:.2f}s)")
        t = tail_ms(x, sr)
        if t > 250:
            why.append(f"quiet tail {t}ms")
        if why:
            bad += 1
            print(f"CHECK {lid:16s} {text!r:40.40} heard {heard!r}: {'; '.join(why)}")
    print(f"voices: {bad} line(s) to listen to" if bad else "voices: every line heard as written")
    sys.exit(1 if bad else 0)


main()
