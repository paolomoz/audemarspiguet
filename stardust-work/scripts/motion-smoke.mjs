import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({viewport:{width:2000,height:1130},deviceScaleFactor:1})).newPage();
await p.goto('https://main--audemarspiguet--paolomoz.aem.page/ch/en/collections/code-11-59-collection',{waitUntil:'load',timeout:60000});
await p.waitForTimeout(4500);
const initState = await p.evaluate(() => ({
  revealInits: document.querySelectorAll('.reveal-init').length,
  heroLines: document.querySelectorAll('h1 .reveal-line').length,
  heroIn: document.querySelectorAll('h1 .reveal-line.reveal-in').length,
}));
// scroll lookbook into view, sample a below-fold heading mid-animation
await p.evaluate(() => document.querySelector('.carousel.releases')?.scrollIntoView({block:'center'}));
await p.waitForTimeout(300);
const mid = await p.evaluate(() => {
  const l = document.querySelector('.carousel.releases h2 .reveal-line');
  const cs = l ? getComputedStyle(l) : null;
  return cs ? { tr: cs.transform, op: cs.opacity, cls: l.className } : null;
});
await p.waitForTimeout(1800);
const done = await p.evaluate(() => {
  const l = document.querySelector('.carousel.releases h2 .reveal-line');
  const cs = getComputedStyle(l);
  return { tr: cs.transform, op: cs.opacity };
});
console.log(JSON.stringify({ initState, mid, done }, null, 1));
// screenshots: lookbook + grid at 2000w
await p.evaluate(() => document.querySelector('.lookbook')?.scrollIntoView());
await p.waitForTimeout(1800);
await p.screenshot({ path: '/tmp/wide-lookbook.png' });
await p.evaluate(() => document.querySelector('.pl-grid')?.scrollIntoView());
await p.waitForTimeout(1800);
await p.screenshot({ path: '/tmp/wide-grid.png' });
await b.close();
