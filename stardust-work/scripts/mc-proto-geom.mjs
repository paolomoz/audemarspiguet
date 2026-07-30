// Proto-side geometry probe for the masterclass gate loop (localhost pages).
// Usage: node mc-proto-geom.mjs <url> <width>
import { chromium } from 'playwright';

const url = process.argv[2];
const width = parseInt(process.argv[3] || '1440', 10);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
await page.evaluate(async () => {
  const s = Math.round(innerHeight * 0.6);
  for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 300)); }
  scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500));
});
const data = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('main > .section').forEach((s) => {
    const r = s.getBoundingClientRect();
    out.push({ cls: s.className.slice(0, 80), top: Math.round(r.top + scrollY), h: Math.round(r.height) });
  });
  const probe = (sel) => [...document.querySelectorAll(sel)].slice(0, 8).map((el) => { const r = el.getBoundingClientRect(); return { sel, top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), left: Math.round(r.left) }; });
  return {
    pageH: document.body.scrollHeight,
    sections: out,
    details: [
      ...probe('.hero-stage'), ...probe('.hero-cell h1'), ...probe('.hero-cell p'),
      ...probe('.text-large p'), ...probe('.ti-media img'), ...probe('.ti-content h2'), ...probe('.ti-content p'),
      ...probe('.masterclass-search .mcs-heading h2'), ...probe('.mcs-desc'), ...probe('.mcs-location'),
      ...probe('.carousel.masterclass .carousel-aside h2'), ...probe('.carousel.masterclass .carousel-aside p'),
      ...probe('.carousel.masterclass .slide'), ...probe('.carousel.masterclass .slide figure aside img'),
      ...probe('.carousel.masterclass .slide h4'), ...probe('.carousel.masterclass .slide .mc-tag'),
      ...probe('.carousel.masterclass .slide .desc'), ...probe('.carousel.masterclass .slide .mc-infos'),
      ...probe('.carousel.masterclass .slide .mc-actions'), ...probe('.carousel.masterclass .carousel-dots'),
      ...probe('.newsletter'),
      // detail page selectors
      ...probe('.masterclass-hero .mch-title .ap-link'), ...probe('.masterclass-hero h1'),
      ...probe('.masterclass-hero .mch-tag'), ...probe('.masterclass-hero .mch-image img'),
      ...probe('.masterclass-hero .mch-card'), ...probe('.mch-card-title'), ...probe('.mch-card-desc'),
      ...probe('.mch-select'), ...probe('.mch-infos'), ...probe('.masterclass-hero .mch-book'),
      ...probe('.columns.duo-text p'), ...probe('.accordion .acc-head h2'), ...probe('.acc-trigger'),
      ...probe('.acc-item'),
    ],
  };
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
