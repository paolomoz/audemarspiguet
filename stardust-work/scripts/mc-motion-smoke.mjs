// Reduced-motion + interaction smoke for the masterclass pages.
// Usage: node mc-motion-smoke.mjs <baseURL>
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:3004';
const browser = await chromium.launch();

// 1) reduced motion: content visible, no reveal transitions pending
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${base}/drafts/ch/en/masterclasses`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const hidden = [...document.querySelectorAll('main *')].filter((el) => {
      const s = getComputedStyle(el);
      return s.opacity === '0' && el.textContent.trim();
    });
    const revealInit = document.querySelectorAll('.reveal-init').length;
    return { hiddenCount: hidden.length, revealInit };
  });
  console.log('[reduced-motion index]', JSON.stringify(r));
  await ctx.close();
}

// 2) detail: banner toggles on scroll; accordion opens/closes; select works
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/drafts/ch/en/masterclasses/detail`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const states = [];
  for (const y of [0, 500, 800, 2000]) {
    await page.evaluate((ty) => window.scrollTo(0, ty), y);
    await page.waitForTimeout(400);
    states.push({ y, bannerVisible: await page.evaluate(() => { const b = document.querySelector('.mch-sticky'); return !!b && !b.hidden; }) });
  }
  console.log('[banner]', JSON.stringify(states));

  await page.evaluate(() => window.scrollTo(0, 1900));
  await page.waitForTimeout(300);
  const q = page.locator('.acc-trigger').first();
  await q.click();
  await page.waitForTimeout(500);
  const open = await page.evaluate(() => {
    const p = document.querySelector('.acc-panel');
    return { h: p.offsetHeight, expanded: document.querySelector('.acc-trigger').getAttribute('aria-expanded') };
  });
  await q.click();
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => document.querySelector('.acc-panel').offsetHeight);
  console.log('[accordion]', JSON.stringify({ open, closedH: closed }));

  const sel = await page.evaluate(() => {
    const s = document.querySelector('.mch-select select');
    s.value = '3';
    s.dispatchEvent(new Event('change'));
    return s.options[s.selectedIndex].textContent;
  });
  console.log('[select]', sel);
  await ctx.close();
}

await browser.close();
