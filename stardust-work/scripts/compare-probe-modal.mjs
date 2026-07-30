/* compare-probe-modal — R-02: comparison overlay deep-dive on the live pilot.
   Dumps the full .ap-overlay DOM, extracts every CSSOM rule touching
   compare/checkbox/overlay/slide-up, samples overlay enter/exit transitions,
   and screenshots the comparison view at several scroll offsets.
   Usage: node compare-probe-modal.mjs <width> */
import { chromium } from 'playwright';
import fs from 'fs';

const W = Number(process.argv[2] || 1440);
const H = W < 768 ? 780 : 900;
const OUT = '/Users/paolo/stardust/audemarspiguet/stardust-work/current';
const UA = W < 768
  ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB', isMobile: W < 768, hasTouch: W < 768,
});
const p = await ctx.newPage();
const netlog = [];
p.on('response', (r) => { const u = r.url(); if (/experience-fragments|\.compare\./.test(u)) netlog.push({ status: r.status(), u }); });

await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.waitForTimeout(1000);
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 7000; y += 900) { window.scrollTo(0, y); await wait(700); }
  document.querySelector('.ap-product-grid')?.scrollIntoView();
  window.scrollBy(0, -160);
  await wait(1200);
});

const out = { width: W };

// toggle + select 3
await p.click('.compare-button-toggle');
await p.waitForTimeout(1200);
const inputs = p.locator('.ap-product-card .ap-checkbox__input');
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await inputs.nth(i).check({ force: true }).catch(() => p.evaluate((idx) => {
    document.querySelectorAll('.ap-product-card .ap-checkbox__wrapper')[idx].click();
  }, i));
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(400);
}
console.log('checked:', await p.evaluate(() => document.querySelectorAll('.ap-checkbox__input:checked').length));
await p.waitForTimeout(600);

// CSSOM extraction (compare/checkbox/overlay/slide-up/status-bar/icon-cross)
const cssRules = await p.evaluate(() => {
  const hits = [];
  const scan = (rules, mediaPrefix) => {
    for (const r of rules) {
      if (r.cssText && /compare|ap-checkbox|ap-overlay|slide-up|icon-cross|ap-button-(primary|secondary)/.test(r.cssText.split('{')[0] || '')) {
        hits.push(mediaPrefix ? `@media ${mediaPrefix} { ${r.cssText} }` : r.cssText);
      }
      if (r.cssRules) {
        try { scan(r.cssRules, r.media ? r.media.mediaText : mediaPrefix); } catch { /* skip */ }
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try { scan(sheet.cssRules, null); } catch { /* cross-origin */ }
  }
  return hits.join('\n');
});
fs.writeFileSync(`${OUT}/compare-css-rules-${W}.css`, cssRules);

// open modal, watch body for the overlay node; sample enter transition
out.overlayEntry = await p.evaluate(async () => {
  const samples = [];
  const t0 = performance.now();
  let target = null;
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && /overlay/.test(n.className || '') && !target) target = n;
        if (n.nodeType === 1 && n.querySelector) { const q = n.querySelector('[class*=overlay]'); if (q && !target) target = q; }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  const sample = () => {
    const el = target || document.querySelector('.ap-overlay__item-wrapper, .ap-overlay-item, [class*=ap-overlay]');
    if (el) {
      const cs = getComputedStyle(el);
      samples.push({ t: Math.round(performance.now() - t0), cls: String(el.className).slice(0, 120), transform: cs.transform, opacity: cs.opacity, transition: cs.transition });
    }
    if (performance.now() - t0 < 4500) requestAnimationFrame(sample);
  };
  const btn = [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent));
  btn.click();
  requestAnimationFrame(sample);
  await new Promise((r) => setTimeout(r, 4700));
  mo.disconnect();
  return samples.filter((s, i) => i < 12 || i % 6 === 0 || i === samples.length - 1);
});
await p.waitForTimeout(3500);

// dump the whole overlay tree + a structural style lift
const overlayHTML = await p.evaluate(() => {
  const ov = document.querySelector('.ap-overlay__item-wrapper')?.closest('[class*=ap-overlay]:not([class*=item])') || document.querySelector('.ap-overlay__item-wrapper')?.parentElement || document.querySelector('.ap-overlay__item-wrapper');
  return ov ? ov.outerHTML : null;
});
if (overlayHTML) fs.writeFileSync(`${OUT}/compare-overlay-dom-${W}.html`, overlayHTML);

