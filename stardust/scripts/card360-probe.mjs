import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:360,height:844},deviceScaleFactor:1,userAgent:UA,locale:'en-GB'})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(2500);
try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
await p.evaluate(async()=>{ document.querySelectorAll('#onetrust-banner-sdk,#onetrust-consent-sdk').forEach(n=>n.remove());
  document.querySelector('.productlist')?.scrollIntoView(); await new Promise(r=>setTimeout(r,2500)); window.scrollBy(0,400); await new Promise(r=>setTimeout(r,1500)); });
const r = await p.evaluate(()=>{
  const cards=[...document.querySelectorAll('.ap-product-card')].slice(0,3);
  return cards.map(card=>{
    const cardTop = card.getBoundingClientRect().top;
    const walk=[...card.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().height>0).slice(0,25).map(e=>{
      const r=e.getBoundingClientRect();
      return `${e.tagName}.${(e.className||'').toString().split(' ')[0].slice(0,28)} rel${Math.round(r.top-cardTop)} h${Math.round(r.height)} w${Math.round(r.width)} "${(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,30)}"`;
    });
    return { h: Math.round(card.getBoundingClientRect().height), walk };
  });
});
console.log(JSON.stringify(r,null,1));
await b.close();
