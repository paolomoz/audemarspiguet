#!/bin/zsh
# One-shot deploy of /ch/en/home after DA_TOKEN refresh in /Users/paolo/.claude/.env
set -e
cd /Users/paolo/stardust/audemarspiguet
TOK=$(grep '^DA_TOKEN=' /Users/paolo/.claude/.env | cut -d= -f2-)
cp content/ch/en/home.html /tmp/home-deploy.html
/usr/bin/env node stardust-work/scripts/sanitise.js /tmp/home-deploy.html
echo "-- PUT source"
/usr/bin/curl -s -o /dev/null -w "PUT: %{http_code}\n" -X PUT \
  -H "Authorization: Bearer $TOK" \
  -F "data=@/tmp/home-deploy.html;type=text/html" \
  "https://admin.da.live/source/paolomoz/audemarspiguet/ch/en/home.html"
echo "-- preview"
/usr/bin/curl -s -o /dev/null -w "preview: %{http_code}\n" -X POST \
  -H "Authorization: Bearer $TOK" \
  "https://admin.hlx.page/preview/paolomoz/audemarspiguet/main/ch/en/home"
echo "-- live"
/usr/bin/curl -s -o /dev/null -w "live: %{http_code}\n" -X POST \
  -H "Authorization: Bearer $TOK" \
  "https://admin.hlx.page/live/paolomoz/audemarspiguet/main/ch/en/home"
echo "-- verify plain.html"
PLAIN=$(/usr/bin/curl -s "https://main--audemarspiguet--paolomoz.aem.live/ch/en/home.plain.html")
echo "h1 count: $(echo "$PLAIN" | grep -o '<h1' | wc -l | tr -d ' ')"
echo "about:error count: $(echo "$PLAIN" | grep -c 'about:error' || true)"
echo "-- deployed computed-style gate"
/usr/bin/env node stardust-work/scripts/deployed-gate.mjs "https://main--audemarspiguet--paolomoz.aem.live/ch/en/home" 1440
/usr/bin/env node stardust-work/scripts/deployed-gate.mjs "https://main--audemarspiguet--paolomoz.aem.live/ch/en/home" 360