out.overlayLift = await p.evaluate(() => {
  const P = ['position', 'inset', 'width', 'height', 'padding', 'margin', 'background', 'color', 'font', 'letterSpacing', 'textTransform', 'display', 'flexDirection', 'gridTemplateColumns', 'gap', 'justifyContent', 'alignItems', 'zIndex', 'transition', 'overflow', 'overflowY', 'borderBottom', 'borderTop', 'top'];
  const lift = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = { rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()) };
    P.forEach((k) => { o[k] = cs[k]; });
    return o;
  };
  const sels = ['.ap-overlay__item-wrapper', '.ap-overlay-item', '.ap-overlay-item__container', '.ap-overlay-item__header', '.ap-overlay-item__close-button', '.ap-overlay-item__content', '.ap-overlay-item__inner-content'];
  const res = {};
  sels.forEach((s) => { res[s] = lift(document.querySelector(s)); });
  // everything inside content with a class, first 80 distinct classes
  const seen = new Set();
  res.contentTree = [];
  document.querySelectorAll('.ap-overlay-item__content *').forEach((e) => {
    const cls = String(e.className);
    if (cls && !seen.has(cls) && res.contentTree.length < 90) {
      seen.add(cls);
      res.contentTree.push({ cls: cls.slice(0, 130), tag: e.tagName, ...lift(e), text: (e.children.length === 0 ? e.textContent.trim().slice(0, 60) : undefined) });
    }
  });
  res.closeButtonHTML = document.querySelector('.ap-overlay-item__header')?.outerHTML?.slice(0, 2500);
  return res;
});

// screenshots through the scroll
await p.screenshot({ path: `${OUT}/compare-modal-top-${W}.png` });
const scrollSteps = [600, 1400, 2400, 3600];
for (const y of scrollSteps) {
  // eslint-disable-next-line no-await-in-loop
  await p.evaluate((yy) => { const sc = document.querySelector('.ap-overlay-item__container'); if (sc) sc.scrollTop = yy; }, y);
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(1000);
  // eslint-disable-next-line no-await-in-loop
  await p.screenshot({ path: `${OUT}/compare-modal-s${y}-${W}.png` });
}
out.scrollHeight = await p.evaluate(() => document.querySelector('.ap-overlay-item__container')?.scrollHeight);
await p.evaluate(() => { const sc = document.querySelector('.ap-overlay-item__container'); if (sc) sc.scrollTop = 0; });
await p.waitForTimeout(600);

// close: sample exit on the wrapper
out.overlayExit = await p.evaluate(async () => {
  const wrapper = document.querySelector('.ap-overlay__item-wrapper');
  const closeBtn = document.querySelector('.ap-overlay-item__close-button, .ap-overlay-item__header button');
  if (!closeBtn) return { found: false };
  const samples = [];
  const t0 = performance.now();
  const sample = () => {
    if (wrapper && document.contains(wrapper)) {
      const cs = getComputedStyle(wrapper);
      samples.push({ t: Math.round(performance.now() - t0), cls: String(wrapper.className).slice(0, 120), transform: cs.transform, opacity: cs.opacity, transition: cs.transition });
    } else samples.push({ t: Math.round(performance.now() - t0), removed: true });
    if (performance.now() - t0 < 3000) requestAnimationFrame(sample);
  };
  closeBtn.click();
  requestAnimationFrame(sample);
  await new Promise((r) => setTimeout(r, 3200));
  const thin = [];
  let removedLogged = false;
  samples.forEach((s, i) => {
    if (s.removed) { if (!removedLogged) { thin.push(s); removedLogged = true; } return; }
    if (i < 12 || i % 6 === 0) thin.push(s);
  });
  return { found: true, samples: thin };
});
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/compare-modal-closed-${W}.png` });
out.afterClose = await p.evaluate(() => ({
  statusBarStill: !!document.querySelector('.compare-status-bar'),
  checkedCount: document.querySelectorAll('.ap-checkbox__input:checked').length,
  compareModeStill: !!document.querySelector('.ap-product-card .ap-checkbox'),
}));

out.netlog = netlog;
fs.writeFileSync(`${OUT}/compare-modal-lift-${W}.json`, JSON.stringify(out, null, 2));
console.log('done', W, 'scrollHeight', out.scrollHeight, 'net', JSON.stringify(netlog));
await b.close();
