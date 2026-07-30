import json

icons = json.load(open('/tmp/store-icons.json'))

header = '''/**
 * store-locator icons — the four store-card glyphs (date/location/mail/phone)
 * are AP's own icomoon outlines extracted from the live site's icomoon.woff2
 * (etc.clientlibs; codepoints e926/e923/e925/e924 from the AP CSS bundle),
 * same method as blocks/footer/social-icons.js. Search magnifier + chevron
 * are static equivalents of the live GSAP-drawn SVGs (geometry lifted from
 * the hydrated DOM's rendered transforms).
 */

export const STORE_ICONS = {
'''

parts = [header]
for name in ('date', 'location', 'mail', 'phone'):
    svg = icons[name].replace("'", "\\'")
    parts.append(f"  {name}: '{svg}',\n")

parts.append("""  search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true"><circle fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" cx="110" cy="90" r="40"/><line fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" x1="91" y1="109" x2="55.6" y2="144.4"/></svg>',
  chevron: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true" style="transform:translate(0,10%)"><line vector-effect="non-scaling-stroke" x1="100" y1="100" x2="64.6" y2="64.6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><line vector-effect="non-scaling-stroke" x1="100" y1="100" x2="135.4" y2="64.6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>',
};

export default STORE_ICONS;
""")

dst = '/Users/paolo/stardust/audemarspiguet/.claude/worktrees/agent-ad08e60bc4368d64e/blocks/store-locator/icons.js'
import os
os.makedirs(os.path.dirname(dst), exist_ok=True)
open(dst, 'w').write(''.join(parts))
print('written', dst, sum(len(p) for p in parts), 'bytes')
