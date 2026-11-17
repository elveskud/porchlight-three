"""Verify the actual Episode 3 encoded film, current dialogue and soundtrack provenance."""
from pathlib import Path
from collections import Counter
import hashlib,json,math,re,subprocess,wave
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'comparisons/episode03/revised';ASSETS=ROOT/'comparisons/episode03/assets';MOVIE=OUT/'episode03_3d_illustrated.mp4';TL=json.loads((OUT/'source/timeline.json').read_text())
def command(*args):return subprocess.check_output(list(args),text=True)
metadata=json.loads(command('ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames,duration','-of','json',str(MOVIE)))
v=metadata['streams'][0];assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'24/1',round(TL['duration']*24));assert abs(float(metadata['format']['duration'])-TL['duration'])<.002
p=subprocess.run(['ffmpeg','-v','error','-i',str(MOVIE),'-f','null','-'],capture_output=True,text=True);assert p.returncode==0 and not p.stderr,p.stderr
manifest=json.loads((ASSETS/'voice-manifest.json').read_text());assert len(manifest['recordings'])==44
for r in manifest['recordings']:
 assert hashlib.sha256((ASSETS/'vo'/f'{r["id"]}.wav').read_bytes()).hexdigest()==r['sha256'];assert hashlib.sha256(Path(r['source']).read_bytes()).hexdigest()==r['sha256']
script=json.loads((ROOT/'episodes/ep03.json').read_text());assert hashlib.sha256((ROOT/'episodes/ep03.json').read_bytes()).hexdigest()==manifest['scriptHash']
expected=[('riot','Previously... '+script['previously'])]
for b in script['beats']:
 expected.extend((l['who'],l['say']) for l in b.get('lines',[]) if l['say'].strip()!='...')
 if b.get('game'):
  g=b['game'];expected.extend([(g['player'],'Dare.'),('riot',g['prompt']),(g['player'],g['perform'])]);expected.extend((l['who'],l['say']) for l in g['after'])
assert Counter(expected)==Counter((e['who'],e['text']) for e in TL['events'] if not e['silent'])
with wave.open(str(ASSETS/'audio.wav')) as w:assert abs(w.getnframes()/w.getframerate()-TL['duration'])<.002
reference=OUT/'qa-soundtrack.m4a';subprocess.run(['ffmpeg','-v','error','-i',str(ASSETS/'audio.wav'),'-af','apad','-t',str(TL['duration']),'-c:a','aac','-b:a','192k','-y',str(reference)],check=True)
hashes=[command('ffmpeg','-v','error','-i',str(m),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-').strip() for m in [MOVIE,reference]];assert hashes[0]==hashes[1],'Exported soundtrack mismatch'
reference.unlink()
loud=subprocess.run(['ffmpeg','-hide_banner','-i',str(MOVIE),'-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True);measurement=json.loads(re.search(r'\{\s*"input_i"[\s\S]+?\}',loud.stderr).group());assert -15.5<float(measurement['input_i'])<-12.5,measurement
browser=json.loads((OUT/'browser-checks.json').read_text());times=browser['samples'];sheet=Image.new('RGB',(1440,math.ceil(len(times)/3)*294),'#142129');d=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
 dest=OUT/'reviews'/f'final-{i}.jpg';subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(MOVIE),'-frames:v','1','-y',str(dest)],check=True);im=Image.open(dest);im.thumbnail((480,270));x=i%3*480;y=i//3*294;sheet.paste(im,(x,y));d.text((x+10,y+274),f'Episode 3 | {t:.2f}s',fill='white')
sheet.save(OUT/'reviews/final-contact-sheet.jpg',quality=93)
# Record the same dependency bytes and ordering as the scene cache uses.
import ast
render=(OUT/'source/render.cjs').read_text();lists=re.findall(r'for\(const file of (\[[^\]]+\])\)',render);h=hashlib.sha256()
for base,items in zip([OUT/'source',ROOT],lists):
 for f in ast.literal_eval(items):h.update((base/f).read_bytes())
assert h.hexdigest()==json.loads((OUT/'3d-render.json').read_text())['sourceHash']
prior=ROOT/'comparisons/episode03/episode03_3d_illustrated.mp4';priorAudio=command('ffmpeg','-v','error','-i',str(prior),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-').strip();assert hashes[0]==priorAudio,'Prior dialogue/soundtrack changed'
report={'result':'PASS','priorAudioIdentical':True,'metadata':metadata,'fullDecode':'PASS','voicesReused':44,'scriptDialogueExact':True,'audioHashes':hashes,'audioMeasurement':measurement,'sourceHash':h.hexdigest(),'sha256':hashlib.sha256(MOVIE.read_bytes()).hexdigest(),'sampleTimes':times};(OUT/'export-checks.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS: full decode; 1080p / 24fps / 4360 frames / 181.667 seconds; exact current dialogue; 44 verified original voice files; matching mastered soundtrack; source fingerprint.')
