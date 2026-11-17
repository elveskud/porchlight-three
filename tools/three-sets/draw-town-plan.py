#!/usr/bin/env python3
"""Draw a printable SVG from the exported Maple Hollow master plan (no dependencies)."""
import html,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[2]
folder=root/'maple hollow tree.js/output'
plan=json.loads((folder/'master-plan.json').read_text())
escape=lambda s:html.escape(str(s),quote=True)
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1530" viewBox="0 0 1800 1530">','<rect width="1800" height="1530" fill="#f4f1e6"/>','<style>text{font-family:Arial,Helvetica,sans-serif;fill:#2d4835}.serif{font-family:Georgia,serif}.small{font-size:12px;fill:#6d8062}.number{font-size:11px;font-weight:bold;text-anchor:middle;dominant-baseline:central}</style>']
svg+=['<text x="60" y="57" class="serif" font-size="39">MAPLE HOLLOW</text>','<text x="61" y="88" font-size="13" letter-spacing="3">PORCHLIGHT / PROPOSED TOWN MASTER PLAN</text>','<text x="1740" y="57" text-anchor="end" class="small">35 sites · 50 local story locations</text>','<text x="1740" y="81" text-anchor="end" class="small">Planning metres; positions and sizes inferred</text>','<line x1="60" x2="1740" y1="108" y2="108" stroke="#cbd4bc"/>','<defs><clipPath id="mapclip"><rect x="-30" y="-12" width="1560" height="1030"/></clipPath></defs>','<g transform="translate(150 137)">','<rect x="-30" y="-12" width="1560" height="1030" rx="7" fill="#b9cba0" stroke="#93aa7f"/>']
points=lambda pts:' '.join(f'{p[0]:.2f},{p[1]:.2f}' for p in pts)
svg.append('<g clip-path="url(#mapclip)">')
# Blocks are planning massing; individual story parcels stay separate below.
for x in [720,800,880,960,1040,1120,1200,1280]:
 for y in [390,470,550,630,710,790]:
  svg.append(f'<rect x="{x+10}" y="{y+10}" width="60" height="60" rx="3" fill="'+('#d8d1b9' if y<710 else '#cad1ad')+'" stroke="#a9b798" stroke-width="1"/>')
for key,color in [('shore','#daccaa'),('lake','#82b1bc')]:svg.append(f'<polygon points="{points(plan["landscape"][key])}" fill="{color}"/>')
for key in ['creekIn','creekOut']:svg.append(f'<polyline points="{points(plan["landscape"][key])}" fill="none" stroke="#82b1bc" stroke-width="9" stroke-linejoin="round"/>')
for p in plan['landscape']['peaks']:
 x,y,rr=p['x'],p['y'],p['r']
 svg.append(f'<path d="M{x-rr*.7},{y+rr*.5} L{x},{y-rr*.7} L{x+rr*.7},{y+rr*.5} Z" fill="#9ea590" stroke="#7d8c78" stroke-width="1"/>')
for road in plan['roads']:
 w=road['w'];pts=points(road['pts'])
 svg.append(f'<polyline points="{pts}" fill="none" stroke="#8d9d7d" stroke-width="{w+3}" stroke-linecap="round" stroke-linejoin="round"/>')
 svg.append(f'<polyline points="{pts}" fill="none" stroke="'+('#c7b992' if road.get('gravel') else '#eee3c4')+f'" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')
svg.append('<polyline points="0,962 300,952 620,940 900,934 1200,928 1500,915" fill="none" stroke="#7f7357" stroke-width="5" stroke-dasharray="8 4"/>')
colors={d['id']:d['color'] for d in plan['districts']}
for i,s in enumerate(plan['sites']):
 x,y=s['at'];draft=s['draft'];color=colors[s['district']]
 if s['parcel']:
  w,h=s['parcel'];svg.append(f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" fill="{color}" fill-opacity=".24" stroke="{color}" stroke-width="1.5"'+(' stroke-dasharray="5 4"' if draft else '')+'/>')
 svg.append(f'<circle cx="{x}" cy="{y}" r="11" fill="'+('#f3edda' if draft else color)+'" stroke="#f4f0dc" stroke-width="2"/>')
 svg.append(f'<text x="{x}" y="{y}" class="number" style="fill:'+('#987747' if draft else '#fff9df')+f'">{i+1:02}</text>')
svg+=['<text x="65" y="270" class="serif" font-size="19" transform="rotate(-90 65 270)">WEST WOODS</text>','<text x="420" y="414" text-anchor="middle" class="serif" font-size="23" fill="#3f707d">The lake</text>','<text x="1060" y="455" text-anchor="middle" class="small">MAIN STREET</text>','<text x="1090" y="905" text-anchor="middle" class="small">FAMILY NEIGHBOURHOODS</text>','<text x="0" y="20" font-size="18">N ↑</text>','<path d="M20,1000 v-6 M20,1000 h100 M120,1000 v-6" fill="none" stroke="#476443" stroke-width="2"/><text x="70" y="988" text-anchor="middle" class="small">100 m</text>','</g></g>']
svg.append('<line x1="60" x2="1740" y1="1180" y2="1180" stroke="#cbd4bc"/>')
for i,s in enumerate(plan['sites']):
 col=i//12;row=i%12;x=65+col*565;y=1210+row*21
 svg.append(f'<text x="{x}" y="{y}" font-size="12"><tspan fill="{colors[s["district"]]}" font-weight="bold">{i+1:02}</tspan><tspan dx="10">{escape(s["name"])}'+('  [draft]' if s['draft'] else '')+'</tspan></text>')
svg+=['<text x="60" y="1490" class="small">Solid sites are sourced from the project. Dashed parcels are retained draft additions. All geography is proposed.</text>','<text x="60" y="1511" class="small">Off-town city locations, Pip’s new bedroom, and the travelling car are catalogued separately. Main Street is established; other road labels are working descriptions.</text>','</svg>']
(folder/'master-plan.svg').write_text('\n'.join(svg)+'\n')
print(folder/'master-plan.svg')
