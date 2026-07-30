import { chromium } from 'playwright';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2, userAgent:UA, locale:'en-GB' })).newPage();
await page.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(2500);
try { const b=page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({timeout:4000})) await b.click(); } catch {}
// scroll to grid and dwell
await page.evaluate(async () => {
  const el = document.querySelector('.productlist, .ap-productlist');
  el?.scrollIntoView({block:'start'});
  await new Promise(r=>setTimeout(r,3000));
  window.scrollBy(0, 600); await new Promise(r=>setTimeout(r,2000));
  window.scrollBy(0, 600); await new Promise(r=>setTimeout(r,2000));
});
const info = await page.evaluate(() => {
  const q = s => [...document.querySelectorAll(s)];
  const gridItems = q('.ap-product-grid__item, [class*="product-grid"] [class*="item"], [class*="product-card"]');
  const grid = document.querySelector('[class*="product-grid"]');
  const stories = q('.carousel')[1];
  const storyImgs = stories ? [...stories.querySelectorAll('img')].map(i=>({src:i.currentSrc?.slice(0,80), loaded:i.complete&&i.naturalWidth>0, cls:i.className.slice(0,60)})) : [];
  const reveal = q('.js-reveal-effect-img, .js-reveal-effect-left').slice(0,8).map(e=>{const cs=getComputedStyle(e);return {cls:e.className.slice(0,60), op:cs.opacity, vis:cs.visibility, clip:cs.clipPath.slice(0,40)}});
  return {
    gridHTML: grid ? grid.outerHTML.slice(0,400) : 'NO GRID NODE',
    gridItemCount: gridItems.length,
    gridSampleCls: gridItems.slice(0,3).map(e=>e.className.slice(0,80)),
    storyImgCount: storyImgs.length, storyImgs: storyImgs.slice(0,4),
    revealSample: reveal,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
