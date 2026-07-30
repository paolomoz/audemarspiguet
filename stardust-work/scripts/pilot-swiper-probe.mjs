/* pilot-swiper-probe — swiper params + arrow visibility on the live pilot page. */
import { chromium } from 'playwright';

const width = Number(process.argv[2] || 1440);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y < document.body.scrollHeight; y += 900) { window.scrollTo(0, y); await wait(300); }
});
const out = await p.evaluate(() => [...document.querySelectorAll('.swiper')].map((el) => {
  const s = el.swiper;
  const car = el.closest('[class*=carousel]');
  const btn = car?.querySelector('.swiper-button--next, .swiper-button-next');
  return {
    cls: (car?.className || el.className).slice(0, 110),
    slides: el.querySelectorAll('.swiper-slide').length,
    params: s ? {
      speed: s.params.speed,
      slidesPerView: s.params.slidesPerView,
      spaceBetween: s.params.spaceBetween,
      grabCursor: s.params.grabCursor,
      freeMode: typeof s.params.freeMode === 'object' ? s.params.freeMode.enabled : s.params.freeMode,
      navigation: !!(s.params.navigation && s.params.navigation.nextEl),
      pagination: !!(s.params.pagination && s.params.pagination.el),
    } : null,
    btnVisible: btn ? getComputedStyle(btn).display + '/' + getComputedStyle(btn).opacity : null,
    indicator: !!car?.querySelector('.ap-indicator-carousel'),
    indicatorVisible: (() => { const i = car?.querySelector('.ap-indicator-carousel'); return i ? getComputedStyle(i).display : null; })(),
  };
}));
console.log(JSON.stringify(out, null, 1));
await b.close();
