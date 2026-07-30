// Build the replica prototype HTML from captured content.
// Content verbatim from the hydrated DOM capture; markup authored clean.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const abs = s => (s && s.startsWith('/')) ? 'https://www.audemarspiguet.com' + s : s;
const esc = s => abs((s ?? '')).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const m1 = JSON.parse(readFileSync('stardust-work/current/content-manifest.json','utf8'));
const m2 = JSON.parse(readFileSync('stardust-work/current/content-manifest-2.json','utf8'));

// residual details from hydrated DOM: car2 wordmarks + collection names, dualtext cell2
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await page.goto('file://' + resolve('stardust-work/current/pages/ch-en-collections-code-11-59-collection-hydrated.html'));
const extra = await page.evaluate(() => {
  const txt = el => el ? el.textContent.replace(/\s+/g,' ').trim() : null;
  const main = document.querySelector('main');
  const cars = [...main.querySelectorAll('.carousel')];
  const car2 = [...cars[2].querySelectorAll('.swiper-slide')].map(s => ({
    imgs: [...s.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src')||i.dataset.src, alt: i.getAttribute('alt')||'' })),
    link: s.querySelector('a')?.getAttribute('href'),
    linkText: txt(s.querySelector('a')),
  }));
  const dtCells = [...main.querySelectorAll('.dualtext .cell')].map(c => ({
    paras: [...c.querySelectorAll('p')].map(p => txt(p)),
    link: (a => a ? { t: txt(a), h: a.getAttribute('href') } : null)(c.querySelector('a')),
  }));
  // uniform slide extraction mirroring live structure:
  // figure > aside(a.img-link > picture) + figcaption(h4>p, .desc>p, a.ap-link)
  const slide = s => ({
    img: (i => i ? { src: i.getAttribute('src')||i.dataset.src, alt: i.getAttribute('alt')||'' } : null)(s.querySelector('aside img')),
    imgLink: s.querySelector('aside a')?.getAttribute('href'),
    imgAria: s.querySelector('aside a')?.getAttribute('aria-label') || '',
    title: txt(s.querySelector('figcaption h4 p, figcaption h4')),
    desc: txt(s.querySelector('figcaption [class*="desc"] p')),
    cta: (a => a ? { t: txt(a), h: a.getAttribute('href'), aria: a.getAttribute('aria-label')||'' } : null)(s.querySelector('figcaption a.ap-link')),
  });
  const car0 = [...cars[0].querySelectorAll('.swiper-slide')].map(slide);
  const car1s = [...cars[1].querySelectorAll('.swiper-slide')].map(slide);
  return { car2, dtCells, car1: car1s, car0 };
});
await browser.close();

const heroCta = m1.hero.cta;
const releases = extra.car0;
const stories = extra.car1;
const collections = extra.car2;
const products = m2.productCards;

const productCardHTML = p => {
  const nodes = p.nodes || [];
  const ref = (nodes.find(n => /reference/.test(n.cls)) || {}).t || '';
  // live title: <b>collection</b> + <span>product</span>; subtitle = size/material line
  const prodName = (nodes.find(n => n.tag === 'SPAN' && n.t && n.t !== ref) || {}).t || '';
  const sub = (nodes.find(n => /__details/.test(n.cls)) || {}).t ||
              (nodes.map(n=>n.t).find(t => /^\d+\s?mm/.test(t||''))) || '';
  const img = p.img || {};
  const srcs = (img.sources||[]).map(s => `<source media="${esc(s.media)}" srcset="${esc(s.srcset)}">`).join('');
  return `<li class="product-card"><a href="${esc(p.href)}">
  <figure><picture>${srcs}<img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy"></picture></figure>
  <p class="product-card__reference">${esc(ref)}</p>
  <h4><b>Code 11.59 by Audemars Piguet</b><span>${esc(prodName)}</span></h4>
  <p class="product-card__subtitle">${esc(sub)}</p>
</a></li>`;
};

const svg = {
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7.5"/><path d="M16 16l6 6"/></svg>',
  watch: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5"/><path d="M9 5.5V2h6v3.5M9 18.5V22h6v-3.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  account: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  filters: '<svg viewBox="0 0 24 24"><circle cx="8" cy="7" r="2.2"/><path d="M2 7h3.8M10.2 7H22"/><circle cx="16" cy="15" r="2.2"/><path d="M2 15h11.8M18.2 15H22"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z"/></svg>',
  pause: '<svg viewBox="0 0 18 18"><rect x="4" y="2" width="2.5" height="14"/><rect x="11" y="2" width="2.5" height="14"/></svg>',
  social: n => `<svg viewBox="0 0 18 18" aria-label="${n}"><rect x="1" y="1" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="1.2"/></svg>`,
};

const socialNames = ['Instagram','Facebook','YouTube','TikTok','LinkedIn','Pinterest','Weibo','WeChat','Line','X'];
const footNav = m2.footer.navs.filter(n => /ap-link-list__list/.test(n.cls));
const footHead = ['WATCHES','Our World','Services','Company'];
const legal = m2.footer.navs.find(n => n.aria === 'Legality')?.links.filter(l=>l.t) || [];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m1.meta.title)}</title>
<meta name="description" content="${esc(m1.meta.description)}">
<link rel="stylesheet" href="./code-11-59-collection-proposed.css">
</head>
<body class="theme-dark">
<header class="site-header">
  <div class="site-header__inner">
    <div class="site-header__left">
      <a href="https://150years.audemarspiguet.com/en"><img class="site-header__150" src="https://dynamicmedia.audemarspiguet.com/is/content/audemarspiguet/AUDEMARS_PIGUET_150_YEARS_LOGOTYPE_BLACK_RGB_RS?size=1920,0&wid=1920&fmt=avif-alpha&dpr=off" alt="150th Anniversary Website"></a>
      <span class="site-header__divider"></span>
      <nav class="site-header__nav" aria-label="Main">
        <button type="button">Watches</button>
        <button type="button">Our World</button>
        <a href="https://www.audemarspiguet.com/ch/en/news">Stories</a>
        <button type="button">Services</button>
      </nav>
    </div>
    <button type="button" class="site-header__burger" aria-label="Hamburger menu"><svg viewBox="0 0 24 24"><path d="M3 8h18M3 16h18"/></svg></button>
    <a href="https://www.audemarspiguet.com/ch/en/home" aria-label="Audemars Piguet">
      <img class="site-header__logo" src="https://www.audemarspiguet.com/etc.clientlibs/ap-com/ui/clientlibs/publish/resources/static/audemars-piguet-logo-white.svg" alt="Audemars Piguet">
      <img class="site-header__logo-mini" src="https://www.audemarspiguet.com/etc.clientlibs/ap-com/ui/clientlibs/publish/resources/static/audemars-piguet-logo-mini-white.svg" alt="Audemars Piguet">
    </a>
    <div class="site-header__right">
      <a href="https://www.audemarspiguet.com/ch/en/watch-collection" aria-label="Search">${svg.watch}</a>
      <a href="https://www.audemarspiguet.com/ch/en/stores" aria-label="Find a boutique">${svg.pin}</a>
      <a href="https://www.audemarspiguet.com/ch/en/secure/account" aria-label="Account">${svg.account}</a>
    </div>
  </div>
