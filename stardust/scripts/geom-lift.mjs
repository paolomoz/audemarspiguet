// Geometry lift: per-section boxes + key layout values from the live page.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const width = parseInt(process.argv[2] || '1440', 10);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport:{width, height: width<500?844:900}, deviceScaleFactor:1, userAgent:UA, locale:'en-GB' })).newPage();
await page.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(2500);
try { const b=page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({timeout:4000})) await b.click(); } catch {}
await page.evaluate(async () => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach(n=>n.remove());
  const step = Math.round(window.innerHeight*0.6); let y=0;
  while (y < document.body.scrollHeight) { y+=step; window.scrollTo(0,y); await new Promise(r=>setTimeout(r,900)); }
  await new Promise(r=>setTimeout(r,1500)); window.scrollTo(0,0); await new Promise(r=>setTimeout(r,800));
});
const geom = await page.evaluate(() => {
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return { top: Math.round(r.top+scrollY), h: Math.round(r.height), w: Math.round(r.width), x: Math.round(r.left),
      pt: cs.paddingTop, pb: cs.paddingBottom, pl: cs.paddingLeft, pr: cs.paddingRight, mt: cs.marginTop, mb: cs.marginBottom,
      bg: cs.backgroundColor, pos: cs.position, disp: cs.display, gtc: cs.gridTemplateColumns.slice(0,80), gap: cs.gap }; };
  const out = { pageH: document.body.scrollHeight, sections: [] };
  const mods = document.querySelectorAll('main > .responsivegrid > .aem-Grid > div, main .parsys > div, main > div > div');
  // walk main's module wrappers (hero, dualtext, text, link, lookbook, carousel, productlist, textimage)
  const seen = new Set();
  for (const m of document.querySelectorAll('.hero, .dualtext, main .text, main .link, .lookbook, .carousel, .productlist, .textimage')) {
    if (seen.has(m)) continue; seen.add(m);
    out.sections.push({ cls: m.className.split(' ')[0], box: box(m) });
  }
  out.header = { bar: box(document.querySelector('header nav, header > div')), full: box(document.querySelector('header')) };
  out.hero = { section: box(document.querySelector('.ap-hero')), bgWrap: box(document.querySelector('.ap-hero__background')),
    video: box(document.querySelector('.ap-hero video')), h1: box(document.querySelector('main h1')),
    textCell: box(document.querySelector('.ap-hero .cell')), controls: box(document.querySelector('.ap-hero__controls')) };
  out.lookbook = [...document.querySelectorAll('.ap-lookbook-element__wrapper')].map(w=>({cls: w.parentElement.className.slice(0,60), box: box(w), img: box(w.querySelector('img,video'))}));
  const car = [...document.querySelectorAll('.carousel')];
  out.carousels = car.map(c=>({ box: box(c), h2: box(c.querySelector('h2')),
    track: box(c.querySelector('.swiper-wrapper, [class*="track"]')),
    slide0: box(c.querySelector('.swiper-slide, li')),
    slide1: box(c.querySelectorAll('.swiper-slide, li')[1]),
    img0: box(c.querySelector('.swiper-slide img, li img')) }));
  const pl = document.querySelector('.productlist');
  const cards = pl.querySelectorAll('.ap-product-card');
  out.productlist = { box: box(pl), search: box(pl.querySelector('.ap-input-search')), input: box(pl.querySelector('input')),
    filterBar: box(pl.querySelector('[class*="toolbar"], [class*="filter-bar"]')), h2: box(pl.querySelector('h2')),
    grid: box(cards[0]?.closest('ul, [class*="list"], [class*="grid"]')), card0: box(cards[0]), card1: box(cards[1]), card3: box(cards[3]),
    cardImg: box(cards[0]?.querySelector('img')), cardCount: cards.length,
    groupHeadings: [...pl.querySelectorAll('h2, h3')].map(h=>({t: h.textContent.trim().slice(0,50), box: box(h)})) };
  out.textimage = { box: box(document.querySelector('.textimage')), inner: box(document.querySelector('.ap-textimage')),
    img: box(document.querySelector('.textimage img')), h2: box(document.querySelector('.textimage h2')) };
  out.footer = { box: box(document.querySelector('footer')), cols: [...document.querySelectorAll('footer nav, footer ul')].slice(0,8).map(n=>box(n)) };
  return out;
});
writeFileSync(`stardust/current/geom-${width}.json`, JSON.stringify(geom, null, 1));
console.log(`geom-${width}.json pageH=${geom.pageH} sections=${geom.sections.length}`);
await browser.close();
