/* compare-probe-price — lift the exact rendered price string + tooltip markup
   in the live comparison view for priced refs (R-02 formatting evidence). */
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const REFS = process.argv.slice(2);
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 9000; y += 900) { window.scrollTo(0, y); await wait(700); }
});
await p.click('.compare-button-toggle');
await p.waitForTimeout(1200);
const found = await p.evaluate(async (refs) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const hits = [];
  for (const ref of refs) {
    const input = document.querySelector(`.ap-checkbox__input[value="${ref}"]`);
    if (input) { input.closest('.ap-checkbox__wrapper').click(); hits.push(ref); await wait(500); }
  }
  return hits;
}, REFS);
console.log('selected:', found);
await p.waitForTimeout(800);
await p.evaluate(() => [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent)).click());
await p.waitForTimeout(6000);
const out = await p.evaluate(() => ({
  prices: [...document.querySelectorAll('.compare-table-head__price-container')].map((e) => e.outerHTML),
  headPrice: [...document.querySelectorAll('.compare-table-head__price')].map((e) => e.textContent.trim()),
  tooltip: document.querySelector('.compare-table-head__tooltip')?.outerHTML?.slice(0, 800) || null,
}));
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
await b.close();
