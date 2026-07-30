// Page-specific recapture for audemarspiguet.com collection pages.
// Slow-scroll hydration: OneTrust accept, step-scroll to fire Vue
// IntersectionObserver reveals + lazy media, wait for product grid,
// then full-page screenshot.
import { chromium } from 'playwright';

const url = process.argv[2];
const out = process.argv[3];
const width = parseInt(process.argv[4] || '1440', 10);
const height = width < 500 ? 844 : 900;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
  userAgent: UA,
  locale: 'en-GB',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout
: 60000 });
await page.waitForTimeout(2500);

// OneTrust: click accept if present, then prune the SDK containers.
try {
  const btn = page.locator('#onetrust-accept-btn-handler');
  if (await btn.isVisible({ timeout: 4000 })) { await btn.click(); await page.waitForTimeout(800); }
} catch {}
await page.evaluate(() => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach(n => n.remove());
});

// Park the pointer so nothing captures in :hover state.
await page.mouse.move(0, 0);

// Slow step-scroll to fire IntersectionObserver reveals and lazy loads.
// Dwell per step: the Vue grid + lazysizes need the viewport to rest
// near content before it hydrates/loads.
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.6);
  let y = 0;
  const max = () => document.body.scrollHeight;
  while (y < max()) {
    y += step;
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 900));
  }
  window.scrollTo(0, max());
  await new Promise(r => setTimeout(r, 2000));
});

// Wait for the Vue product grid to hydrate (any product card link).
try {
  await page.waitForSelector('.ap-product-grid a, ap-product-grid a, [class*="product-grid"] a', { timeout: 15000 });
} catch { console.error('[recapture] WARN product grid never hydrated'); }

// Force any remaining lazy sources, wait for fonts + images.
await page.evaluate(async () => {
  document.querySelectorAll('img[data-src]').forEach(i => { i.src = i.dataset.src; });
  document.querySelectorAll('source[data-srcset]').forEach(s => { s.srcset = s.dataset.srcset; });
  document.querySelectorAll('source[data-src]').forEach(s => { s.srcset = s.dataset.src; });
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1500));
});

// Wait until ≥90% of product-card images have actually decoded.
try {
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('.ap-product-card img')];
    if (!imgs.length) return false;
    const ok = imgs.filter(i => i.complete && i.naturalWidth > 0).length;
    return ok / imgs.length >= 0.9;
  }, { timeout: 30000 });
} catch { console.error('[recapture] WARN some product images never decoded'); }

// Back to top, settle, freeze animations for a stable shot.
await page.evaluate(async () => {
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 1000));
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}';
  document.head.appendChild(st);
});
await page.waitForTimeout(500);

const h = await page.evaluate(() => document.body.scrollHeight);
console.log(`[recapture] page height ${h}px at ${width}w`);
await page.screenshot({ path: out, fullPage: true });
console.log(`[recapture] saved ${out}`);
await browser.close();
