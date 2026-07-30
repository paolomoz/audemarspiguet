/* compare-probe-deep — R-02 measured lift on the live pilot page.
   Usage: node compare-probe-deep.mjs <width>
   Captures: compare-mode empty state, 3-selected state, comparison modal
   (screenshots + DOM + computed-style lift + enter/exit transitions +
   network log of the interaction-time fetches). */
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
p.on('request', (r) => netlog.push({ t: Date.now(), m: r.method(), u: r.url() }));

await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.waitForTimeout(1000);

await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 7000; y += 900) { window.scrollTo(0, y); await wait(700); }
});
// stand on the grid so cards + toolbar are in view
await p.evaluate(async () => {
  document.querySelector('.ap-product-grid')?.scrollIntoView();
  window.scrollBy(0, -160);
  await new Promise((r) => setTimeout(r, 1200));
});

const out = { width: W, netlog: null };
const lift = (el, props) => {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const o = { rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()) };
  props.forEach((k) => { o[k] = cs[k]; });
  return o;
};
await p.exposeFunction('noop', () => {});
const netMark = () => netlog.length;

// ---- 1. toggle compare ON; watch the status bar entry (rAF sampling)
const preToggle = netMark();
out.statusBarEntry = await p.evaluate(async () => {
  const samples = [];
  const t0 = performance.now();
  const sample = () => {
    const sb = document.querySelector('.compare-status-bar');
    if (sb) {
      const cs = getComputedStyle(sb);
      samples.push({ t: Math.round(performance.now() - t0), cls: sb.className, transform: cs.transform, opacity: cs.opacity, transition: cs.transition, bottom: sb.getBoundingClientRect().bottom - window.innerHeight });
    }
    if (performance.now() - t0 < 2500) requestAnimationFrame(sample);
  };
  document.querySelector('.compare-button-toggle').click();
  requestAnimationFrame(sample);
  await new Promise((r) => setTimeout(r, 2600));
  // thin the samples
  return samples.filter((s, i) => i < 8 || i % 5 === 0 || i === samples.length - 1);
});
out.netToggle = netlog.slice(preToggle).filter((r) => !/analytics|google|facebook|doubleclick|cookielaw|tiktok|snapchat|omtrdc|rum/.test(r.u));

// ---- 2. lift compare-mode styles: checkbox + status bar (empty)
const LIFTP = ['position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'padding', 'margin', 'background', 'backgroundColor', 'border', 'borderRadius', 'color', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'zIndex', 'transition', 'transform', 'opacity', 'boxShadow', 'inset'];
out.compareMode = await p.evaluate((props) => {
  const lift = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = { rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()) };
    props.forEach((k) => { o[k] = cs[k]; });
    return o;
  };
  const card = document.querySelector('.ap-product-card');
  const cb = card.querySelector('.ap-checkbox');
  return {
    cardPosition: getComputedStyle(card).position,
    checkboxHost: lift(cb),
    checkboxWrapper: lift(cb.querySelector('.ap-checkbox__wrapper')),
    checkboxBoxContainer: lift(cb.querySelector('.ap-checkbox__box-container')),
    checkboxBox: lift(cb.querySelector('.ap-checkbox__box')),
    checkboxInner: lift(cb.querySelector('.ap-checkbox__inner-content')),
    statusBar: lift(document.querySelector('.compare-status-bar')),
    statusBarContainer: lift(document.querySelector('.compare-status-bar__container')),
    emptyLabel: lift(document.querySelector('.compare-status-bar__empty-label')),
    emptyLabelText: document.querySelector('.compare-status-bar__empty-label')?.textContent.trim(),
    ctas: lift(document.querySelector('.compare-status-bar__ctas')),
    ctaButtons: [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].map((b2) => ({ text: b2.textContent.trim(), disabled: b2.disabled, cls: b2.className, ...lift(b2) })),
    statusBarHTML: document.querySelector('.compare-status-bar')?.outerHTML,
    apCompareHTML: document.querySelector('.ap-compare')?.outerHTML.slice(0, 3000),
    toggleExpanded: document.querySelector('.compare-button-toggle')?.getAttribute('aria-expanded'),
  };
}, LIFTP);
await p.screenshot({ path: `${OUT}/compare-mode-empty-${W}.png` });

