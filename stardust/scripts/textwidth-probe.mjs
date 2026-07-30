import { chromium } from 'playwright';
const width = parseInt(process.argv[2]||'360',10);
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width,height:width<500?844:900},deviceScaleFactor:1,userAgent:UA,locale:'en-GB'})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(2500);
try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
await p.evaluate(async()=>{ document.querySelectorAll('#onetrust-banner-sdk,#onetrust-consent-sdk').forEach(n=>n.remove());
  document.querySelector('.productlist')?.scrollIntoView(); await new Promise(r=>setTimeout(r,2500)); });
const r = await p.evaluate(()=>{
  const w = el => el ? {w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height)} : null;
  const card = document.querySelector('.ap-product-card');
  return {
    cardTitle: w(card?.querySelector('.ap-product-card__title')),
    cardTitleSpanParent: w(card?.querySelector('.ap-product-card__title div')),
    cardContent: w(card?.querySelector('.ap-product-card__content')),
    dtP: w(document.querySelector('.dualtext p')),
    dtCell: w(document.querySelector('.dualtext .cell')),
    heroP: w(document.querySelector('.ap-hero p')),
    storyDesc: w(document.querySelector('.carousel .ap-standard-card__desc')),
    tiP: w(document.querySelector('.textimage p')),
  };
});
console.log(width, JSON.stringify(r));
await b.close();
