/* news-lift: computed styles + geometry for /ch/en/news key elements */
/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-console */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LS = resolve(HERE, 'diff/live-session.mjs');
const { REAL_CHROME_UA, newLiveContext, gotoLive, dismissOverlays } = await import(pathToFileURL(LS).href);

const width = Number(process.argv[2] || 1440);
const out = process.argv[3] || `/tmp/news-lift-${width}.json`;
const browser = await chromium.launch();
const ctx = await newLiveContext(browser, { ua: REAL_CHROME_UA, viewport: { width, height: 900 } });
const page = await ctx.newPage();
await gotoLive(page, 'https://www.audemarspiguet.com/ch/en/news', { waitUntil: 'domcontentloaded', timeoutMs: 60000, settleMs: 0 });
await page.waitForTimeout(3000);
await dismissOverlays(page, { lateWindowMs: 6000 });
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 300) {
    window.scrollTo(0, y);
    await new Promise((r) => { setTimeout(r, 220); });
  }
});
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);

const lift = await page.evaluate(() => {
  const PROPS = ['display', 'position', 'width', 'height', 'margin', 'padding', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'backgroundColor', 'border', 'borderRadius', 'borderBottom', 'borderTop', 'gap', 'columnGap', 'rowGap', 'gridTemplateColumns', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'textAlign', 'opacity', 'overflow', 'objectFit', 'aspectRatio', 'maxWidth', 'whiteSpace', 'textDecoration', 'verticalAlign', 'listStyle', 'boxSizing', 'top', 'left', 'zIndex', 'transform'];
  const probe = (sel, extra) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return { missing: String(sel) };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const o = { rect: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) } };
    PROPS.forEach((p) => { o[p] = cs[p]; });
    if (extra) extra.forEach((p) => { o[p] = cs[p]; });
    return o;
  };
  const res = { viewport: window.innerWidth, pageHeight: document.body.scrollHeight };
  res.main = probe('#maincontent');
  res.h1wrap = probe('main h1')?.missing ? null : probe(document.querySelector('main h1').parentElement);
  res.h1 = probe('main h1');
  const h1 = document.querySelector('main h1');
  res.h1HTML = h1 ? h1.outerHTML : null;
  res.h1i = probe('main h1 i');
  res.newslistSection = probe('.newslist');
  res.filterBar = probe('.ap-filter-bar');
  res.filterWrapper = probe('.ap-filter-bar__wrapper');
  res.filterList = probe('.ap-filter-bar__list');
  res.tabActive = probe('.ap-tab-item--active');
  res.tabActiveA = probe('.ap-tab-item--active a');
  res.tab2 = probe('.ap-tab-item:not(.ap-tab-item--active)');
  res.tab2A = probe('.ap-tab-item:not(.ap-tab-item--active) a');
  res.mainArticle = probe('.ap-news-main-article');
  res.mainArticleGrid = probe('.ap-news-main-article .grid-container');
  res.hugeCard = probe('.ap-article-card-huge');
  res.hugeImageWrap = probe('.ap-article-card-huge .ap-article-card__image');
  res.hugeImg = probe('.ap-article-card-huge img');
  res.hugeContent = probe('.ap-article-card-huge .ap-article-card__content');
  res.hugeContentLeft = probe('.ap-article-card-huge .ap-article-card__content-left');
  res.hugeContentRight = probe('.ap-article-card-huge .ap-article-card__content-right');
  res.hugeTitle = probe('.ap-article-card-huge .ap-article-card__title');
  res.hugeTag = probe('.ap-article-card-huge .ap-article-card__tag');
  res.hugeChip = probe('.ap-article-card-huge .ap-chip');
  res.hugeDesc = probe('.ap-article-card-huge .ap-article-card__desc');
  res.hugeDescP = probe('.ap-article-card-huge .ap-article-card__desc p');
  res.hugeLink = probe('.ap-article-card-huge .ap-link');
  res.newslist = probe('.ap-newslist');
  res.newslistGridC = probe('.ap-newslist .grid-container');
  res.list = probe('.ap-newslist__list');
  res.items = [...document.querySelectorAll('.ap-newslist__item')].slice(0, 6).map((li) => probe(li));
  res.basicCard = probe('.ap-article-card-basic');
  res.basicImageWrap = probe('.ap-article-card-basic .ap-article-card__image');
  res.basicImg = probe('.ap-article-card-basic img');
  const bimg = document.querySelector('.ap-article-card-basic img');
  res.basicImgSrc = bimg ? bimg.currentSrc : null;
  res.basicPictureHTML = document.querySelector('.ap-article-card-basic picture')?.outerHTML.slice(0, 2000);
  res.hugePictureHTML = document.querySelector('.ap-article-card-huge picture')?.outerHTML.slice(0, 2500);
  res.basicContent = probe('.ap-article-card-basic .ap-article-card__content');
  res.basicContentLeft = probe('.ap-article-card-basic .ap-article-card__content-left');
  res.basicContentRight = probe('.ap-article-card-basic .ap-article-card__content-right');
  res.basicTitle = probe('.ap-article-card-basic .ap-article-card__title');
  res.basicChip = probe('.ap-article-card-basic .ap-chip');
  res.basicDesc = probe('.ap-article-card-basic .ap-article-card__desc');
  res.basicDescP = probe('.ap-article-card-basic .ap-article-card__desc p');
  res.basicLink = probe('.ap-article-card-basic .ap-link');
  res.ctaContainer = probe('.ap-newslist__cta-container');
  res.loadMoreBtn = probe('.ap-newslist__load-more-button', ['cursor', 'textDecoration']);
  res.loadMoreHTML = document.querySelector('.ap-newslist__load-more-button')?.outerHTML;
  res.loadMoreSpan = probe('.ap-newslist__load-more-button span');
  res.parsys = probe('.parsys');
  res.newsletter = probe('.ap-newsletter');
  res.newsletterSection = probe('.newsletter');
  // first 8 item rects to derive grid pattern
  res.itemRects = [...document.querySelectorAll('.ap-newslist__item')].slice(0, 8).map((li) => {
    const r = li.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  });
  // chip inner details
  const chip = document.querySelector('.ap-article-card-basic .ap-chip');
  res.chipHTML = chip ? chip.outerHTML : null;
  return res;
});
writeFileSync(out, JSON.stringify(lift, null, 2));
console.log('lift →', out, 'pageHeight', lift.pageHeight);
await browser.close();