// ---- 3. check 3 boxes (real label clicks); lift populated bar + checked box
const inputs = p.locator('.ap-product-card .ap-checkbox__input');
for (let i = 0; i < 3; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await inputs.nth(i).check({ force: true }).catch(async () => {
    await p.locator('.ap-product-card .ap-checkbox__box').nth(i).click({ force: true });
  });
  // eslint-disable-next-line no-await-in-loop
  await p.waitForTimeout(500);
}
await p.waitForTimeout(800);
out.selected = await p.evaluate((props) => {
  const lift = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = { rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()) };
    props.forEach((k) => { o[k] = cs[k]; });
    return o;
  };
  const checkedInput = document.querySelector('.ap-checkbox__input:checked');
  const cb = checkedInput?.closest('.ap-checkbox');
  return {
    checkedCount: document.querySelectorAll('.ap-checkbox__input:checked').length,
    checkedBox: lift(cb?.querySelector('.ap-checkbox__box')),
    checkedBoxBefore: cb ? (() => { const cs = getComputedStyle(cb.querySelector('.ap-checkbox__box'), '::before'); return { content: cs.content, background: cs.background.slice(0, 120), width: cs.width, height: cs.height, maskImage: cs.maskImage?.slice(0, 200) }; })() : null,
    checkedBoxAfter: cb ? (() => { const cs = getComputedStyle(cb.querySelector('.ap-checkbox__box'), '::after'); return { content: cs.content, background: cs.background.slice(0, 120), width: cs.width, height: cs.height, borderWidth: cs.borderWidth, borderColor: cs.borderColor, transform: cs.transform, maskImage: cs.maskImage?.slice(0, 200) }; })() : null,
    checkedInner: lift(cb?.querySelector('.ap-checkbox__inner-content')),
    checkedInnerHTML: cb?.querySelector('.ap-checkbox__inner-content')?.innerHTML,
    statusBarHTML: document.querySelector('.compare-status-bar')?.outerHTML,
    statusBarLabel: lift(document.querySelector('.compare-status-bar__container > :first-child')),
    statusBarText: document.querySelector('.compare-status-bar__container')?.textContent.replace(/\s+/g, ' ').trim(),
    compareBtn: (() => { const b2 = [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent)); return b2 ? { disabled: b2.disabled, ...lift(b2) } : null; })(),
    cancelBtn: (() => { const b2 = [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /cancel/i.test(x.textContent)); return b2 ? { disabled: b2.disabled, ...lift(b2), inner: lift(b2.querySelector('.ap-button__content')) } : null; })(),
  };
}, LIFTP);
await p.screenshot({ path: `${OUT}/compare-selected-${W}.png` });

// ---- 4. open the comparison modal; log fetches; sample entry
const preModal = netMark();
out.modalEntry = await p.evaluate(async () => {
  const samples = [];
  const t0 = performance.now();
  const sample = () => {
    const m = document.querySelector('.ap-modal, [class*=modal]:not(script)');
    if (m) {
      const cs = getComputedStyle(m);
      samples.push({ t: Math.round(performance.now() - t0), cls: m.className.slice(0, 140), transform: cs.transform, opacity: cs.opacity, transition: cs.transition });
    }
    if (performance.now() - t0 < 4000) requestAnimationFrame(sample);
  };
  const btn = [...document.querySelectorAll('.compare-status-bar__ctas .ap-button')].find((x) => /compare/i.test(x.textContent));
  btn.click();
  requestAnimationFrame(sample);
  await new Promise((r) => setTimeout(r, 4200));
  return samples.filter((s, i) => i < 10 || i % 6 === 0 || i === samples.length - 1);
});
await p.waitForTimeout(3000);
out.netModal = netlog.slice(preModal).filter((r) => !/analytics|google|facebook|doubleclick|cookielaw|tiktok|snapchat|omtrdc|rum|dynamicmedia/.test(r.u));
out.netModalMedia = netlog.slice(preModal).filter((r) => /dynamicmedia/.test(r.u)).slice(0, 6);

