import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,userAgent:UA,locale:'en-GB'})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(2500);
try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
await p.evaluate(async()=>{ document.querySelectorAll('#onetrust-banner-sdk,#onetrust-consent-sdk').forEach(n=>n.remove());
  document.querySelector('.productlist')?.scrollIntoView(); await new Promise(r=>setTimeout(r,2500)); window.scrollBy(0,700); await new Promise(r=>setTimeout(r,2000)); });
const r = await p.evaluate(()=>{
  const box = el => { if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
    return {x:Math.round(r.left),y:Math.round(r.top+scrollY),w:Math.round(r.width),h:Math.round(r.height),of:cs.objectFit,disp:cs.display,vis:cs.visibility,op:cs.opacity,pt:cs.paddingTop,mt:cs.marginTop}; };
  const c = document.querySelector('.ap-product-card');
  return {
    card: box(c),
    wrapper: box(c.querySelector('.ap-product-card__wrapper')),
    aside: box(c.querySelector('.ap-product-card__aside')),
    figure: box(c.querySelector('figure')),
    img: box(c.querySelector('img')),
    imgSrc: c.querySelector('img')?.currentSrc?.slice(0,120),
    ref: box(c.querySelector('.ap-product-card__reference')),
    refText: c.querySelector('.ap-product-card__reference')?.textContent.trim(),
    title: box(c.querySelector('.ap-product-card__title')),
    titleHTML: c.querySelector('.ap-product-card__title')?.innerHTML.replace(/\sdata-v-[a-z0-9]+(="")?/g,'').replace(/\s+/g,' ').slice(0,400),
    sub: box(c.querySelector('[class*="subtitle"], .ap-product-card__text')),
    subText: c.querySelector('[class*="subtitle"], .ap-product-card__text')?.textContent.trim(),
    cardBg: getComputedStyle(c).backgroundColor,
    sectionBg: getComputedStyle(document.querySelector('.ap-productlist') || document.querySelector('.productlist')).backgroundColor,
  };
});
console.log(JSON.stringify(r,null,1));
await b.close();
