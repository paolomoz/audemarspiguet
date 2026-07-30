// Compare proto accordion trigger heights (gate loop helper).
// Usage: node mc-acc-heights.mjs <url> <width>
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: parseInt(process.argv[3] || '360', 10), height: 900 } })).newPage();
await page.goto(process.argv[2], { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const rows = await page.evaluate(() => [...document.querySelectorAll('.acc-trigger')].map((el) => ({
  h: Math.round(el.getBoundingClientRect().height),
  t: el.textContent.trim().slice(0, 60),
})));
rows.forEach((r) => console.log(r.h, r.t));
await browser.close();
