// Interaction smoke for archetype F: mobile hours accordion, carousel arrows,
// reduced-motion, console errors.
import { chromium } from 'playwright';

const URL = 'http://localhost:3003/drafts/ch/en/stores/ap-house-geneva';
const browser = await chromium.launch({ headless: true });

// mobile accordion
{
  const page = await (await browser.newContext({ viewport: { width: 360, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const t = page.locator('.bh-hours-toggle');
  const before = await page.evaluate(() => document.querySelector('.bh-hours').getBoundingClientRect().height);
  await t.click();
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => document.querySelector('.bh-hours').getBoundingClientRect().height);
  const expanded = await t.getAttribute('aria-expanded');
  const rows = await page.locator('.bh-hours-week li').count();
  const firstRow = await page.locator('.bh-hours-week li').first().textContent();
  await t.click();
  await page.waitForTimeout(700);
  const closed = await page.evaluate(() => document.querySelector('.bh-hours').getBoundingClientRect().height);
  console.log('accordion:', { before, after, closed, expanded, rows, firstRow });
  // mobile dots present
  console.log('gallery dots:', await page.locator('.carousel.gallery .carousel-dots .dot').count());
  console.log('errors:', errors);
  await page.close();
}

// desktop arrows advance the boutiques track
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('.carousel.boutiques').scrollIntoView());
  await page.waitForTimeout(600);
  const tf = () => page.evaluate(() => document.querySelector('.carousel.boutiques .carousel-track').style.transform);
  const t0 = await tf();
  await page.locator('.carousel.boutiques .carousel-nav-next').click();
  await page.waitForTimeout(500);
  const t1 = await tf();
  const prevDisabled0 = await page.locator('.carousel.boutiques .carousel-nav-prev').isDisabled();
  console.log('boutiques arrows:', { t0, t1, prevDisabledAtStart: prevDisabled0 });
  const status = await page.locator('.boutique-hero .bh-hours-status').textContent();
  console.log('hero status (desktop):', status.trim().replace(/\s+/g, ' '));
  await page.close();
}

// reduced motion: no transitions on reveal/accordion
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({
    weekTransition: getComputedStyle(document.querySelector('.bh-hours-week')).transitionDuration,
    revealInits: document.querySelectorAll('.reveal-init:not(.reveal-in)').length,
    h1Visible: getComputedStyle(document.querySelector('.boutique-hero h1')).opacity,
  }));
  console.log('reduced-motion:', r);
  await page.close();
}

await browser.close();
