/* footer-probe — live footer computed styles at a given width + social SVG
   extraction + mobile carousel pagination + header inventory.
   Usage: node footer-probe.mjs <width> [url] */
import { chromium } from 'playwright';

const width = Number(process.argv[2] || 1440);
const url = process.argv[3] || 'https://www.audemarspiguet.com/ch/en/home';
const UA = width < 500
  ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({
  viewport: { width, height: 900 }, deviceScaleFactor: 1, userAgent: UA, locale: 'en-GB', isMobile: width < 500, hasTouch: width < 500,
})).newPage();
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
try { const x = p.locator('#onetrust-accept-btn-handler'); if (await x.isVisible({ timeout: 4000 })) await x.click(); } catch { /* absent */ }
// dwell-scroll to bottom to hydrate footer
await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += 800) { window.scrollTo(0, y); await wait(250); }
  window.scrollTo(0, h);
  await wait(1200);
});

const out = await p.evaluate(() => {
  const f = document.querySelector('.ap-footer, footer');
  const pick = (e, extra = []) => {
    if (!e) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const o = {
      font: `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(',')[0]}`,
      ls: cs.letterSpacing, tt: cs.textTransform, color: cs.color,
      m: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
      p: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
      wh: `${Math.round(r.width)}x${Math.round(r.height)}`,
    };
    extra.forEach((k) => { o[k] = cs[k]; });
    return o;
  };
  const q = (s) => f?.querySelector(s);
  // social icons
  const socialLinks = [...(f?.querySelectorAll('.ap-footer__social a, [class*=social] a') || [])];
  const social = socialLinks.slice(0, 8).map((a) => ({
    label: a.getAttribute('aria-label') || a.title || a.href.slice(0, 60),
    html: a.innerHTML.replace(/\s+/g, ' ').slice(0, 1200),
    size: (() => { const r = a.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
    iconSize: (() => { const i = a.querySelector('svg, i, span'); if (!i) return null; const r = i.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
  }));
  // social row container
  const socialWrap = socialLinks[0]?.closest('div, ul');
  return {
    footerCls: f?.className?.slice(0, 100),
    bg: f ? getComputedStyle(f).backgroundColor : null,
    langBtn: pick(q('.ap-language-selector-button')),
    langBtnText: q('.ap-language-selector-button')?.textContent.trim(),
    langBtnIcon: (() => { const i = q('.ap-language-selector-button svg'); if (!i) return null; const r = i.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
    colTitle: pick(q('.ap-link-list__list-title')),
    colItem: pick(q('.ap-link-list__item a')),
    colItemLi: pick(q('.ap-link-list__item')),
    colList: pick(q('.ap-link-list__list')),
    nav: pick(q('.ap-navigation')),
    wrapperTop: pick(q('.ap-footer__wrapper--top')),
    social,
    socialWrapStyles: pick(socialWrap, ['display', 'gap', 'justifyContent']),
    legal: pick(q('[class*=legal] a') || q('.ap-footer__bottom a')),
    legalWrap: pick(q('[class*=legal]')),
    copyright: pick(q('.copyright p') || q('[class*=copyright] p')),
    copyrightWrap: pick(q('[class*=copyright]')),
    brands: pick(q('.ap-footer__wrapper--brands, [class*=brand]')),
    // header inventory at this width
    headerItems: [...(document.querySelector('.ap-header')?.querySelectorAll('button, a') || [])].slice(0, 20).map((e) => ({
      cls: (e.className.toString() || '').slice(0, 70),
      label: e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30),
      vis: getComputedStyle(e).display,
    })),
    headerH: document.querySelector('.ap-header__container')?.getBoundingClientRect().height,
    // carousel pagination (dots)
    dots: (() => {
      const pag = document.querySelector('.ap-storybook-carousel .swiper-pagination, [class*=carousel] .swiper-pagination');
      if (!pag) return null;
      const cs = getComputedStyle(pag);
      const bullets = [...pag.querySelectorAll('.swiper-pagination-bullet')];
      const active = pag.querySelector('.swiper-pagination-bullet-active');
      return {
        display: cs.display, cls: pag.className.slice(0, 80), count: bullets.length,
        bullet: bullets[0] ? pick(bullets[0], ['borderRadius', 'backgroundColor', 'opacity', 'transition']) : null,
        active: active ? pick(active, ['borderRadius', 'backgroundColor', 'border', 'opacity']) : null,
      };
    })(),
    swiperButtons: (() => {
      const btn = document.querySelector('.swiper-button, .swiper-button-next, .swiper-button-prev');
      if (!btn) return null;
      return { cls: btn.className.slice(0, 100), ...pick(btn, ['position', 'top', 'right', 'left', 'backgroundColor', 'borderRadius', 'opacity', 'transition']), html: btn.innerHTML.replace(/\s+/g, ' ').slice(0, 400) };
    })(),
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
