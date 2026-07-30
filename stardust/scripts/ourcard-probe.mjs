import { chromium } from 'playwright';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:360,height:844},deviceScaleFactor:1})).newPage();
await p.goto('http://localhost:8791/code-11-59-collection-proposed.html',{waitUntil:'load'});
await p.waitForTimeout(800);
const r = await p.evaluate(()=>{
  const c=document.querySelector('.product-card');
  const el=s=>c.querySelector(s);
  const m=e=>{if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {w:Math.round(r.width),h:Math.round(r.height),fs:cs.fontSize,lh:cs.lineHeight,disp:cs.display,maxw:cs.maxWidth};};
  return { card:m(c), h4:m(el('h4')), b:m(el('h4 b')), span:m(el('h4 span')), ref:m(el('.product-card__reference')), sub:m(el('.product-card__subtitle')), bText: el('h4 b').textContent };
});
console.log(JSON.stringify(r,null,1));
await b.close();
