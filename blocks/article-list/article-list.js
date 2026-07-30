/**
 * article-list — AP news index (ap-news-main-article + ap-newslist):
 * featured story (huge card), card list, load-more; category filter driven
 * by the `chips` block (event `chips:filter`).
 *
 * Authoring rows (positional):
 *  1. featured desktop image (img; live rendition ?size=1920,0)
 *  2. featured mobile image (img; art-directed narrow rendition)
 *  3. featured title (text)
 *  4. featured category label (text, e.g. News)
 *  5. featured description (text)
 *  6. featured CTA (link to the article; label e.g. "View story")
 *  7. feed (link to the article index JSON — snapshot /data/news-*.json
 *     today, per-locale query-index after cutover; query-index row shape)
 *  8. load-more label (text, e.g. "Load more Stories")
 *
 * Live list semantics (probed 2026-07-30): feed order preserved; the
 * featured article is excluded from the unfiltered list but appears as a
 * normal card in its category filter; 12 cards per page; load-more appends
 * a page and scrolls the first new card into view.
 */

const AP_ORIGIN = 'https://www.audemarspiguet.com';
const PAGE_SIZE = 12;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

/** live card renditions: ≥1501 image, ≥1025 imageTabletWide, ≥768 imageTablet, else imageMobile */
function cardPicture(item, alt) {
  return `<picture>
    <source media="(min-width: 1501px)" srcset="${item.image}">
    <source media="(min-width: 1025px)" srcset="${item.imageTabletWide || item.image}">
    <source media="(min-width: 768px)" srcset="${item.imageTablet || item.image}">
    <img src="${item.imageMobile || item.image}" alt="${alt || ''}" loading="lazy">
  </picture>`;
}

function cardHTML(item) {
  const href = item.path && item.path.startsWith('/') ? AP_ORIGIN + item.path : item.path;
  return `<li class="al-item" data-filter="${item.filter || ''}">
    <a class="al-card" href="${href}" aria-label="View story - ${item.title}">
      <div class="al-card-image">${cardPicture(item, item.title)}</div>
      <div class="al-card-content">
        <div class="al-card-left">
          <h3 class="al-card-title">${item.title}</h3>
          <div class="al-card-tag">${item.category ? `<span class="al-chip">${item.category}</span>` : ''}</div>
        </div>
        <div class="al-card-right">
          <div class="al-card-desc"><p>${item.description || ''}</p></div>
          <span class="ap-link">View story</span>
        </div>
      </div>
    </a>
  </li>`;
}

/** AP scroll-reveal on card text (settled motion values; reveal CSS in styles.css) */
function primeReveal(scope, io) {
  if (REDUCED.matches) return;
  scope.querySelectorAll('.al-card').forEach((card) => {
    if (card.dataset.revealPrimed) return;
    card.dataset.revealPrimed = 'true';
    [['.al-card-title', 0], ['.al-card-tag', 200], ['.al-card-desc', 200], ['.ap-link', 400]]
      .forEach(([sel, delay]) => {
        const el = card.querySelector(sel);
        if (!el) return;
        el.classList.add('reveal-init');
        el.style.transitionDelay = `${delay}ms`;
      });
    io.observe(card);
  });
}

export default async function decorate(block) {
  const rows = [...block.children].map((r) => [...r.children]);
  const cell = (i) => (rows[i] && rows[i][0]) || null;
  const text = (i) => (cell(i) ? cell(i).textContent.trim() : '');
  const desktopImg = cell(0)?.querySelector('img');
  const mobileImg = cell(1)?.querySelector('img');
  const featuredTitle = text(2);
  const featuredCategory = text(3);
  const featuredDesc = text(4);
  const featuredCta = cell(5)?.querySelector('a');
  const feedRaw = cell(6)?.querySelector('a')?.getAttribute('href') || text(6);
  const loadMoreLabel = text(7) || 'Load more Stories';

  let feed = feedRaw;
  try { feed = new URL(feedRaw, window.location).pathname; } catch { /* keep raw */ }

  const featuredHref = featuredCta ? featuredCta.getAttribute('href') : '';
  let featuredPath = featuredHref;
  try { featuredPath = new URL(featuredHref, window.location).pathname; } catch { /* keep raw */ }

  // featured picture: middle renditions derived from the authored desktop
  // asset (live: ?size=900,0 at ≥1025, layer crop at ≥768)
  const base = desktopImg ? desktopImg.src.split('?')[0] : '';
  const featuredPic = `<picture>
    <source media="(min-width: 1501px)" srcset="${base}?size=1920,0&dpr=off">
    <source media="(min-width: 1025px)" srcset="${base}?size=900,0&dpr=off">
    <source media="(min-width: 768px)" srcset="${base}?layer=2&wid=768&hei=470&scl=1.6&dpr=off">
    <img src="${mobileImg ? mobileImg.src : base}" alt="${desktopImg ? desktopImg.alt : ''}">
  </picture>`;

  block.innerHTML = `
    <div class="al-featured" aria-label="View story - ${featuredTitle}">
      <div class="grid-container">
        <a class="al-card al-card-huge" href="${featuredHref}" aria-label="View story - ${featuredTitle}">
          <div class="al-card-image">${featuredPic}</div>
          <div class="al-card-content">
            <div class="al-card-left">
              <h3 class="al-card-title">${featuredTitle}</h3>
              <div class="al-card-tag"><span class="al-chip">${featuredCategory}</span></div>
            </div>
            <div class="al-card-right">
              <div class="al-card-desc"><p>${featuredDesc}</p></div>
              <span class="ap-link">${featuredCta ? featuredCta.textContent.trim() : 'View story'}</span>
            </div>
          </div>
        </a>
      </div>
    </div>
    <div class="al-list">
      <div class="grid-container">
        <ul class="al-items"></ul>
        <div class="al-cta-row">
          <button type="button" class="al-load-more">${loadMoreLabel} <span aria-hidden="true">+</span></button>
        </div>
      </div>
    </div>`;

  const listEl = block.querySelector('.al-items');
  const featuredEl = block.querySelector('.al-featured');
  const btn = block.querySelector('.al-load-more');

  let items = [];
  try {
    const resp = await fetch(feed);
    const json = await resp.json();
    items = json.data || [];
  } catch { items = []; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.reveal-init').forEach((el) => el.classList.add('reveal-in'));
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });

  let activeFilter = new URLSearchParams(window.location.search).get('filter') || '';
  let shown = 0;

  const matches = () => (activeFilter
    ? items.filter((it) => it.filter === activeFilter)
    : items.filter((it) => it.path !== featuredPath));

  const render = (count, { fresh = false } = {}) => {
    const pool = matches();
    if (fresh) { listEl.innerHTML = ''; shown = 0; }
    const next = pool.slice(shown, count);
    const firstNewIndex = listEl.children.length;
    listEl.insertAdjacentHTML('beforeend', next.map(cardHTML).join(''));
    shown += next.length;
    btn.parentElement.hidden = shown >= pool.length;
    featuredEl.hidden = !!activeFilter;
    primeReveal(listEl, io);
    return listEl.children[firstNewIndex];
  };

  render(PAGE_SIZE, { fresh: true });
  primeReveal(featuredEl, io);

  btn.addEventListener('click', () => {
    const firstNew = render(shown + PAGE_SIZE);
    // live scrolls the first appended row into view after the append
    if (firstNew) {
      firstNew.scrollIntoView({
        behavior: REDUCED.matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  });

  document.addEventListener('chips:filter', (e) => {
    activeFilter = (e.detail && e.detail.id) || '';
    render(PAGE_SIZE, { fresh: true });
  });
}
