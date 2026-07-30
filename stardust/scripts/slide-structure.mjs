import { chromium } from 'playwright';
import { resolve } from 'path';
const b = await chromium.launch({headless:true});
const p = await (await b.newContext({javaScriptEnabled:false})).newPage();
await p.goto('file://' + resolve('stardust/current/pages/ch-en-collections-code-11-59-collection-hydrated.html'));
const r = await p.evaluate(() => {
  const clean = h => h.replace(/\sdata-v-[a-z0-9]+(="")?/g,'').replace(/\s+/g,' ');
  const cars = [...document.querySelectorAll('main .carousel')];
  return {
    car0slide: clean(cars[0].querySelector('.swiper-slide').outerHTML).slice(0,1600),
    car1slide: clean(cars[1].querySelector('.swiper-slide').outerHTML).slice(0,1400),
    car2slide: clean(cars[2].querySelector('.swiper-slide').outerHTML).slice(0,1400),
  };
});
console.log(r.car0slide, '\n\n---CAR1---\n', r.car1slide, '\n\n---CAR2---\n', r.car2slide);
await b.close();
