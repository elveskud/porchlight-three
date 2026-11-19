"""Mix generated music/SFX and frozen or placeholder voices: mix_episode.py comparisons/episodeNN."""
"""Use the shared generated-audio mixer read-only, adding local horn and humming synthesizers."""
from pathlib import Path
import sys,numpy as np
shared=Path(__file__).resolve().parent/'templates/mix.py';sys.path.insert(0,str(shared.parent.parent/'audio'));import sfxkit as K
def horn():
 t=np.arange(round(K.SR*.65))/K.SR;env=np.minimum(1,t/.025)*np.minimum(1,(.65-t)/.12);return env*.35*(np.sin(2*np.pi*350*t)+.6*np.sin(2*np.pi*440*t)+.15*np.sin(2*np.pi*700*t))
def hum():
 t=np.arange(K.SR*8)/K.SR;notes=[130.81,164.81,146.83,130.81,110,130.81,146.83,130.81];f=np.array(notes)[np.minimum(7,t.astype(int))];phase=np.cumsum(f*(1+.003*np.sin(t*2*np.pi*4)))/K.SR;env=np.clip((t%1)/.08,0,1)*np.clip((.88-t%1)/.12,0,1)*np.minimum(1,(8-t)/.35);return (.22*np.sin(2*np.pi*phase)+.06*np.sin(4*np.pi*phase))*env
source=shared.read_text();source=source.replace('for name, at, gain in cues.get("sfx", []):','SOUNDS.update(car_horn=horn,rocco_hum=hum)\nfor name, at, gain in cues.get("sfx", []):');assets=Path(sys.argv[1]).resolve()/'assets/data';sys.argv=[str(shared),str(assets)];exec(compile(source,str(shared),'exec'),{'__file__':str(shared),'__name__':'__main__','horn':horn,'hum':hum})

# Sample limiting alone does not bound reconstructed/AAC peaks of generated noise.
# Measure true peaks, then master with headroom before encoding the film.
import json,re,subprocess
audio=assets/'audio.wav'
analysis=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(audio),'-af','loudnorm=I=-14:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
stats=json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}',analysis.stderr,re.S)[-1])
normalizer='loudnorm=I=-14:TP=-2:LRA=11:'+':'.join(f'{key}={stats[value]}' for key,value in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])+':linear=true'
master=assets/'audio-master.wav'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(audio),'-af',normalizer,'-ar',str(K.SR),'-c:a','pcm_s16le','-y',str(master)],check=True)
master.replace(audio)
print('MASTER -14 LUFS, -2 dBTP target (AAC headroom)')
