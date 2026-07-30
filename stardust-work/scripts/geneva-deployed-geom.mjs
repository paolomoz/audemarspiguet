// Compare prototype geometry against the live-probe numbers (archetype F).
// Usage: node store-proto-geom.mjs <width>
import { chromium } from 'playwright';

const width = parseInt(process.argv[2] || '1440', 10);
const URL = 'https://project-context--audemarspiguet--paolomoz.aem.page/ch/en/stores/ap-house-geneva';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.6); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); }
  window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
});

const data = await page.evaluate(() => {
  const r = (sel, root) => {
    const el = (root || document).querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top + scrollY), h: Math.round(b.height * 10) / 10, w: Math.round(b.width * 10) / 10, left: Math.round(b.left * 10) / 10 };
  };
  return {
    pageH: document.body.scrollHeight,
    heroSection: r('.boutique-hero'),
    link: r('.boutique-hero .bh-title .ap-link'),
    h1: r('.boutique-hero h1'),
    role: r('.boutique-hero .bh-role'),
    img: r('.boutique-hero .bh-image img'),
    card: r('.boutique-hero .bh-card'),
    cardTitle: r('.boutique-hero .bh-card-title'),
    hoursStatus: r('.boutique-hero .bh-hours-status'),
    week: r('.boutique-hero .bh-hours-week'),
    weekFirst: r('.boutique-hero .bh-hours-week li'),
    infos: r('.boutique-hero .bh-infos'),
    cta1: r('.boutique-hero a.bh-cta'),
    quote: r('.boutique-hero .bh-quote p'),
    gallery: r('.carousel.gallery'),
    galleryH2: r('.carousel.gallery .carousel-head h2'),
    galleryP: r('.carousel.gallery .carousel-head p'),
    gallerySlide: r('.carousel.gallery .slide'),
    gallerySlideImg: r('.carousel.gallery .slide img'),
    boutiques: r('.carousel.boutiques'),
    bH2: r('.carousel.boutiques h2'),
    bLink: r('.carousel.boutiques .carousel-head .ap-link'),
    bSlide: r('.carousel.boutiques .slide'),
    bCard: r('.carousel.boutiques .store-card'),
    bImg: r('.carousel.boutiques .store-card img'),
    bCaption: r('.carousel.boutiques .store-card figcaption'),
    bName: r('.carousel.boutiques .sc-name'),
    bRole: r('.carousel.boutiques .sc-role'),
    bHours: r('.carousel.boutiques .sc-hours'),
    bAddr: r('.carousel.boutiques .sc-address'),
    dots: r('.carousel.gallery .carousel-dots'),
    newsletter: r('.newsletter'),
    footer: r('footer'),
  };
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
