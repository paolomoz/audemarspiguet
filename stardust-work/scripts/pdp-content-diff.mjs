// Structural content diff: live PDP vs local harness (archetype C gate).
// Compares heading set, CTA labels/hrefs, visible image count, key texts.
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();

async function snap(url, live) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, locale: 'en-GB' })).newPage();
  await p.goto(url, { waitUntil: live ? 'domcontentloaded' : 'networkidle', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(3500);
  await p.evaluate(async (dwell) => {
    document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove());
    const step = Math.round(window.innerHeight * 0.6); let y = 0;
    while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, dwell)); }
    window.scrollTo(0, 0);
  }, live ? 900 : 350);
  await p.waitForTimeout(1000);
  const d = await p.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const txt = (el) => el.textContent.replace(/\s+/g, ' ').trim();
    const main = document.querySelector('main') || document.body;
    return {
      headings: [...main.querySelectorAll('h1,h2,h3,h4')].filter(vis).map((h) => `${h.tagName}:${txt(h)}`).filter((t) => t.length > 3),
      ctas: [...main.querySelectorAll('a')].filter(vis).filter((a) => txt(a)).map((a) => `${txt(a).slice(0, 50)} -> ${(a.getAttribute('href') || '').slice(0, 90)}`),
      imgs: [...main.querySelectorAll('img')].filter(vis).length,
      texts: [...main.querySelectorAll('p')].filter(vis).map(txt).filter((t) => t.length > 30).map((t) => t.slice(0, 70)),
      priceText: (document.querySelector('.ap-productinfo__price, .pi-price') || {}).textContent?.trim(),
    };
  });
  await p.close();
  return d;
}

const live = await snap('https://www.audemarspiguet.com/ch/en/watch-collection/royal-oak-offshore/26420SO.OO.A600CA.01', true);
const proto = await snap('http://localhost:3007/drafts/pdp-26420so', false);
await b.close();

function diff(name, a, bl) {
  const A = new Set(a); const B = new Set(bl);
  const missing = [...A].filter((x) => !B.has(x));
  const extra = [...B].filter((x) => !A.has(x));
  console.log(`== ${name}: live ${a.length} / proto ${bl.length}`);
  missing.forEach((m) => console.log('  MISSING:', m));
  extra.forEach((m) => console.log('  EXTRA  :', m));
}
diff('headings', live.headings, proto.headings);
diff('texts', live.texts, proto.texts);
console.log('== imgs: live', live.imgs, 'proto', proto.imgs);
console.log('== price: live', JSON.stringify(live.priceText), 'proto', JSON.stringify(proto.priceText));
console.log('== ctas live', live.ctas.length, 'proto', proto.ctas.length);
const protoSet = new Set(proto.ctas.map((c) => c.split(' -> ')[0]));
live.ctas.forEach((c) => { if (!protoSet.has(c.split(' -> ')[0])) console.log('  CTA missing:', c); });