// ---- 5. lift the modal
out.modal = await p.evaluate((props) => {
  const lift = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = { rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()) };
    props.forEach((k) => { o[k] = cs[k]; });
    return o;
  };
  // find the top-most overlay-ish thing
  const cands = [...document.querySelectorAll('body *')].filter((e) => {
    const cs = getComputedStyle(e);
    return (cs.position === 'fixed') && e.getBoundingClientRect().width > window.innerWidth * 0.8 && e.getBoundingClientRect().height > window.innerHeight * 0.5 && cs.display !== 'none' && !e.className.includes?.('header');
  }).map((e) => ({ cls: String(e.className).slice(0, 140), tag: e.tagName, z: getComputedStyle(e).zIndex, rect: (({ x, y, width, height }) => ({ x, y, width, height }))(e.getBoundingClientRect()) }));
  const modal = document.querySelector('[class*=modal i]') || document.querySelector('.ap-compare [class*=overlay]');
  return {
    overlayCandidates: cands.slice(0, 10),
    modalCls: modal ? String(modal.className) : null,
    modalLift: lift(modal),
    modalHTMLLen: modal?.outerHTML.length,
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
  };
}, LIFTP);
const modalHTML = await p.evaluate(() => {
  const modal = document.querySelector('[class*=modal i]')?.closest('[class*=modal i]') || document.querySelector('[class*=modal i]');
  return modal ? modal.outerHTML : document.querySelector('.ap-compare')?.outerHTML || null;
});
if (modalHTML) fs.writeFileSync(`${OUT}/compare-modal-dom-${W}.html`, modalHTML);
await p.screenshot({ path: `${OUT}/compare-modal-${W}.png` });
// scrolled view of the modal content if it scrolls
await p.evaluate(() => {
  const sc = [...document.querySelectorAll('[class*=modal i], [class*=modal i] *')].find((e) => e.scrollHeight > e.clientHeight + 100);
  if (sc) sc.scrollTop = 600; else window.scrollBy(0, 600);
});
await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/compare-modal-scrolled-${W}.png` });
await p.evaluate(() => {
  const sc = [...document.querySelectorAll('[class*=modal i], [class*=modal i] *')].find((e) => e.scrollHeight > e.clientHeight + 100);
  if (sc) sc.scrollTop = 0;
});
await p.waitForTimeout(600);

// ---- 6. close: find close button, sample exit
out.modalClose = await p.evaluate(async () => {
  const closeBtn = [...document.querySelectorAll('[class*=modal i] button, [class*=close] , button[aria-label*=lose]')].find((e) => /close/i.test(e.className + (e.getAttribute('aria-label') || '')));
  if (!closeBtn) return { found: false, buttons: [...document.querySelectorAll('[class*=modal i] button')].map((e) => ({ cls: String(e.className).slice(0, 100), aria: e.getAttribute('aria-label'), text: e.textContent.trim().slice(0, 30) })).slice(0, 15) };
  const target = document.querySelector('[class*=modal i]');
  const samples = [];
  const t0 = performance.now();
  const sample = () => {
    if (target && document.contains(target)) {
      const cs = getComputedStyle(target);
      samples.push({ t: Math.round(performance.now() - t0), cls: String(target.className).slice(0, 140), transform: cs.transform, opacity: cs.opacity });
    } else samples.push({ t: Math.round(performance.now() - t0), removed: true });
    if (performance.now() - t0 < 2500) requestAnimationFrame(sample);
  };
  closeBtn.click();
  requestAnimationFrame(sample);
  await new Promise((r) => setTimeout(r, 2600));
  return { found: true, closeBtnCls: String(closeBtn.className), samples: samples.filter((s, i) => i < 8 || i % 5 === 0 || s.removed) };
});
await p.waitForTimeout(1000);
await p.screenshot({ path: `${OUT}/compare-after-close-${W}.png` });

out.netlog = netlog.filter((r) => /audemarspiguet|compare/.test(r.u) && !/analytics|rum|cookielaw|dynamicmedia|\.(css|js|woff2|png|jpg|svg|avif)(\?|$)/.test(r.u)).slice(0, 40);
fs.writeFileSync(`${OUT}/compare-lift-${W}.json`, JSON.stringify(out, null, 2));
console.log('written', `${OUT}/compare-lift-${W}.json`, 'modalHTMLLen', out.modal?.modalHTMLLen);
console.log('netModal:', JSON.stringify(out.netModal, null, 1));
await b.close();
