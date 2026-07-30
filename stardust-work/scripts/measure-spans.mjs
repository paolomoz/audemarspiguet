import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext()).newPage();
await p.goto('http://localhost:8791/code-11-59-collection-proposed.html', {waitUntil:'load'});
const r = await p.evaluate(async () => {
  await document.fonts.ready;
  const c = document.createElement('canvas').getContext('2d');
  c.font = '300 14px "Helvetica Neue Web", "Helvetica Neue", Helvetica, Arial, sans-serif';
  return ['Grande Sonnerie Supersonnerie','Minute Repeater Supersonnerie','Selfwinding Flying Tourbillon','Perpetual Calendar Openworked','Selfwinding Chronograph','Ultra-Complication Universelle (RD#4)'].map(t=>[t, Math.round(c.measureText(t).width*10)/10]);
});
r.forEach(([t,w])=>console.log(w, t));
await b.close();
