#!/usr/bin/env python3
"""Check a finished episode film. Every check can fail. Exit code 1 if anything fails.

  python3 tools/three-sets/verify-film.py <film.mp4> <timeline.json> <audio.wav> [report.json]
  example (Episode 4 v5):
  python3 tools/three-sets/verify-film.py comparisons/episode04/v5/episode04_v5.mp4 comparisons/episode04/source/timeline-v5.json comparisons/episode04/assets/v5/audio.wav comparisons/episode04/v5/export-checks.json

Checks: 1920x1080 at 24 fps; frame count equals duration x 24; the whole file decodes with no errors; the soundtrack
inside the film matches audio.wav in length; loudness is near -14 LUFS; BT.709 colour tags; black only where the story
fades to black (the last seconds); the film is on twos (about half of consecutive frame pairs are identical).
"""
import json, re, subprocess, sys, wave
from pathlib import Path

film, timeline, audio = (Path(a) for a in sys.argv[1:4])
report_path = Path(sys.argv[4]) if len(sys.argv) > 4 else None
tl = json.loads(timeline.read_text())
fails, report = [], {}


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


probe = json.loads(run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(film)]).stdout)
video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
sound = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
expected = round(tl['duration'] * 24)
report['video'] = {k: video.get(k) for k in ('width', 'height', 'r_frame_rate', 'nb_read_frames', 'pix_fmt', 'color_space', 'color_primaries', 'color_transfer', 'color_range')}
if (video['width'], video['height']) != (1920, 1080): fails.append(f"size {video['width']}x{video['height']}")
if video['r_frame_rate'] != '24/1': fails.append(f"frame rate {video['r_frame_rate']}")
if int(video['nb_read_frames']) != expected: fails.append(f"{video['nb_read_frames']} frames, expected {expected}")
for key in ('color_space', 'color_primaries', 'color_transfer'):
    if video.get(key) != 'bt709': fails.append(f'{key} is {video.get(key)}, expected bt709')

decode = run(['ffmpeg', '-v', 'error', '-i', str(film), '-f', 'null', '-'])
report['decodeErrors'] = decode.stderr.strip()[:300]
if decode.stderr.strip(): fails.append('decode errors: ' + decode.stderr.strip()[:120])

with wave.open(str(audio)) as w:
    wav_seconds = w.getnframes() / w.getframerate()
film_audio = float(sound.get('duration') or probe['format']['duration'])
report['audio'] = {'wavSeconds': round(wav_seconds, 3), 'filmAudioSeconds': round(film_audio, 3), 'videoSeconds': round(float(video['duration']), 3)}
if abs(film_audio - float(video['duration'])) > 0.1: fails.append(f'audio {film_audio:.2f}s vs video {float(video["duration"]):.2f}s')
if abs(wav_seconds - tl['duration']) > 0.05: fails.append(f'audio.wav {wav_seconds:.2f}s vs timeline {tl["duration"]:.2f}s')

loud = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(film), '-af', 'loudnorm=print_format=json', '-vn', '-f', 'null', '-']).stderr
data = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', loud, re.S)[-1])
report['loudness'] = {'integratedLUFS': float(data['input_i']), 'truePeakDB': float(data['input_tp']), 'range': float(data['input_lra'])}
if not -15.5 <= float(data['input_i']) <= -12.5: fails.append(f"loudness {data['input_i']} LUFS")
if float(data['input_tp']) > 0.0: fails.append(f"true peak {data['input_tp']} dB clips")

black = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(film), '-vf', 'blackdetect=d=0.2:pix_th=0.06', '-an', '-f', 'null', '-']).stderr
intervals = [(float(a), float(b)) for a, b in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', black)]
report['blackIntervals'] = intervals
allowed_from = tl['actions']['lampOff'] - 0.1
for a, b in intervals:
    if a < allowed_from: fails.append(f'black frames from {a:.2f}s to {b:.2f}s (only the final fade after {allowed_from:.1f}s is allowed)')

# Held drawings: whole drawings are held for 2 frames. Over 15 s, compare each frame with the one before: the PEAK local
# difference (YMAX of the difference picture) is 3-4 for a held pair (encoder noise only) and 30+ for a new drawing.
diff = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(film), '-vf',
            'trim=start_frame=2400:end_frame=2760,setpts=PTS-STARTPTS,scale=320:180,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YMAX:file=-',
            '-an', '-f', 'null', '-']).stdout
values = [float(v) for v in re.findall(r'YMAX=([\d.]+)', diff)][1:]
held = sum(1 for v in values if v < 12)
report['twos'] = {'pairs': len(values), 'heldPairs': held, 'share': round(held / max(1, len(values)), 2)}
# On twos about half the pairs are held (a little less where the film goes to 24 drawings a second, a little more in still shots).
if not values or not 0.40 <= held / len(values) <= 0.65: fails.append(f'held pairs {held}/{len(values)}: not drawn on twos?')

report['fails'], report['result'] = fails, 'FAIL' if fails else 'PASS'
if report_path: report_path.write_text(json.dumps(report, indent=1))
print(json.dumps({k: report[k] for k in ('video', 'audio', 'loudness', 'twos', 'blackIntervals')}, indent=1))
print('FILM CHECK:', report['result'], ('\n - ' + '\n - '.join(fails)) if fails else '')
sys.exit(1 if fails else 0)
