#!/usr/bin/env node
// Store-locator extraction probe (archetype E — /ch/en/stores).
// Loads the live page hydrated, records Yext/servlet network payloads,
// dumps hydrated DOM + a geometry/CSS lift of the locator UI.
// Usage: node stardust-work/scripts/stores-probe.mjs <width> <outPrefix>
/* eslint-disable */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const { REAL_CHROME_UA, newLiveContext, gotoLive, dismissOverlays } = await import(
  pathToFileURL(resolvePath(HERE, 'diff/live-session.mjs')).href
);

const width = Number(process.argv[2] || 1440);
const outPrefix = process.argv[3] || `/tmp/stores-${width}`;
const URL = 'https://www.audemarspiguet.com/ch/en/stores';

const browser = await chromium.launch();
const ctx = await newLiveContext(browser, { ua: REAL_CHROME_UA, locale: 'en-GB', viewport: { width, height: 900 } });
const page = await ctx.newPage();

const netlog = [];
const payloads = {};
page.on('response', async (res) => {
  const u = res.url();
  if (/yextentit|yext|googleapis|maps\.|geolocat|\.json\b/i.test(u) && !/gstatic|fonts|rum|cookielaw|analytics|gtm|teads/i.test(u)) {
    netlog.push({ url: u, status: res.status(), type: res.headers()['content-type'] || '' });
    if (/yext/i.test(u) && res.status() === 200) {
      try { payloads[u] = await res.text(); } catch {}
    }
  }
});

await gotoLive(page, URL, { waitUntil: 'domcontentloaded', timeoutMs: 60000, settleMs: 0 });
await page.waitForTimeout(3000);
await dismissOverlays(page, { lateWindowMs: 6000 });

// dwell-scroll hydration
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 300) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(4000);

const dom = await page.evaluate(() => document.documentElement.outerHTML);
writeFileSync(`${outPrefix}-hydrated.html`, dom);

// geometry + computed-style lift of locator UI
const lift = await page.evaluate(() => {
  const pick = (el, props) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = {};
    props.forEach((p) => { o[p] = cs[p]; });
    return o;
  };
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +(r.y + window.scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
  const TYPO = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'textTransform', 'textAlign'];
  const BOX = ['display', 'position', 'padding', 'margin', 'backgroundColor', 'border', 'borderRadius', 'width', 'height', 'gap', 'flexDirection', 'justifyContent', 'alignItems', 'gridTemplateColumns', 'overflow', 'boxShadow', 'top', 'left', 'right', 'bottom', 'zIndex'];

  const out = { pageHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), nodes: {} };
  const grab = (name, sel, root = document) => {
    const el = root.querySelector(sel);
    out.nodes[name] = el ? {
      sel, tag: el.tagName, cls: el.className && el.className.baseVal !== undefined ? '' : el.className,
      rect: rect(el), typo: pick(el, TYPO), box: pick(el, BOX), text: (el.children.length === 0 || el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'P' || /^H\d$/.test(el.tagName)) ? txt(el) : undefined,
    } : null;
  };

  grab('app', '.ap-store-locator-app');
  grab('h1', '.ap-store-locator-app h1, main h1');
  grab('intro', '.ap-store-locator-app p');
  // sweep every element inside the app with a class, first occurrence per class
  const app = document.querySelector('.ap-store-locator-app') || document.querySelector('main');
  const seen = {};
  [...app.querySelectorAll('*')].forEach((el) => {
    const cls = typeof el.className === 'string' ? el.className.trim() : '';
    if (!cls) return;
    const key = `${el.tagName}.${cls.split(/\s+/).join('.')}`;
    if (seen[key]) { seen[key].count += 1; return; }
    seen[key] = {
      count: 1, rect: rect(el), typo: pick(el, TYPO), box: pick(el, BOX),
      text: el.children.length === 0 ? txt(el) : (['BUTTON', 'A', 'P', 'H1', 'H2', 'H3', 'H4', 'SPAN', 'LABEL', 'LI'].includes(el.tagName) ? txt(el).slice(0, 160) : undefined),
      html: ['svg', 'SVG'].includes(el.tagName) ? el.outerHTML.slice(0, 500) : undefined,
    };
  });
  out.classSweep = seen;

  // list items verbatim
  out.storeCards = [...app.querySelectorAll('[class*="store-card"], [class*="locator"] li, [class*="result"]')].slice(0, 200).map((el) => ({
    cls: typeof el.className === 'string' ? el.className : '', rect: rect(el), text: txt(el).slice(0, 300),
  }));

  // map region
  const mapEl = app.querySelector('[class*="map"], #map, .gm-style');
  out.mapRect = rect(mapEl && (mapEl.closest('[class*="map"]') || mapEl));
  return out;
});
writeFileSync(`${outPrefix}-lift.json`, JSON.stringify(lift, null, 2));
writeFileSync(`${outPrefix}-netlog.json`, JSON.stringify(netlog, null, 2));
Object.entries(payloads).forEach(([u, body], i) => {
  writeFileSync(`${outPrefix}-yext-${i}.json`, body);
  console.log(`payload ${i}: ${u} (${body.length}b)`);
});
console.log(`pageHeight=${lift.pageHeight} nodes=${Object.keys(lift.classSweep).length} netlog=${netlog.length}`);
await browser.close();
