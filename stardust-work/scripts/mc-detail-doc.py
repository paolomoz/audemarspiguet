# Generate the masterclass detail content doc's FAQ rows from the extracted
# Q/A JSON (mc-faq-extract.py output).
# Usage: python3 mc-detail-doc.py <faq.json>  → prints the accordion rows HTML
import json
import re
import sys
from html import escape

d = json.load(open(sys.argv[1], encoding='utf-8'))


def render_answer(a):
    # markers: \n<P> starts a paragraph; <A href=X>text</A> inline links
    parts = [p.strip() for p in a.split('<P>') if p.strip()]
    out = []
    for p in parts:
        p = escape(p, quote=False)
        p = re.sub(
            r'&lt;A href=([^&>]*)&gt;(.*?)&lt;/A&gt;',
            lambda m: f'<a href="{m.group(1)}">{m.group(2)}</a>',
            p,
        )
        out.append(f'<p>{p}</p>')
    return ''.join(out)


rows = []
for it in d['items']:
    rows.append(
        f'    <div><div><p>{escape(it["q"], quote=False)}</p></div>'
        f'<div>{render_answer(it["a"])}</div></div>'
    )
print('\n'.join(rows))
