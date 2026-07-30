/* compare-replica-rows — lift replica overlay row offsets (content coords,
   same base as the live contentTree lift) for geometry debugging. */
import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:3006/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => window.localStorage.clear());
await p.waitForTimeout(2500);
await p.evaluate(async () => {
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 9000; y += 1200) { window.scrollTo(0, y); await w(250); }
});
await p.click('.pl-compare');
await p.waitForTimeout(600);
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate((idx) => document.querySelectorAll('.pl-grid .ap-checkbox__input')[idx].click(), i);
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(200);
}
await p.click('.compare-status-bar__submit-button');
await p.waitForSelector('.ap-compare-overlay');
await p.waitForTimeout(1500);
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
      descH: Math.round(e.querySelector('.compare-table-row__description')?.getBoundingClientRect().height || 0),
    })).slice(0, 20);
  return {
    details,
    sections: [...document.querySelectorAll('.compare-table__section-header')].map((e) => Math.round(e.getBoundingClientRect().y - base)),
    imageRowsAll: [...document.querySelectorAll('.compare-table-row__image-container')].filter((e, i2) => i2 % 3 === 0).map((e) => Math.round(e.getBoundingClientRect().y - base)),
    flipBtn: r('.compare__table-row__flip-button'),
    title: r('.compare-table__title'),
    mobileHeader: r('.compare-table-mobile-header'),
    wrapper: r('.compare-table__wrapper'),
    headRow: r('.compare-table-head__row'),
    priceCell: r('.compare-table-head__price-cells'),
    caseImage: r('.compare-table-row__image-container', 0),
    materialDetails: r('.compare-table-row__details', 0),
    sectionDial: r('.compare-table__section-header', 1),
    dialImage: r('.compare-table-row__image-container', 3),
    sectionBracelet: r('.compare-table__section-header', 2),
    sectionCalibre: r('.compare-table__section-header', 3),
    totalH: sc.scrollHeight,
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
