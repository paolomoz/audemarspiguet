/* compare-proof — R-02 interaction-state pixel proofs, symmetric instrument.
   Captures live audemarspiguet.com AND the local replica in the SAME browser
   context shape (plain viewport, no mobile emulation — the earlier isMobile
   live captures laid out at 381px from a live overflow, poisoning the diff),
   drives the same interaction (toggle → 3 selected → comparison overlay →
   scroll states), then pixelmatches per state.
   Replica gets "bug-parity" CSS injected (title/section headings white, as
   live's theme-dark token leak renders them) so the diff measures layout,
   not the documented register-candidate delta.
   Usage: node compare-proof.mjs <width> */
import { chromium } from 'playwright';
import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const W = Number(process.argv[2] || 1440);
const H = W < 768 ? 780 : 900;
const PORT = '3006';
const OUT = '/Users/paolo/stardust/audemarspiguet/stardust-work/current';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const SCROLLS = [600, 1400, 2400, 3600];

async function captureStates(mode) {
  const isLive = mode === 'live';
  const tag = isLive ? 'proofref' : 'parity';
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB',
  });
  const p = await ctx.newPage();
  const url = isLive
    ? 'https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection'
    : `http://localhost:${PORT}/ch/en/collections/code-11-59-collection`;
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (!isLive) {
    await p.evaluate(() => window.localStorage.clear());
    await p.addStyleTag({ content: '.ap-compare-overlay .compare-table__title, .ap-compare-overlay .compare-table__heading { color: #fff !important; }' });
  }
  await p.waitForTimeout(isLive ? 4000 : 3000);
  if (isLive) {
    try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
  }
  await p.evaluate(async (live) => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y <= 9000; y += 900) { window.scrollTo(0, y); await wait(live ? 700 : 400); }
    const grid = document.querySelector(live ? '.ap-product-grid' : '.pl-grid');
    grid?.scrollIntoView();
    window.scrollBy(0, -160);
    await wait(1200);
  }, isLive);

  await p.click(isLive ? '.compare-button-toggle' : '.pl-compare');
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/compare-${tag}-mode-empty-${W}.png` });

  const sel = isLive ? '.ap-product-card .ap-checkbox__wrapper' : '.pl-grid .ap-checkbox__input';
  for (let i = 0; i < 3; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await p.evaluate(({ s, idx }) => document.querySelectorAll(s)[idx].click(), { s: sel, idx: i });
    // eslint-disable-next-line no-await-in-loop
    await p.waitForTimeout(400);
  }
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/compare-${tag}-selected-${W}.png` });

  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')]
      .find((x) => /compare/i.test(x.textContent) && !x.disabled);
    btn.click();
  });
  await p.waitForTimeout(isLive ? 6000 : 2000);
  await p.waitForSelector(isLive ? '.ap-overlay-item__container' : '.ap-compare-overlay', { timeout: 20000 });
  await p.evaluate(async () => {
    const sc = document.querySelector('.ap-overlay-item__container');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y <= sc.scrollHeight; y += 800) { sc.scrollTop = y; await wait(450); }
    sc.scrollTop = 0;
    await wait(1000);
  });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/compare-${tag}-modal-top-${W}.png` });
  for (const y of SCROLLS) {
    // eslint-disable-next-line no-await-in-loop
    await p.evaluate((yy) => { document.querySelector('.ap-overlay-item__container').scrollTop = yy; }, y);
    // eslint-disable-next-line no-await-in-loop
    await p.waitForTimeout(900);
    // eslint-disable-next-line no-await-in-loop
    await p.screenshot({ path: `${OUT}/compare-${tag}-modal-s${y}-${W}.png` });
  }
  await b.close();
}

await captureStates('live');
await captureStates('replica');

/* ---- diffs ---- */
const read = (f) => PNG.sync.read(fs.readFileSync(f));
const diffPair = (liveF, repF, label, cropTop) => {
  if (!fs.existsSync(liveF) || !fs.existsSync(repF)) { console.log(`${label}: MISSING`); return; }
  let a = read(liveF); let c = read(repF);
  const crop = (img) => {
    const h = img.height - cropTop;
    const outI = new PNG({ width: img.width, height: h });
    PNG.bitblt(img, outI, 0, cropTop, img.width, h, 0, 0);
    return outI;
  };
  if (cropTop) { a = crop(a); c = crop(c); }
  const w = Math.min(a.width, c.width);
  const h = Math.min(a.height, c.height);
  const d = new PNG({ width: w, height: h });
  const n = pixelmatch(a.data, c.data, d.data, w, h, { threshold: 0.1 });
  const pct = ((n / (w * h)) * 100).toFixed(2);
  fs.writeFileSync(`${OUT}/compare-diff-${label}-${W}.png`, PNG.sync.write(d));
  console.log(`${label}@${W}: ${pct}% (${n}px of ${w}x${h})`);
};

const barCrop = W < 768 ? H - 220 : H - 170;
diffPair(`${OUT}/compare-proofref-mode-empty-${W}.png`, `${OUT}/compare-parity-mode-empty-${W}.png`, 'bar-empty', barCrop);
diffPair(`${OUT}/compare-proofref-selected-${W}.png`, `${OUT}/compare-parity-selected-${W}.png`, 'bar-selected', barCrop);
diffPair(`${OUT}/compare-proofref-modal-top-${W}.png`, `${OUT}/compare-parity-modal-top-${W}.png`, 'modal-top', 0);
for (const y of SCROLLS) {
  diffPair(`${OUT}/compare-proofref-modal-s${y}-${W}.png`, `${OUT}/compare-parity-modal-s${y}-${W}.png`, `modal-s${y}`, 0);
}
