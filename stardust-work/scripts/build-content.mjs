// Build EDS content documents (DA body fragments) from the captured manifests.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { chromium } from 'playwright';
import { resolve } from 'path';

const m1 = JSON.parse(readFileSync('stardust-work/current/content-manifest.json','utf8'));
const m2 = JSON.parse(readFileSync('stardust-work/current/content-manifest-2.json','utf8'));
const abs = s => (s && s.startsWith('/')) ? 'https://www.audemarspiguet.com' + s : s;
const esc = s => abs((s ?? '')).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// re-extract slide data (same as build-prototype)
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await page.goto('file://' + resolve('stardust-work/current/pages/ch-en-collections-code-11-59-collection-hydrated.html'));
const extra = await page.evaluate(() => {
  const txt = el => el ? el.textContent.replace(/\s+/g,' ').trim() : null;
  const main = document.querySelector('main');
  const cars = [...main.querySelectorAll('.carousel')];
  const slide = s => ({
    img: (i => i ? { src: i.getAttribute('src')||i.dataset.src, alt: i.getAttribute('alt')||'' } : null)(s.querySelector('aside img')),
    title: txt(s.querySelector('figcaption h4 p, figcaption h4')),
    desc: txt(s.querySelector('figcaption [class*="desc"] p')),
    cta: (a => a ? { t: txt(a), h: a.getAttribute('href') } : null)(s.querySelector('figcaption a.ap-link')),
  });
  const car2 = [...cars[2].querySelectorAll('.swiper-slide')].map(s => ({
    imgs: [...s.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src')||i.dataset.src, alt: i.getAttribute('alt')||'' })),
    link: s.querySelector('a')?.getAttribute('href'),
  }));
  const dtCells = [...main.querySelectorAll('.dualtext .cell')].map(c => ({
    paras: [...c.querySelectorAll('p')].map(p => txt(p)),
    link: (a => a ? { t: txt(a), h: a.getAttribute('href') } : null)(c.querySelector('a')),
  }));
  return { car0: [...cars[0].querySelectorAll('.swiper-slide')].map(slide),
           car1: [...cars[1].querySelectorAll('.swiper-slide')].map(slide), car2, dtCells };
});
await browser.close();

const img = (i) => i && i.src ? `<img src="${esc(i.src)}" alt="${esc(i.alt)}">` : '';
const carRow = (s) => `<div><div>${img(s.img)}</div><div><p>${esc(s.title)}</p>${s.desc?`<p>${esc(s.desc)}</p>`:''}<p><a href="${esc(s.cta?.h)}">${esc(s.cta?.t)}</a></p></div></div>`;

const lb = m2.lookbook;
const heroV = m1.hero;

const pageHTML = `<body>
<header></header>
<main>
<div>
  <div class="hero">
    <div><div><a href="${esc(heroV.video)}">${esc(heroV.video)}</a></div></div>
    <div><div><h1>MEET THE UNCONVENTIONAL<br><em>CODE 11.59 BY AUDEMARS PIGUET</em></h1></div></div>
    <div><div><p>${esc(heroV.paragraph)}</p></div></div>
    <div><div><p><a href="${esc(heroV.cta.h)}">${esc(heroV.cta.t)}</a></p></div></div>
  </div>
</div>
<div>
  <div class="columns editorial">
    <div>
      <div><p>${esc(extra.dtCells[0]?.paras[0] || '')}</p></div>
      <div>${(extra.dtCells[1]?.paras||[]).map(p=>`<p>${esc(p)}</p>`).join('')}${extra.dtCells[1]?.link?`<p><a href="${esc(extra.dtCells[1].link.h)}">${esc(extra.dtCells[1].link.t)}</a></p>`:''}</div>
    </div>
  </div>
</div>
<div>
  <div class="lookbook">
    <div><div>${img(lb[1].img)}</div></div>
    <div><div>${img(lb[2].img)}</div></div>
    <div><div><a href="${esc('https://www.audemarspiguet.com' + lb[0].video)}">${esc('https://www.audemarspiguet.com' + lb[0].video)}</a></div></div>
    <div><div>${img(lb[3].img)}</div></div>
    <div><div>${img(lb[4].img)}</div></div>
  </div>
</div>
<div>
  <h2>OUR LATEST<br><em>RELEASES</em></h2>
  <p><a href="${esc(m1.carousels[0].browse?.h)}">${esc(m1.carousels[0].browse?.t)}</a></p>
  <div class="carousel releases">
${extra.car0.map(carRow).join('\n')}
  </div>
</div>
<div>
  <h2>The stories behind<br><em>OUR COLLECTION</em></h2>
  <div class="carousel stories">
${extra.car1.map(carRow).join('\n')}
  </div>
</div>
<div>
  <div class="product-listing">
    <div><div>Search for watches</div></div>
    <div><div>CODE 11.59 BY AUDEMARS PIGUET</div></div>
    <div><div><a href="https://main--audemarspiguet--paolomoz.aem.live/data/products-core-collection.json">https://main--audemarspiguet--paolomoz.aem.live/data/products-core-collection.json</a></div></div>
  </div>
</div>
<div>
  <h2>our other<br><em>COLLECTIONS</em></h2>
  <div class="carousel collections">
${extra.car2.map(s => `<div><div>${img(s.imgs[0])}${s.imgs[1]?img(s.imgs[1]):''}</div><div><p><a href="${esc(s.link)}">View collection</a></p></div></div>`).join('\n')}
  </div>
</div>
<div>
  <div class="text-image">
    <div><div><img src="${esc(m1.textimage.img?.src)}" alt="${esc(m1.textimage.img?.alt || 'Audemars Piguet boutique interior')}"></div></div>
    <div><div><h2>FIND A<br><em>BOUTIQUE</em></h2></div></div>
    <div><div><p>${esc(m1.textimage.text)}</p></div></div>
    <div><div><p><a href="${esc(m1.textimage.cta?.h)}">${esc(m1.textimage.cta?.t)}</a></p></div></div>
  </div>
</div>
<div>
  <div class="metadata">
    <div><div>title</div><div>${esc(m1.meta.title)}</div></div>
    <div><div>description</div><div>${esc(m1.meta.description)}</div></div>
  </div>
</div>
</main>
<footer></footer>
</body>
`;

mkdirSync('content/ch/en/collections', { recursive: true });
writeFileSync('content/ch/en/collections/code-11-59-collection.html', pageHTML);

// nav
const navHTML = `<body>
<header></header>
<main>
<div>
  <p><a href="https://150years.audemarspiguet.com/en"><img src="https://dynamicmedia.audemarspiguet.com/is/content/audemarspiguet/AUDEMARS_PIGUET_150_YEARS_LOGOTYPE_BLACK_RGB_RS?size=1920,0&amp;wid=1920&amp;fmt=avif-alpha&amp;dpr=off" alt="150th Anniversary Website"></a></p>
  <p><a href="https://www.audemarspiguet.com/ch/en/home"><img src="https://www.audemarspiguet.com/etc.clientlibs/ap-com/ui/clientlibs/publish/resources/static/audemars-piguet-logo-white.svg" alt="Audemars Piguet"></a></p>
</div>
<div>
  <ul>
    <li>Watches</li>
    <li>Our World</li>
    <li><a href="https://www.audemarspiguet.com/ch/en/news">Stories</a></li>
    <li>Services</li>
  </ul>
</div>
<div>
  <p><a href="https://www.audemarspiguet.com/ch/en/watch-collection">Search</a></p>
  <p><a href="https://www.audemarspiguet.com/ch/en/stores">Find a boutique</a></p>
  <p><a href="https://www.audemarspiguet.com/ch/en/secure/account">Account</a></p>
</div>
</main>
<footer></footer>
</body>
`;
writeFileSync('content/nav.html', navHTML);

// footer
const fNav = m2.footer.navs.filter(n => /ap-link-list__list/.test(n.cls));
const heads = ['WATCHES','OUR WORLD','SERVICES','COMPANY'];
const legal = (m2.footer.navs.find(n => n.aria === 'Legality')?.links || []).filter(l => l.t);
const socials = ['Instagram','Facebook','YouTube','TikTok','LinkedIn','Pinterest','Weibo','WeChat','Line','X'];
const socialHrefs = {
  Instagram:'https://www.instagram.com/audemarspiguet/', Facebook:'https://www.facebook.com/audemarspiguet',
  YouTube:'https://www.youtube.com/user/audemarspiguet', TikTok:'https://www.tiktok.com/@audemarspiguet',
  LinkedIn:'https://www.linkedin.com/company/audemars-piguet', Pinterest:'https://www.pinterest.com/audemarspiguet/',
  Weibo:'https://weibo.com/audemarspiguet', WeChat:'https://www.audemarspiguet.com/ch/en/social/wechat',
  Line:'https://line.me/R/ti/p/@audemarspiguet', X:'https://x.com/audemarspiguet',
};
const footerHTML = `<body>
<header></header>
<main>
<div>
${m2.footer.imgs.slice(0,3).map(i=>`  <p><img src="${esc(i.src)}" alt="${esc(i.alt)}"></p>`).join('\n')}
</div>
<div>
  <p>Change language / currency</p>
</div>
<div>
${fNav.slice(0,4).map((n,i)=>`  <h3>${heads[i]}</h3>\n  <ul>${n.links.map(l=>`<li><a href="${esc(l.h)}">${esc(l.t)}</a></li>`).join('')}</ul>`).join('\n')}
</div>
<div>
  ${socials.map(s=>`<p><a href="${socialHrefs[s]}">${s}</a></p>`).join('\n  ')}
</div>
<div>
  ${legal.map(l=>`<p><a href="${esc(l.h)}">${esc(l.t)}</a></p>`).join('\n  ')}
  <p>沪ICP备13031168号-1</p>
</div>
<div>
  <p>© 2026 Audemars Piguet</p>
</div>
</main>
<footer></footer>
</body>
`;
writeFileSync('content/footer.html', footerHTML);
console.log('content written:', ['content/ch/en/collections/code-11-59-collection.html','content/nav.html','content/footer.html'].map(f=>`${f} (${(readFileSync(f).length/1024)|0}KB)`).join(', '));
