/* compare-flip-probe — rect + src of the calibre flip image, live or replica.
   Usage: node compare-flip-probe.mjs live|replica */
import { chromium } from 'playwright';

const MODE = process.argv[2] || 'replica';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, locale: 'en-GB' })).newPage();
const url = MODE === 'live'
  ? 'https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection'
  : 'http://localhost:3006/ch/en/collections/code-11-59-collection';
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
if (MODE === 'replica') await p.evaluate(() => window.localStorage.clear());
await p.waitForTimeout(MODE === 'live' ? 4000 : 2500);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 3000 })) await x.click(); } catch { /* absent */ }
await p.evaluate(async (mode) => {
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 9000; y += 900) { window.scrollTo(0, y); await w(mode === 'live' ? 600 : 300); }
}, MODE).catch(() => {});
await p.click(MODE === 'live' ? '.compare-button-toggle' : '.pl-compare');
await p.waitForTimeout(1000);
const sel = MODE === 'live' ? '.ap-checkbox__wrapper' : '.pl-grid .ap-checkbox__input';
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate(({ s, idx }) => document.querySelectorAll(s)[idx].click(), { s: sel, idx: i });
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(400);
}
await p.evaluate(() => {
  const btn = [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent));
  btn.click();
});
await p.waitForTimeout(6000);
const out = await p.evaluate(async () => {
  const sc = document.querySelector('.ap-overlay-item__container');
  sc.scrollTop = 3600;
  await new Promise((r) => setTimeout(r, 1500));
  const rect = (e) => (e ? (({ x, y, width, height }) => ({ x: +x.toFixed(1), y: +y.toFixed(1), w: +width.toFixed(1), h: +height.toFixed(1) }))(e.getBoundingClientRect()) : null);
  const cont = document.querySelectorAll('.compare-table-row__image-container--gray')[0];
  const wrap = cont.querySelector('.compare__table-row-flip-image');
  const fig = cont.querySelector('.compare__table-row-flip-image-inner');
  const front = cont.querySelector('.compare__table-row-flip-image-front');
  const img = front.querySelector('img');
  const ref = cont.querySelector('.compare__table-row-flip-image-reference img');
  return {
    cont: rect(cont),
    wrap: rect(wrap),
    fig: rect(fig),
    front: rect(front),
    img: { ...rect(img), src: img.currentSrc.slice(-80), nat: [img.naturalWidth, img.naturalHeight] },
    ref: ref ? { ...rect(ref), nat: [ref.naturalWidth, ref.naturalHeight] } : null,
  };
});
console.log(MODE, JSON.stringify(out, null, 1));
await b.close();
