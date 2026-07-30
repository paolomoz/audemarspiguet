# Extract FAQ accordion Q/A pairs (verbatim) from the detail page hydrated DOM.
# Usage: python3 mc-faq-extract.py <detail-dom.html> <out.json>
import re
import json
import sys
from html.parser import HTMLParser


class Grab(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = []
        self.mode = None
        self.depth = 0
        self.buf = []
        self.qbuf = []

    def handle_starttag(self, tag, attrs):
        cls = dict(attrs).get('class', '')
        if 'ap-accordion__label' in cls and tag == 'button':
            self.mode = 'q'
            self.qbuf = []
        elif 'ap-faq__item-content' in cls:
            self.mode = 'a'
            self.depth = 1
            self.buf = []
        elif self.mode == 'a':
            self.depth += 1
            if tag == 'p':
                self.buf.append('\n<P>')
            if tag == 'a':
                href = dict(attrs).get('href', '')
                self.buf.append(f'<A href={href}>')

    def handle_endtag(self, tag):
        if self.mode == 'q' and tag == 'button':
            self.items.append({'q': ' '.join(''.join(self.qbuf).split()), 'a': ''})
            self.mode = None
        elif self.mode == 'a':
            if tag == 'a':
                self.buf.append('</A>')
            self.depth -= 1
            if self.depth <= 0:
                self.items[-1]['a'] = ''.join(self.buf).strip()
                self.mode = None

    def handle_data(self, data):
        if self.mode == 'q':
            self.qbuf.append(data)
        elif self.mode == 'a':
            self.buf.append(data)


html = open(sys.argv[1], encoding='utf-8').read()
seg = html[html.find('cmp-experiencefragment--master11'):html.find('class="newsletter"')]
g = Grab()
g.feed(seg)
# also grab the section h2
m = re.search(r'--master11.*?<h2[^>]*>(.*?)</h2>', seg, re.S)
title = ' '.join(re.sub(r'<[^>]+>', '', m.group(1)).split()) if m else None
out = {'title': title, 'items': g.items}
with open(sys.argv[2], 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print('title:', title)
print('items:', len(g.items))
for it in g.items:
    print('-', it['q'][:70], '||', it['a'][:60].replace('\n', ' '))
