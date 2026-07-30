// A+ module-page lift (FAQ / contact-us): dwell-hydrated DOM snapshot +
// verbatim content manifest + computed-style lift at a breakpoint.
// Pattern cloned from home-lift.mjs; adds accordion + form field extraction.
// Usage: node aplus-lift.mjs <url> <width> <out.json> [--dom <out.html>]
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = process.argv[2];
const width = parseInt(process.argv[3] || '1440', 10);
const outJson = process.argv[4];
const domIdx = process.argv.indexOf('--dom');
const outHtml = domIdx > -1 ? process.argv[domIdx + 1] : null;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({
  viewport: { width, height: 900 },
  deviceScaleFactor: 2, userAgent: UA, locale: 'en-GB',
})).newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
try { const b = page.locator('#onetrust-accept-btn-handler'); if (await b.isVisible({ timeout: 4000 })) await b.click(); } catch {}
await page.evaluate(async () => {
  document.querySelectorAll('#onetrust-banner-sdk, #onetrust-consent-sdk').forEach((n) => n.remove());
  const step = Math.round(window.innerHeight * 0.6); let y = 0;
  while (y < document.body.scrollHeight) { y += step; window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 900)); }
  await new Promise((r) => setTimeout(r, 2000)); window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 800));
});

const PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'max-width', 'width', 'height', 'display', 'grid-template-columns', 'gap', 'border-radius', 'border', 'border-top', 'border-bottom', 'text-align', 'opacity', 'position', 'appearance', 'justify-content', 'align-items', 'flex-direction', 'transition', 'transform', 'cursor', 'overflow', 'text-decoration-line'];

const data = await page.evaluate((PROPS) => {
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el); const o = {};
    PROPS.forEach((p) => { o[p] = s.getPropertyValue(p); });
    const r = el.getBoundingClientRect();
    o._rect = { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), left: Math.round(r.left) };
    return o;
  };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);

  const main = document.querySelector('#maincontent') || document.querySelector('main') || document.body;
  const mods = [...main.children]
    .flatMap((el) => (el.classList.contains('parsys') ? [...el.children] : [el]))
    .filter((el) => el.getBoundingClientRect().height > 8);

  const modules = mods.map((el) => {
    const r = el.getBoundingClientRect();
    const headings = [...el.querySelectorAll('h1,h2,h3,h4')].filter((h) => h.getBoundingClientRect().height > 0).map((h) => ({
      tag: h.tagName, text: txt(h), html: h.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 500), style: cs(h),
    }));
    const paras = [...el.querySelectorAll('p')].filter((p) => txt(p) && p.getBoundingClientRect().height > 0).map((p) => ({ text: txt(p), style: cs(p) })).slice(0, 30);
    const ctas = [...el.querySelectorAll('a, button')].filter((a) => txt(a) && a.getBoundingClientRect().height > 0).map((a) => ({ tag: a.tagName, text: txt(a).slice(0, 90), href: a.getAttribute('href'), cls: (a.className || '').toString().slice(0, 100), style: cs(a) })).slice(0, 30);

    // accordion structure (FAQ)
    const accGroups = [...el.querySelectorAll('.ap-faq__content, [data-cmp-is="accordion"]')].map((g) => ({
      cls: g.className, style: cs(g),
      items: [...g.querySelectorAll('.ap-faq__item')].slice(0, 70).map((it) => {
        const title = it.querySelector('.ap-faq__item-title');
        const content = it.querySelector('.ap-faq__item-content');
        const toggler = it.querySelector('button, [role="button"], .toggle-title, summary') || it.firstElementChild;
        const icon = it.querySelector('svg, i, [class*=icon], [class*=chevron], [class*=arrow]');
        return {
          rootCls: it.className, rootTag: it.tagName, rootHtmlHead: it.outerHTML.slice(0, 700),
          title: txt(title), titleStyle: cs(title),
          togglerCls: toggler ? toggler.className : null, togglerTag: toggler ? toggler.tagName : null, togglerStyle: cs(toggler),
          iconCls: icon ? icon.className.toString() : null, iconTag: icon ? icon.tagName : null,
          iconHtml: icon ? icon.outerHTML.slice(0, 500) : null, iconStyle: cs(icon),
          contentPresent: !!content, contentVisible: content ? content.getBoundingClientRect().height > 0 : false,
          contentStyle: cs(content),
          contentHtml: content ? content.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 4000) : null,
          itemStyle: cs(it),
        };
      }),
    }));

    // form structure (contact-us)
    const fields = [...el.querySelectorAll('input, select, textarea')].slice(0, 60).map((f) => {
      const wrap = f.closest('[class*=field], [class*=form-group], [class*=input], label, div');
      const label = (f.id && el.querySelector(`label[for="${f.id}"]`)) || wrap?.querySelector('label') || null;
      return {
        tag: f.tagName, type: f.getAttribute('type'), name: f.getAttribute('name') || f.id,
        placeholder: f.getAttribute('placeholder'), required: f.required || null,
        value: f.tagName === 'SELECT' ? (f.selectedOptions[0]?.textContent || '').trim() : f.value,
        options: f.tagName === 'SELECT' ? [...f.options].slice(0, 40).map((o) => o.textContent.trim()) : null,
        checked: f.checked || null,
        cls: (f.className || '').toString().slice(0, 120),
        style: cs(f),
        wrapCls: wrap ? wrap.className.toString().slice(0, 120) : null, wrapStyle: cs(wrap),
        label: txt(label), labelStyle: cs(label),
        labelHtml: label ? label.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 600) : null,
      };
    });
    const legends = [...el.querySelectorAll('legend, fieldset > :first-child, [class*=section-title]')].slice(0, 20).map((l) => ({ tag: l.tagName, cls: l.className.toString().slice(0, 100), text: txt(l)?.slice(0, 200), style: cs(l) }));
    const spans = [...el.querySelectorAll('span, small, label')].filter((s) => {
      const t = txt(s); const rr = s.getBoundingClientRect();
      return t && t.length > 1 && t.length < 300 && rr.height > 0 && rr.height < 200;
    }).slice(0, 80).map((s) => ({ tag: s.tagName, cls: s.className.toString().slice(0, 100), text: txt(s).slice(0, 240), style: cs(s) }));

    return {
      cls: (el.className || '').toString().slice(0, 140), id: el.id || null,
      rect: { top: Math.round(r.top + scrollY), h: Math.round(r.height) },
      sectionStyle: cs(el),
      innerRoot: (el.firstElementChild?.className || '').toString().slice(0, 140),
      headings, paras, ctas, accGroups, fields, legends, spans,
    };
  });
  return {
    pageH: document.body.scrollHeight,
    title: document.title,
    mainCls: main.className.toString(),
    modules,
  };
}, PROPS);

writeFileSync(outJson, JSON.stringify(data, null, 1));
console.log(`[aplus-lift] ${width}w: ${data.modules.length} modules, pageH ${data.pageH} -> ${outJson}`);
if (outHtml) {
  const html = await page.content();
  writeFileSync(outHtml, html);
  console.log(`[aplus-lift] DOM snapshot -> ${outHtml} (${Math.round(html.length / 1024)}KB)`);
}
await browser.close();
