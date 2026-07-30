// Targeted geometry/style probe for the store-detail page (archetype F).
// Usage: node store-probe.mjs <width> <out.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const width = parseInt(process.argv[2] || '1440', 10);
const outJson = process.argv[3];
const URL = 'https://www.audemarspiguet.com/ch/en/stores/ap-house-geneva';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 },
  deviceScaleFactor: 2, userAgent: UA, locale: 'en-GB',
})).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch {}
await page.evaluate(async () => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove());
  const step = Math.round(window.innerHeight * 0.6); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 900)); }
  await new Promise((r) => setTimeout(r, 2000)); window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 800));
});

const data = await page.evaluate(() => {
  const P = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color', 'margin', 'padding', 'width', 'height', 'max-width', 'display', 'position', 'top', 'left', 'right', 'bottom', 'gap', 'border', 'border-bottom', 'border-top', 'object-fit', 'text-align', 'justify-content', 'align-items', 'flex-direction', 'grid-template-columns', 'z-index', 'text-decoration-line', 'opacity'];
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el); const o = {};
    P.forEach((p) => { o[p] = s.getPropertyValue(p); });
    const r = el.getBoundingClientRect();
    o._rect = { top: Math.round(r.top + scrollY), h: Math.round(r.height * 10) / 10, w: Math.round(r.width * 10) / 10, left: Math.round(r.left * 10) / 10 };
    o._tag = el.tagName;
    o._cls = (el.className || '').toString().slice(0, 120);
    o._txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return o;
  };
  const q = (sel, root) => cs((root || document).querySelector(sel));
  const qa = (sel, root, n) => [...(root || document).querySelectorAll(sel)].slice(0, n || 12).map(cs);

  const hero = document.querySelector('.hero');
  const carousels = [...document.querySelectorAll('.boutiqueCarousel')];
  const [gal, near] = carousels;

  return {
    width: innerWidth,
    pageH: document.body.scrollHeight,
    hero: {
      section: cs(hero),
      inner: qa(':scope > * > * > *', hero, 8),
      link: q('.ap-link', hero),
      h1: q('h1', hero),
      role: q('[class*="role"]', hero),
      imgWrap: q('[class*="image"], picture, .boutique-hero__picture', hero),
      img: q('img', hero),
      allDivsShallow: qa('[class*="boutique-hero__"]', hero, 24),
      card: q('[class*="contact"], .store-card', hero),
      cardTitle: q('[class*="contact-name"]', hero),
      hoursRoot: q('[class*="opening-hours"]', hero),
      hoursRows: qa('[class*="opening-hours"] li, [class*="opening-hours"] > div, [class*="opening-hours"] tr', hero, 12),
      hoursSpans: qa('[class*="opening-hours"] span, [class*="opening-hours"] div', hero, 20),
      addr: q('.store-card__address', hero),
      contactBtn: q('button.ap-button', hero),
      phone: q('.store-card__phone', hero),
      ctaButtons: qa('a.ap-button', hero, 4),
      svgs: qa('svg, [class*="icon"]', hero, 14),
      quote: q('[class*="quote"], p[class*="fade"]', hero),
      lastP: cs([...hero.querySelectorAll('p')].pop()),
    },
    gallery: gal ? {
      section: cs(gal),
      head: q('[class*="head"], [class*="header"]', gal),
      h2: q('h2', gal),
      desc: q('p', gal),
      descLines: (() => { const p = gal.querySelector('p'); return p ? [...p.querySelectorAll('span')].length : 0; })(),
      swiper: q('.swiper, [class*="swiper"]', gal),
      slides: qa('.swiper-slide', gal, 4),
      slideImgs: qa('.swiper-slide img', gal, 4),
      arrows: qa('button[class*="button-icon"], [class*="carousel"] button', gal, 6),
      dots: q('[class*="pagination"], [class*="indicator"]', gal),
    } : null,
    nearby: near ? {
      section: cs(near),
      h2: q('h2', near),
      link: q('.ap-link', near),
      swiper: q('.swiper, [class*="swiper"]', near),
      slides: qa('.swiper-slide', near, 3),
      card: q('.store-card', near),
      cardParts: qa('.swiper-slide:first-child .store-card *', near, 30),
      cardImg: q('.swiper-slide img', near),
    } : null,
    newsletter: q('.newsletter, .ap-newsletter'),
    newsletterParts: qa('.ap-newsletter *', null, 14),
  };
});

writeFileSync(outJson, JSON.stringify(data, null, 1));
console.log(`[store-probe] ${width}w -> ${outJson} (pageH ${data.pageH})`);
await browser.close();
