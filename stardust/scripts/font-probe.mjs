import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({viewport:{width:1440,height:900}, userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'})).newPage();
await p.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4000);
const r = await p.evaluate(async () => {
  await document.fonts.ready;
  const loaded = [...document.fonts].map(f=>`${f.family} ${f.weight} ${f.style} ${f.status}`);
  const checks = {};
  for (const q of ['italic 250 60px "Times Now"','italic 500 60px "Cormorant Garamond"','100 56px "Helvetica Neue Web"']) checks[q] = document.fonts.check(q);
  return {loaded: loaded.filter(l=>!/VideoJS|icomoon|swiper/.test(l)), checks};
});
console.log(JSON.stringify(r,null,1));
await b.close();
