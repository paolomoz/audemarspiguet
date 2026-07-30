// Spot rects on the local harness for gate iteration.
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '1440', 10);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width, height: 900 } })).newPage();
await p.goto('http://localhost:3007/drafts/pdp-26420so', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.7); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 300)); }
  window.scrollTo(0, 0);
});
await p.waitForTimeout(1000);
const sels = {
  specImg: '.specifications .sp-watch-right img',
  specTitle: '.specifications .sp-title',
  specTabs: '.specifications .sp-tabs',
  specSub: '.specifications .sp-subtitle',
  specHalves: '.specifications .sp-halves',
  simCard: '.similar-products .sim-slide',
  simCardImg: '.similar-products .sim-card-aside img',
  simTitle: '.similar-products .sim-content h2',
  simCta: '.similar-products .sim-content .ap-cta',
  simViewport: '.similar-products .sim-viewport',
  strapHeading: '.strap-selector .ss-heading',
  strapSlide: '.strap-selector .ss-slide',
  strapOverlayImg: '.strap-selector .ss-overlay-slide img',
  strapInfo: '.strap-selector .ss-info',
  strapTitle: '.strap-selector .ss-info h4',
  strapCta: '.strap-selector .ss-cta',
  pushTitle: '.store-locator-simple h2',
  pushCta: '.store-locator-simple .ap-cta',
  pushMap: '.store-locator-simple .sls-map',
  galSlide: '.carousel.gallery .slide',
  galHead: '.carousel.gallery .carousel-aside h2',
  videoFrame: '.video .video-frame',
  playBtn: '.video .video-play',
  piTitle: '.product-info h1',
  piRef: '.product-info .pi-ref',
  piPrice: '.product-info .pi-price',
  piImg: '.product-info .pi-image img',
  piCta: '.product-info .ap-cta',
  piPara: '.product-info .pi-paragraph p',
};
const d = await p.evaluate((SELS) => {
  const out = {};
  Object.entries(SELS).forEach(([k, sel]) => {
    out[k] = [...document.querySelectorAll(sel)].slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  return out;
}, sels);
console.log(JSON.stringify(d, null, 1));
await b.close();
