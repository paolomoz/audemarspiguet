import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const grab = async (url, needsScroll) => {
  const p=await (await b.newContext({viewport:{width:360,height:844},deviceScaleFactor:1,userAgent:UA,locale:'en-GB'})).newPage();
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(needsScroll?2500:800);
  if (needsScroll) {
    try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
    await p.evaluate(async()=>{ document.querySelectorAll('#onetrust-banner-sdk,#onetrust-consent-sdk').forEach(n=>n.remove());
      const step=Math.round(window.innerHeight*0.6); let y=0;
      while(y<document.body.scrollHeight){y+=step;window.scrollTo(0,y);await new Promise(r=>setTimeout(r,700));}
      await new Promise(r=>setTimeout(r,1200)); });
  }
  const r = await p.evaluate(()=>[...document.querySelectorAll('.ap-product-card, .product-card')].map(c=>({h:Math.round(c.getBoundingClientRect().height), ref:(c.textContent.match(/\d{5}[A-Z]{2}\.[A-Z]{2}\.[A-Z0-9]+\.\d{2}(-[A-Z]+)?/)||[''])[0]})));
  await p.close();
  return r;
};
const live = await grab('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', true);
const ours = await grab('http://localhost:8791/code-11-59-collection-proposed.html', false);
let drift = 0;
for (let i=0;i<Math.max(live.length,ours.length);i++){
  const l=live[i]||{}, o=ours[i]||{};
  const d=(o.h||0)-(l.h||0);
  drift += d;
  if (d) console.log(`#${i} ${l.ref} live ${l.h} ours ${o.h} Δ${d} (cum ${drift})`);
}
console.log('counts', live.length, ours.length, 'total drift', drift);
await b.close();
