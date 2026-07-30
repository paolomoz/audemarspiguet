/* compare-dial-probe — dial image rect at 360 (plain viewport), live|replica */
import { chromium } from 'playwright';

const MODE = process.argv[2] || 'replica';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' })).newPage();
const url = MODE === 'live'
  ? 'https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection'
  : 'http://localhost:3006/ch/en/collections/code-11-59-collection';
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
if (MODE !== 'live') await p.evaluate(() => window.localStorage.clear());
await p.waitForTimeout(3000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 3000 })) await x.click(); } catch { /* absent */ }
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 12000; y += 900) { window.scrollTo(0, y); await wait(500); }
});
await p.click(MODE === 'live' ? '.compare-button-toggle' : '.pl-compare');
await p.waitForTimeout(1000);
const sel = MODE === 'live' ? '.ap-product-card .ap-checkbox__wrapper' : '.pl-grid .ap-checkbox__input';
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate(({ s, idx }) => document.querySelectorAll(s)[idx].click(), { s: sel, idx: i });
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(400);
}
await p.evaluate(() => [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent) && !x.disabled).click());
await p.waitForTimeout(6000);
const out = await p.evaluate(async () => {
  const sc = document.querySelector('.ap-overlay-item__container');
  sc.scrollTop = 1400;
  await new Promise((r) => setTimeout(r, 1200));
  const rect = (e) => (e ? (({ x, y, width, height }) => ({ x: +x.toFixed(1), y: +y.toFixed(1), w: +width.toFixed(1), h: +height.toFixed(1) }))(e.getBoundingClientRect()) : null);
  const conts = [...document.querySelectorAll('.compare-table-row__image-container')];
  const dial = conts[3]; // second image row, col 1
  const img = dial?.querySelector('img');
  const pic = dial?.querySelector('picture');
  const cell = dial?.closest('.compare__table-cell');
  return {
    cell: rect(cell),
    cont: rect(dial),
    pic: rect(pic),
    img: img ? { ...rect(img), src: img.currentSrc.slice(-70), nat: [img.naturalWidth, img.naturalHeight] } : null,
    contCS: dial ? (({ marginBottom, aspectRatio }) => ({ marginBottom, aspectRatio }))(getComputedStyle(dial)) : null,
    imgCS: img ? (({ aspectRatio, objectFit, width, maxWidth, maxHeight }) => ({ aspectRatio, objectFit, width, maxWidth, maxHeight }))(getComputedStyle(img)) : null,
  };
});
console.log(MODE, JSON.stringify(out, null, 1));
await b.close();
