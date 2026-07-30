import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({viewport:{width:1350,height:940},deviceScaleFactor:1})).newPage();
await p.addInitScript(() => {
  window.__lt = [];
  new PerformanceObserver((list) => {
    list.getEntries().forEach((e) => window.__lt.push({ start: Math.round(e.startTime), dur: Math.round(e.duration), name: e.name, attr: e.attribution?.[0]?.containerSrc || e.attribution?.[0]?.containerName || '' }));
  }).observe({ type: 'longtask', buffered: true });
});
await p.goto('https://project-context--audemarspiguet--paolomoz.aem.page/ch/en/collections/code-11-59-collection', {waitUntil:'load', timeout:60000});
await p.waitForTimeout(6000);
const lt = await p.evaluate(() => window.__lt);
console.log(JSON.stringify(lt, null, 0));
const total = lt.reduce((a, e) => a + Math.max(0, e.dur - 50), 0);
console.log('TBT-ish total:', total, 'ms across', lt.length, 'long tasks');
await b.close();
