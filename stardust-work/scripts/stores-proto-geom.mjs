#!/usr/bin/env node
// Compare prototype geometry to the live lift's key rects.
/* eslint-disable */
import { chromium } from 'playwright';

const width = Number(process.argv[2] || 1440);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
await page.goto('http://localhost:3002/drafts/ch/en/stores', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const out = await page.evaluate(() => {
  const r = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return [b.x, b.y + scrollY, b.width, b.height].map((v) => +v.toFixed(1));
  };
  return {
    pageH: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    block: r('.store-locator'),
    wrapper: r('.sl-wrapper'),
    sidebar: r('.sl-sidebar'),
    head: r('.sl-head'),
    h1: r('.sl-head h1'),
    intro: r('.sl-head p'),
    search: r('.sl-search'),
    form: r('.sl-search-form'),
    textarea: r('.sl-search-form textarea'),
    geo: r('.sl-geo'),
    chips: r('.sl-chips'),
    chip1: r('.sl-chip'),
    filters: r('.sl-filters'),
    list: r('.sl-list'),
    card: r('.sl-card'),
    img: r('.sl-card figure > img'),
    caption: r('.sl-card figcaption'),
    name: r('.sl-card-name'),
    role: r('.sl-card-role'),
    hours: r('.sl-hours'),
    hoursBtn: r('.sl-hours-toggle'),
    infos: r('.sl-card-infos'),
    address: r('.sl-card-address'),
    contactBtn: r('.sl-card-contact button'),
    phone: r('.sl-card-phone'),
    appt: r('.sl-btn-appointment'),
    explore: r('.sl-btn-explore'),
    map: r('.sl-map'),
    footerTop: r('footer'),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
