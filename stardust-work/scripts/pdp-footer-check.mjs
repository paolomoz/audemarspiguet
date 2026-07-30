// Compare footer heights: local PDP harness vs local /ch/en/home at 360.
import { chromium } from 'playwright';

const b = await chromium.launch();
async function footerH(url) {
  const p = await (await b.newContext({ viewport: { width: 360, height: 900 } })).newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const f = document.querySelector('footer');
    if (!f) return null;
    const b2 = f.getBoundingClientRect();
    const rows = [...f.querySelectorAll('.footer > div, .footer > *')].map((x) => `${(x.className || '').toString().slice(0, 30)} h=${Math.round(x.getBoundingClientRect().height)}`);
    return { h: Math.round(b2.height), rows };
  });
  await p.close();
  return r;
}
console.log('pdp   :', JSON.stringify(await footerH('http://localhost:3007/drafts/pdp-26420so')));
console.log('home  :', JSON.stringify(await footerH('http://localhost:3007/ch/en/home')));
await b.close();
