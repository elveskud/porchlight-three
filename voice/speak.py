# Character voices with Chatterbox (local, free). Each character = pitch shift + expressiveness.
#   .venv/bin/python speak.py test          -> out/test_*.wav
#   .venv/bin/python speak.py mafia         -> out/mafia_*.wav
#   .venv/bin/python speak.py job.json DIR  -> DIR/<id>.wav   (job = [[id, character, text], ...], used by templates)
# Optional: put a 5-10s recording at refs/<character>.wav to give that character its own voice.
import os, sys, subprocess
import torch, torchaudio

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

# pitch in semitones, exaggeration 0.25 (calm) .. 1.0+ (over the top), cfg lower = faster/more dramatic
CHARACTERS = {  # each clones its own base voice from refs/<who>.wav (made by make_refs.py with Kokoro)
    "riot":     dict(pitch=0.5, exaggeration=0.7, cfg=0.4),
    "bash":     dict(pitch=-1.0, exaggeration=0.95, cfg=0.3),
    "pip":      dict(pitch=1.5, exaggeration=0.8, cfg=0.35),
    "rocco":    dict(pitch=0.0, exaggeration=0.5, cfg=0.45),
    "narrator": dict(pitch=-0.5, exaggeration=0.4, cfg=0.5),
    # Porchlight townsfolk (base voices picked by the user 9 Nov 2026)
    "owl":      dict(pitch=-0.5, exaggeration=0.45, cfg=0.5),
    "gus":      dict(pitch=-1.0, exaggeration=0.55, cfg=0.45),
    "dot":      dict(pitch=2.0, exaggeration=0.35, cfg=0.5),
    "brook":    dict(pitch=0.0, exaggeration=0.45, cfg=0.5),
    # Ep 4-13 townsfolk (voices picked by the user 9 Nov 2026)
    "walt":     dict(pitch=-0.5, exaggeration=0.5, cfg=0.5),
    "hal":      dict(pitch=-1.5, exaggeration=0.35, cfg=0.5),
    "mayor":    dict(pitch=0.5, exaggeration=0.6, cfg=0.45),
    "preston":  dict(pitch=0.0, exaggeration=0.6, cfg=0.45),
    "marlo":    dict(pitch=-1.0, exaggeration=0.25, cfg=0.55),
    "hiker":    dict(pitch=0.0, exaggeration=0.5, cfg=0.5),
    "bashmom":  dict(pitch=-0.5, exaggeration=0.65, cfg=0.4),
    "pipmom":   dict(pitch=0.0, exaggeration=0.4, cfg=0.5),
    "pipdad":   dict(pitch=0.8, exaggeration=0.5, cfg=0.5),
    "bea":      dict(pitch=4.0, exaggeration=0.6, cfg=0.45),
}

SCRIPTS = {
    "test": [
        ("bash_itshim", "bash", "IT'S HIM! It's totally him!"),
        ("riot_shh", "riot", "Shhh... heh."),
    ],
    "samples": [  # one signature line per character: the voice reference for future videos
        ("sample_riot", "riot", "Hey, I'm Riot! Grab your friends, it's game night."),
        ("sample_bash", "bash", "I'm Bash. And I KNOW it was you!"),
        ("sample_pip", "pip", "H-hi, I'm Pip... I didn't do it, I swear!"),
        ("sample_rocco", "rocco", "Mm... Rocco. You gonna finish those?"),
        ("sample_narrator", "narrator", "Night falls on the village... someone won't survive until morning."),
    ],
    "mafia": [
        ("bash_itshim", "bash", "IT'S HIM! It's totally him!"),
        ("pip_innocent", "pip", "Wh-what?! I'm innocent!"),
        ("rocco_who", "rocco", "Mm... who's him?"),
        ("narr_pip", "narrator", "Pip... was a Civilian."),
        ("narr_bash", "narrator", "Bash... was a Civilian."),
        ("rocco_you", "rocco", "...YOU?!"),
        ("riot_shh", "riot", "Shhh... heh."),
        ("riot_end", "riot", "Friendzy. Let the chaos begin."),
    ],
}

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"  # Mac / NVIDIA PC / other
_load = torch.load
torch.load = lambda *a, **k: _load(*a, **{"map_location": torch.device(device), **k})  # checkpoints were saved on CUDA

from chatterbox.tts import ChatterboxTTS
model = ChatterboxTTS.from_pretrained(device=device)

arg = sys.argv[1] if len(sys.argv) > 1 else "test"
if arg.endswith(".json"):
    import json
    lines = json.load(open(arg))
    OUT = sys.argv[2]
    os.makedirs(OUT, exist_ok=True)
else:
    lines = SCRIPTS[arg]

for line_id, who, text in lines:
    c = CHARACTERS[who]
    ref = os.path.join(HERE, "refs", f"{who}.wav")
    torch.manual_seed(len(text))  # same line -> same take
    wav = model.generate(text, exaggeration=c["exaggeration"], cfg_weight=c["cfg"],
                         audio_prompt_path=ref if os.path.exists(ref) else None)
    raw = os.path.join(OUT, f"{line_id}_raw.wav")
    torchaudio.save(raw, wav, model.sr)
    # pitch shift without changing speed, trim silence, normalize
    ratio = 2 ** (c["pitch"] / 12)
    af = (f"asetrate={model.sr}*{ratio:.5f},aresample={model.sr},atempo={1 / ratio:.5f},"
          "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, "-ar", "44100",
                    os.path.join(OUT, f"{line_id}.wav")], check=True)
    os.remove(raw)  # the take before pitch/trim/loudness: not needed once the line is written
    print("wrote", line_id)
