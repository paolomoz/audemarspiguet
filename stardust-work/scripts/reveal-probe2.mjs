/* reveal-probe2 — map each js-reveal-effect-line to its parent card + text,
   and sample card imgs (clip/scale/opacity) during first reveal. */
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB' })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/home', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
await p.waitForTimeout(500);

const out = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const sb = document.querySelector('.ap-storybook-carousel');
  const section = sb.closest('.carousel')?.parentElement || sb.parentElement;
  // identify every line in the whole module area (aside + cards)
  const module = sb.closest('[class*=module], .ap-carousel-app') || sb;
  const allLines = [...module.querySelectorAll('.js-reveal-effect-line')];
  const slideEls = [...sb.querySelectorAll('.swiper-slide')];
  const id = allLines.map((l, i) => {
    const slide = l.closest('.swiper-slide');
    return {
      i,
      slideIdx: slide ? slideEls.indexOf(slide) : -1,
      inAside: !slide,
      text: l.textContent.trim().slice(0, 40),
    };
  });
  // heading/aside lines might live outside sb — look in the module head
  const head = module.querySelector('.ap-carousel__header, .ap-carousel__title, h2')?.closest('div');
  const headLines = head ? [...head.querySelectorAll('.js-reveal-effect-line')].map((l) => l.textContent.trim().slice(0, 40)) : [];
  // sample imgs of first 4 cards + their lines
  const cards = slideEls.slice(0, 4).map((s) => s.querySelector('figure'));
  const imgs = cards.map((c) => c?.querySelector('img'));
  const pics = cards.map((c) => c?.querySelector('picture'));
  const grab = (e) => {
    if (!e) return null;
    const cs = getComputedStyle(e);
    return { tr: cs.transform, op: cs.opacity, cp: cs.clipPath, vis: cs.visibility, inline: (e.getAttribute('style') || '').slice(0, 100) };
  };
  const rect = sb.getBoundingClientRect();
  const absTop = window.scrollY + rect.top;
  window.scrollTo(0, Math.max(0, absTop - window.innerHeight - 600));
  await wait(400);
  const pre = { imgs: imgs.map(grab), pics: pics.map(grab), figs: cards.map(grab) };
  window.scrollTo(0, absTop - window.innerHeight + 300);
  const t0 = performance.now();
  const samples = [];
  const lineSample = allLines.slice(0, 14);
  for (let i = 0; i < 110; i += 1) {
    samples.push({
      t: Math.round(performance.now() - t0),
      imgs: imgs.map(grab),
      figs: cards.map(grab),
      lines: lineSample.map((l) => { const cs = getComputedStyle(l); return { op: cs.opacity }; }),
    });
    await wait(33);
  }
  return { id, headLines, pre, samples, totalLines: allLines.length };
});
console.log(JSON.stringify(out));
await b.close();
