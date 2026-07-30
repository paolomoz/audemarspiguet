/* compare-probe-reveal — check whether the live comparison overlay's title /
   section headings reveal in headless (they were blank in all captures).
   Tries container scroll + window events, samples opacity/transform. */
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 9000; y += 900) { window.scrollTo(0, y); await wait(600); }
});
await p.click('.compare-button-toggle');
await p.waitForTimeout(1000);
for (let i = 0; i < 2; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate((idx) => document.querySelectorAll('.ap-checkbox__wrapper')[idx].click(), i);
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(400);
}
await p.evaluate(() => [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent)).click());
await p.waitForTimeout(5000);

const read = () => p.evaluate(() => {
  const t = document.querySelector('.compare-table__header .title');
  const h = document.querySelector('.compare-table__heading');
  const cs = t ? getComputedStyle(t) : null;
  const hs = h ? getComputedStyle(h) : null;
  return {
    title: t ? { opacity: cs.opacity, transform: cs.transform, visibility: cs.visibility, cls: t.className, kids: t.innerHTML.slice(0, 200) } : null,
    heading: h ? { opacity: hs.opacity, transform: hs.transform, visibility: hs.visibility } : null,
  };
});
console.log('initial:', JSON.stringify(await read()));
await p.evaluate(async () => {
  const sc = document.querySelector('.ap-overlay-item__container');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  sc.scrollTop = 200; sc.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('scroll'));
  await wait(800);
  sc.scrollTop = 0; sc.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('scroll'));
  await wait(1500);
});
console.log('after scroll:', JSON.stringify(await read()));
await p.waitForTimeout(2500);
console.log('later:', JSON.stringify(await read()));
await p.screenshot({ path: '/Users/paolo/stardust/audemarspiguet/stardust-work/current/compare-reveal-check-1440.png' });
await b.close();
