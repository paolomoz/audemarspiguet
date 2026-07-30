// Quick DOM probe of the local PDP harness. Usage: node pdp-proto-probe.mjs [width] [selector...]
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '1440', 10);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message.slice(0, 200)}`));
await page.goto('http://localhost:3007/drafts/pdp-26420so', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.7); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 350)); }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);
const data = await page.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; };
  const sections = [...document.querySelectorAll('main > .section')].map((s) => ({
    cls: s.className, rect: r(s), status: s.dataset.sectionStatus,
    kids: [...s.children].map((k) => `${k.className.toString().slice(0, 40)} h=${Math.round(k.getBoundingClientRect().height)}`),
  }));
  const feat = document.querySelector('.product-highlights .ph-feature');
  const featCS = feat ? getComputedStyle(feat).display : null;
  const strap = document.querySelector('.strap-selector .ss-wrapper');
  return {
    bodyH: document.body.scrollHeight,
    sections,
    featDisplay: featCS,
    strapH: strap ? r(strap) : null,
    metaLeak: [...document.querySelectorAll('main .section-metadata')].length,
  };
});
console.log(JSON.stringify(data, null, 1));
console.log('console errors:', JSON.stringify(errors.slice(0, 10), null, 1));
await browser.close();
