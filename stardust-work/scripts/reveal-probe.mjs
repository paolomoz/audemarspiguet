/* reveal-probe — fresh-load measurement of the storybook (novelties) reveal.
   Samples inline styles + computed transform/opacity of candidate elements
   during first scroll-into-view. */
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
  if (!sb) return { missing: true };
  // inventory of reveal-marked elements inside the module wrapper
  const wrapper = sb.closest('.carousel, [data-ap-reveal-effect]')?.parentElement || sb.parentElement;
  const inv = [...sb.querySelectorAll('[class*=reveal], [data-ap-reveal-effect]')].slice(0, 30).map((e) => ({
    tag: e.tagName, cls: e.className.toString().slice(0, 140), hidden: getComputedStyle(e).opacity,
  }));
  const revealRoot = sb.closest('[data-ap-reveal-effect]') || sb;
  // targets to sample: section itself, h2/lines, aside content, first 6 slides + their figures
  const slides = [...sb.querySelectorAll('.swiper-slide')].slice(0, 6);
  const lines = [...revealRoot.querySelectorAll('.js-reveal-effect-line')].slice(0, 8);
  const hiddenEls = [...revealRoot.querySelectorAll('.js-reveal-effect-hidden, [class*=reveal-effect]')].slice(0, 12);
  const desc = revealRoot.querySelector('p, .ap-carousel__description');
  const grab = (e) => {
    if (!e) return null;
    const cs = getComputedStyle(e);
    return {
      tr: cs.transform, op: cs.opacity, vis: cs.visibility,
      inline: (e.getAttribute('style') || '').slice(0, 160),
    };
  };
  // position just above the section, then scroll in
  const rect = sb.getBoundingClientRect();
  const absTop = window.scrollY + rect.top;
  window.scrollTo(0, Math.max(0, absTop - window.innerHeight - 600));
  await wait(400);
  const pre = { slides: slides.map(grab), lines: lines.map(grab), sect: grab(revealRoot), desc: grab(desc) };
  window.scrollTo(0, absTop - window.innerHeight + 300);
  const t0 = performance.now();
  const samples = [];
  for (let i = 0; i < 110; i += 1) {
    samples.push({
      t: Math.round(performance.now() - t0),
      slides: slides.map(grab),
      lines: lines.map(grab),
      sect: grab(revealRoot),
      desc: grab(desc),
    });
    await wait(33);
  }
  return {
    inv, revealRootCls: revealRoot.className.toString().slice(0, 140),
    revealRootAttr: revealRoot.getAttribute('data-ap-reveal-effect'),
    hiddenCount: hiddenEls.length,
    pre, samples,
  };
});
console.log(JSON.stringify(out));
await b.close();
