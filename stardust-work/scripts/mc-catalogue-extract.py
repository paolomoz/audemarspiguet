# Extract the server-embedded masterclass catalogue from a saved live page
# source (the <ap-masterclass-card :product="..."> attributes) into a JSON
# data asset, following the product-listing feed-snapshot convention.
# Usage: python3 mc-catalogue-extract.py <saved-page.html> <out.json>
import re
import html as H
import json
import sys

raw = open(sys.argv[1], encoding='utf-8').read()
prods = []
for m in re.finditer(r'<ap-masterclass-card[^>]*?:product="([^"]*)"', raw, re.S):
    j = H.unescape(m.group(1))
    try:
        prods.append(json.loads(j))
    except Exception as e:  # noqa: BLE001
        print('parse fail', e, j[:100])
print('cards found:', len(prods))
seen = {}
for p in prods:
    seen.setdefault(p['sku'], p)
for p in seen.values():
    print(p['sku'], '|', p['name'], '|', p['priceRange']['minimumPrice']['regularPrice'],
          '|', p['duration'], '| type', p['masterclassType'], 'level', p['level'])
out = {
    'source': 'https://www.audemarspiguet.com/ch/en/masterclasses (server-embedded <ap-masterclass-card :product> attributes)',
    'captured': '2026-07-30',
    'total': len(seen),
    'items': list(seen.values()),
}
with open(sys.argv[2], 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print('written', sys.argv[2], 'unique skus:', list(seen))
