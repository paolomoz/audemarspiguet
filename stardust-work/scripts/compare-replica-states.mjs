/* compare-replica-states — capture the replica's compare interaction states
   at the same viewports/scroll offsets as the live probes, for pixel proofs.
   Usage: node compare-replica-states.mjs <width> [port] */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const PORT = process.argv[3] || '3006';
const H = W < 768 ? 780 : 900;
const OUT = '/Users/paolo/stardust/audemarspiguet/stardust-work/current';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB', isMobile: W < 768, hasTouch: W < 768,
});
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push(String(e)));

await p.goto(`http://localhost:${PORT}/ch/en/collections/code-11-59-collection`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.evaluate(() => window.localStorage.clear());
await p.waitForTimeout(3000);
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 9000; y += 900) { window.scrollTo(0, y); await wait(400); }
  document.querySelector('.pl-grid')?.scrollIntoView();
  window.scrollBy(0, -160);
  await wait(1200);
});
await p.waitForSelector('.pl-compare');

// 1. compare mode (empty)
await p.click('.pl-compare');
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/compare-replica-mode-empty-${W}.png` });

// 2. select first three cards
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate((idx) => {
    const input = document.querySelectorAll('.pl-grid .ap-checkbox__input')[idx];
    input.click();
  }, i);
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(500);
}
await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/compare-replica-selected-${W}.png` });

// 3. open overlay, wait for images
await p.click('.compare-status-bar__submit-button');
await p.waitForTimeout(1500);
await p.waitForSelector('.ap-compare-overlay');
await p.evaluate(async () => {
  // settle all overlay images (dwell down the scroll container)
  const sc = document.querySelector('.ap-overlay-item__container');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= sc.scrollHeight; y += 800) { sc.scrollTop = y; await wait(500); }
  sc.scrollTop = 0;
  await wait(1000);
});
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/compare-replica-modal-top-${W}.png` });
for (const y of [600, 1400, 2400, 3600]) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate((yy) => { document.querySelector('.ap-overlay-item__container').scrollTop = yy; }, y);
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(900);
  // eslint-disable-next-line no-await-in-loop
  await p.screenshot({ path: `${OUT}/compare-replica-modal-s${y}-${W}.png` });
}
const scrollHeight = await p.evaluate(() => document.querySelector('.ap-overlay-item__container').scrollHeight);

// 4. numeric checkbox/status-bar lift for value-level verification
await p.evaluate(() => { document.querySelector('.ap-overlay-item__close-button').click(); });
await p.waitForTimeout(800);
const lift = await p.evaluate(() => {
  const r = (el) => (el ? (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()) : null);
  const cb = document.querySelector('.pl-grid .ap-checkbox');
  const card = cb?.closest('.product-card');
  const box = cb?.querySelector('.ap-checkbox__box');
  const cs = box ? getComputedStyle(box) : null;
  const after = box ? getComputedStyle(box, '::after') : null;
  const sb = document.querySelector('.compare-status-bar');
  return {
    checkboxHost: r(cb),
    cardTopRightDelta: cb && card ? { dx: card.getBoundingClientRect().right - cb.getBoundingClientRect().right, dy: cb.getBoundingClientRect().top - card.getBoundingClientRect().top } : null,
    box: box ? { ...r(box), outline: cs.outline, background: cs.backgroundColor, transition: cs.transition } : null,
    after: after ? { clip: after.clipPath, background: after.background.slice(0, 40), scale: after.scale, transition: after.transition } : null,
    statusBar: sb ? { ...r(sb), transition: getComputedStyle(sb).transition, borderTop: getComputedStyle(sb).borderTop, zIndex: getComputedStyle(sb).zIndex } : null,
    buttons: [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].map((e) => ({ text: e.textContent.trim(), ...r(e), font: getComputedStyle(e).font, bg: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).border })),
  };
});
console.log(JSON.stringify({ width: W, scrollHeight, lift, errors: errors.slice(0, 10) }, null, 1));
await b.close();
