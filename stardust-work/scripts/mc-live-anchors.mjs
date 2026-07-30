// Live-side anchors for the masterclasses index (band comparison vs deployed).
// Usage: node mc-live-anchors.mjs <width>
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '360', 10);
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width, height: 900 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
await page.goto('https://www.audemarspiguet.com/ch/en/masterclasses', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
try { await page.click('#onetrust-accept-btn-handler', { timeout: 4000 }); } catch (e) { /* absent */ }
await page.evaluate(async () => {
  const s = Math.round(innerHeight * 0.6);
  for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 500)); }
  scrollTo(0, 0); await new Promise((r) => setTimeout(r, 600));
});
const data = await page.evaluate(() => {
  const probe = (sel) => [...document.querySelectorAll(sel)].slice(0, 6).map((el) => {
    const r = el.getBoundingClientRect();
    return { sel, top: Math.round(r.top + scrollY), h: Math.round(r.height) };
  });
  return {
    pageH: document.body.scrollHeight,
    anchors: [
      ...probe('[class*="masterclass-search"]'),
      ...probe('[class*="masterclassSearch"]'),
      ...probe('.ap-text-image, [class*="textimage"], [class*="textImage"]'),
      ...probe('.ap-chip, [class*="chip"]'),
      ...probe('h2'),
      ...probe('.masterclasscarousel'),
      ...probe('.masterclasscarousel h2'),
      ...probe('.masterclasscarousel .swiper-slide'),
      ...probe('.text--center'),
      ...probe('.ap-newsletter'),
      ...probe('footer'),
    ],
  };
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
