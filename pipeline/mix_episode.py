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
