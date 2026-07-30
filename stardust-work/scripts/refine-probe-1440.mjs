/* refine-probe-1440 — live-site measurements for the home refinements batch:
   header scroll states, storybook reveal choreography, swiper params,
   ap-link hover, header language selector, footer computed styles. */
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/home', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.waitForTimeout(1000);

const out = {};

// ---- 1. header structure + language selector presence
out.header = await p.evaluate(() => {
  const h = document.querySelector('.ap-header');
  const cs = h ? getComputedStyle(h) : null;
  const langInHeader = h ? [...h.querySelectorAll('[class*=language]')].map((e) => ({ cls: e.className, vis: getComputedStyle(e).display })) : [];
  const burger = h?.querySelector('button[class*=burger], .ap-header__menu-icon, [aria-label*=enu]');
  return {
    cls: h?.className,
    transition: cs?.transition,
    position: cs?.position,
    height: h?.getBoundingClientRect().height,
    containerH: h?.querySelector('.ap-header__container')?.getBoundingClientRect().height,
    bgPanel: !!h?.querySelector('.ap-header__background-panel'),
    bgPanelStyle: h?.querySelector('.ap-header__background-panel') ? getComputedStyle(h.querySelector('.ap-header__background-panel')).background.slice(0, 60) : null,
    langInHeader,
    burgerCls: burger?.className,
    placeholder: document.querySelector('.header-placeholder')?.getBoundingClientRect().height,
  };
});

// ---- 2. header scroll state machine: sample classes at scroll positions/directions
out.headerScroll = await p.evaluate(async () => {
  const h = document.querySelector('.ap-header');
  const read = () => ({
    y: Math.round(window.scrollY),
    cls: [...h.classList].filter((c) => c.includes('--')).join(' '),
    tr: getComputedStyle(h).transform,
    panel: !!h.querySelector('.ap-header__background-panel'),
    logoDarkVisible: (() => { const d = h.querySelector('.ap-header__logo-image:not(.ap-header__logo-image--dark-theme):not(.ap-header__logo-image--mobile)'); return d ? getComputedStyle(d).display : 'n/a'; })(),
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const seq = [];
  const go = async (y, label) => { window.scrollTo(0, y); await wait(600); seq.push({ label, ...read() }); };
  seq.push({ label: 'top', ...read() });
  await go(50, 'down-50');
  await go(120, 'down-120');
  await go(300, 'down-300');
  await go(600, 'down-600');
  await go(1200, 'down-1200');
  await go(2400, 'down-2400');
  await go(2200, 'up-2200');
  await go(2000, 'up-2000');
  await go(1000, 'up-1000');
  // now scroll down again slightly from an "up" (shown) state
  await go(1100, 'down-again-1100');
  await go(1400, 'down-again-1400');
  await go(100, 'up-100');
  await go(0, 'top-again');
  return seq;
});

// ---- 3. swiper params for every carousel on the page
out.swipers = await p.evaluate(() => [...document.querySelectorAll('.swiper')].map((el) => {
  const s = el.swiper;
  const car = el.closest('[class*=carousel]');
  if (!s) return { cls: car?.className?.slice(0, 80), noInstance: true };
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]).filter(([, v]) => v !== undefined && typeof v !== 'object' || typeof v === 'object'));
  return {
    cls: (car?.className || el.className).slice(0, 120),
    slides: s.slides?.length,
    params: {
      speed: s.params.speed,
      slidesPerView: s.params.slidesPerView,
      spaceBetween: s.params.spaceBetween,
      freeMode: typeof s.params.freeMode === 'object' ? { enabled: s.params.freeMode.enabled, sticky: s.params.freeMode.sticky, momentum: s.params.freeMode.momentum, momentumRatio: s.params.freeMode.momentumRatio, momentumBounce: s.params.freeMode.momentumBounce } : s.params.freeMode,
      slidesPerGroup: s.params.slidesPerGroup,
      centeredSlides: s.params.centeredSlides,
      loop: s.params.loop,
      grabCursor: s.params.grabCursor,
      resistanceRatio: s.params.resistanceRatio,
      touchRatio: s.params.touchRatio,
      threshold: s.params.threshold,
      longSwipesRatio: s.params.longSwipesRatio,
      longSwipesMs: s.params.longSwipesMs,
      followFinger: s.params.followFinger,
      cssMode: s.params.cssMode,
      pagination: s.params.pagination && s.params.pagination.el ? { type: s.params.pagination.type, clickable: s.params.pagination.clickable } : false,
      navigation: s.params.navigation && s.params.navigation.nextEl ? true : false,
      breakpointsKeys: s.params.breakpoints ? Object.keys(s.params.breakpoints) : null,
    },
    navVisible: (() => { const n = el.closest('[class*=carousel]')?.querySelector('.swiper-button, .swiper-button-next'); return n ? getComputedStyle(n).display : null; })(),
  };
}));

// ---- 4. storybook (novelties) reveal choreography
out.reveal = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // find the storybook carousel (novelties)
  const sb = document.querySelector('.ap-storybook-carousel') || [...document.querySelectorAll('[class*=carousel]')].find((c) => /novelt/i.test(c.textContent));
  if (!sb) return { missing: true };
  const section = sb.closest('[data-ap-reveal-effect], .ap-lazy-content') || sb;
  // jump far away, wait, then bring into view and sample
  window.scrollTo(0, 0);
  await wait(800);
  const slides = [...sb.querySelectorAll('.swiper-slide')].slice(0, 6);
  const lines = [...(section.querySelectorAll('.js-reveal-effect-line') || [])].slice(0, 6);
  const rect = sb.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - window.innerHeight + 200; // just entering
  window.scrollTo(0, Math.max(0, targetY - 400));
  await wait(700);
  const pre = slides.map((s) => { const cs = getComputedStyle(s); return { tr: cs.transform, op: cs.opacity, transition: cs.transition.slice(0, 120), inline: s.getAttribute('style')?.slice(0, 120) }; });
  // scroll it into view
  window.scrollTo(0, window.scrollY + sb.getBoundingClientRect().top - window.innerHeight + 350);
  const t0 = performance.now();
  const samples = [];
  for (let i = 0; i < 90; i += 1) {
    samples.push({
      t: Math.round(performance.now() - t0),
      slides: slides.map((s) => { const cs = getComputedStyle(s); return { tr: cs.transform === 'none' ? 'none' : cs.transform.split(',').slice(4).join(','), op: cs.opacity }; }),
      lines: lines.map((l) => { const cs = getComputedStyle(l); return { tr: cs.transform === 'none' ? 'none' : cs.transform.split(',').slice(4).join(','), op: cs.opacity }; }),
    });
    await wait(33);
  }
  return {
    sectionCls: section.className?.slice(0, 120),
    sbCls: sb.className?.slice(0, 120),
    slideCount: sb.querySelectorAll('.swiper-slide').length,
    lineCount: lines.length,
    pre,
    samples,
  };
});

await p.screenshot({ path: '/tmp/live-novelties-probe.png' });
console.log(JSON.stringify(out, null, 1));
await b.close();
