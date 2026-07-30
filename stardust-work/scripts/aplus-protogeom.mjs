import { chromium } from 'playwright';

const url = process.argv[2];
const width = parseInt(process.argv[3] || '1440', 10);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const data = await page.evaluate(() => {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width), left: Math.round(b.left) };
  };
  const out = { pageH: document.body.scrollHeight, sections: [] };
  document.querySelectorAll('main > .section').forEach((s) => {
    const sec = { rect: r(s), cls: s.className.slice(0, 60), items: [] };
    const h1 = s.querySelector('h1');
    if (h1) sec.h1 = r(h1);
    const p = s.querySelector('.default-content-wrapper p');
    if (p) sec.p = r(p);
    const h2 = s.querySelector('.acc-group-title');
    if (h2) sec.h2 = r(h2);
    s.querySelectorAll('.acc-item').forEach((it, i) => {
      if (i < 3) sec.items.push({ item: r(it), title: r(it.querySelector('.acc-title')), icon: r(it.querySelector('.acc-icon')) });
    });
    // form bits
    ['.fm-card', '.fm-fields', '.fm-label', '.fm-control', '.fm-submit', '.fm-ack', '.fm-field.fm-textarea textarea', '.fm-phone', '.fm-hours'].forEach((sel) => {
      const el = s.querySelector(sel);
      if (el) sec[sel] = r(el);
    });
    out.sections.push(sec);
  });
  const f = document.querySelector('footer');
  if (f) out.footer = r(f);
  return out;
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
