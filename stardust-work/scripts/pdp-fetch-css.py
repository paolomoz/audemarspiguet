"""Download the PDP per-component CSS chunks referenced by the hydrated DOM."""
import re
import os
import urllib.request

HYDRATED = '/Users/paolo/stardust/audemarspiguet/stardust-work/current/pages/ch-en-watch-collection-roo-26420so-hydrated.html'
OUTDIR = '/Users/paolo/stardust/audemarspiguet/stardust-work/current/pdp-css'

html = open(HYDRATED).read()
hrefs = sorted(set(re.findall(r'href="(/etc\.clientlibs/[^"]*componentsV3[^"]*\.css)"', html)))
os.makedirs(OUTDIR, exist_ok=True)
for h in hrefs:
    name = re.search(r'componentsV3_([A-Za-z]+)_', h).group(1)
    url = 'https://www.audemarspiguet.com' + h
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req).read()
    open(f'{OUTDIR}/{name}.css', 'wb').write(data)
    print(name, len(data))
