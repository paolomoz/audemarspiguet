// Crop a band out of a (possibly huge) PNG and optionally downscale by integer factor.
// Usage: node png-crop.mjs <in.png> <out.png> <y0> <h> [scaleDiv]
/* eslint-disable import/no-extraneous-dependencies */
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'fs';

const [inP, outP, y0s, hs, divs] = process.argv.slice(2);
const y0 = Number(y0s); const h = Number(hs); const div = Number(divs || 1);
const img = PNG.sync.read(readFileSync(inP));
const hh = Math.min(h, img.height - y0);
const out = new PNG({ width: Math.floor(img.width / div), height: Math.floor(hh / div) });
for (let y = 0; y < out.height; y += 1) {
  for (let x = 0; x < out.width; x += 1) {
    const si = ((y0 + y * div) * img.width + x * div) * 4;
    const di = (y * out.width + x) * 4;
    out.data[di] = img.data[si]; out.data[di + 1] = img.data[si + 1];
    out.data[di + 2] = img.data[si + 2]; out.data[di + 3] = img.data[si + 3];
  }
}
writeFileSync(outP, PNG.sync.write(out));
console.log(`${outP}: ${out.width}x${out.height} (from y=${y0} h=${hh} div=${div})`);
