import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b=await chromium.launch({headless:true});
const SAMPLES = [
  ['300 16px', 'Blending traditional craftsmanship with contemporary design'],
  ['500 16px', 'Ultra-Complication Universelle (RD#4)'],
  ['500 14px', 'Browse the full collection'],
  ['100 56px', 'MEET THE UNCONVENTIONAL'],
];
const measure = async (url, family) => {
  const p = await (await b.newContext({viewport:{width:1440,height:900},userAgent:UA,locale:'en-GB'})).newPage();
  await p.goto(url, {waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(3500);
  const r = await p.evaluate(async ({SAMPLES, family}) => {
    await document.fonts.ready;
    const c = document.createElement('canvas').getContext('2d');
    return SAMPLES.map(([spec, text]) => { c.font = `${spec} ${family}`; return [spec, text.slice(0,20), Math.round(c.measureText(text).width*10)/10]; });
  }, {SAMPLES, family});
  return r;
};
const live = await measure('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', '"Helvetica Neue Web", sans-serif');
const ours = await measure('http://localhost:8791/code-11-59-collection-proposed.html', '"Helvetica Neue Web", "Helvetica Neue", Helvetica, Arial, sans-serif');
for (let i=0;i<live.length;i++) console.log(live[i][0], '|', live[i][2], 'vs', ours[i][2], '→', Math.round((ours[i][2]/live[i][2]-1)*1000)/10 + '%');
// serif
const liveS = await measure('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', '"Times Now", serif');
const oursS = await measure('http://localhost:8791/code-11-59-collection-proposed.html', '"Times Now", "Cormorant Garamond", "Times New Roman", serif');
console.log('serif 60px italic:');
console.log(' live', liveS[3][2], 'ours', oursS[3][2]);
await b.close();
