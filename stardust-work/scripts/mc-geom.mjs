// Focused geometry/style probe for the masterclass pages (archetype G).
// Dumps computed styles + rects for a fixed selector list, plus the
// masterclass-banner scroll behavior (new component — measured, not derived).
// Usage: node mc-geom.mjs <url> <width> <out.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = process.argv[2];
const width = parseInt(process.argv[3] || '1440', 10);
const outJson = process.argv[4];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const SELECTORS = [
  // index page
  '.ap-primaryhero__title h1', '.ap-primaryhero__text', '.ap-primaryhero__background img',
  '.text--center', '.text--center p', '.text--center .text-large',
  '.ap-textimage', '.ap-textimage__img', '.ap-textimage__img img', '.ap-textimage__text',
  '.ap-textimage__text h2', '.ap-textimage__text p', '.ap-textimage__text .ap-link',
  '.masterclass-search', '.masterclass-search__heading', '.masterclass-search__title h1',
  '.masterclass-search__title h1 i', '.masterclass-search__description p',
  '.masterclass-search__locations', '.masterclass-search__location', '.masterclass-search__location span',
  '.masterclasscarousel', '.masterclasscarousel .ap-storybook-carousel-head',
  '.masterclasscarousel h2', '.masterclasscarousel .ap-storybook-carousel-head p',
  '.masterclasscarousel .swiper', '.masterclasscarousel .swiper-slide',
  '.masterclasscarousel .ap-masterclass-card', '.masterclasscarousel .ap-masterclass-card img',
  '.masterclasscarousel .ap-masterclass-card__picture', '.masterclasscarousel .ap-masterclass-card picture',
  '.masterclasscarousel .masterclass-card__product-title',
  '.masterclasscarousel .masterclass__tags-tag',
  '.masterclasscarousel .ap-masterclass-card__product-description',
  '.masterclasscarousel .ap-masterclass-card__infos',
  '.masterclasscarousel .ap-masterclass-card__type', '.masterclasscarousel .ap-masterclass-card__type .icon',
  '.masterclasscarousel .ap-masterclass-card__hours',
  '.masterclasscarousel .ap-masterclass-card__actions', '.masterclasscarousel .ap-masterclass-card__link',
  '.masterclasscarousel .ap-masterclass-card__header', '.masterclasscarousel .ap-masterclass-card__name',
  // detail page
  '.masterclass-hero', '.masterclass-hero__title-section', '.ap-masterclasshero__link .ap-link--line',
  '.masterclass-hero__name', '.masterclass-hero__name-primary', '.masterclass-hero__name-secondary',
  '.masterclass-hero__title-section .masterclass__tags-tag',
  '.masterclass-hero__image-container', '.masterclass-hero__image', '.masterclass-hero__picture img',
  '.masterclass-hero__product-container', '.masterclass-hero__product',
  '.ap-masterclass-card-hero.ap-masterclass-card', '.ap-masterclass-card-hero .masterclass-card__product-title',
  '.ap-masterclass-card-hero .ap-masterclass-card__product-description',
  '.ap-masterclass-card-hero .ap-input-select__label', '.ap-masterclass-card-hero .ap-custom-select-input__select',
  '.ap-masterclass-card-hero .ap-masterclass-card__infos',
  '.ap-masterclass-card-hero .ap-masterclass-card__type', '.ap-masterclass-card-hero .ap-masterclass-card__price',
  '.ap-masterclass-card-hero .ap-button-primary',
  '.ap-masterclass-banner', '.ap-masterclass-banner .ap-masterclass-card',
  '.xfpagepdp', '.xfpagepdp p',
  '.cmp-experiencefragment--master11', '.cmp-experiencefragment--master11 h2',
  '.ap-accordion', '.ap-accordion__trigger', '.ap-accordion__label', '.ap-accordion__content',
  '.cmp-experiencefragment--master11 .text', '.cmp-experiencefragment--master11 .accordion',
];

const PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color', 'background', 'margin', 'padding', 'max-width', 'width', 'height', 'display', 'grid-template-columns', 'gap', 'border', 'border-bottom', 'border-radius', 'text-align', 'opacity', 'position', 'top', 'bottom', 'left', 'right', 'z-index', 'object-fit', 'justify-content', 'align-items', 'flex-direction', 'transform', 'transition', 'box-shadow', 'text-decoration'];

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
  await new Promise((r) => setTimeout(r, 2000)); window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 800));
});

const data = await page.evaluate(({ SELECTORS, PROPS }) => {
  const out = {};
  SELECTORS.forEach((sel) => {
    const els = [...document.querySelectorAll(sel)].slice(0, 3);
    out[sel] = els.map((el) => {
      const s = getComputedStyle(el); const o = {};
      PROPS.forEach((p) => { const v = s.getPropertyValue(p); if (v && v !== 'none' && v !== 'normal' && v !== 'auto') o[p] = v; });
      const r = el.getBoundingClientRect();
      o._rect = { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), left: Math.round(r.left) };
      o._text = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
      if (el.tagName === 'IMG') o._src = (el.currentSrc || el.src || '').slice(0, 200);
      return o;
    });
  });
  return out;
}, { SELECTORS, PROPS });

// masterclass-banner scroll behavior (detail page only): visibility vs scrollY
const banner = await page.evaluate(async () => {
  const b = document.querySelector('.ap-masterclass-banner-app, [class*="masterclass-banner"]');
  if (!b) return null;
  const snap = () => {
    const el = document.querySelector('[class*="masterclass-banner"]');
    const inner = el ? el.firstElementChild : null;
    const target = inner || el;
    if (!target) return null;
    const s = getComputedStyle(target);
    const r = target.getBoundingClientRect();
    return { y: scrollY, cls: (target.className || '').toString().slice(0, 160), position: s.position, top: s.top, bottom: s.bottom, transform: s.transform, transition: s.transition, opacity: s.opacity, display: s.display, visibility: s.visibility, zIndex: s.zIndex, h: Math.round(r.height), vTop: Math.round(r.top), bg: s.backgroundColor };
  };
  const states = [];
  for (const y of [0, 200, 400, 600, 800, 1000, 1400, 2000, 3000]) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 700));
    states.push(snap());
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 700));
  states.push(snap());
  return states;
});

writeFileSync(outJson, JSON.stringify({ url: URL, width, selectors: data, banner }, null, 1));
console.log(`[mc-geom] ${width}w -> ${outJson}`);
await browser.close();
