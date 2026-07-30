#!/usr/bin/env python3
"""Pretty-print selected fields from a compare-lift JSON (R-02 recon helper)."""
import json
import sys

path = sys.argv[1]
section = sys.argv[2] if len(sys.argv) > 2 else 'compareMode'
d = json.load(open(path))
PROPS = ['rect', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'padding',
         'margin', 'background', 'backgroundColor', 'border', 'borderRadius', 'font', 'color',
         'zIndex', 'transition', 'display', 'flexDirection', 'gap', 'justifyContent',
         'alignItems', 'inset', 'letterSpacing', 'textTransform', 'opacity', 'transform']

def show(name, v, maxlen=800):
    if v is None:
        print(name, '= None')
        return
    if isinstance(v, dict):
        slim = {p: v[p] for p in PROPS if p in v and v[p] not in (None, '', 'none', 'normal', 'auto')}
        print(name, json.dumps(slim, default=str)[:maxlen])
    else:
        print(name, json.dumps(v, default=str)[:maxlen])

sec = d.get(section, {})
if isinstance(sec, dict):
    for k, v in sec.items():
        if k.endswith('HTML'):
            print(k, '=', (v or '')[:1500])
        elif isinstance(v, list):
            print(k, json.dumps(v, default=str)[:1600])
        else:
            show(k, v)
else:
    print(json.dumps(sec, default=str)[:4000])
