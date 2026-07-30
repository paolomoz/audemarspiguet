// Featured-products internals on the local harness.
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '1440', 10);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width, height: 900 } })).newPage();
await p.goto('http://localhost:3007/drafts/pdp-26420so', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2500);
const d = await p.evaluate(() => {
  const r = (el) => { const x = el.getBoundingClientRect(); return [Math.round(x.top + scrollY), Math.round(x.left), Math.round(x.width), Math.round(x.height)]; };
  return [...document.querySelectorAll('.product-highlights .ph-feature')].map((f) => ({
    f: r(f),
    text: r(f.querySelector('.ph-text')),
    media: r(f.querySelector('.ph-media')),
    box: [...f.querySelectorAll('.ph-imgbox')].map((x) => [r(x), getComputedStyle(x).display, getComputedStyle(x).paddingBottom, getComputedStyle(x).height]),
    img: [...f.querySelectorAll('img')].map((i) => [r(i), (i.currentSrc || '').slice(90, 150)]),
  }));
});
console.log(JSON.stringify(d, null, 1));
await b.close();
