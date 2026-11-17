# Generates each character's reference voice with Kokoro (local, Apache-2.0); speak.py clones from refs/<who>.wav.
#   .venv/bin/python make_refs.py
import os, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
CAST = {  # character: (Kokoro voice, speed, a reference passage in their personality)
    "riot": ("am_puck", 1.05, "Okay okay, listen up! Tonight we're doing something wild. Grab your friends, pick a game, "
                               "and no backing out. Ooh, this is gonna be good. Let's gooo!"),
    "bash": ("am_onyx", 1.0, "I'm telling you, it was him! I saw the whole thing. Trust me on this one, I am never wrong. "
                             "Okay, maybe once. But not tonight!"),
    "pip": ("af_sky", 1.08, "W-wait, why is everyone looking at me? I didn't do anything, I swear! "
                            "Can we please just play something else? Please?"),
    "rocco": ("am_michael", 0.95, "Mm. Yeah, I heard you. I'm just eating. These chips are honestly amazing. "
                                  "Wait, what did I miss? Who's out?"),
    "narrator": ("bm_george", 0.92, "Night falls on the village. Everyone, close your eyes. Someone in this room "
                                    "is not who they say they are. And by morning, one of you will be gone."),
    # Porchlight townsfolk (picked by the user 9 Nov 2026)
    "owl": ("bm_lewis", 0.92, "And so, class, as we break for the summer, one small assignment. An essay. My Summer. Two pages. "
                              "Then you'll have lots to write about."),
    "gus": ("am_santa", 0.9, "Well now. That depends on your frequency. And that's why you never trust a medium wave after lunch."),
    "dot": ("bf_lily", 1.05, "He gives that essay every summer. Every summer. Same one. I've seen the pile."),
    "brook": ("bf_alice", 0.86, "That's a rude question to ask a turtle. How long have you got? A long time ago. By the lake. "
                                "Terrible businessman. Lovely lemonade."),
    # Ep 4-13 townsfolk (picked by the user 9 Nov 2026)
    "walt": ("am_eric", 0.95, "Nobody's leaving this table hungry. I've made four kinds of potato. Your grandpa used to say a summer's only good once it's over."),
    "hal": ("am_echo", 0.88, "I've looked after those trees thirty years. There's an oak by the water that's older than this town."),
    "mayor": ("af_nicole", 1.05, "Well! Yes. No. Let's form a committee. Yes. Order, please. Or not. Whichever you prefer."),
    "preston": ("bm_fable", 0.95, "Ladies. Gentlemen. Ducks. Imagine... this. But more. That's the Preston Pavilion. It has a fountain inside a smaller fountain."),
    "marlo": ("bm_daniel", 0.92, "Doubled. Every word. The offer stands until Friday. Sign here, and here."),
    "hiker": ("am_liam", 1.0, "Morning! Chilly for November, huh? Better get your shopping done."),
    "bashmom": ("af_heart", 1.0, "Who wants cereal? The race is on! Don't feel bad, sweetie! You're the best loser in this house!"),
    "pipmom": ("af_river", 0.95, "Mayor? Do you know how long the vote will take? It's just for... planning reasons."),
    "pipdad": ("bm_daniel", 0.97, "There's my boy. We got you the good spot. Come on, sit with us."),
    "bea": ("af_heart", 1.12, "I beat you at pouring! I did though! I got more in! Because I won."),
}
ONLY = os.environ.get("ONLY")  # ONLY=owl,gus remakes just those, leaving the others' refs untouched
k = Kokoro(os.path.join(HERE, "kokoro/kokoro-v1.0.onnx"), os.path.join(HERE, "kokoro/voices-v1.0.bin"))
os.makedirs(os.path.join(HERE, "refs"), exist_ok=True)
for who, (voice, speed, line) in CAST.items():
    if ONLY and who not in ONLY.split(","):
        continue
    samples, sr = k.create(line, voice=voice, speed=speed, lang="en-us" if voice[0] == "a" else "en-gb")
    sf.write(os.path.join(HERE, "refs", f"{who}.wav"), samples, sr)
    print(who, voice, round(len(samples) / sr, 1), "s")
