import re

html = open('/Users/paolo/stardust/audemarspiguet/stardust-work/current/stores-1440-hydrated.html').read()
i = html.find('ap-store-locator-app')
j = html.find('google-map-element', i)
seg = html[i - 200:j]
# strip long attribute noise
print(seg[:16000])
