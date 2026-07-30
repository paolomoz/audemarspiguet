/* refine-smoke — behavioral verification of the six refinement items against
   the local dev server (or a deployed URL). Checks header scroll machine,
   carousel drag/arrows/dots, reveal cascade choreography, footer icons/type,
   ap-link hover. Usage: node refine-smoke.mjs [origin] [width] */
import { chromium } from 'playwright';

const origin = process.argv[2] || 'http://localhost:3000';
const width = Number(process.argv[3] || 1440);
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, hasTouch: width < 500 });
const p = await ctx.newPage();
await p.goto(`${origin}/ch/en/home`, { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(4000);

const results = {};

// 1. header scroll machine
results.header = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const h = document.querySelector('header');
  const read = () => ({
    cls: [...h.classList].join(' ') || 'none',
    pos: getComputedStyle(h).position,
    tr: getComputedStyle(h).transform,
    panel: (() => { const pn = h.querySelector('.ap-nav-panel'); return pn ? getComputedStyle(pn).transform : 'missing'; })(),
    darkLogo: (() => { const d = h.querySelector('.ap-logo-dark'); return d ? getComputedStyle(d).display : 'missing'; })(),
    navColor: getComputedStyle(h.querySelector('.ap-nav')).color,
  });
  const seq = {};
  window.scrollTo(0, 0); await wait(500); seq.top = read();
  window.scrollTo(0, 40); await wait(500); seq.down40 = read();
  window.scrollTo(0, 600); await wait(500); seq.down600 = read();
  window.scrollTo(0, 590); await wait(500); seq.up590 = read();
  window.scrollTo(0, 0); await wait(500); seq.backTop = read();
  return seq;
});

// 2. reveal cascade priming (delays) on novelties
results.cascade = await p.evaluate(() => {
  const car = document.querySelector('.carousel.novelties');
  if (!car) return { missing: true };
  const figs = [...car.querySelectorAll('.slide figure')].slice(0, 3);
  const lines = [...car.querySelectorAll('.slide .reveal-line')].slice(0, 8);
  const ctas = [...car.querySelectorAll('figcaption .ap-link')].slice(0, 2);
  return {
    figDelays: figs.map((f) => f.style.transitionDelay),
    figInit: figs.map((f) => f.classList.contains('reveal-init')),
    lineDelays: lines.map((l) => l.style.transitionDelay),
    ctaDelays: ctas.map((c) => c.style.transitionDelay),
    lineCount: car.querySelectorAll('.slide .reveal-line').length,
  };
});

// 3. carousel functionality: arrows + transform + dots
results.carousel = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const car = document.querySelector('.carousel.novelties');
  car.scrollIntoView({ block: 'center' });
  await wait(2500);
  const track = car.querySelector('.carousel-track');
  const next = car.querySelector('.carousel-nav-next');
  const prev = car.querySelector('.carousel-nav-prev');
  const state = () => ({
    tr: getComputedStyle(track).transform,
    prevDisabled: prev.disabled,
    prevOpacity: getComputedStyle(prev).opacity,
    nextDisabled: next.disabled,
    nextDisplay: getComputedStyle(next).display,
  });
  const before = state();
  next.click();
  await wait(500);
  const afterNext = state();
  prev.click();
  await wait(500);
  const afterPrev = state();
  return { before, afterNext, afterPrev, slideW: track.children[0].getBoundingClientRect().width };
});

// 4. drag gesture
const car = p.locator('.carousel.novelties .carousel-viewport');
const box = await car.boundingBox();
if (box) {
  await p.mouse.move(box.x + box.width / 2, box.y + 100);
  await p.mouse.down();
  for (let i = 1; i <= 10; i += 1) {
    await p.mouse.move(box.x + box.width / 2 - i * 45, box.y + 100, { steps: 2 });
    await p.waitForTimeout(30);
  }
  await p.mouse.up();
  await p.waitForTimeout(600);
  results.drag = await p.evaluate(() => {
    const track = document.querySelector('.carousel.novelties .carousel-track');
    return { trAfterDrag: getComputedStyle(track).transform };
  });
}

// 5. ap-link hover shrink
results.apLink = await p.evaluate(() => {
  const l = document.querySelector('main .ap-link');
  const bef = getComputedStyle(l, '::before');
  return { rest: bef.width, transition: bef.transition.slice(0, 90) };
});
const link = p.locator('main .ap-link').first();
await link.scrollIntoViewIfNeeded();
await p.waitForTimeout(1800);
await link.hover();
await p.waitForTimeout(500);
results.apLinkHover = await p.evaluate(() => {
  const l = document.querySelector('main .ap-link');
  return getComputedStyle(l, '::before').width;
});

// 6. footer icons + type
results.footer = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  window.scrollTo(0, document.body.scrollHeight);
  await wait(1500);
  const f = document.querySelector('footer');
  const social = [...f.querySelectorAll('.ap-footer-social a')];
  const pick = (e) => { if (!e) return null; const cs = getComputedStyle(e); return `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight}`; };
  return {
    socialCount: social.length,
    socialSvg: social.filter((a) => a.querySelector('svg path')).length,
    iconSize: social[0] ? `${Math.round(social[0].querySelector('svg').getBoundingClientRect().width)}` : null,
    lang: pick(f.querySelector('.ap-footer-lang')),
    langIsButton: !!f.querySelector('button.ap-footer-lang'),
    colTitle: pick(f.querySelector('.ap-footer-cols h3')),
    colLink: pick(f.querySelector('.ap-footer-cols a')),
    colLinkColor: f.querySelector('.ap-footer-cols a') ? getComputedStyle(f.querySelector('.ap-footer-cols a')).color : null,
    legal: pick(f.querySelector('.ap-footer-legal a')),
    copy: pick(f.querySelector('.ap-footer-copy')),
    badge: !!f.querySelector('.ap-footer-a11y-badge'),
  };
});

// dots at mobile only — report presence
results.dots = await p.evaluate(() => {
  const d = document.querySelector('.carousel.novelties .carousel-dots');
  return { count: d?.children.length, display: d ? getComputedStyle(d).display : null };
});

console.log(JSON.stringify(results, null, 1));
await b.close();
