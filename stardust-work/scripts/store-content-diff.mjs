// Content diff for archetype F: verbatim text + CTA hrefs + img srcs of the
// live page vs the local prototype (main content only), 1440.
// Also emits the content manifest artifact.
// Usage: node store-content-diff.mjs <manifest-out.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const outManifest = process.argv[2];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function extract(browser, url, live) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, locale: 'en-GB' })).newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(live ? 2500 : 1500);
  if (live) {
    try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch { /* absent */ }
  }
  await page.evaluate(async () => {
    document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove());
    const step = Math.round(window.innerHeight * 0.6); let y = 0;
    while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 600)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500));
  });
  const data = await page.evaluate(() => {
    const main = document.querySelector('main');
    const texts = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      texts.push(t);
    }
    const links = [...main.querySelectorAll('a[href]')]
      .filter((a) => a.getBoundingClientRect().height > 0)
      .map((a) => ({ text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.href.replace(/^http:\/\/localhost:\d+/, 'https://www.audemarspiguet.com') }));
    const imgs = [...main.querySelectorAll('img')]
      .filter((i) => i.getBoundingClientRect().height > 2)
      .map((i) => (i.currentSrc || i.src).split('?')[0]);
    return { texts, links, imgs };
  });
  await page.close();
  return data;
}

const browser = await chromium.launch({ headless: true });
const live = await extract(browser, 'https://www.audemarspiguet.com/ch/en/stores/ap-house-geneva', true);
const proto = await extract(browser, 'http://localhost:3003/drafts/ch/en/stores/ap-house-geneva', false);
await browser.close();

const norm = (arr) => arr.map((t) => t.toLowerCase());
const missing = live.texts.filter((t) => !norm(proto.texts).includes(t.toLowerCase()));
const extra = proto.texts.filter((t) => !norm(live.texts).includes(t.toLowerCase()));
const liveImgSet = new Set(live.imgs);
const protoImgSet = new Set(proto.imgs);
const missingImgs = [...liveImgSet].filter((s) => !protoImgSet.has(s));
const extraImgs = [...protoImgSet].filter((s) => !liveImgSet.has(s));

console.log('LIVE texts:', live.texts.length, ' PROTO texts:', proto.texts.length);
console.log('MISSING (in live, not proto):', JSON.stringify(missing, null, 1));
console.log('EXTRA (in proto, not live):', JSON.stringify(extra, null, 1));
console.log('MISSING IMGS:', missingImgs);
console.log('EXTRA IMGS:', extraImgs);
const liveHrefs = new Set(live.links.map((l) => `${l.text} -> ${l.href}`));
const protoHrefs = new Set(proto.links.map((l) => `${l.text} -> ${l.href}`));
console.log('MISSING LINKS:', [...liveHrefs].filter((x) => !protoHrefs.has(x)));

if (outManifest) {
  writeFileSync(outManifest, JSON.stringify({
    page: '/ch/en/stores/ap-house-geneva', width: 1440, capturedAt: new Date().toISOString(), live, proto,
  }, null, 1));
  console.log('manifest ->', outManifest);
}
