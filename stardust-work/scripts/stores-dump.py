import json
import sys

for w in (1440, 360):
    d = json.load(open(f'/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-{w}-lift.json'))
    print(f'===== {w} =====')
    for k, v in d['classSweep'].items():
        if not v['rect']:
            continue
        print(k)
        print('  rect', v['rect'], 'count', v['count'])
        print('  typo', v['typo'])
        b = v['box']
        keep = ('display', 'position', 'padding', 'margin', 'backgroundColor', 'border',
                'borderRadius', 'width', 'height', 'gap', 'flexDirection', 'alignItems',
                'justifyContent', 'overflow', 'top', 'left')
        print('  box ', {kk: b[kk] for kk in keep if b.get(kk) and b[kk] not in ('none', 'normal', 'rgba(0, 0, 0, 0)', '0px', 'auto', 'visible', 'static', 'stretch')})
        if v.get('text'):
            print('  text', v['text'][:120])
