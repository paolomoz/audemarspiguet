/* compare-probe-explore — R-02 recon on the live pilot page.
   Hydrates the grid, toggles Compare, selects cards, follows the drawer CTA,
   and hunts for the quick-view trigger. Logs interaction-time network fetches
   (XF modal fragment, .compare. servlet). Dump-only; measurements come later. */
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/Users/paolo/stardust/audemarspiguet/stardust-work/current';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' });
const p = await ctx.newPage();

const netlog = [];
p.on('request', (r) => {
  const u = r.url();
  if (u.includes('experience-fragments') || u.includes('.compare.') || u.includes('modal') || u.includes('quick')) {
    netlog.push({ t: Date.now(), method: r.method(), url: u });
  }
});

await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.waitForTimeout(1000);

// dwell-scroll to the grid so cards hydrate
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y <= 6000; y += 900) { window.scrollTo(0, y); await wait(900); }
  const tb = document.querySelector('.product-toolbar');
  if (tb) tb.scrollIntoView();
  await wait(1200);
});

const out = { netlog };

// resting toolbar/card snapshot
out.resting = await p.evaluate(() => ({
  toggle: document.querySelector('.compare-button-toggle')?.outerHTML,
  cardCls: document.querySelector('.ap-product-card')?.className,
  cardChildren: [...(document.querySelector('.ap-product-card')?.children || [])].map((c) => c.className),
  bodyOverlays: [...document.body.children].map((c) => `${c.tagName}.${c.className}`.slice(0, 120)),
}));

// 1. toggle compare mode
await p.click('.compare-button-toggle');
await p.waitForTimeout(1500);
out.afterToggle = await p.evaluate(() => {
  const card = document.querySelector('.ap-product-card');
  return {
    toggleNow: document.querySelector('.compare-button-toggle')?.outerHTML,
    cardHTML: card?.outerHTML.slice(0, 4000),
    newBodyKids: [...document.body.children].map((c) => `${c.tagName}.${c.className}`.slice(0, 120)),
    tray: document.querySelector('[class*=compare-tray], [class*=compare-drawer], [class*=compare-bar], [class*=comparison]')?.outerHTML?.slice(0, 4000) || null,
    anyCompareEls: [...document.querySelectorAll('[class*=compare]')].map((e) => e.className).slice(0, 40),
  };
});

// 2. select first three cards' compare controls (whatever they are)
out.selection = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const res = { clicked: [] };
  const cards = [...document.querySelectorAll('.ap-product-card')].slice(0, 3);
  for (const c of cards) {
    const ctl = c.querySelector('input[type=checkbox], [class*=checkbox], [class*=compare] button, button[class*=compare], [role=checkbox]');
    if (ctl) { ctl.click(); res.clicked.push(ctl.className || ctl.tagName); await wait(600); }
  }
  await wait(800);
  res.compareEls = [...document.querySelectorAll('[class*=compare], [class*=Compare]')].map((e) => ({ cls: e.className, tag: e.tagName, rect: (({ x, y, width, height }) => ({ x, y, width, height }))(e.getBoundingClientRect()) })).slice(0, 60);
  const tray = document.querySelector('[class*=compare-tray], [class*=compare-drawer], [class*=compare-bar], [class*=compare-panel], [class*=comparison]');
  res.trayHTML = tray?.outerHTML?.slice(0, 6000) || null;
  return res;
});
await p.screenshot({ path: `${OUT}/compare-explore-selected-1440.png` });

// 3. quick-view hunt: hover a card, list any buttons that appear
out.quickview = await p.evaluate(async () => {
  const card = document.querySelectorAll('.ap-product-card')[4];
  const btns = [...card.querySelectorAll('button, [role=button]')].map((e) => ({ cls: e.className, aria: e.getAttribute('aria-label'), text: e.textContent.trim().slice(0, 40), display: getComputedStyle(e).display, opacity: getComputedStyle(e).opacity }));
  return { btns, cardHTML: card.outerHTML.slice(0, 4500) };
});
const card5 = p.locator('.ap-product-card').nth(4);
await card5.hover();
await p.waitForTimeout(800);
out.quickviewHover = await p.evaluate(() => {
  const card = document.querySelectorAll('.ap-product-card')[4];
  const btns = [...card.querySelectorAll('button, [role=button]')].map((e) => ({ cls: e.className, aria: e.getAttribute('aria-label'), text: e.textContent.trim().slice(0, 40), display: getComputedStyle(e).display, opacity: getComputedStyle(e).opacity, vis: getComputedStyle(e).visibility }));
  return { btns };
});
await p.screenshot({ path: `${OUT}/compare-explore-hover-1440.png` });

// 4. find + click the compare CTA (view comparison)
out.compareCTA = await p.evaluate(() => {
  const cands = [...document.querySelectorAll('button, a')].filter((e) => /compare/i.test(e.textContent) && !e.classList.contains('compare-button-toggle'));
  return cands.map((e) => ({ tag: e.tagName, cls: e.className, text: e.textContent.trim().slice(0, 60), href: e.href || null }));
});

fs.writeFileSync(`${OUT}/compare-explore-1440.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 12000));
await b.close();
