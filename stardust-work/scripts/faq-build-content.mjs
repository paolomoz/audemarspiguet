// Build the FAQ content doc (content/ch/en/services/faq.html) + verbatim
// content manifest from the raw live page HTML (accordion content ships
// server-side inside <template> tags — no hydration needed for text).
// Usage: node faq-build-content.mjs <faq-raw.html> <out-content.html> <out-manifest.json>
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const [, , rawPath, outHtml, outManifest] = process.argv;
const raw = readFileSync(rawPath, 'utf8');
const main = raw.match(/<main[^>]*>([\s\S]*)<\/main>/)[1];

const decode = (s) => s
  .replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ');
// manifest-side full decode (content-diff comparisons run on plain text)
const decodeText = (s) => decode(s).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');

// split into ap-faq blocks (each has a title + ap-accordion items)
const faqBlocks = main.split('<ap-faq>').slice(1);
if (faqBlocks.length !== 7) throw new Error(`expected 7 faq groups, got ${faqBlocks.length}`);

const cleanAnswer = (tpl) => {
  // inner of <div class="text"> …; drop wrapper divs, keep p/a/br/b lists
  let t = tpl;
  const m = t.match(/<div class="text">([\s\S]*)<\/div>\s*$/);
  if (m) [, t] = m;
  t = t.replace(/<div class="toggle-content[^"]*"[^>]*>/g, '')
    .replace(/<div class="text">/g, '')
    .replace(/<\/div>/g, '')
    .replace(/\sdata-analytics[a-z-]*(="[^"]*")?/g, '')
    .replace(/\starget="_self"/g, '')
    .replace(/\srel="noopener noreferrer"/g, '')
    // root-relative live links → absolute, .html suffix kept (live URLs)
    .replace(/href="\/(ch\/en[^"]*)"/g, 'href="https://www.audemarspiguet.com/$1"')
    .replace(/href="\/(com\/[^"]*)"/g, 'href="https://www.audemarspiguet.com/$1"')
    .replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>')
    .replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
  // collapse whitespace between tags, trim
  t = t.replace(/\r/g, '').replace(/\n\s*\n+/g, '\n').trim();
  t = t.split('\n').map((l) => l.trim()).filter(Boolean).join('');
  return t;
};

const groups = faqBlocks.map((blk) => {
  const title = decode(blk.match(/class="ap-faq__title">([\s\S]*?)<\/h2>/)[1].trim());
  const items = [];
  const itemRe = /<template #label>([\s\S]*?)<\/template>\s*<template #default>([\s\S]*?)<\/template>/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = itemRe.exec(blk)) !== null) {
    const q = decode(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const a = decode(cleanAnswer(m[2]));
    items.push({ q, a });
  }
  return { title, items };
});

const total = groups.reduce((n, g) => n + g.items.length, 0);
if (total !== 63) throw new Error(`expected 63 items, got ${total}`);

// ---- content doc (EDS authored shape, mirrors content/*.html conventions)
const esc = (s) => s.replace(/&(?!#?\w+;)/g, '&amp;');
let out = '<body>\n<header></header>\n<main>\n';
out += '<div>\n  <div class="metadata">\n'
  + '    <div><div>Title</div><div>Audemars Piguet | FAQ</div></div>\n'
  + '    <div><div>Description</div><div>Frequently asked questions about Audemars Piguet services, warranty, authentication, straps, AP Coverage and masterclasses.</div></div>\n'
  + '    <div><div>Theme</div><div>light-page</div></div>\n'
  + '  </div>\n</div>\n';
groups.forEach((g, gi) => {
  out += '<div>\n';
  if (gi === 0) {
    out += '  <h1>Frequently Asked<br><em>Questions</em></h1>\n';
    out += '  <p>When you consider owning or caring for an Audemars Piguet watch, several questions may spring to mind. Below are some of the more common inquiries.</p>\n';
  }
  out += '  <div class="accordion">\n';
  out += `    <div><div><h2>${esc(g.title)}</h2></div></div>\n`;
  g.items.forEach(({ q, a }) => {
    out += `    <div><div><p>${esc(q)}</p></div><div>${esc(a)}</div></div>\n`;
  });
  out += '  </div>\n';
  out += '</div>\n';
});
out += '</main>\n<footer></footer>\n</body>\n';

mkdirSync(dirname(outHtml), { recursive: true });
writeFileSync(outHtml, out);
const manifestGroups = groups.map((g) => ({
  title: decodeText(g.title),
  items: g.items.map(({ q, a }) => ({ q: decodeText(q), a })),
}));
writeFileSync(outManifest, JSON.stringify({
  page: '/ch/en/services/faq',
  capturedAt: new Date().toISOString(),
  source: 'raw HTML <template> content (server-rendered)',
  intro: {
    h1: 'Frequently Asked Questions',
    p: 'When you consider owning or caring for an Audemars Piguet watch, several questions may spring to mind. Below are some of the more common inquiries.',
  },
  groups: manifestGroups,
}, null, 1));
console.log(`groups ${groups.length}, items ${total} -> ${outHtml}`);
