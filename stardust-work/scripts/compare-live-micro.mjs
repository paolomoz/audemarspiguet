/* compare-live-micro — R-02: micro-geometry of the live overlay details rows
   and the calibre flip button (2px/8px residual hunt). */
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
  const rect = (e) => (e ? (({ y, height, x, width }) => ({ y: +y.toFixed(1), h: +height.toFixed(1), x: +x.toFixed(1), w: +width.toFixed(1) }))(e.getBoundingClientRect()) : null);
  const d = document.querySelector('.compare-table-row__details');
  const label = d.querySelector('.compare-table-row__label');
  const desc = d.querySelector('.compare-table-row__description');
  const btn = document.querySelector('.compare__table-row__flip-button');
  const icon = btn?.querySelector('.icon-arrow-360-bold');
  const iconWrap = icon?.parentElement;
  const content = btn?.querySelector('.ap-button__content');
  const gs = (e, props) => { const cs = getComputedStyle(e); const o = {}; props.forEach((k) => { o[k] = cs[k]; }); return o; };
  return {
    details: rect(d),
    detailsCS: gs(d, ['padding', 'margin', 'lineHeight', 'fontSize']),
    label: rect(label),
    labelCS: gs(label, ['margin', 'lineHeight', 'fontSize', 'padding']),
    desc: rect(desc),
    descCS: gs(desc, ['margin', 'lineHeight', 'fontSize', 'padding']),
    btn: rect(btn),
    btnCS: btn ? gs(btn, ['padding', 'margin', 'minHeight', 'font', 'display', 'alignItems', 'gap']) : null,
    btnContent: rect(content),
    btnContentCS: content ? gs(content, ['padding', 'gap', 'display', 'alignItems']) : null,
    icon: rect(icon),
    iconCS: icon ? gs(icon, ['fontSize', 'lineHeight', 'margin', 'padding']) : null,
    iconWrapCS: iconWrap && iconWrap !== content ? gs(iconWrap, ['margin', 'padding', 'fontSize', 'display']) : null,
    btnText: btn?.textContent.trim(),
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
