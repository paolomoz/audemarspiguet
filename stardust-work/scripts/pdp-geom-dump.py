"""Compact console dump of a pdp-geom JSON. Usage: pdp-geom-dump.py <file> [name ...]"""
import json
import sys

d = json.load(open(sys.argv[1]))
names = sys.argv[2:] or list(d.keys())
KEEP = ('font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color',
        'background-color', 'margin', 'padding', 'border', 'display', 'gap',
        'grid-template-columns', 'object-fit', 'text-transform', 'text-decoration-line',
        'width', 'max-width', 'position', 'justify-content', 'align-items', 'flex-direction',
        'text-align', 'min-height', 'background-image', 'overflow')
for name in names:
    els = d.get(name, [])
    print('==', name, '(%d)' % len(els))
    for e in els[:6]:
        keep = {k: v for k, v in e['style'].items() if k in KEEP}
        print('  ', e['tag'], e['rect'], '|', e['text'][:40], '|', keep)
