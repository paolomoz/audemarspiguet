// Extract a verbatim content manifest from the hydrated DOM capture.
// Parsed via Playwright DOM (no network, JS disabled).
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const src = 'file://' + resolve('stardust-work/current/pages/ch-en-collections-code-11-59-collection-hydrated.html');
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await page.goto(src);

const manifest = await page.evaluate(() => {
  const txt = el => el ? el.textContent.replace(/\s+/g,' ').trim() : null;
  const pickImg = img => img ? {
    src: img.currentSrc || img.getAttribute('src') || img.dataset.src || null,
    srcset: img.getAttribute('srcset') || img.dataset.srcset || null,
    alt: img.getAttribute('alt') || '',
    sources: [...(img.closest('picture')?.querySelectorAll('source')||[])].map(s=>({media:s.getAttribute('media'), srcset:s.getAttribute('srcset')||s.dataset.srcset||s.dataset.src}))
  } : null;

  const out = { meta: {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    og: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map(m=>[m.getAttribute('property'), m.content])),
  }};

  // HEADER (resting state)
  const header = document.querySelector('header');
  out.header = {
    topLinks: [...header.querySelectorAll('nav a, [class*="menu"] > ul > li > a')].slice(0,20).map(a=>({t:txt(a), h:a.getAttribute('href')})),
    logo: header.querySelector('img[src*="logo"]')?.getAttribute('src'),
    utilityLabels: [...header.querySelectorAll('button')].slice(0,12).map(b=>txt(b)).filter(Boolean),
  };

  const main = document.querySelector('main');

  // HERO
  const hero = main.querySelector('.hero');
  out.hero = {
    video: hero.querySelector('video source')?.getAttribute('src'),
    h1Lines: [...hero.querySelectorAll('h1 span')].map(s=>({text: txt(s), italic: !!s.querySelector('i') || s.closest('i')!=null || !!s.querySelector('em')})),
    h1HTML: hero.querySelector('h1')?.innerHTML.replace(/\s+/g,' ').trim(),
    h1Attrs: {title: hero.querySelector('h1')?.getAttribute('title'), aria: hero.querySelector('h1')?.getAttribute('aria-label')},
    paragraph: txt(hero.querySelector('p')),
    cta: (a=>a?{t:txt(a),h:a.getAttribute('href')}:null)(hero.querySelector('a')),
    playLabel: txt(hero.querySelector('.ap-hero__controls button')),
  };

  // DUALTEXT
  const dt = main.querySelector('.dualtext');
  out.dualtext = dt ? { html: dt.querySelector('.ap-dualtext')?.innerHTML.length, cells: [...dt.querySelectorAll('.cell')].map(c=>({cls:c.className, text: txt(c), paras: [...c.querySelectorAll('p, h2, h3')].map(p=>({tag:p.tagName, t:txt(p)}))})) } : null;

  // standalone text + link modules in order
  out.textLinkModules = [...main.querySelectorAll(':scope .text, :scope .link')].map(m=>({
    kind: m.classList.contains('text')?'text':'link',
    html: m.innerHTML.replace(/\s+/g,' ').trim().slice(0,500),
    text: txt(m),
    a: (a=>a?{t:txt(a),h:a.getAttribute('href')}:null)(m.querySelector('a')),
  }));

  // LOOKBOOK
  out.lookbook = [...main.querySelectorAll('.ap-lookbook-element__wrapper')].map(w=>({
    cls: w.className,
    img: pickImg(w.querySelector('img')),
    video: w.querySelector('video source')?.getAttribute('src') || w.querySelector('video')?.getAttribute('src'),
    caption: txt(w.querySelector('figcaption, [class*="caption"]')),
  }));

  // CAROUSELS
  out.carousels = [...main.querySelectorAll('.carousel')].map(c => {
    const layout = c.querySelector('ap-carousel-container')?.getAttribute(':layout') || '';
    const heading = c.querySelector('h2');
    const slides = [...c.querySelectorAll('.swiper-slide, [class*="carousel__slide"], li')].filter(s=>s.querySelector('img'));
    const cards = slides.map(s=>({
      cls: s.className.slice(0,80),
      img: pickImg(s.querySelector('img')),
      eyebrow: txt(s.querySelector('[class*="reference"], [class*="eyebrow"], [class*="overline"]')),
      title: txt(s.querySelector('h3, [class*="title"]')),
      text: txt(s.querySelector('p')),
      cta: (a=>a?{t:txt(a),h:a.getAttribute('href')}:null)(s.querySelector('a')),
      allLinks: [...s.querySelectorAll('a')].map(a=>({t:txt(a),h:a.getAttribute('href')})),
    }));
    return {
      layout,
      headingHTML: heading?.innerHTML.replace(/\s+/g,' ').trim(),
      headingText: txt(heading),
      browse: (a=>a?{t:txt(a),h:a.getAttribute('href')}:null)(c.querySelector('a[class*="link"], .ap-link-app a')),
      slideCount: slides.length, cards,
    };
  });

  // PRODUCT LIST section
  const pl = main.querySelector('.productlist');
  const cards = [...pl.querySelectorAll('.ap-product-card')];
  out.productlist = {
    searchPlaceholder: pl.querySelector('input')?.getAttribute('placeholder') || txt(pl.querySelector('label')),
    filterLabels: [...pl.querySelectorAll('button, [class*="filter"] span')].slice(0,10).map(b=>txt(b)).filter(Boolean),
    sectionHeading: txt(pl.querySelector('h2')),
    cardCount: cards.length,
    cards: cards.map(c=>({
      ref: txt(c.querySelector('[class*="reference"]')),
      title: txt(c.querySelector('h3, [class*="title"]')),
      subtitle: txt(c.querySelector('[class*="subtitle"], [class*="material"]')),
      img: pickImg(c.querySelector('img')),
      href: c.querySelector('a')?.getAttribute('href'),
      fullText: txt(c),
    })),
  };

  // TEXTIMAGE
  const ti = main.querySelector('.textimage');
  out.textimage = {
    theme: ti.querySelector('.ap-textimage')?.className,
    img: pickImg(ti.querySelector('img')),
    headingHTML: ti.querySelector('h2')?.innerHTML.replace(/\s+/g,' ').trim(),
    text: txt(ti.querySelector('p')),
    cta: (a=>a?{t:txt(a),h:a.getAttribute('href')}:null)(ti.querySelector('a[href]')),
  };

  // FOOTER
  const footer = document.querySelector('footer');
  out.footer = {
    columns: [...footer.querySelectorAll('nav, ul')].map(n=>({label: n.getAttribute('aria-label'), links: [...n.querySelectorAll('a')].map(a=>({t:txt(a), h:a.getAttribute('href')}))})),
    headings: [...footer.querySelectorAll('h3, h4, [class*="title"]')].map(h=>txt(h)),
    text: txt(footer).slice(0,600),
    imgs: [...footer.querySelectorAll('img')].map(i=>({src:i.getAttribute('src')||i.dataset.src, alt:i.getAttribute('alt')})),
  };
  return out;
});
writeFileSync('stardust-work/current/content-manifest.json', JSON.stringify(manifest, null, 1));
console.log('manifest written. carousels:', manifest.carousels.map(c=>c.slideCount), 'products:', manifest.productlist.cardCount, 'lookbook:', manifest.lookbook.length);
await browser.close();
