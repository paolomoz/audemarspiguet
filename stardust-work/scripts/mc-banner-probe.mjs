// masterclass-banner behavior probe (detail page): find the fixed bottom bar,
// its geometry/styles, contents, and the scroll threshold where it appears.
// Usage: node mc-banner-probe.mjs <url> <width> <out.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = process.argv[2];
const width = parseInt(process.argv[3] || '1440', 10);
const outJson = process.argv[4];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 }, deviceScaleFactor: 2, userAgent: UA, locale: 'en-GB',
})).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch {}
await page.evaluate(() => { document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove()); });

const snap = async (y) => {
  await page.evaluate((ty) => window.scrollTo(0, ty), y);
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    // find any fixed/sticky element pinned to viewport bottom with height>40
    const hits = [];
    document.querySelectorAll('div,section,form').forEach((el) => {
      const s = getComputedStyle(el);
      if ((s.position === 'fixed' || s.position === 'sticky') && el.offsetHeight > 40) {
        const r = el.getBoundingClientRect();
        if (Math.abs(r.bottom - innerHeight) < 5 && r.height < 400) {
          hits.push({
            cls: (el.className || '').toString().slice(0, 160),
            h: Math.round(r.height),
            top: Math.round(r.top),
            bg: s.backgroundColor,
            zIndex: s.zIndex,
            transition: s.transition,
            transform: s.transform,
            padding: s.padding,
            text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 200),
          });
        }
      }
    });
    return { y: scrollY, hits };
  });
};

const states = [];
for (const y of [0, 100, 300, 500, 550, 600, 650, 700, 750, 800, 900, 1200, 2000, 3500]) {
  states.push(await snap(y));
}

// detail styles of the bar innards once visible
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(700);
const innards = await page.evaluate(() => {
  const bars = [...document.querySelectorAll('div,section,form')].filter((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.position === 'fixed' && el.offsetHeight > 40 && Math.abs(r.bottom - innerHeight) < 5 && r.height < 400;
  });
  const bar = bars[0];
  if (!bar) return null;
  const PROPS = ['font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color', 'padding', 'margin', 'border', 'border-bottom', 'width', 'height', 'display', 'gap', 'text-align', 'justify-content', 'align-items', 'flex-direction', 'position', 'opacity'];
  const dump = (el) => {
    const s = getComputedStyle(el); const o = {};
    PROPS.forEach((p) => { const v = s.getPropertyValue(p); if (v && v !== 'none' && v !== 'normal' && v !== 'auto') o[p] = v; });
    const r = el.getBoundingClientRect();
    o._rect = { vtop: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), left: Math.round(r.left) };
    o._cls = (el.className || '').toString().slice(0, 120);
    o._tag = el.tagName;
    o._text = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90);
    return o;
  };
  const out = [dump(bar)];
  bar.querySelectorAll('*').forEach((el) => {
    if (el.getBoundingClientRect().height > 0) out.push(dump(el));
  });
  return out.slice(0, 60);
});

writeFileSync(outJson, JSON.stringify({ url: URL, width, states, innards }, null, 1));
console.log(`[mc-banner] ${width}w -> ${outJson}`);
await browser.close();
