#!/usr/bin/env node
/**
 * aplus-harness.mjs — build a local gate harness from a content doc, running
 * the REAL runtime (styles/styles.css + scripts/scripts.js + blocks/*).
 * Unlike build-harness.mjs it carries the metadata block into <head> meta
 * tags (theme: light-page must reach decorateTemplateAndTheme) and emits
 * /nav.plain.html + /footer.plain.html alongside so loadHeader/loadFooter
 * resolve against the static server.
 *
 * Usage: node aplus-harness.mjs <contentFile> <outHarness>
 *        node aplus-harness.mjs --chrome            (writes nav/footer plain)
 */
import { readFileSync, writeFileSync } from 'fs';

function matchDivEnd(s, start) {
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = start;
  let depth = 0;
  let m = re.exec(s);
  while (m) {
    if (m[0][1] === '/') { depth -= 1; if (depth === 0) return m.index + m[0].length; } else depth += 1;
    m = re.exec(s);
  }
  return s.length;
}

function mainOf(file) {
  const html = readFileSync(file, 'utf8');
  const mm = html.match(/<main[\s\S]*?<\/main>/i);
  return mm ? mm[0] : html;
}

if (process.argv[2] === '--chrome') {
  ['nav', 'footer'].forEach((name) => {
    let main = mainOf(`content/${name}.html`).replace(/^<main[^>]*>/i, '').replace(/<\/main>$/i, '');
    // DA delivery wraps authored images in <picture> — mimic it so
    // picture-scoped chrome CSS behaves like the deployed pages
    main = main.replace(/<img\b[^>]*>/gi, (img) => `<picture>${img}</picture>`);
    writeFileSync(`${name}.plain.html`, main.trim());
    console.log(`${name}.plain.html written`);
  });
  process.exit(0);
}

const [, , inFile, outFile] = process.argv;
let main = mainOf(inFile);

// lift metadata block into meta tags, then remove it
const metas = [];
const metaAttr = main.indexOf('class="metadata"');
if (metaAttr >= 0) {
  const metaDiv = main.lastIndexOf('<div', metaAttr);
  const wrapDiv = main.lastIndexOf('<div', metaDiv - 1);
  const end = matchDivEnd(main, wrapDiv);
  const metaHtml = main.slice(wrapDiv, end);
  const rowRe = /<div><div>([^<]+)<\/div><div>([^<]+)<\/div><\/div>/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = rowRe.exec(metaHtml)) !== null) {
    const k = m[1].trim().toLowerCase();
    const v = m[2].trim();
    if (k === 'title') metas.push(`<title>${v}</title>`);
    else metas.push(`<meta name="${k}" content="${v}">`);
  }
  main = (main.slice(0, wrapDiv) + main.slice(end)).replace(/\n\s*\n/g, '\n');
}

const doc = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${metas.join('\n')}
<script src="/scripts/aem.js" type="module"></script>
<script src="/scripts/scripts.js" type="module"></script>
<link rel="stylesheet" href="/styles/styles.css">
<link rel="icon" href="data:,"></head>
<body>
<header></header>
${main}
<footer></footer>
</body></html>`;
writeFileSync(outFile, doc);
console.log(`harness written: ${outFile} (${doc.length} bytes)`);
