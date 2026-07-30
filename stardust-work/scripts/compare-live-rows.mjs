/* compare-live-rows — same row-offset lift as compare-replica-rows, but on
   the live comparison overlay (R-02 geometry debugging). */
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, locale: 'en-GB' })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.evaluate(async () => {
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 9000; y += 900) { window.scrollTo(0, y); await w(600); }
});
await p.click('.compare-button-toggle');
await p.waitForTimeout(1000);
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate((idx) => document.querySelectorAll('.ap-checkbox__wrapper')[idx].click(), i);
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(400);
}
await p.evaluate(() => [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent)).click());
await p.waitForTimeout(6000);
const out = await p.evaluate(() => {
  const sc = document.querySelector('.ap-overlay-item__container');
  sc.scrollTop = 0;
  const base = document.querySelector('.compare-table').getBoundingClientRect().y - 188;
  const r = (sel, i) => {
    const e = document.querySelectorAll(sel)[i || 0];
    return e ? Math.round(e.getBoundingClientRect().y - base) : null;
  };
  const details = [...document.querySelectorAll('.compare-table-row__details')]
    .filter((e, i2) => i2 % 3 === 0)
    .map((e) => ({
      label: e.querySelector('.compare-table-row__label')?.textContent.trim(),
      y: Math.round(e.getBoundingClientRect().y - base),
      h: Math.round(e.getBoundingClientRect().height),
      labelH: Math.round(e.querySelector('.compare-table-row__label')?.getBoundingClientRect().height || 0),
      labelMB: getComputedStyle(e.querySelector('.compare-table-row__label')).marginBottom,
      descH: Math.round(e.querySelector('.compare-table-row__description')?.getBoundingClientRect().height || 0),
    })).slice(0, 20);
  return {
    header: r('.compare-table__header'),
    mobileHeader: r('.compare-table-mobile-header'),
    wrapper: r('.compare-table__wrapper'),
    headRow: r('.compare-table-head__row'),
    priceCell: r('.compare-table-head__price-cells'),
    caseImage: r('.compare-table-row__image-container', 0),
    details,
    sections: [...document.querySelectorAll('.compare-table__section-header')].map((e) => Math.round(e.getBoundingClientRect().y - base)),
    imageRows: [...document.querySelectorAll('.compare-table-row__image-container')].filter((e, i2) => i2 % 3 === 0).map((e) => Math.round(e.getBoundingClientRect().y - base)),
    flipBtn: r('.compare__table-row__flip-button'),
    totalH: sc.scrollHeight,
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
