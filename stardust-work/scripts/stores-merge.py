import json
from collections import Counter

base = '/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-1440-yext-'
ents = []
for i in (1, 2, 3):
    d = json.load(open(f'{base}{i}.json'))
    ents += d['entities']

# dedupe by meta.id (pagination should not overlap, but be safe)
seen = set()
out = []
for e in ents:
    i = e.get('meta', {}).get('id')
    if i in seen:
        continue
    seen.add(i)
    out.append(e)

print('entities merged:', len(out))
print('retailer types:', Counter(e.get('c_retailerType_v2') for e in out))
print('countries:', Counter(e.get('address', {}).get('countryCode') for e in out).most_common(15))
it = [e for e in out if e.get('address', {}).get('countryCode') == 'IT']
print('IT stores:', [(e['name'], e.get('c_retailerType_v2'), e['yextDisplayCoordinate']) for e in it])
ch = [e for e in out if e.get('address', {}).get('countryCode') == 'CH']
print('CH stores:', [(e['name'], round(e['yextDisplayCoordinate']['latitude'], 2), round(e['yextDisplayCoordinate']['longitude'], 2)) for e in ch])

dst = '/Users/paolo/stardust/audemarspiguet/.claude/worktrees/agent-ad08e60bc4368d64e/data/stores-ch-en.json'
json.dump({'entities': out, 'count': len(out)}, open(dst, 'w'), separators=(',', ':'))
print('written', dst)
