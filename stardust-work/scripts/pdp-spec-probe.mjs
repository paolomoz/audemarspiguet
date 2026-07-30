// Live specs-internals probe at a width (archetype C).
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '360', 10);
const b = await chromium.launch();
const p = await (await b.newContext({
  viewport: { width, height: 900 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'en-GB',
})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/watch-collection/royal-oak-offshore/26420SO.OO.A600CA.01', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
await p.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.6); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 700)); }
  window.scrollTo(0, 0);
});
await p.waitForTimeout(1000);
const d = await p.evaluate(() => {
  const r = (el) => { const x = el.getBoundingClientRect(); return [Math.round(x.top + scrollY), Math.round(x.left), Math.round(x.width), Math.round(x.height)]; };
  const out = [];
  document.querySelectorAll('.ap-specifications__tab').forEach((tab, ti) => {
    if (ti > 0) return;
    tab.querySelectorAll('h3, p, ul, li, .ap-specifications__cell, .ap-specifications__text').forEach((el) => {
      out.push([el.tagName, (el.className || '').toString().slice(0, 44), r(el), el.textContent.replace(/\s+/g, ' ').trim().slice(0, 30)]);
    });
  });
  const ug = document.querySelector('.ap-specifications__user-guide');
  const mob = document.querySelector('.ap-specifications__mobile-img');
  return { out, ug: ug ? r(ug) : null, mob: mob ? r(mob) : null };
});
console.log(JSON.stringify(d, null, 1));
await b.close();
