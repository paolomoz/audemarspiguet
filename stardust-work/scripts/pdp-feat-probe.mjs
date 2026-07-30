// Featured-products row/cell geometry probe (archetype C).
// Usage: node pdp-feat-probe.mjs <width>
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '1440', 10);
const URL = 'https://www.audemarspiguet.com/ch/en/watch-collection/royal-oak-offshore/26420SO.OO.A600CA.01';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 }, userAgent: UA, locale: 'en-GB',
})).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch {}
await page.evaluate(async () => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove());
  const step = Math.round(window.innerHeight * 0.6); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 900)); }
  await new Promise((r) => setTimeout(r, 1500)); window.scrollTo(0, 0);
});
const data = await page.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; };
  const out = [];
  document.querySelectorAll('.ap-featuredproducts__feature').forEach((f) => {
    const row = { feature: r(f), cls: f.className, cells: [] };
    f.querySelectorAll(':scope > .grid-container > .grid-x > .cell, :scope .cell').forEach((c) => {
      row.cells.push({
        rect: r(c),
        cls: c.className.slice(0, 90),
        imgBox: c.querySelector('.ap-featuredproducts__image') ? r(c.querySelector('.ap-featuredproducts__image')) : null,
        img: c.querySelector('img') ? { rect: r(c.querySelector('img')), src: (c.querySelector('img').currentSrc || '').slice(0, 140) } : null,
        text: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
      });
    });
    out.push(row);
  });
  // carousel container heading + viewport + video wrapper details
  const car = document.querySelector('.ap-carousel-container-app');
  const carInfo = car ? { rect: r(car), swiper: car.querySelector('.swiper') ? r(car.querySelector('.swiper')) : null } : null;
  // similar products swiper box
  const sim = document.querySelector('.ap-similarproducts');
  const simInfo = sim ? {
    rect: r(sim),
    cs: (() => { const s = getComputedStyle(sim); return { display: s.display, gridTemplateColumns: s.gridTemplateColumns, paddingBottom: s.paddingBottom }; })(),
    carousel: sim.querySelector('.ap-similarproducts__carousel') ? r(sim.querySelector('.ap-similarproducts__carousel')) : null,
    firstSlide: sim.querySelector('.swiper-slide') ? r(sim.querySelector('.swiper-slide')) : null,
    wrapperTransform: sim.querySelector('.swiper-wrapper')?.style.transform,
  } : null;
  // strap selector wrapper + overlay + info
  const strap = document.querySelector('.ap-strap-selector');
  const strapInfo = strap ? {
    rect: r(strap),
    wrapper: strap.querySelector('.ap-strap-selector__wrapper') ? r(strap.querySelector('.ap-strap-selector__wrapper')) : null,
    overlayImg: strap.querySelector('.ap-strap-selector__overlay-slide img') ? r(strap.querySelector('.ap-strap-selector__overlay-slide img')) : null,
    overlaySrc: (strap.querySelector('.ap-strap-selector__overlay-slide img')?.currentSrc || '').slice(0, 140),
    info: strap.querySelector('.ap-strap-selector__info') ? r(strap.querySelector('.ap-strap-selector__info')) : null,
    swiper: strap.querySelector('.swiper') ? r(strap.querySelector('.swiper')) : null,
    wrapperTransform: strap.querySelector('.swiper-wrapper')?.style.transform,
    navPrev: strap.querySelector('.swiper-button--prev') ? r(strap.querySelector('.swiper-button--prev')) : null,
    navNext: strap.querySelector('.swiper-button--next') ? r(strap.querySelector('.swiper-button--next')) : null,
    caseImg: strap.querySelector('.swiper-slide .ap-strap-selector__case') ? { rect: r(strap.querySelector('.swiper-slide .ap-strap-selector__case')), src: (strap.querySelector('.swiper-slide .ap-strap-selector__case').currentSrc || '').slice(0, 160) } : null,
    slideContent: strap.querySelector('.ap-strap-selector__slide-content') ? r(strap.querySelector('.ap-strap-selector__slide-content')) : null,
    strapTop: strap.querySelector('.ap-strap-selector__strap--top') ? r(strap.querySelector('.ap-strap-selector__strap--top')) : null,
  } : null;
  // carousel XF nav buttons
  const carNext = document.querySelector('.ap-carousel-app .swiper-button--next');
  // specs userguide/tab measurement
  const activeTabBtn = document.querySelector('.ap-specifications__button--active button');
  return {
    features: out,
    carInfo,
    simInfo,
    strapInfo,
    carNext: carNext ? r(carNext) : null,
    activeTabBtn: activeTabBtn ? { rect: r(activeTabBtn), cs: (() => { const s = getComputedStyle(activeTabBtn); return { color: s.color, padding: s.padding, fontSize: s.fontSize, lineHeight: s.lineHeight }; })() } : null,
  };
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
