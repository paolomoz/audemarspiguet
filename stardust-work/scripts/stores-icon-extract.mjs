#!/usr/bin/env node
// Extract the 4 store-card icomoon glyphs (date/location/mail/phone) from
// AP's own icomoon.woff2 into inline SVG path data (same method as the
// footer's social-icons.js extraction).
/* eslint-disable import/no-extraneous-dependencies */
import * as fontkit from 'fontkit';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

const URL = 'https://www.audemarspiguet.com/etc.clientlibs/ap-com/ui/clientlibs/publish/resources/fonts/icomoon.woff2';
const TMP = '/tmp/icomoon-stores.woff2';
execSync(`curl -s "${URL}" -o ${TMP}`);
const font = fontkit.openSync(TMP);
const icons = { date: 0xe926, location: 0xe923, mail: 0xe925, phone: 0xe924 };
const out = {};
Object.entries(icons).forEach(([name, cp]) => {
  const run = font.layout(String.fromCodePoint(cp));
  const glyph = run.glyphs[0];
  const path = glyph.path.toSVG();
  out[name] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${font.unitsPerEm} ${font.unitsPerEm}" aria-hidden="true"><path transform="translate(0,${font.ascent}) scale(1,-1)" d="${path.replace(/"/g, '')}" fill="currentColor"/></svg>`;
  console.log(name, 'advance', glyph.advanceWidth, 'upem', font.unitsPerEm, 'ascent', font.ascent);
});
writeFileSync('/tmp/store-icons.json', JSON.stringify(out, null, 1));
console.log('written /tmp/store-icons.json');
