// CSS lift for replica recreation: hydrated DOM + computed styles of the
// key elements at a given breakpoint, from the live page.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const width = parseInt(process.argv[2] || '1440', 10);
const outJson = process.argv[3];
const outHtml = process.argv[4] || null;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport:{width, height: width<500?844:900}, deviceScaleFactor:2, userAgent:UA, locale:'en-GB' })).newPage();
await page.goto('https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(2500);
try { const b=page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({timeout:4000})) await b.click(); } catch {}
await page.evaluate(async () => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach(n=>n.remove());
  const step = Math.round(window.innerHeight*0.6); let y=0;
  while (y < document.body.scrollHeight) { y+=step; window.scrollTo(0,y); await new Promise(r=>setTimeout(r,900)); }
  await new Promise(r=>setTimeout(r,2000)); window.scrollTo(0,0); await new Promise(r=>setTimeout(r,800));
});

const PROPS = ['font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-transform','color','background-color','margin-top','margin-bottom','padding-top','padding-bottom','padding-left','padding-right','max-width','width','height','display','grid-template-columns','gap','border-radius','border','box-shadow','text-align','opacity','position','top','z-index','object-fit','aspect-ratio','text-decoration','flex-direction','justify-content','align-items'];
const SELECTORS = {
  body: 'body',
  header: 'header .ap-header, header [class*="header"]',
  headerBar: 'header nav, header [class*="nav"]',
  h1: 'main h1',
  h1span: 'main h1 span',
  h1italic: 'main h1 i',
  heroSection: '.hero .ap-hero',
  heroContainer: '.hero .grid-container',
  heroText: '.hero p',
  heroCta: '.hero a',
  gridContainer: 'main .grid-container',
  dualtext: '.dualtext .ap-dualtext',
  dualtextP: '.dualtext p',
  sectionH2: 'main h2.heading-1',
  h2span: 'main h2.heading-1 span',
  lookbook: '.lookbook',
  lookbookEl: '.ap-lookbook-element__wrapper',
  carousel: '.carousel .ap-carousel-container-app',
  productCard: '.ap-product-card',
  productCardRef: '.ap-product-card [class*="reference"], .ap-product-card__reference',
  productCardTitle: '.ap-product-card h3, .ap-product-card [class*="title"]',
  productCardImg: '.ap-product-card img',
  storyCard: '.ap-standard-card',
  storyCardTitle: '.ap-standard-card h3, .ap-standard-card [class*="title"]',
  searchInput: '.ap-input-search input',
  searchLabel: '.ap-input-search label',
  filtersBar: '[class*="filter-bar"], .ap-filter, [class*="toolbar"]',
  gridSectionHeading: '[class*="product-grid"] h2, .ap-productlist h2',
  productGrid: '[class*="product-grid"] ul, [class*="product-grid"] [class*="list"]',
  textimage: '.textimage .ap-textimage',
  textimageH2: '.textimage h2',
  textimageP: '.textimage p',
  footer: 'footer',
  footerCol: 'footer nav, footer ul',
  ctaLink: 'main .link a, main a[class*="link"]',
  revealLine: '.js-reveal-effect-line',
};
const lift = await page.evaluate(({SELECTORS, PROPS}) => {
  const out = {};
  for (const [name, sel] of Object.entries(SELECTORS)) {
    let el = null;
    for (const s of sel.split(',')) { el = document.querySelector(s.trim()); if (el) break; }
    if (!el) { out[name] = null; continue; }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const style = {};
    for (const p of PROPS) style[p] = cs.getPropertyValue(p);
    out[name] = { selector: sel, rect: {w: Math.round(r.width), h: Math.round(r.height)}, style, tag: el.tagName, cls: (el.className||'').toString().slice(0,120) };
  }
  // root custom props
  const rootCS = getComputedStyle(document.documentElement);
  out._rootVars = {};
  for (const sheet of document.styleSheets) {
    try { for (const rule of sheet.cssRules) {
      if (rule.selectorText === ':root' && rule.style) for (const p of rule.style) if (p.startsWith('--')) out._rootVars[p] = rule.style.getPropertyValue(p).trim();
    } } catch {}
  }
  return out;
}, {SELECTORS, PROPS});
writeFileSync(outJson, JSON.stringify(lift, null, 1));
console.log(`[css-lift] wrote ${outJson} (${Object.keys(lift).length} keys, ${Object.values(lift).filter(v=>v).length} matched)`);
if (outHtml) {
  const html = await page.content();
  writeFileSync(outHtml, html);
  console.log(`[css-lift] wrote hydrated DOM ${outHtml} (${(html.length/1024)|0}KB)`);
}
await browser.close();
