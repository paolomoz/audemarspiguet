import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,userAgent:UA,locale:'en-GB'})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(2500);
try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
await p.evaluate(()=>document.querySelectorAll('#onetrust-banner-sdk,#onetrust-consent-sdk').forEach(n=>n.remove()));
const at = async () => await p.evaluate(() => {
  const h = document.querySelector('header');
  const bar = h.querySelector('div,nav');
  const cs = getComputedStyle(h);
  const inner = h.firstElementChild ? getComputedStyle(h.firstElementChild) : null;
  const vis = [...h.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().height>0).map(i=>i.src.split('/').pop().slice(0,50));
  const r = h.getBoundingClientRect();
  return { pos: cs.position, top: Math.round(r.top), h: Math.round(r.height), bg: cs.backgroundColor,
    innerPos: inner?.position, innerBg: inner?.backgroundColor, visibleLogos: vis,
    cls: h.className.slice(0,80), bodyCls: document.body.className.slice(0,120) };
});
console.log('header@0:', JSON.stringify(await at()));
await p.evaluate(()=>window.scrollTo(0,1500)); await p.waitForTimeout(1200);
console.log('header@1500:', JSON.stringify(await at()));
await p.evaluate(()=>window.scrollTo(0,5000)); await p.waitForTimeout(1200);
console.log('header@5000:', JSON.stringify(await at()));
// sticky filter bar
const fb = await p.evaluate(() => {
  const cands = [...document.querySelectorAll('.productlist *')].filter(e=>{const cs=getComputedStyle(e); return (cs.position==='sticky'||cs.position==='fixed') && e.getBoundingClientRect().width>200});
  return cands.slice(0,4).map(e=>({cls:(e.className||'').toString().slice(0,70), pos:getComputedStyle(e).position, top:getComputedStyle(e).top, h:Math.round(e.getBoundingClientRect().height), bg:getComputedStyle(e).backgroundColor}));
});
console.log('sticky in productlist:', JSON.stringify(fb));
// hero details + footer + h2 blocks
const d = await p.evaluate(() => {
  const box = el => { if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.left),y:Math.round(r.top+scrollY),w:Math.round(r.width),h:Math.round(r.height)}; };
  const hero=document.querySelector('.ap-hero');
  const foot=document.querySelector('footer');
  const fcs=getComputedStyle(foot);
  const fInner=[...foot.querySelectorAll(':scope div')].slice(0,3).map(d=>({cls:(d.className||'').slice(0,50),bg:getComputedStyle(d).backgroundColor, box:box(d)}));
  return {
    heroControls: box(document.querySelector('.ap-hero__controls')),
    heroTextBlock: box(document.querySelector('.ap-hero .cell')),
    heroH1: box(document.querySelector('.ap-hero h1')),
    heroP: box(document.querySelector('.ap-hero p')),
    heroCta: box(document.querySelector('.ap-hero a')),
    footer: {box: box(foot), bg: fcs.backgroundColor, inner: fInner},
    dualtextCells: [...document.querySelectorAll('.dualtext .cell')].map(c=>box(c)),
    car_h2: [...document.querySelectorAll('.carousel h2')].map(h=>box(h)),
    carBrowse: [...document.querySelectorAll('.carousel .ap-link-app a, .carousel a[class*="link"]')].slice(0,3).map(a=>box(a)),
    plH2: box(document.querySelector('.productlist h2')),
    plSearch: box(document.querySelector('.ap-input-search')),
    plFilterRow: box(document.querySelector('.productlist [class*="toolbar"], .productlist [class*="actions"]')),
  };
});
console.log('detail:', JSON.stringify(d,null,1));
await b.close();
