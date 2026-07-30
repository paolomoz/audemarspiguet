import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://project-context--audemarspiguet--paolomoz.aem.page/ch/en/stores/ap-house-geneva', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
const out = await page.evaluate(async () => {
  await document.fonts.ready;
  const em = document.querySelector('.carousel.boutiques h2 em') || document.querySelector('.carousel h2 em');
  const cs = getComputedStyle(em);
  const r = em.getBoundingClientRect();
  const loaded = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`);
  const h2 = em.closest('h2');
  return {
    emFamily: cs.fontFamily, emSize: cs.fontSize, emLH: cs.lineHeight, emH: r.height,
    h2H: h2.getBoundingClientRect().height,
    check: document.fonts.check(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} "Cormorant Garamond"`),
    loaded,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
