/* detail-probe — swiper clip boxes, arrow look, chevron path, ap-link hover. */
import { chromium } from 'playwright';

const width = Number(process.argv[2] || 1440);
const UA = width < 500
  ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB', isMobile: width < 500, hasTouch: width < 500 })).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/home', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }

const out = await p.evaluate(() => {
  const res = {};
  const sb = document.querySelector('.ap-storybook-carousel');
  sb.scrollIntoView({ block: 'center' });
  const swiper = sb.querySelector('.swiper');
  const wrapper = sb.querySelector('.swiper-wrapper');
  const slide = sb.querySelector('.swiper-slide');
  const r = (e) => { if (!e) return null; const x = e.getBoundingClientRect(); return { left: Math.round(x.left), top: Math.round(x.top), w: Math.round(x.width), h: Math.round(x.height) }; };
  res.swiperBox = r(swiper);
  res.swiperOverflow = getComputedStyle(swiper).overflow;
  res.swiperPad = getComputedStyle(swiper).padding;
  res.wrapperBox = r(wrapper);
  res.slideBox = r(slide);
  res.carouselBox = r(sb);
  res.gridContainerBox = r(sb.closest('.grid-container') || sb.parentElement);
  // arrows
  const next = sb.querySelector('.swiper-button--next');
  const prev = sb.querySelector('.swiper-button--prev');
  const look = (e) => {
    if (!e) return null;
    const cs = getComputedStyle(e);
    const bef = getComputedStyle(e, '::before');
    return {
      box: r(e), opacity: cs.opacity, color: cs.color, display: cs.display,
      beforeBg: bef.backgroundColor, beforeBorder: bef.border, beforeRadius: bef.borderRadius,
      beforeBox: { w: bef.width, h: bef.height }, disabled: e.className.includes('disabled'),
      svg: e.querySelector('svg')?.outerHTML.replace(/\s+/g, ' ').slice(0, 700),
    };
  };
  res.next = look(next);
  res.prev = look(prev);
  // ap-link hover values (resting) — find a rule-line link
  const link = document.querySelector('.ap-link--line') || document.querySelector('main .ap-link');
  if (link) {
    const bef = getComputedStyle(link, '::before');
    res.apLink = { cls: link.className.slice(0, 80), width: bef.width, height: bef.height, bg: bef.backgroundColor, transition: bef.transition };
  }
  return res;
});

// hover the ap-link and re-read ::before
const hover = await p.evaluate(() => {
  const link = document.querySelector('.ap-link--line') || document.querySelector('main .ap-link');
  if (!link) return null;
  link.scrollIntoView({ block: 'center' });
  const x = link.getBoundingClientRect();
  return { x: x.left + x.width / 2, y: x.top + x.height / 2 };
});
if (hover) {
  await p.mouse.move(hover.x, hover.y);
  await p.waitForTimeout(600);
  const hovered = await p.evaluate(() => {
    const link = document.querySelector('.ap-link--line') || document.querySelector('main .ap-link');
    const bef = getComputedStyle(link, '::before');
    return { width: bef.width, bg: bef.backgroundColor };
  });
  out.apLinkHover = hovered;
}
console.log(JSON.stringify(out, null, 1));
await b.close();
