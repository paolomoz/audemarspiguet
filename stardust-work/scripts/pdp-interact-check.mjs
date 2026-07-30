// Functional checks on the harness: strap switching, spec tabs, video play,
// gallery drag, reduced-motion, console errors.
import { chromium } from 'playwright';

const b = await chromium.launch();

async function run(reduced) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  p.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message.slice(0, 120)}`));
  await p.goto('http://localhost:3007/drafts/pdp-26420so', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(3000);

  const out = { reduced };

  // strap selector: click 3rd strap
  await p.evaluate(() => document.querySelector('.strap-selector').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(600);
  const before = await p.evaluate(() => ({
    t: document.querySelector('.ss-info h4').textContent.trim(),
    href: document.querySelector('.ss-cta').href,
    tx: document.querySelector('.ss-track').style.transform,
  }));
  await p.click('.ss-slide:nth-child(3) .ss-slide-btn');
  await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({
    t: document.querySelector('.ss-info h4').textContent.trim(),
    href: document.querySelector('.ss-cta').href,
    tx: document.querySelector('.ss-track').style.transform,
    active: document.querySelector('.ss-slide-active') === document.querySelector('.ss-slide:nth-child(3)'),
  }));
  out.strap = { before, after };

  // spec tabs
  await p.click('#sp-tab-calibre');
  out.calibreVisible = await p.evaluate(() => !document.querySelector('#sp-panel-calibre').hidden && document.querySelector('#sp-panel-watch').hidden);
  out.calibreText = await p.evaluate(() => document.querySelector('#sp-panel-calibre').textContent.replace(/\s+/g, ' ').trim().slice(0, 60));
  await p.click('#sp-tab-warranty');
  out.warrantyVisible = await p.evaluate(() => !document.querySelector('#sp-panel-warranty').hidden);
  await p.click('#sp-tab-watch');

  // video play (first = scene7 mp4)
  await p.evaluate(() => document.querySelector('.video .video-play').scrollIntoView({ block: 'center' }));
  await p.click('.video .video-play');
  await p.waitForTimeout(1500);
  out.videoPlays = await p.evaluate(() => {
    const v = document.querySelector('.video .video-frame video');
    return v ? { present: true, paused: v.paused, src: v.src.slice(0, 60) } : { present: false };
  });

  // gallery arrows
  await p.evaluate(() => document.querySelector('.carousel.gallery').scrollIntoView({ block: 'center' }));
  const g0 = await p.evaluate(() => document.querySelector('.carousel.gallery .carousel-track').style.transform);
  await p.click('.carousel.gallery .carousel-nav-next');
  await p.waitForTimeout(600);
  const g1 = await p.evaluate(() => document.querySelector('.carousel.gallery .carousel-track').style.transform);
  out.galleryAdvances = g0 !== g1;

  out.errors = errors;
  await ctx.close();
  return out;
}

console.log(JSON.stringify(await run(false), null, 1));
console.log(JSON.stringify(await run(true), null, 1));
await b.close();
