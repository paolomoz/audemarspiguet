// FAQ accordion motion probe (A+ batch): measures the live expand/collapse
// behavior — CSS var --accordion-animation-duration, transition curve, opened
// content margins/typography, icon plus/minus line animation, ARIA wiring.
// Usage: node faq-accordion-probe.mjs [width]
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '1440', 10);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 }, userAgent: UA, locale: 'en-GB',
})).newPage();
await page.goto('https://www.audemarspiguet.com/ch/en/services/faq', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch {}
await page.evaluate(() => { document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove()); });
await page.waitForTimeout(500);

// scroll first accordion into view
await page.evaluate(() => {
  const it = document.querySelector('.ap-accordion__item');
  it.scrollIntoView({ block: 'center', behavior: 'instant' });
});
await page.waitForTimeout(800);

const resting = await page.evaluate(() => {
  const it = document.querySelector('.ap-accordion__item');
  const btn = it.querySelector('.ap-accordion__trigger');
  const content = it.querySelector('.ap-accordion__content');
  const icon = it.querySelector('.ap-accordion__icon');
  const lines = [...it.querySelectorAll('.ap-accordion__icon svg line')];
  const cs = (el) => {
    const s = getComputedStyle(el);
    return {
      transition: s.transition,
      height: s.height,
      margin: s.margin,
      overflow: s.overflow,
      animDur: s.getPropertyValue('--accordion-animation-duration'),
      contentH: s.getPropertyValue('--accordion-collapsible-content-height'),
    };
  };
  return {
    btnAria: { expanded: btn.getAttribute('aria-expanded'), controls: !!btn.getAttribute('aria-controls'), id: !!btn.id },
    contentAttrs: { role: content.getAttribute('role'), labelledby: !!content.getAttribute('aria-labelledby'), id: !!content.id, ariaHidden: content.getAttribute('aria-hidden'), inert: content.hasAttribute('inert') },
    headerTag: it.querySelector('.ap-accordion__header').tagName,
    contentStyle: cs(content),
    iconLines: lines.map((l) => ({ x1: l.getAttribute('x1'), y1: l.getAttribute('y1'), x2: l.getAttribute('x2'), y2: l.getAttribute('y2'), cls: l.getAttribute('class'), transform: getComputedStyle(l).transform, rotateStyle: l.style.rotate || l.style.transform, style: l.getAttribute('style') })),
    iconSvgHtml: icon.outerHTML.slice(0, 900),
  };
});
console.log('RESTING', JSON.stringify(resting, null, 1));

// click and sample expansion
const expand = await page.evaluate(async () => {
  const it = document.querySelector('.ap-accordion__item');
  const btn = it.querySelector('.ap-accordion__trigger');
  const content = it.querySelector('.ap-accordion__content');
  const line1 = it.querySelector('.ap-accordion__icon svg line.hand-1');
  const samples = [];
  const t0 = performance.now();
  btn.click();
  const animDur = getComputedStyle(content).getPropertyValue('--accordion-animation-duration');
  const contentHVar = getComputedStyle(content).getPropertyValue('--accordion-collapsible-content-height');
  const transition = getComputedStyle(content).transition;
  for (let i = 0; i < 40; i += 1) {
    samples.push({
      t: Math.round(performance.now() - t0),
      h: Math.round(content.getBoundingClientRect().height * 10) / 10,
      lineTransform: line1 ? getComputedStyle(line1).transform : null,
    });
    await new Promise((r) => setTimeout(r, 40));
  }
  const openedContentDiv = content.firstElementChild;
  const ds = getComputedStyle(openedContentDiv);
  return {
    animDur,
    contentHVar,
    transition,
    ariaAfter: btn.getAttribute('aria-expanded'),
    itemCls: it.className,
    openedMargin: getComputedStyle(content).margin,
    contentDivStyle: {
      font: ds.font, color: ds.color, padding: ds.padding, letterSpacing: ds.letterSpacing,
    },
    linkStyle: (() => {
      const a = openedContentDiv.querySelector('a');
      if (!a) return null;
      const s = getComputedStyle(a);
      return { font: s.font, color: s.color, textDecoration: s.textDecorationLine, letterSpacing: s.letterSpacing };
    })(),
    samples,
  };
});
console.log('EXPAND', JSON.stringify(expand, null, 1));

await page.waitForTimeout(600);
const collapse = await page.evaluate(async () => {
  const it = document.querySelector('.ap-accordion__item');
  const btn = it.querySelector('.ap-accordion__trigger');
  const content = it.querySelector('.ap-accordion__content');
  const samples = [];
  const t0 = performance.now();
  btn.click();
  const animDur = getComputedStyle(content).getPropertyValue('--accordion-animation-duration');
  for (let i = 0; i < 40; i += 1) {
    samples.push({ t: Math.round(performance.now() - t0), h: Math.round(content.getBoundingClientRect().height * 10) / 10 });
    await new Promise((r) => setTimeout(r, 40));
  }
  return { animDur, ariaAfter: btn.getAttribute('aria-expanded'), samples };
});
console.log('COLLAPSE', JSON.stringify(collapse, null, 1));

// keyboard behavior: focus trigger, press Enter
const kbd = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.ap-accordion__trigger')];
  return { count: btns.length, allButtons: btns.every((b) => b.tagName === 'BUTTON') };
});
console.log('KBD', JSON.stringify(kbd));
await browser.close();
