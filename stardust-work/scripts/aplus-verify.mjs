// A+ functional + content verification against the local harness.
// 1. accordion: open/close motion, ARIA wiring, keyboard, reduced-motion
// 2. content-diff: rendered text vs the live-derived manifests (0 structural red)
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = 'http://127.0.0.1:3005';
const manifest = JSON.parse(readFileSync('/Users/paolo/stardust/audemarspiguet/stardust-work/current/faq-content-manifest.json', 'utf8'));
const browser = await chromium.launch();
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

// ---------- FAQ ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(`${BASE}/qa/faq.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const counts = await page.evaluate(() => ({
    groups: document.querySelectorAll('.acc-group-title').length,
    items: document.querySelectorAll('.acc-item').length,
    buttons: document.querySelectorAll('.acc-trigger').length,
    h3: document.querySelectorAll('.acc-header').length,
    openAtRest: document.querySelectorAll('.acc-item.acc-open').length,
    aria: [...document.querySelectorAll('.acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'false' && document.getElementById(b.getAttribute('aria-controls'))),
    regions: [...document.querySelectorAll('.acc-content')].every((c) => c.getAttribute('role') === 'region' && c.getAttribute('aria-labelledby')),
    h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
  }));
  check('faq: 7 groups', counts.groups === 7, String(counts.groups));
  check('faq: 63 items, all buttons in h3', counts.items === 63 && counts.buttons === 63 && counts.h3 === 63);
  check('faq: all closed at rest', counts.openAtRest === 0);
  check('faq: aria-expanded/controls wired', counts.aria === true);
  check('faq: contents are labelled regions', counts.regions === true);
  // reveal.js line-splits the h1 (removes the <br>) — compare space-insensitive
  check('faq: h1 verbatim', counts.h1.replace(/\s+/g, '') === 'FrequentlyAskedQuestions', counts.h1);

  // content-diff: every question + group title + answer text present
  const dom = await page.evaluate(() => ({
    titles: [...document.querySelectorAll('.acc-group-title')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()),
    qs: [...document.querySelectorAll('.acc-title')].map((s) => s.textContent.replace(/\s+/g, ' ').trim()),
    answers: [...document.querySelectorAll('.acc-text')].map((t) => t.textContent.replace(/\s+/g, ' ').trim()),
  }));
  const norm = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&').replace(/\s|\u00a0/g, '').trim();
  let missing = 0;
  manifest.groups.forEach((g, gi) => {
    if (norm(dom.titles[gi] || '') !== norm(g.title)) { missing += 1; console.log(`  RED group title ${gi}: ${g.title}`); }
    g.items.forEach(({ q, a }) => {
      if (!dom.qs.some((x) => norm(x) === norm(q))) { missing += 1; console.log(`  RED missing Q: ${q}`); }
      const aText = norm(a.replace(/<[^>]+>/g, ' '));
      if (!dom.answers.some((x) => norm(x).includes(aText.slice(0, 60)))) { missing += 1; console.log(`  RED missing A for: ${q}`); }
    });
  });
  check('faq: content-diff structural red', missing === 0, `${missing} red`);

  // motion: open first item, sample height timing
  const motion = await page.evaluate(async () => {
    const item = document.querySelector('.acc-item');
    const btn = item.querySelector('.acc-trigger');
    const content = item.querySelector('.acc-content');
    btn.click();
    const t0 = performance.now();
    const samples = [];
    for (let i = 0; i < 12; i += 1) {
      samples.push({ t: Math.round(performance.now() - t0), h: Math.round(content.getBoundingClientRect().height) });
      await new Promise((r) => { setTimeout(r, 50); });
    }
    const opened = content.getBoundingClientRect().height;
    const transition = getComputedStyle(content).transition;
    const aria = btn.getAttribute('aria-expanded');
    btn.click();
    await new Promise((r) => { setTimeout(r, 500); });
    const closed = content.getBoundingClientRect().height;
    return { samples, opened, closed, transition, aria };
  });
  check('faq: expand transition 300ms ease-in-out', /height 0\.3s ease-in-out/.test(motion.transition), motion.transition);
  check('faq: opens to content height then closes to 0', motion.opened > 40 && motion.closed === 0, `open ${motion.opened}, closed ${motion.closed}`);
  const mid = motion.samples.find((s) => s.t > 120 && s.t < 220);
  check('faq: height animates (not a snap)', mid && mid.h > 0 && mid.h < motion.opened, JSON.stringify(mid));

  // keyboard: Enter on focused trigger toggles
  const kbd = await page.evaluate(async () => {
    const btn = document.querySelectorAll('.acc-trigger')[1];
    btn.focus();
    const before = btn.getAttribute('aria-expanded');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return { focusable: document.activeElement === btn, before };
  });
  await page.keyboard.press('Enter');
  const kbdAfter = await page.evaluate(() => document.querySelectorAll('.acc-trigger')[1].getAttribute('aria-expanded'));
  check('faq: keyboard focus + Enter toggles', kbd.focusable && kbd.before === 'false' && kbdAfter === 'true', `after=${kbdAfter}`);
  await page.close();
}

// reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/qa/faq.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const rm = await page.evaluate(() => {
    const content = document.querySelector('.acc-content');
    const v = document.querySelector('.acc-ico-v');
    const h1 = document.querySelector('h1');
    return {
      contentTransition: getComputedStyle(content).transitionDuration,
      iconTransition: getComputedStyle(v).transitionDuration,
      h1Visible: getComputedStyle(h1).opacity,
    };
  });
  check('faq: reduced-motion collapses transitions', rm.contentTransition === '0s' && rm.iconTransition === '0s', JSON.stringify(rm));
  check('faq: reduced-motion content visible', rm.h1Visible === '1');
  await page.close();
  await ctx.close();
}

// ---------- contact ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(`${BASE}/qa/contact-us.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const c = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent.trim(),
    labels: [...document.querySelectorAll('.fm-label')].map((l) => l.textContent.trim()),
    placeholders: [...document.querySelectorAll('.fm-control input')].map((i) => i.placeholder),
    selects: [...document.querySelectorAll('.fm-control select')].map((s) => ({
      shown: s.options[s.selectedIndex]?.textContent.trim(),
      n: s.options.length,
      labelled: !!(s.id && document.querySelector(`label[for="${s.id}"]`)) || !!s.getAttribute('aria-label'),
    })),
    inputsLabelled: [...document.querySelectorAll('.fm-control input, textarea')].every((i) => i.id && document.querySelector(`label[for="${i.id}"]`)),
    filledCard: !!document.querySelector('.fm-card .fm-field.fm-filled'),
    ack: document.querySelector('.fm-ack')?.textContent.replace(/\s+/g, ' ').trim(),
    ackLink: document.querySelector('.fm-ack a')?.getAttribute('href'),
    submit: document.querySelector('.fm-submit')?.textContent.trim(),
    phone: document.querySelector('.fm-phone')?.textContent.trim(),
    hours: [...document.querySelectorAll('.fm-hours li')].map((li) => li.textContent.trim()),
  }));
  check('contact: h1', c.h1 === 'Contact us', c.h1);
  const expectedLabels = ['Local Contact', 'Salutation *', 'First name *', 'Last name *', 'Your place of residence *', 'Email *', 'Code *', 'Number *', 'Preferred contact method *', 'Reason for contacting *', 'Your message *'];
  check('contact: 11 labels verbatim', JSON.stringify(c.labels) === JSON.stringify(expectedLabels), JSON.stringify(c.labels));
  check('contact: placeholders verbatim', JSON.stringify(c.placeholders) === JSON.stringify(['Fill in your first name', 'Fill in your last name', 'Enter your email address', '1234567890']), JSON.stringify(c.placeholders));
  const shown = c.selects.map((s) => s.shown);
  check('contact: select resting values', JSON.stringify(shown) === JSON.stringify(['Italy', 'Salutation', 'Select a country or region', 'Code', 'Contact me by...', 'Select a reason']), JSON.stringify(shown));
  check('contact: card select filled (Italy)', c.filledCard === true);
  check('contact: all controls labelled', c.inputsLabelled && c.selects.every((s) => s.labelled));
  check('contact: ack verbatim', c.ack === 'I acknowledge that my personal data will be processed in accordance with Audemars Piguet Privacy Notice. Read here .', c.ack);
  check('contact: ack link', (c.ackLink || '').includes('/ch/en/legal/privacy-notice'));
  check('contact: submit label', c.submit === 'Submit');
  check('contact: phone verbatim', c.phone === '+39 02 6749 3105', c.phone);
  check('contact: hours verbatim', c.hours.join(';').replace(/\s+/g, ' ') === 'Monday - Friday8:00 - 17:30;Saturday10:00 - 18:00;SundayClosed'.replace(/\s+/g, ' '), JSON.stringify(c.hours));

  // submit is inert (no navigation)
  const urlBefore = page.url();
  await page.click('.fm-submit');
  await page.waitForTimeout(500);
  check('contact: submit inert (deferred backend)', page.url() === urlBefore);
  await page.close();
}

await browser.close();
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
