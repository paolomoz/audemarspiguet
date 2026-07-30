// Store-detail lift (archetype F) for replica recreation: dwell-hydrated DOM
// snapshot + per-module verbatim content manifest + computed-style lift.
// Adapted from home-lift.mjs; adds boutique-hero internals (hours table,
// address/contact, appointment CTA) and carousel gallery/nearby internals.
// Usage: node store-lift.mjs <width> <out.json> [--dom <out.html>] [--url <url>]
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const width = parseInt(process.argv[2] || '1440', 10);
const outJson = process.argv[3];
const domIdx = process.argv.indexOf('--dom');
const outHtml = domIdx > -1 ? process.argv[domIdx + 1] : null;
const urlIdx = process.argv.indexOf('--url');
const URL = urlIdx > -1 ? process.argv[urlIdx + 1] : 'https://www.audemarspiguet.com/ch/en/stores/ap-house-geneva';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: width < 500 ? 844 : 900 },
  deviceScaleFactor: 2, userAgent: UA, locale: 'en-GB',
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

const PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color', 'margin-top', 'margin-bottom', 'margin-left', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'max-width', 'width', 'height', 'display', 'grid-template-columns', 'gap', 'border-radius', 'border', 'text-align', 'opacity', 'position', 'object-fit', 'aspect-ratio', 'justify-content', 'align-items', 'flex-direction', 'text-decoration-line'];

const data = await page.evaluate((PROPS) => {
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el); const o = {};
    PROPS.forEach((p) => { o[p] = s.getPropertyValue(p); });
    const r = el.getBoundingClientRect();
    o._rect = { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), left: Math.round(r.left) };
    return o;
  };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
  const imgOf = (i) => (i ? {
    src: i.currentSrc || i.getAttribute('src') || i.dataset.src, alt: i.getAttribute('alt') || '',
    w: i.naturalWidth, sources: [...(i.closest('picture')?.querySelectorAll('source') || [])].map((s) => ({ media: s.getAttribute('media'), srcset: s.getAttribute('srcset') || s.dataset.srcset })),
  } : null);
  const vidOf = (v) => (v ? { src: v.currentSrc || v.querySelector('source')?.src || v.src, poster: v.getAttribute('poster'), autoplay: v.autoplay, loop: v.loop, muted: v.muted } : null);

  const main = document.querySelector('#maincontent') || document.querySelector('main') || document.body;
  const mods = [...main.children]
    .flatMap((el) => (el.classList.contains('parsys') ? [...el.children] : [el]))
    .flatMap((el) => (el.classList.contains('grid-container') || el.classList.contains('cmp-container') || el.classList.contains('container') ? [...el.querySelectorAll(':scope > * , :scope > * > *')].filter((c) => c.children.length) : [el]))
    .filter((el) => el.getBoundingClientRect().height > 8);
  const modules = mods.map((el) => {
    const r = el.getBoundingClientRect();
    const headings = [...el.querySelectorAll('h1,h2,h3,h4')].filter((h) => h.getBoundingClientRect().height > 0).map((h) => ({
      tag: h.tagName, cls: (h.className || '').toString().slice(0, 90), text: txt(h), html: h.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 500), style: cs(h),
    }));
    const paras = [...el.querySelectorAll('p')].filter((p) => txt(p) && p.getBoundingClientRect().height > 0).map((p) => ({ cls: (p.className || '').toString().slice(0, 90), text: txt(p), style: cs(p) })).slice(0, 30);
    const ctas = [...el.querySelectorAll('a,button')].filter((a) => txt(a) && a.getBoundingClientRect().height > 0).map((a) => ({ tag: a.tagName, text: txt(a).slice(0, 90), href: a.getAttribute('href'), cls: (a.className || '').toString().slice(0, 90), style: cs(a) })).slice(0, 30);
    const imgs = [...el.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().height > 4).map(imgOf).slice(0, 30);
    const videos = [...el.querySelectorAll('video')].map(vidOf);
    const slides = [...el.querySelectorAll('.swiper-slide')].slice(0, 24).map((s) => ({
      cls: (s.firstElementChild?.className || '').toString().slice(0, 90),
      img: imgOf(s.querySelector('img')),
      texts: [...s.querySelectorAll('h3,h4,p,a,span,div')].map((n) => ({ tag: n.tagName, cls: (n.className || '').toString().slice(0, 60), t: txt(n)?.slice(0, 140), href: n.tagName === 'A' ? n.getAttribute('href') : null })).filter((x) => x.t && x.t.length < 141).slice(0, 14),
      rect: { w: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height), left: Math.round(s.getBoundingClientRect().left) },
    }));
    // boutique hero internals: every leaf with text, classed, with computed style
    const heroBits = el.querySelector('.ap-boutique-hero, [class*="boutique-hero"]')
      ? [...el.querySelectorAll('[class*="boutique"] *')].filter((n) => n.children.length === 0 && txt(n) && n.getBoundingClientRect().height > 0).slice(0, 80).map((n) => ({
        tag: n.tagName, cls: (n.className || '').toString().slice(0, 110), t: txt(n).slice(0, 160), style: cs(n),
      }))
      : [];
    return {
      cls: (el.className || '').toString().slice(0, 140), id: el.id || null,
      rect: { top: Math.round(r.top + scrollY), h: Math.round(r.height) },
      sectionStyle: cs(el),
      innerRoot: (el.firstElementChild?.className || '').toString().slice(0, 140),
      headings, paras, ctas, imgs, videos, slides, heroBits,
    };
  });
  return {
    url: location.href,
    pageH: document.body.scrollHeight,
    headerStyle: cs(document.querySelector('header')),
    modules,
  };
}, PROPS);

writeFileSync(outJson, JSON.stringify(data, null, 1));
console.log(`[store-lift] ${width}w: ${data.modules.length} modules, pageH ${data.pageH} -> ${outJson}`);
if (outHtml) {
  const html = await page.content();
  writeFileSync(outHtml, html);
  console.log(`[store-lift] DOM snapshot -> ${outHtml} (${Math.round(html.length / 1024)}KB)`);
}
await browser.close();
