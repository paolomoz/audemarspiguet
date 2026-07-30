import { chromium } from 'playwright';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2, userAgent:UA, locale:'en-GB' })).newPage();
await page.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(2500);
try { const b=page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({timeout:4000})) await b.click(); } catch {}
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.6);
  let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise(r=>setTimeout(r,900)); }
  await new Promise(r=>setTimeout(r,2000));
});
const report = async (label) => {
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.ap-product-card')];
    const imgs = [...document.querySelectorAll('.ap-product-card img')];
    const ok = imgs.filter(i=>i.complete&&i.naturalWidth>0).length;
    const lazyPending = imgs.filter(i=>!i.currentSrc).length;
    const cs = cards[0] ? getComputedStyle(cards[0]) : null;
    const rect = cards[0]?.getBoundingClientRect();
    return { cards: cards.length, imgs: imgs.length, decoded: ok, noSrc: lazyPending,
      firstCard: cs ? {display:cs.display, opacity:cs.opacity, visibility:cs.visibility, h:rect.height} : null,
      pageH: document.body.scrollHeight, scrollY: window.scrollY };
  });
  console.log(label, JSON.stringify(r));
};
await report('at-bottom:');
await page.evaluate(() => window.scrollTo(0,0));
await page.waitForTimeout(1500);
await report('back-at-top:');
// viewport shot mid-grid
await page.evaluate(() => { document.querySelector('.ap-product-grid, [class*="product-grid"]')?.scrollIntoView({block:'start'}); });
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/grid-viewport.png' });
await report('mid-grid:');
await browser.close();
