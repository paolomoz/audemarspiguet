/* news-probe: dump hydrated DOM + structure of /ch/en/news */
/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-console */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LS = resolve(HERE, 'diff/live-session.mjs');
const { REAL_CHROME_UA, newLiveContext, gotoLive, dismissOverlays } = await import(pathToFileURL(LS).href);

const width = Number(process.argv[2] || 1440);
const out = process.argv[3] || `/tmp/news-hydrated-${width}.html`;
const browser = await chromium.launch();
const ctx = await newLiveContext(browser, { ua: REAL_CHROME_UA, viewport: { width, height: 900 } });
const page = await ctx.newPage();
await gotoLive(page, 'https://www.audemarspiguet.com/ch/en/news', { waitUntil: 'domcontentloaded', timeoutMs: 60000, settleMs: 0 });
await page.waitForTimeout(3000);
await dismissOverlays(page, { lateWindowMs: 6000 });
// dwell scroll
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 300) {
    window.scrollTo(0, y);
    await new Promise((r) => { setTimeout(r, 220); });
  }
});
await page.waitForTimeout(3000);
const html = await page.content();
writeFileSync(out, html);
console.log('height', await page.evaluate(() => document.body.scrollHeight));
// structural summary
const summary = await page.evaluate(() => {
  const rows = [];
  document.querySelectorAll('main [class*="ap-"], main section').forEach((el) => {
    if (rows.length > 400) return;
    const r = el.getBoundingClientRect();
    rows.push({ tag: el.tagName, cls: el.className && el.className.toString().slice(0, 140), y: Math.round(r.top + window.scrollY), h: Math.round(r.height) });
  });
  return rows;
});
console.log(JSON.stringify(summary.slice(0, 150), null, 1));
await browser.close();
