/* compare-icon-extract — pull icon-cross (0xe915) + icon-arrow-360-bold
   (0xe921) outlines from AP's own icomoon.woff2 (same technique as the
   footer social icons). Prints SVG path data. */
import fs from 'fs';
import * as fontkit from 'fontkit';

const url = 'https://www.audemarspiguet.com/etc.clientlibs/ap-com/ui/clientlibs/publish/resources/fonts/icomoon.woff2';
console.log('font url:', url);

const resp = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } });
const buf = Buffer.from(await resp.arrayBuffer());
fs.writeFileSync('/tmp/ap-icomoon.woff2', buf);
const font = fontkit.openSync('/tmp/ap-icomoon.woff2');
for (const [name, cp] of [['cross', 0xe915], ['arrow-360-bold', 0xe921], ['info', 0xe918]]) {
  const run = font.layout(String.fromCodePoint(cp));
  const glyph = run.glyphs[0];
  console.log(`\n${name}: advance=${glyph.advanceWidth} upm=${font.unitsPerEm} bbox=${JSON.stringify(glyph.bbox)}`);
  console.log(glyph.path.toSVG());
}
