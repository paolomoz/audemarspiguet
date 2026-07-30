// Measure live display-heading italic line metrics on the PDP (archetype C).
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await (await b.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'en-GB',
})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/watch-collection/royal-oak-offshore/26420SO.OO.A600CA.01', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
const d = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('h1.heading-1, h2.heading-1, h2.title-1').forEach((h) => {
    const i = h.querySelector('i');
    const hr = h.getBoundingClientRect();
    const rec = {
      text: h.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
      h: Math.round(hr.height * 10) / 10,
      cs: (() => { const s = getComputedStyle(h); return `${s.fontSize}/${s.lineHeight}`; })(),
    };
    if (i) {
      const ir = i.getBoundingClientRect();
      const s = getComputedStyle(i);
      rec.i = {
        rect: { top: Math.round((ir.top - hr.top) * 10) / 10, h: Math.round(ir.height * 10) / 10 },
        font: `${s.fontWeight} ${s.fontStyle} ${s.fontSize}/${s.lineHeight} ${s.fontFamily.slice(0, 30)}`,
        display: s.display,
        letterSpacing: s.letterSpacing,
      };
    }
    out.push(rec);
  });
  return out;
});
console.log(JSON.stringify(d, null, 1));
await b.close();