</header>
<main class="root">

<section class="hero">
  <div class="hero__bg">
    <video muted loop autoplay playsinline src="${esc(m1.hero.video)}"></video>
  </div>
  <div class="grid-container hero__content">
    <div class="hero__cell">
      <h1 class="heading-display" title="${esc(m1.hero.h1Attrs.title)}" aria-label="${esc(m1.hero.h1Attrs.aria)}">
        <span class="heading-line">MEET THE UNCONVENTIONAL</span>
        <br aria-hidden="true">
        <span class="heading-line"><i>CODE 11.59 BY AUDEMARS PIGUET</i></span>
      </h1>
      <p>${esc(m1.hero.paragraph)}</p>
      <a class="ap-link" href="${esc(heroCta.h)}">${esc(heroCta.t)}</a>
    </div>
  </div>
  <div class="hero__controls">
    <button type="button" aria-label="Pause video">${svg.pause}<span class="label">ap.commons.ui.comp.video.pause.text</span></button>
  </div>
</section>

<section class="dualtext">
  <div class="grid-container">
    <div class="grid-x">
      <div class="dualtext__cell1"><p>${esc(extra.dtCells[0]?.paras[0] || '')}</p></div>
      <div class="dualtext__cell2">${(extra.dtCells[1]?.paras||[]).map(p=>`<p>${esc(p)}</p>`).join('')}
        ${extra.dtCells[1]?.link ? `<a class="ap-link" href="${esc(extra.dtCells[1].link.h)}">${esc(extra.dtCells[1].link.t)}</a>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="lookbook">
  <div class="lookbook__collage">
    <div class="lb-el lb-el--left-tall"><img src="${esc(m2.lookbook[1].img?.src)}" alt="${esc(m2.lookbook[1].img?.alt)}" loading="lazy"></div>
    <div class="lb-el lb-el--left-short"><img src="${esc(m2.lookbook[2].img?.src)}" alt="${esc(m2.lookbook[2].img?.alt)}" loading="lazy"></div>
    <div class="lb-el lb-el--center"><video muted loop autoplay playsinline src="https://www.audemarspiguet.com${esc(m2.lookbook[0].video)}"></video></div>
    <div class="lb-el lb-el--right-short"><img src="${esc(m2.lookbook[3].img?.src)}" alt="${esc(m2.lookbook[3].img?.alt)}" loading="lazy"></div>
    <div class="lb-el lb-el--right-tall"><img src="${esc(m2.lookbook[4].img?.src)}" alt="${esc(m2.lookbook[4].img?.alt)}" loading="lazy"></div>
  </div>
</section>

<section class="carousel carousel--releases">
  <div class="carousel__aside" style="margin-left: var(--container-pad);">
    <h2 class="heading-display" style="margin-left:0" title="OUR LATEST RELEASES" aria-label="OUR LATEST RELEASES">
      <span class="heading-line">OUR LATEST</span><br aria-hidden="true"><span class="heading-line"><i>RELEASES</i></span>
    </h2>
    <a class="ap-link" href="${esc(m1.carousels[0].browse?.h)}">${esc(m1.carousels[0].browse?.t)}</a>
  </div>
  <ul class="carousel__track">
    ${releases.map(s => `<li class="slide">
      <figure>
        <aside><a class="img-link" tabindex="-1" aria-label="${esc(s.imgAria)}" href="${esc(s.imgLink)}"><img src="${esc(s.img?.src)}" alt="${esc(s.img?.alt)}" loading="lazy"></a></aside>
        <figcaption>
          <h4><p>${esc(s.title)}</p></h4>
          ${s.desc ? `<div class="desc"><p>${esc(s.desc)}</p></div>` : ''}
          <a class="ap-link" aria-label="${esc(s.cta?.aria)}" href="${esc(s.cta?.h)}">${esc(s.cta?.t)}</a>
        </figcaption>
      </figure>
    </li>`).join('\n')}
  </ul>
  <div class="carousel__dots"><span class="dot dot--active"></span>${'<span class="dot"></span>'.repeat(5)}</div>
</section>

<section class="carousel carousel--stories">
  <h2 class="heading-display" title="The stories behind our collection" aria-label="The stories behind our collection">
    <span class="heading-line">The stories behind</span><br aria-hidden="true"><span class="heading-line"><i>OUR COLLECTION</i></span>
  </h2>
  <ul class="carousel__track">
    ${stories.map(s => `<li class="slide">
      <figure>
        <aside><a class="img-link" tabindex="-1" aria-label="${esc(s.imgAria)}" href="${esc(s.imgLink)}"><img src="${esc(s.img?.src)}" alt="${esc(s.img?.alt)}" loading="lazy"></a></aside>
        <figcaption>
          <h4><p>${esc(s.title)}</p></h4>
          ${s.desc ? `<div class="desc"><p>${esc(s.desc)}</p></div>` : ''}
          <a class="ap-link" aria-label="${esc(s.cta?.aria)}" href="${esc(s.cta?.h)}">${esc(s.cta?.t)}</a>
        </figcaption>
      </figure>
    </li>`).join('\n')}
  </ul>
  <div class="carousel__dots"><span class="dot dot--active"></span>${'<span class="dot"></span>'.repeat(2)}</div>
</section>

<section class="productlist">
  <h2 class="sr-only">Search for watches</h2>
  <div class="grid-container productlist__search">
    <div class="productlist__search-row">
      <input class="placeholder" type="text" placeholder="Search for watches" aria-label="Search for watches">
      <span class="sr-only">search</span>
      <span class="sr-only">ap.com.ui.comp.searchbar.assistivetextinstruction</span>
      ${svg.search}
    </div>
  </div>
  <div class="product-toolbar">
    <div class="grid-container">
      <button type="button">${svg.filters}Filters</button>
      <button type="button" class="compare-btn"><span class="compare-label">Compare</span><svg class="compare-icon" viewBox="0 0 24 24"><path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4"/></svg></button>
    </div>
  </div>
  <div class="grid-container">
    <p class="productlist__group-heading">CODE 11.59 BY AUDEMARS PIGUET</p>
    <ul class="product-grid">
${products.map(productCardHTML).join('\n')}
    </ul>
    <p class="ap-product-grid__no-results" style="display:none">No results</p>
  </div>
</section>

<section class="carousel carousel--collections">
  <h2 class="heading-display" title="our other collections" aria-label="our other collections">
    <span class="heading-line">our other</span><br aria-hidden="true"><span class="heading-line"><i>COLLECTIONS</i></span>
  </h2>
  <ul class="carousel__track">
    ${collections.map(s => `<li class="slide">
      <figure>
        <aside><a class="img-link" tabindex="-1" aria-label="View collection " href="${esc(s.link)}">
          <img class="photo" src="${esc(s.imgs[0]?.src)}" alt="${esc(s.imgs[0]?.alt)}" loading="lazy">
          ${s.imgs[1] ? `<img class="wordmark" src="${esc(s.imgs[1].src)}" alt="${esc(s.imgs[1].alt)}" loading="lazy">` : ''}
        </a></aside>
        <figcaption><a class="ap-link" aria-label="View collection " href="${esc(s.link)}">View collection</a></figcaption>
      </figure>
    </li>`).join('\n')}
  </ul>
  <div class="carousel__dots"><span class="dot dot--active"></span>${'<span class="dot"></span>'.repeat(4)}</div>
</section>

<section class="textimage">
  <div class="grid-container">
    <div class="grid-x">
      <div class="textimage__img">
        <img src="${esc(m1.textimage.img?.src)}" alt="${esc(m1.textimage.img?.alt || '')}" loading="lazy">
      </div>
      <div class="textimage__content">
        <h2 class="heading-display" title="FIND A BOUTIQUE" aria-label="FIND A BOUTIQUE">
          <span class="heading-line">FIND A</span><br aria-hidden="true"><span class="heading-line"><i>BOUTIQUE</i></span>
        </h2>
        <p>${esc(m1.textimage.text)}</p>
        <a class="ap-link" href="${esc(m1.textimage.cta?.h)}">${esc(m1.textimage.cta?.t)}</a>
      </div>
    </div>
  </div>
</section>

</main>
<footer class="site-footer">
  <div class="grid-container">
    <div class="site-footer__brands">
      ${m2.footer.imgs.slice(0,3).map(i => `<img src="${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy">`).join('\n      ')}
    </div>
    <div class="site-footer__main">
      <div class="site-footer__lang">${svg.globe}<span>Change language / currency</span></div>
      <div class="site-footer__cols">
        ${footNav.slice(0,4).map((n,i) => `<div><h4>${esc(footHead[i])}</h4><ul>${n.links.map(l => `<li><a href="${esc(l.h)}">${esc(l.t)}</a></li>`).join('')}</ul></div>`).join('\n        ')}
      </div>
    </div>
    <div class="site-footer__socialrow">
      <div class="site-footer__social">
        ${socialNames.map(n => svg.social(n)).join('\n        ')}
      </div>
      <div class="site-footer__legal">
        ${legal.map(l => `<a href="${esc(l.h)}">${esc(l.t)}</a>`).join('\n        ')}
        <span>沪ICP备13031168号-1</span>
      </div>
    </div>
    <p class="site-footer__copy">© 2026 Audemars Piguet</p>
  </div>
</footer>
</body>
</html>
`;
writeFileSync('stardust-work/prototypes/code-11-59-collection-proposed.html', html);
console.log(`prototype written: ${(html.length/1024)|0}KB, ${products.length} product cards, ${releases.length} release slides, ${stories.length} stories, ${collections.length} collections`);
