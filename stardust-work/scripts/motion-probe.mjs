import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,userAgent:UA,locale:'en-GB'})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(3000);
try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
// scroll the releases heading into view and sample line transforms
const samples = await p.evaluate(async () => {
  const car = document.querySelectorAll('.carousel')[0];
  const lines = [...car.querySelectorAll('h2 .js-reveal-effect-line')];
  const img = car.querySelector('.swiper-slide figure');
  car.scrollIntoView({block:'center'});
  const out = [];
  const t0 = performance.now();
  for (let i = 0; i < 60; i += 1) {
    out.push({
      t: Math.round(performance.now() - t0),
      lines: lines.map(l => { const cs = getComputedStyle(l); return { tr: cs.transform, op: cs.opacity, oh: l.parentElement ? getComputedStyle(l.parentElement).overflow : '' }; }),
      fig: img ? { tr: getComputedStyle(img).transform.slice(0,60), op: getComputedStyle(img).opacity, cp: getComputedStyle(img).clipPath.slice(0,50) } : null,
    });
    await new Promise(r => setTimeout(r, 40));
  }
  return out;
});
// print transitions
let last = '';
for (const s of samples) {
  const key = JSON.stringify(s.lines.map(l=>l.tr.slice(0,40))) + (s.fig?.op||'');
  if (key !== last) { console.log(s.t, JSON.stringify(s.lines), 'fig:', JSON.stringify(s.fig)); last = key; }
}
await b.close();
