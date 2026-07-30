/**
 * product-listing — search bar + sticky toolbar + product grid, hydrated
 * from a JSON product feed (snapshot of the source site's
 * `.products.<set>.json` endpoints, committed under /data).
 *
 * Authoring rows (positional):
 *  1. search placeholder text
 *  2. group heading text
 *  3. data feed path (plain link or text, e.g. /data/products-core-collection.json)
 *  4. (optional) compare data feed (default: row 3 with "products-" → "compare-")
 *  5. (optional) compare modal fragment doc (default: /<cc>/<lang>/fragments/compare-modal)
 *
 * Compare (R-02): toolbar toggle + card checkboxes + status bar + comparison
 * overlay live in ./compare.js, loaded on demand — zero resting-state change.
 * Live quick-view carousel stays off, matching the source page
 * (:is-showing-product-card-carousel="false").
 */

const AP_ORIGIN = 'https://www.audemarspiguet.com';
const absUrl = (u) => (u && u.startsWith('/') ? AP_ORIGIN + u : u);

function cardHTML(p) {
  const img = p.mainImage || {};
  const src = absUrl(img.link || img.tabletLink || '');
  const mobile = absUrl(img.mobileLink) || src;
  const title = p.collectionTitle || '';
  const name = p.productTitle || '';
  const sub = [p.size ? `${p.size}${p.sizeUnit || 'mm'}` : '', p.materials].filter(Boolean).join(', ');
  const href = p.link
    ? `https://www.audemarspiguet.com${p.link}`
    : `https://www.audemarspiguet.com/ch/en/watch-collection/code-1159/${p.reference}`;
  return `<li class="product-card">
    <a href="${href}">
      <figure><picture>
        <source media="(min-width: 768px)" srcset="${src}">
        <img src="${mobile}" alt="${title}" loading="lazy">
      </picture></figure>
      <p class="product-ref">${p.reference || ''}</p>
      <h3><b>${title}</b><span>${name}</span></h3>
      <p class="product-sub">${sub}</p>
    </a>
  </li>`;
}

export default async function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const placeholder = rows[0]?.textContent.trim() || 'Search for watches';
  const groupHeading = rows[1]?.textContent.trim() || '';
  // authors write a fully-qualified URL (D4); code extracts the pathname
  const rowPath = (row) => {
    const raw = row?.querySelector('a')?.getAttribute('href') || row?.textContent.trim();
    if (!raw) return '';
    try { return new URL(raw, window.location).pathname; } catch { return raw; }
  };
  const feed = rowPath(rows[2]);
  const compareFeed = rowPath(rows[3]) || feed.replace(/products-/, 'compare-');
  const [, cc, lang] = window.location.pathname.split('/');
  const compareFragment = rowPath(rows[4]) || `/${cc}/${lang}/fragments/compare-modal`;

  block.innerHTML = `
    <h2 class="sr-only">Search for watches</h2>
    <div class="grid-container pl-search">
      <div class="pl-search-row">
        <input type="text" placeholder="${placeholder}" aria-label="${placeholder}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"></circle><path d="M16 16l6 6"></path></svg>
      </div>
    </div>
    <div class="pl-toolbar">
      <div class="grid-container">
        <button type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="7" r="2.2"></circle><path d="M2 7h3.8M10.2 7H22"></path><circle cx="16" cy="15" r="2.2"></circle><path d="M2 15h11.8M18.2 15H22"></path></svg>Filters</button>
        <button type="button" class="pl-compare"><span class="compare-label">Compare</span><svg class="compare-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4"></path></svg></button>
      </div>
    </div>
    <div class="grid-container">
      <p class="pl-group-heading">${groupHeading}</p>
      <ul class="pl-grid"></ul>
      <p class="pl-no-results" hidden>No results</p>
    </div>`;

  const grid = block.querySelector('.pl-grid');
  let products = [];
  try {
    const resp = await fetch(feed);
    const data = await resp.json();
    products = Array.isArray(data) ? data : Object.values(data)[0] || [];
  } catch {
    products = [];
  }
  grid.innerHTML = products.map(cardHTML).join('');

  // simple client-side search over reference + titles
  const input = block.querySelector('input');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    [...grid.children].forEach((li, i) => {
      const hit = !q || li.textContent.toLowerCase().includes(q);
      li.hidden = !hit;
      if (hit) visible += 1;
      return i;
    });
    block.querySelector('.pl-no-results').hidden = visible > 0;
  });

  // compare mode (R-02): behavior module loaded on demand, resting DOM untouched
  const compareToggle = block.querySelector('.pl-compare');
  compareToggle.setAttribute('aria-expanded', 'false');
  compareToggle.setAttribute('aria-label', 'Compare');
  let comparePromise = null;
  const loadCompare = (activate) => {
    if (!comparePromise) {
      comparePromise = import('./compare.js').then(({ default: initCompare }) => initCompare({
        block,
        toggle: compareToggle,
        products,
        dataPath: compareFeed,
        fragmentPath: compareFragment,
        activate,
      }));
    }
    return comparePromise;
  };
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(`ap-compare:${window.location.pathname}`) || 'null'); } catch { /* ignore */ }
  if (saved && saved.active) loadCompare(false);
  else {
    compareToggle.addEventListener('click', () => loadCompare(true), { once: true });
  }
}
