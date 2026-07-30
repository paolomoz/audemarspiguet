import { chromium } from 'playwright';
import { resolve } from 'path';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({javaScriptEnabled:false})).newPage();
await p.goto('file://' + resolve('stardust-work/current/pages/ch-en-collections-code-11-59-collection-hydrated.html'));
const r = await p.evaluate(() => {
  const clean = h => h.replace(/\sdata-v-[a-z0-9]+(="")?/g,'').replace(/\s+/g,' ');
  const cars = [...document.querySelectorAll('main .carousel')];
  // the content part AFTER the image aside
  const grab = (ci) => {
    const fig = cars[ci].querySelector('.swiper-slide figure');
    const caption = fig.querySelector('figcaption') || fig.querySelector('.ap-standard-card__content') || fig;
    return clean(caption.outerHTML).slice(0, 1600);
  };
  return { c0: grab(0), c1: grab(1), c2: grab(2) };
});
console.log('---C0 caption---\n', r.c0, '\n---C1 caption---\n', r.c1, '\n---C2 caption---\n', r.c2);
await b.close();
