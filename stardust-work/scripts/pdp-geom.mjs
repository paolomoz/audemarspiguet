// Fine-grained geometry probe for the PDP archetype (rects + key styles of
// named selectors). Usage: node pdp-geom.mjs <width> <out.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const width = parseInt(process.argv[2] || '1440', 10);
const outJson = process.argv[3];
const URL = 'https://www.audemarspiguet.com/ch/en/watch-collection/royal-oak-offshore/26420SO.OO.A600CA.01';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB',
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

const SELS = {
  info: '.ap-productinfo',
  infoContainer: '.ap-productinfo__container',
  infoTitle: '.ap-productinfo .title-1',
  infoRef: '.ap-productinfo__ref',
  infoPrice: '.ap-productinfo__price',
  infoImage: '.ap-productinfo__image img',
  infoPara: '.ap-productinfo__paragraph p',
  infoCta: '.ap-productinfo__cta',
  video1: '.experiencefragment .video',
  video1Player: '.experiencefragment .video .vjs-tech, .experiencefragment .video video, .experiencefragment .video .vjs-poster',
  bigPlay: '.vjs-big-play-button',
  featured: '.featured',
  featCaseText: '.ap-featuredproducts__text',
  featList: '.ap-featuredproducts__list',
  featListItem: '.ap-featuredproducts__list li',
  featLabel: '.ap-featuredproducts__list-label',
  featValue: '.ap-featuredproducts__list-value',
  featUnit: '.ap-featuredproducts__list-unit',
  featSubtitle: '.ap-featuredproducts__subtitle',
  featImg: '.ap-featuredproducts img',
  carouselXF: '.ap-carousel-container-app',
  carouselHead: '.ap-carousel-container-app h2, .ap-carousel-app h2',
  carSlide: '.ap-carousel-app .swiper-slide',
  carTrack: '.ap-carousel-app .swiper-wrapper',
  strapXFTitle: 'h1.heading-1',
  strap: '.strapselector .ap-strap-selector',
  strapHeading: '.ap-strap-selector__heading',
  strapWatchImg: '.ap-strap-selector .ap-strap-selector__product img, .ap-strap-selector__image img',
  strapThumbs: '.ap-strap-selector .swiper-slide',
  strapTitle: '.ap-strap-selector h4',
  strapShow: '.ap-strap-selector .ap-link--underline',
  strapCta: '.ap-strap-selector .ap-button-secondary, .ap-strap-selector .ap-cta--secondary',
  specs: '.specifications',
  specsTitle: '.ap-specifications__title',
  specsUG: '.ap-specifications .ap-link--underline',
  specsTabs: '.ap-specifications__tabs',
  specsTabBtn: '.ap-specifications__button',
  specsSub: '.ap-specifications__subtitle',
  specsList: '.ap-specifications__list',
  specsLi: '.ap-specifications__list li',
  specsLabel: '.ap-specifications__list-label',
  specsValue: '.ap-specifications__list-value',
  specsImg: '.ap-specifications__product-container img',
  similar: '.similarwatches',
  simTitle: '.similarwatches h2',
  simCta: '.similarwatches .ap-cta',
  simCard: '.similarwatches .ap-product-card__wrapper',
  simCardImg: '.similarwatches .ap-product-card__wrapper img',
  simCardRef: '.similarwatches [class*="reference"]',
  simCardTitle: '.similarwatches .ap-product-card__title',
  simCardSub: '.similarwatches [class*="subtitle"], .similarwatches [class*="details"]',
  push: '.push',
  pushTitle: '.push h2',
  pushCta: '.push .ap-cta',
  pushMap: '.push .ap-store-locator-simple, .push [class*="map"]',
};

const KEYS = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color', 'background-image', 'margin', 'padding', 'border', 'display', 'grid-template-columns', 'grid-template-areas', 'gap', 'justify-content', 'align-items', 'flex-direction', 'object-fit', 'width', 'height', 'max-width', 'min-height', 'position', 'top', 'left', 'right', 'bottom', 'text-align', 'text-decoration-line', 'opacity', 'z-index', 'overflow', 'transition'];

const data = await page.evaluate(({ SELS, KEYS }) => {
  const out = {};
  Object.entries(SELS).forEach(([name, sel]) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width > 0).slice(0, 8);
    out[name] = els.map((el) => {
      const s = getComputedStyle(el);
      const st = {};
      KEYS.forEach((k) => { const v = s.getPropertyValue(k); if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== 'rgba(0, 0, 0, 0)') st[k] = v; });
      const r = el.getBoundingClientRect();
      return {
        rect: { top: Math.round(r.top + scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) },
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70),
        cls: (el.className || '').toString().slice(0, 100),
        tag: el.tagName,
        style: st,
      };
    });
  });
  return out;
}, { SELS, KEYS });
writeFileSync(outJson, JSON.stringify(data, null, 1));
console.log(`[pdp-geom] ${width}w -> ${outJson}`);
await browser.close();
