// Computed-style + integrity gate on the deployed preview URL (deploy #87).
import { chromium } from 'playwright';
const url = process.argv[2];
const width = parseInt(process.argv[3] || '1440', 10);
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, deviceScaleFactor: 1 })).newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0,150)}`); });
await p.goto(url, { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(4000);
await p.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.7);
  for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 800));
});
const r = await p.evaluate(() => {
  const gridBlocks = ['.product-listing .pl-grid', '.lookbook .lookbook-collage', '.carousel .carousel-track', '.text-image .ti-grid'];
  const layout = gridBlocks.map(sel => { const el = document.querySelector(sel); return [sel, el ? getComputedStyle(el).display : 'MISSING']; });
  const imgs = [...document.querySelectorAll('img')];
  const broken = imgs.filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map(i => i.src.slice(0, 90));
  return {
    sections: document.querySelectorAll('main .section').length,
    decorated: document.querySelectorAll('[data-block-name]').length,
    bodyAppear: document.body.classList.contains('appear'),
    layout,
    productCards: document.querySelectorAll('.product-card').length,
    imgs: imgs.length,
    broken,
    h1: document.querySelectorAll('h1').length,
    pageH: document.body.scrollHeight,
    headerNav: !!document.querySelector('header .ap-nav'),
    footerRendered: !!document.querySelector('footer .ap-footer'),
  };
});
console.log(JSON.stringify({ ...r, errors: errors.slice(0, 8) }, null, 1));
await p.screenshot({ path: `/tmp/deployed-${width}.png`, fullPage: false });
await b.close();
