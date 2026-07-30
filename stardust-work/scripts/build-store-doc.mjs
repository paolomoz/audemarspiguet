/**
 * build-store-doc — generates the EDS content doc for a store-detail page
 * (archetype F) from a captured Yext entity snapshot. This is the working
 * prototype of the per-store generator (76 pages/locale): every block slot
 * is filled mechanically from entity fields — see the DATA→TEMPLATE mapping
 * in the archetype report / block headers.
 *
 * Usage: node build-store-doc.mjs <entity.json> <out.html>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const [, , inJson, outHtml] = process.argv;
const data = JSON.parse(readFileSync(inJson, 'utf-8'));
const { store, gallerySlides, nearby } = data;

const SITE = 'https://www.audemarspiguet.com';
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Yext hours → one line per day: "Monday 10:00 — 18:30, 14:30 — 19:00" */
function hoursLines(hours) {
  return DAY_ORDER.map((day) => {
    const d = hours[day];
    if (!d || d.closed || d.isClosed || !(d.openIntervals || []).length) return `${cap(day)} Closed`;
    const ivs = d.openIntervals.map((iv) => `${iv.start} — ${iv.end}`).join(', ');
    return `${cap(day)} ${ivs}`;
  });
}

/** role line — live derives it from c_titleBoutiqueType + c_serviceCenter */
function roleLine(entity) {
  const type = entity.c_titleBoutiqueType === 'AP_HOUSE' ? 'AP House' : 'Boutique';
  return entity.c_serviceCenter ? `${type} | Service Center` : type;
}

function addressLine(a) {
  return `${a.line1}, ${a.postalCode} ${a.city}`;
}

function mapsUrl(a) {
  // live appends the entity countryCode and leaves commas unencoded
  const q = encodeURIComponent(`${addressLine(a)}, ${a.countryCode}`).replace(/%2C/g, ',');
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

const telHref = (phone) => `tel:${phone}`;

/* ---- boutique-hero ---- */
const heroImg = store.photoGallery?.[0]?.image;
const storeId = store.meta.id;
const heroRows = [
  ['link', `<a href="${SITE}/ch/en/stores">Explore all boutiques</a>`],
  ['name', `<h1>${esc(store.name)}</h1>`],
  ['role', esc(roleLine(store))],
  ['image', `<img src="${esc(heroImg.url)}" alt="${esc(`${roleLine(store)} ${store.address.city}`)}">`],
  ['panel-title', 'Contact details'],
  ['timezone', esc(store.timezone)],
  ['hours', hoursLines(store.hours).map((l) => `<p>${esc(l)}</p>`).join('')],
  ['labels', 'Open now | Closed now | Closed'],
  ['address', `<a href="${esc(mapsUrl(store.address))}">${esc(addressLine(store.address))}</a>`],
  ['email', `<a href="mailto:${esc(store.emails[0])}">Contact us</a>`],
  ['phone', `<a href="${esc(telHref(store.mainPhone))}">${esc(store.mainPhone)}</a>`],
  ['appointment', `<a href="${SITE}/ch/en/form/appointment?storeId=${esc(storeId)}">Plan an Appointment</a>`],
  store.c_masterclass ? ['masterclass', `<a href="${esc(store.c_masterclass)}">Book a masterclass</a>`] : null,
  ['quote', `<p>${esc(store.c_quoteBoutiquePages)}</p>`],
].filter(Boolean);

const heroHtml = heroRows
  .map(([k, v]) => `    <div><div>${k}</div><div>${v}</div></div>`)
  .join('\n');

/* ---- gallery carousel (photoGallery + tablet/mobile renditions) ---- */
const galleryAlt = (i) => esc(store.photoGallery?.[i + 1]?.image?.alternateText || '');
const galleryRows = gallerySlides.map((s, i) => [
  `<div><img src="${esc(s.url)}" alt="${galleryAlt(i)}"></div>`,
  `<div><img src="${esc(s['url-tablet'])}" alt=""></div>`,
  `<div><img src="${esc(s['url-mobile'])}" alt=""></div>`,
].join('')).map((cells) => `<div>${cells}</div>`).join('\n');

/* ---- nearby stores carousel ---- */
const nearbyRows = nearby.map(({ pageUrl, entity }) => {
  const img = entity.photoGallery?.[0]?.image;
  const info = [
    `<p><a href="${esc(pageUrl)}">${esc(entity.name)}</a></p>`,
    `<p>${esc(roleLine(entity))}</p>`,
    ...hoursLines(entity.hours).map((l) => `<p>${esc(l)}</p>`),
    `<p>${esc(entity.timezone)}</p>`,
    `<p><a href="${esc(mapsUrl(entity.address))}">${esc(addressLine(entity.address))}</a></p>`,
  ].join('');
  return `<div><div><img src="${esc(img.url)}" alt=""></div><div>${info}</div></div>`;
}).join('\n');

/* ---- page ---- */
const html = `<body>
<header></header>
<main>
<div>
  <div class="boutique-hero">
${heroHtml}
  </div>
</div>
<div>
  <h2>About this<br><em>${esc(roleLine(store).split(' | ')[0])}</em></h2>
  <p>${esc(store.c_descriptionBoutiquePages)}</p>
  <div class="carousel gallery">
${galleryRows}
  </div>
</div>
<div>
  <h2>Explore our other<br><em>boutiques nearby</em></h2>
  <p><a href="${SITE}/ch/en/stores">Explore all boutiques</a></p>
  <div class="carousel boutiques">
    <div><div>Open now | Closed now | Closed</div></div>
${nearbyRows}
  </div>
</div>
<div>
  <div class="newsletter">
    <div><div><h2>Get the<br><em>Latest News</em></h2></div></div>
    <div><div><p>Be the first to receive the latest news on our brand, products and upcoming events.</p></div></div>
    <div><div><p><strong><a href="${SITE}/ch/en/form/newsletter-subscription">Subscribe</a></strong></p></div></div>
  </div>
</div>
<div>
  <div class="metadata">
    <div><div>title</div><div>${esc(store.name)} - Audemars Piguet</div></div>
  </div>
</div>
</main>
<footer></footer>
</body>
`;

mkdirSync(dirname(outHtml), { recursive: true });
writeFileSync(outHtml, html);
console.log(`[build-store-doc] ${store.name} -> ${outHtml} (${Math.round(html.length / 1024)}KB, ${nearby.length} nearby, ${gallerySlides.length} gallery slides)`);
