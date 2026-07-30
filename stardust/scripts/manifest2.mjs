// Refined per-card extraction with DOM granularity notes.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
const src = 'file://' + resolve('stardust/current/pages/ch-en-collections-code-11-59-collection-hydrated.html');
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await page.goto(src);
const data = await page.evaluate(() => {
  const txt = el => el ? el.textContent.replace(/\s+/g,' ').trim() : null;
  const img = i => i ? { src: i.getAttribute('src')||i.dataset.src, alt: i.getAttribute('alt')||'',
    sources: [...(i.closest('picture')?.querySelectorAll('source')||[])].map(s=>({media:s.getAttribute('media'), srcset:s.getAttribute('srcset')||s.dataset.srcset||s.dataset.src})) } : null;
  const main = document.querySelector('main');
  const out = {};

  // carousel 0: latest releases — structure per slide
  const cars = [...main.querySelectorAll('.carousel')];
  out.car0 = [...cars[0].querySelectorAll('.swiper-slide')].map(s => ({
    html_cls: s.firstElementChild?.className.slice(0,80),
    img: img(s.querySelector('img')),
    texts: [...s.querySelectorAll('h3,h4,p,a,span')].map(n=>({tag:n.tagName, cls:(n.className||'').toString().slice(0,50), t:txt(n)?.slice(0,140), href:n.getAttribute?n.getAttribute('href'):null})).filter(x=>x.t),
  }));
  out.car1 = [...cars[1].querySelectorAll('.swiper-slide')].map(s => ({
    img: img(s.querySelector('img')),
    texts: [...s.querySelectorAll('h3,h4,p,a,span,div')].map(n=>({tag:n.tagName, cls:(n.className||'').toString().slice(0,60), t:txt(n)?.slice(0,140), href:n.tagName==='A'?n.getAttribute('href'):null})).filter(x=>x.t).slice(0,10),
  }));
  out.car2 = [...cars[2].querySelectorAll('.swiper-slide')].map(s => ({
    img: img(s.querySelector('img')),
    texts: [...s.querySelectorAll('h3,h4,p,a,span,div')].map(n=>({tag:n.tagName, cls:(n.className||'').toString().slice(0,60), t:txt(n)?.slice(0,140), href:n.tagName==='A'?n.getAttribute('href'):null})).filter(x=>x.t).slice(0,10),
  }));

  // lookbook full
  out.lookbook = [...main.querySelectorAll('.ap-lookbook-element__wrapper')].map(w => ({
    parentCls: w.parentElement.className,
    selfCls: w.className,
    inner: w.innerHTML.replace(/\s+/g,' ').slice(0,300),
    img: img(w.querySelector('img')),
    video: w.querySelector('video source')?.getAttribute('src') || w.querySelector('video')?.getAttribute('src'),
  }));

  // product card 0 full structure
  const c0 = main.querySelector('.ap-product-card');
  out.productCardHTML = c0.outerHTML.replace(/\s+/g,' ').slice(0,2500);

  // product cards: text pieces
  out.productCards = [...main.querySelectorAll('.ap-product-card')].map(c => ({
    href: c.querySelector('a')?.getAttribute('href'),
    img: img(c.querySelector('img')),
    nodes: [...c.querySelectorAll('span,h3,h2,p,div')].map(n=>({tag:n.tagName,cls:(n.className||'').toString().slice(0,60),t:txt(n)?.slice(0,110)})).filter(x=>x.t && x.t.length<111).slice(0,10),
  }));

  // productlist chrome: search, filters, headings + hidden markup within main
  const pl = main.querySelector('.productlist');
  out.plChrome = {
    searchHTML: pl.querySelector('.ap-input-search')?.outerHTML.replace(/\s+/g,' ').slice(0,1200),
    toolbar: [...pl.querySelectorAll('button')].map(b=>({t:txt(b), cls:(b.className||'').slice(0,60)})).slice(0,12),
    headings: [...pl.querySelectorAll('h2,h3')].map(h=>({tag:h.tagName, cls:(h.className||'').slice(0,60), t:txt(h)})),
  };

  // hero CTA full + dualtext second cell + trailing link module
  out.heroCta = main.querySelector('.hero a')?.outerHTML.replace(/\s+/g,' ').slice(0,800);
  out.dualtextCell2 = [...main.querySelectorAll('.dualtext .cell')].map(c=>({cls:c.className, html:c.innerHTML.replace(/\s+/g,' ').slice(0,600)}));
  const links = [...main.querySelectorAll('.link .ap-link-component a')];
  out.linkModules = links.map(a=>({href:a.getAttribute('href'), t:txt(a), html:a.outerHTML.replace(/\s+/g,' ').slice(0,600)}));

  // footer complete
  const footer = document.querySelector('footer');
  out.footerHTML_len = footer.innerHTML.length;
  out.footer = {
    sections: [...footer.querySelectorAll(':scope > div, :scope > section')].map(d=>({cls:(d.className||'').slice(0,60)})),
    headings: [...footer.querySelectorAll('h2,h3,h4')].map(h=>({tag:h.tagName,t:txt(h)})),
    navs: [...footer.querySelectorAll('nav,ul')].map(n=>({aria:n.getAttribute('aria-label'), cls:(n.className||'').toString().slice(0,50), links:[...n.querySelectorAll('a')].map(a=>({t:txt(a)||a.getAttribute('aria-label'), h:a.getAttribute('href')}))})).filter(n=>n.links.length),
    imgs: [...footer.querySelectorAll('img')].map(i=>({src:i.getAttribute('src')||i.dataset.src, alt:i.getAttribute('alt')})),
    smallprint: [...footer.querySelectorAll('p,small,[class*="legal"] span')].map(n=>txt(n)).filter(Boolean).slice(0,8),
  };

  // header resting bar
  const header = document.querySelector('header');
  out.headerBar = {
    navLabels: [...header.querySelectorAll(':scope nav > ul > li > a, :scope nav > ul > li > button')].map(n=>({t:txt(n), href:n.getAttribute?.('href')})),
    allTopButtons: [...header.querySelectorAll('button')].slice(0,15).map(b=>({t:txt(b)||b.getAttribute('aria-label'), cls:(b.className||'').slice(0,40)})),
    logos: [...header.querySelectorAll('img,svg')].slice(0,8).map(n=>({tag:n.tagName, src:n.getAttribute?.('src'), cls:(n.getAttribute?.('class')||'').slice(0,40), aria:n.getAttribute?.('aria-label')})),
    links: [...header.querySelectorAll('a')].slice(0,25).map(a=>({t:txt(a)||a.getAttribute('aria-label'), h:a.getAttribute('href')})),
  };
  return out;
});
writeFileSync('stardust/current/content-manifest-2.json', JSON.stringify(data, null, 1));
console.log('manifest2 written', Object.keys(data));
await browser.close();
