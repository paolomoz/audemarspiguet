import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
await p.goto('https://main--audemarspiguet--paolomoz.aem.page/ch/en/collections/code-11-59-collection',{waitUntil:'load',timeout:60000});
await p.waitForTimeout(4000);
await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,250));}scrollTo(0,0);await new Promise(r=>setTimeout(r,600));});
const r = await p.evaluate(()=>{
  const box = el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:Math.round(r.top+scrollY),h:Math.round(r.height)};};
  return {
    hero: box(document.querySelector('.hero')),
    columns: box(document.querySelector('.columns.editorial')),
    lookbook: box(document.querySelector('.lookbook')),
    releases: box(document.querySelector('.carousel.releases')),
    stories: box(document.querySelector('.carousel.stories')),
    plist: box(document.querySelector('.product-listing')),
    search: box(document.querySelector('.pl-search-row')),
    toolbar: box(document.querySelector('.pl-toolbar')),
    heading: box(document.querySelector('.pl-group-heading')),
    card0: box(document.querySelector('.product-card')),
    collections: box(document.querySelector('.carousel.collections')),
    textimage: box(document.querySelector('.text-image')),
    footer: box(document.querySelector('footer')),
    h1: box(document.querySelector('h1')),
  };
});
console.log(JSON.stringify(r));
await b.close();
