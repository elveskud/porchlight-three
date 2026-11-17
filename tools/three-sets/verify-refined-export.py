#!/usr/bin/env python3
"""Validate the refined export and sample its actual encoded frames."""
from pathlib import Path
import hashlib
import json
import math
import os
import subprocess
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
OUT = (ROOT / os.environ.get('PORCHLIGHT_VERIFY_OUT', 'comparisons/episode01/refined')).resolve()
MOVIE = OUT / os.environ.get('PORCHLIGHT_VERIFY_MOVIE', 'episode01_3d_refined.mp4')
ORIGINAL = (ROOT / os.environ.get('PORCHLIGHT_COMPARE_MOVIE', 'comparisons/episode01/episode01_3d.mp4')).resolve()

def command(*args):
    return subprocess.check_output(list(args), text=True)

metadata = json.loads(command('ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames,duration', '-of', 'json', str(MOVIE)))
v = metadata['streams'][0]
assert (v['width'],v['height'],v['r_frame_rate'],v['nb_frames'],metadata['format']['duration']) == (1920,1080,'24/1','3228','134.500000')
decode = subprocess.run(['ffmpeg','-v','error','-i',str(MOVIE),'-f','null','-'], capture_output=True, text=True)
assert decode.returncode == 0 and not decode.stderr, decode.stderr
hashes = [command('ffmpeg','-v','error','-i',str(m),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-').strip() for m in (ORIGINAL,MOVIE)]
assert hashes[0] == hashes[1], 'Audio differs from the original'
reviews = OUT / 'reviews'
reviews.mkdir(exist_ok=True)
times = [3,10,19,22.8,28.5,39,50.7,55.1,63.8,65.6,79,88.5,96.6,106,118.8,127.2,131.8,132.4]
sheet = Image.new('RGB',(1440,math.ceil(len(times)/3)*294),'#141b21')
draw = ImageDraw.Draw(sheet)
for i,t in enumerate(times):
    dest = reviews / f'final-{str(t).replace(".","_")}.jpg'
    subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(MOVIE),'-frames:v','1','-y',str(dest)],check=True)
    image = Image.open(dest); image.thumbnail((480,270)); x=(i%3)*480; y=(i//3)*294
    sheet.paste(image,(x,y)); draw.text((x+10,y+273),f'Refined 3D | {t:.1f}s',fill='white')
sheet.save(reviews/'final-contact-sheet.jpg',quality=92)
# Matched-camera times illustrate the visual pass; the edition also changes some camera cuts.
comparisons = Image.new('RGB',(1920,4*572),'#141b21'); d=ImageDraw.Draw(comparisons)
for row,t in enumerate([10,19,28.5,127.2] if os.environ.get('PORCHLIGHT_LAKE_COMPARISON') else [28.5,63.8,96.6,118.8]):
    for col,movie in enumerate([ORIGINAL,MOVIE]):
        dest = reviews/f'comparison-{col}-{str(t).replace(".","_")}.jpg'
        subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1','-y',str(dest)],check=True)
        im=Image.open(dest); im.thumbnail((960,540)); comparisons.paste(im,(col*960,row*572)); d.text((col*960+14,row*572+546),('Original' if col==0 else 'Refined')+f' | {t:.1f}s',fill='white')
comparisons.save(reviews/'before-after.jpg',quality=93)
report = {'result':'PASS','metadata':metadata,'fullDecode':'PASS','identicalAudio':True,'audioHashes':hashes,'sha256':hashlib.sha256(MOVIE.read_bytes()).hexdigest(),'sampleTimes':times}
(OUT/'export-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: 1080p / 24fps / 3228 frames / 134.5s; every frame decodes; identical original audio. Final review sheets saved.')
