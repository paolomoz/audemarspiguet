import re
import sys

files = [
    '/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-component-library.css',
    '/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-main-css-1.css',
    '/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-main-css-2.css',
    '/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-locator-chunk.css',
]
pat = sys.argv[1]
for f in files:
    css = open(f).read()
    # split into rule blocks (handles @media crudely by scanning braces)
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel, body = m.group(1), m.group(2)
        if re.search(pat, sel):
            print(f.split("/")[-1], '::', sel.strip()[:160], '{', body.strip()[:400], '}')
