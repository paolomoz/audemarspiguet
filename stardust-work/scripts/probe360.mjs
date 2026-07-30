import { chromium } from 'playwright';
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:360,height:844},deviceScaleFactor:1,userAgent:UA,locale:'en-GB',isMobile:true,hasTouch:true})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(2500);
try{const x=p.locator('#onetrust-accept-btn-handler'); if(await x.isVisible({timeout:4000}))await x.click();}catch{}
await p.evaluate(async()=>{ document.querySelectorAll('#onetrust-banner-sdk,#onetrust-consent-sdk').forEach(n=>n.remove());
  const step=Math.round(window.innerHeight*0.6); let y=0;
  while(y<document.body.scrollHeight){y+=step;window.scrollTo(0,y);await new Promise(r=>setTimeout(r,700));}
  await new Promise(r=>setTimeout(r,1500)); window.scrollTo(0,0); await new Promise(r=>setTimeout(r,600)); });
const r = await p.evaluate(()=>{
  const box = el => { if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.left),y:Math.round(r.top+scrollY),w:Math.round(r.width),h:Math.round(r.height)}; };
  const cards=[...document.querySelectorAll('.ap-product-card')];
  const foot=document.querySelector('footer');
  return {
    pageH: document.body.scrollHeight,
    cardCount: cards.length,
    card0: box(cards[0]), card1: box(cards[1]), cardLast: box(cards[cards.length-1]),
    cardImg: box(cards[0]?.querySelector('img')),
    plistBottom: box(document.querySelector('.productlist')),
    searchRow: box(document.querySelector('.ap-input-search')),
    toolbar: box(document.querySelector('.product-toolbar')),
    groupHeading: box(document.querySelector('[class*="group"] h3, .ap-product-grid h3, [class*="collection-title"]')),
    footer: box(foot),
    footerRows: [...foot.querySelectorAll('h4, nav, ul, [class*="accordion"], button')].slice(0,25).map(e=>({tag:e.tagName, cls:(e.className||'').toString().slice(0,40), t:(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,30), box:box(e)})),
    dtCells: [...document.querySelectorAll('.dualtext .cell')].map(c=>box(c)),
    heroText: box(document.querySelector('.ap-hero .cell')),
    h1: box(document.querySelector('main h1')),
  };
});
console.log(JSON.stringify(r,null,1));
await b.close();
