/* news-behavior-probe: filtered view, load-more append animation, card reveal, tab hover, meta */
/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-console */
import { chromium } from 'playwright';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LS = resolve(HERE, 'diff/live-session.mjs');
const { REAL_CHROME_UA, newLiveContext, gotoLive, dismissOverlays } = await import(pathToFileURL(LS).href);

const browser = await chromium.launch();
const ctx = await newLiveContext(browser, { ua: REAL_CHROME_UA, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// --- 1. filtered view ---
await gotoLive(page, 'https://www.audemarspiguet.com/ch/en/news?filter=art', { waitUntil: 'domcontentloaded', timeoutMs: 60000, settleMs: 0 });
await page.waitForTimeout(3500);
await dismissOverlays(page, { lateWindowMs: 5000 });
const filtered = await page.evaluate(() => ({
  hasMainArticle: !!document.querySelector('.ap-news-main-article'),
  mainTitle: document.querySelector('.ap-news-main-article .ap-article-card__title')?.textContent.trim(),
  listCount: document.querySelectorAll('.ap-newslist__item').length,
  activeTab: document.querySelector('.ap-tab-item--active a')?.textContent.trim(),
  loadMore: !!document.querySelector('.ap-newslist__load-more-button'),
  h1: document.querySelector('main h1')?.textContent.replace(/\s+/g, ' ').trim(),
  filteredTitle: document.querySelector('.ap-filter-bar__filtered-title')?.textContent.trim(),
}));
console.log('FILTERED(art):', JSON.stringify(filtered, null, 1));

// --- 2. unfiltered page: meta, hover, load-more append behavior ---
await gotoLive(page, 'https://www.audemarspiguet.com/ch/en/news', { waitUntil: 'domcontentloaded', timeoutMs: 60000, settleMs: 0 });
await page.waitForTimeout(3500);
await dismissOverlays(page, { lateWindowMs: 5000 });
const meta = await page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
}));
console.log('META:', JSON.stringify(meta, null, 1));

// tab hover
const tab = await page.$('.ap-tab-item:not(.ap-tab-item--active) a');
const before = await tab.evaluate((el) => { const cs = getComputedStyle(el); return { color: cs.color, borderBottom: cs.borderBottom, transition: cs.transition }; });
await tab.hover();
await page.waitForTimeout(500);
const after = await tab.evaluate((el) => { const cs = getComputedStyle(el); return { color: cs.color, borderBottom: cs.borderBottom }; });
console.log('TAB hover:', JSON.stringify({ before, after }));

// chip + card link hover (View story underline?)
const card = await page.$('.ap-newslist__item a.ap-article-card');
const linkBefore = await card.evaluate((el) => {
  const l = el.querySelector('.ap-link');
  const cs = getComputedStyle(l, '::before');
  return { w: cs.width, transition: cs.transition };
});
await card.hover();
await page.waitForTimeout(500);
const linkAfter = await card.evaluate((el) => {
  const l = el.querySelector('.ap-link');
  const cs = getComputedStyle(l, '::before');
  const img = el.querySelector('img');
  const ics = getComputedStyle(img);
  return { w: cs.width, imgTransform: ics.transform, imgTransition: ics.transition };
});
console.log('CARD hover:', JSON.stringify({ linkBefore, linkAfter }));

// --- 3. reveal motion on a below-fold row: scroll to row 2 and sample ---
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const revealSamples = await page.evaluate(async () => {
  const li = document.querySelectorAll('.ap-newslist__item')[3]; // row 2 first card
  const img = li.querySelector('.ap-article-card__image');
  const title = li.querySelector('.ap-article-card__title');
  const desc = li.querySelector('.ap-article-card__desc');
  const cta = li.querySelector('.ap-link');
  const chip = li.querySelector('.ap-chip');
  const pre = [img, title, desc, cta, chip].map((el) => {
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform, transition: cs.transition };
  });
  li.scrollIntoView({ block: 'center' });
  const t0 = performance.now();
  const samples = [];
  await new Promise((done) => {
    const iv = setInterval(() => {
      const t = Math.round(performance.now() - t0);
      samples.push({
        t,
        img: { o: getComputedStyle(img).opacity, tr: getComputedStyle(img).transform },
        title: { o: getComputedStyle(title).opacity, tr: getComputedStyle(title).transform },
        desc: { o: getComputedStyle(desc).opacity, tr: getComputedStyle(desc).transform },
        cta: { o: getComputedStyle(cta).opacity, tr: getComputedStyle(cta).transform },
      });
      if (t > 3200) { clearInterval(iv); done(); }
    }, 160);
  });
  // title line split?
  const lines = title.querySelectorAll('div, span').length;
  return { pre, samples: samples.filter((s, i) => i % 2 === 0), titleChildren: title.innerHTML.slice(0, 300), lines };
});
console.log('REVEAL:', JSON.stringify(revealSamples, null, 1));

// --- 4. load-more append: scroll to button, click, sample new card + scroll pos ---
const appendInfo = await page.evaluate(async () => {
  const btn = document.querySelector('.ap-newslist__load-more-button');
  btn.scrollIntoView({ block: 'center' });
  await new Promise((r) => { setTimeout(r, 800); });
  const yBefore = window.scrollY;
  const nBefore = document.querySelectorAll('.ap-newslist__item').length;
  btn.click();
  const t0 = performance.now();
  const samples = [];
  await new Promise((done) => {
    const iv = setInterval(() => {
      const items = document.querySelectorAll('.ap-newslist__item');
      const newCard = items[nBefore];
      let s = null;
      if (newCard) {
        const a = newCard.querySelector('.ap-article-card');
        const cs = getComputedStyle(a);
        const imgcs = getComputedStyle(newCard.querySelector('.ap-article-card__image') || a);
        s = { o: cs.opacity, tr: cs.transform, imgO: imgcs.opacity, imgTr: imgcs.transform };
      }
      samples.push({ t: Math.round(performance.now() - t0), n: items.length, scrollY: window.scrollY, card: s });
      if (performance.now() - t0 > 3500) { clearInterval(iv); done(); }
    }, 200);
  });
  return { yBefore, nBefore, samples };
});
console.log('APPEND:', JSON.stringify(appendInfo, null, 1));

await browser.close();
