#!/usr/bin/env node
// Interaction + reduced-motion smoke for the store-locator block.
/* eslint-disable */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const errors = [];
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await page.goto('http://localhost:3002/drafts/ch/en/stores', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const t = async (name, fn) => {
  try { const r = await fn(); console.log(`${name}: ${r}`); }
  catch (e) { console.log(`${name}: FAIL ${e.message}`); }
};

await t('resting count', () => page.textContent('.sl-count'));
await t('resting card', () => page.textContent('.sl-card-name'));

// chip: All → Boutique (Milan is AP_HOUSE → count changes)
await page.click('.sl-chip:has(input[value="boutique"])');
await page.waitForTimeout(300);
await t('boutique chip count', () => page.textContent('.sl-count'));
await page.click('.sl-chip:has(input[value="all"])');
await page.waitForTimeout(300);
await t('back to all', () => page.textContent('.sl-count'));

// hours toggle
await page.click('.sl-hours-toggle');
await page.waitForTimeout(500);
await t('hours expanded', async () => {
  const h = await page.evaluate(() => document.querySelector('.sl-hours-days').getBoundingClientRect().height);
  return `days panel h=${Math.round(h)} (expect >150)`;
});
await t('first day is today', () => page.textContent('.sl-hours-days li:first-child .sl-day'));

// contact toggle
await page.click('.sl-contact-toggle');
await t('email revealed', async () => {
  const hidden = await page.evaluate(() => document.querySelector('.sl-card-email').hidden);
  return `hidden=${hidden} (expect false)`;
});

// search: type "gen" → suggestions; pick Geneva
await page.fill('#sl-search-input', 'gen');
await page.waitForTimeout(300);
await t('suggestions', async () => {
  const items = await page.$$eval('.sl-suggestions button', (b) => b.map((x) => x.textContent));
  return items.join(' | ');
});
await page.click('.sl-suggestions button');
await page.waitForTimeout(400);
await t('after search count', () => page.textContent('.sl-count'));
await t('after search first card', () => page.textContent('.sl-card-name'));

// mobile relocation
await page.setViewportSize({ width: 360, height: 800 });
await page.waitForTimeout(400);
await t('mobile list parent', () => page.evaluate(() => document.querySelector('.sl-list').parentElement.className));
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);
await t('desktop list parent', () => page.evaluate(() => document.querySelector('.sl-list').parentElement.className));

// reduced motion: transitions none + content visible
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const p2 = await ctx2.newPage();
await p2.goto('http://localhost:3002/drafts/ch/en/stores', { waitUntil: 'networkidle' });
await p2.waitForTimeout(1500);
await t('reduced-motion h1 visible', () => p2.evaluate(() => {
  const h = document.querySelector('main h1');
  const cs = getComputedStyle(h);
  return `opacity=${cs.opacity} chevronTransition=${getComputedStyle(document.querySelector('.sl-ic-chevron')).transitionDuration}`;
}));

console.log(errors.length ? `JS ERRORS:\n${errors.join('\n')}` : 'no JS errors');
await browser.close();
