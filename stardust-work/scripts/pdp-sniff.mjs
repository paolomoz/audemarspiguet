// One-off XHR sniffer for PDP data feeds (strapselector / price) — archetype C.
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 1440, height: 900 }, locale: 'en-GB',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
})).newPage();
const hits = [];
page.on('response', async (r) => {
  const u = r.url();
  if (/strapselector|price|\.json/.test(u) && !/analytics|google|onetrust|cookielaw|adobedtm|demdex/.test(u)) {
    let size = 0; try { size = (await r.body()).length; } catch {}
    hits.push({ u: u.slice(0, 200), status: r.status(), size });
  }
});
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.7); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 500)); }
});
await page.waitForTimeout(3000);
console.log(JSON.stringify(hits, null, 1));
const strapH = await page.evaluate(() => {
  const el = document.querySelector('.strapselector, .ap-strap-selector-app');
  return el ? el.getBoundingClientRect().height : null;
});
console.log('strap module height:', strapH);
await browser.close();
