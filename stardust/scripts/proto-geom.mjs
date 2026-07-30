import { chromium } from 'playwright';
const width = parseInt(process.argv[2]||'1440',10);
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({viewport:{width,height:width<500?844:900},deviceScaleFactor:1})).newPage();
await p.goto('http://localhost:8791/code-11-59-collection-proposed.html',{waitUntil:'load'});
await p.waitForTimeout(1200);
const r = await p.evaluate(() => {
  const box = el => { if(!el) return null; const r=el.getBoundingClientRect(); return {top:Math.round(r.top+scrollY),h:Math.round(r.height),x:Math.round(r.left),w:Math.round(r.width)}; };
  const out = { pageH: document.body.scrollHeight, sections: {} };
  for (const [k,sel] of Object.entries({hero:'.hero',dualtext:'.dualtext',lookbook:'.lookbook',car0:'.carousel--releases',car1:'.carousel--stories',plist:'.productlist',car2:'.carousel--collections',textimage:'.textimage',footer:'.site-footer'}))
    out.sections[k] = box(document.querySelector(sel));
  out.h1 = box(document.querySelector('h1'));
  out.card0 = box(document.querySelector('.product-card'));
  out.card3 = box(document.querySelectorAll('.product-card')[3]);
  out.card42 = box(document.querySelectorAll('.product-card')[42]);
  out.search = box(document.querySelector('.productlist__search-row'));
  out.groupHeading = box(document.querySelector('.productlist__group-heading'));
  out.car0h2 = box(document.querySelector('.carousel--releases h2'));
  out.car0slide = box(document.querySelector('.carousel--releases .slide'));
  out.car1slide = box(document.querySelector('.carousel--stories .slide'));
  out.car2slide = box(document.querySelector('.carousel--collections .slide'));
  out.ftrBrands = box(document.querySelector('.site-footer__brands'));
  return out;
});
console.log(JSON.stringify(r,null,1));
await b.close();
