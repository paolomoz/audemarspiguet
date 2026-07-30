// Follow-up probe: indicator dots, divider borders, black panel element,
// mobile hours dropdown expand behavior. Usage: node store-probe2.mjs <width>
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '360', 10);
const URL = 'https://www.audemarspiguet.com/ch/en/stores/ap-house-geneva';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 }, deviceScaleFactor: 2, userAgent: UA, locale: 'en-GB',
})).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch {}
await page.evaluate(async () => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove());
  const step = Math.round(window.innerHeight * 0.6); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 900)); }
  await new Promise((r) => setTimeout(r, 1500)); window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500));
});

const out = await page.evaluate(() => {
  const info = (el, props) => {
    if (!el) return null;
    const s = getComputedStyle(el); const o = {};
    (props || ['width', 'height', 'border-radius', 'background-color', 'border', 'margin', 'padding', 'gap', 'justify-content', 'transition', 'opacity', 'transform', 'position', 'right', 'left', 'top', 'bottom', 'display', 'align-items', 'border-top', 'border-bottom', 'color', 'font-size', 'overflow', 'max-height']).forEach((p) => { o[p] = s.getPropertyValue(p); });
    const r = el.getBoundingClientRect();
    o._rect = { top: Math.round(r.top + scrollY), h: Math.round(r.height * 10) / 10, w: Math.round(r.width * 10) / 10, left: Math.round(r.left * 10) / 10 };
    o._cls = (el.className || '').toString().slice(0, 100);
    return o;
  };
  // black panel: walk hero descendants, find first with black-ish bg
  let black = null;
  document.querySelectorAll('.hero *').forEach((el) => {
    if (black) return;
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)') black = { bg, ...info(el) };
  });
  // dividers: elements in hero/cards with visible borders or hr
  const dividers = [];
  document.querySelectorAll('.hero *, .store-card *, .boutiqueCarousel hr, .hero hr').forEach((el) => {
    const s = getComputedStyle(el);
    ['border-top', 'border-bottom'].forEach((side) => {
      const v = s.getPropertyValue(side);
      if (v && !v.startsWith('0px') && !v.includes('none')) dividers.push({ side, v, cls: (el.className || '').toString().slice(0, 80), rect: info(el)._rect });
    });
    if (el.tagName === 'HR') dividers.push({ side: 'HR', v: s.getPropertyValue('border-top') || s.getPropertyValue('background-color'), cls: (el.className || '').toString().slice(0, 80), rect: info(el)._rect });
  });
  // indicator dots
  const pag = document.querySelector('.boutiqueCarousel .swiper-pagination');
  const ind = pag ? pag.querySelector('.ap-indicator-carousel') : null;
  const items = ind ? [...ind.children].map((c) => info(c)) : [];
  // dropdown
  const dd = document.querySelector('.hero .ap-dropdown');
  const ddBtn = dd ? dd.querySelector('.ap-custom-dropdown') : null;
  const ddArrow = dd ? dd.querySelector('[class*="icon-arrow"], [class*="arrow"]') : null;
  const ddPanel = dd ? dd.querySelector('[class*="panel"], [class*="options"], ul') : null;
  return {
    black,
    dividers: dividers.slice(0, 14),
    pagination: info(pag),
    indicator: info(ind),
    items,
    dropdown: info(dd),
    ddBtn: info(ddBtn),
    ddArrow: info(ddArrow),
    ddPanel: info(ddPanel),
    ddHTML: dd ? dd.outerHTML.replace(/\s+/g, ' ').slice(0, 1500) : null,
  };
});
console.log(JSON.stringify(out, null, 1));

// expand the mobile dropdown and measure
if (width < 500) {
  const dd = page.locator('.hero .ap-custom-dropdown').first();
  if (await dd.count()) {
    const before = await page.evaluate(() => document.querySelector('.hero .ap-dropdown').getBoundingClientRect().height);
    await dd.click();
    await page.waitForTimeout(100);
    const mid = await page.evaluate(() => document.querySelector('.hero .ap-dropdown').getBoundingClientRect().height);
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => {
      const d = document.querySelector('.hero .ap-dropdown');
      const rows = [...d.querySelectorAll('.opening-hours__option')].map((r) => {
        const s = getComputedStyle(r); const rr = r.getBoundingClientRect();
        return { top: Math.round(rr.top + scrollY), h: Math.round(rr.height * 10) / 10, mt: s.marginTop, txt: r.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), fw: getComputedStyle(r.querySelector('span') || r).fontWeight };
      });
      return { h: d.getBoundingClientRect().height, rows, panelTransition: getComputedStyle(d.querySelector('.ap-custom-dropdown ~ *, .ap-dropdown__panel') || d).transition };
    });
    console.log('EXPAND:', JSON.stringify({ before, mid, after }, null, 1));
  }
}
await browser.close();
