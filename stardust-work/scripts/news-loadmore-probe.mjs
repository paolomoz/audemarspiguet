/* news-loadmore-probe: click Load more until exhausted; log network + harvest all cards */
/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-console */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LS = resolve(HERE, 'diff/live-session.mjs');
const { REAL_CHROME_UA, newLiveContext, gotoLive, dismissOverlays } = await import(pathToFileURL(LS).href);

const out = process.argv[2] || '/tmp/news-articles.json';
const browser = await chromium.launch();
const ctx = await newLiveContext(browser, { ua: REAL_CHROME_UA, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const reqs = [];
page.on('request', (r) => {
  const u = r.url();
  if (!/dynamicmedia|google|onetrust|cookielaw|gtm|analytics|facebook|doubleclick|\.(png|jpg|webp|avif|woff2?|css|svg|gif)(\?|$)/i.test(u)) reqs.push(u);
});
await gotoLive(page, 'https://www.audemarspiguet.com/ch/en/news', { waitUntil: 'domcontentloaded', timeoutMs: 60000, settleMs: 0 });
await page.waitForTimeout(3000);
await dismissOverlays(page, { lateWindowMs: 6000 });

const count = () => page.evaluate(() => document.querySelectorAll('.ap-newslist__item').length);
let n = await count();
console.log('initial cards', n);
const mark = reqs.length;
for (let i = 0; i < 30; i += 1) {
  const btn = await page.$('.ap-newslist__load-more-button');
  if (!btn) { console.log('no load-more button'); break; }
  const visible = await btn.isVisible();
  if (!visible) { console.log('button hidden'); break; }
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(2500);
  const n2 = await count();
  console.log(`click ${i + 1}: cards ${n} -> ${n2}`);
  if (n2 === n) { console.log('exhausted (no growth)'); break; }
  n = n2;
}
console.log('NETWORK after clicks:');
reqs.slice(mark).forEach((u) => console.log(' ', u));

// harvest all cards (main + list)
const data = await page.evaluate(() => {
  const harvest = (a, kind) => {
    const img = a.querySelector('img');
    const pic = a.querySelector('picture');
    const sources = pic ? [...pic.querySelectorAll('source')].map((s) => ({ media: s.media, srcset: s.getAttribute('srcset') || s.dataset.srcset })) : [];
    return {
      kind,
      path: a.getAttribute('href'),
      title: a.querySelector('.ap-article-card__title')?.textContent.trim(),
      description: a.querySelector('.ap-article-card__desc p')?.textContent.trim(),
      category: a.querySelector('.ap-chip')?.textContent.trim(),
      cta: a.querySelector('.ap-link')?.textContent.trim(),
      image: img?.currentSrc || img?.src || img?.dataset.src,
      alt: img?.alt,
      sources,
    };
  };
  const main = document.querySelector('.ap-news-main-article a.ap-article-card');
  const list = [...document.querySelectorAll('.ap-newslist__item a.ap-article-card')];
  return {
    h1: document.querySelector('main h1')?.textContent.trim(),
    tabs: [...document.querySelectorAll('.ap-filter-bar__list .ap-tab-item')].map((t) => ({
      label: t.querySelector('a')?.textContent.trim(),
      href: t.querySelector('a')?.getAttribute('href'),
      filterId: t.dataset.filterId || '',
      active: t.className.includes('--active'),
    })),
    loadMoreLabel: document.querySelector('.ap-newslist__load-more-button')?.textContent.replace(/\s+/g, ' ').trim(),
    main: main ? harvest(main, 'main') : null,
    articles: list.map((a) => harvest(a, 'basic')),
  };
});
writeFileSync(out, JSON.stringify(data, null, 2));
console.log('cards harvested:', data.articles.length, '→', out);
await browser.close();
