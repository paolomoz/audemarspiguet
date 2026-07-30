/**
 * chips — AP category chips/tabs (ap-filter-bar + ap-tab-item), news index.
 *
 * Authoring rows (positional):
 *  1. optional page heading (h1, kept as-is)
 *  2..n one link per tab; "All" tab links the page itself, category tabs
 *       carry ?filter=<id> (ids mirror the live site: origin, savoir-faire,
 *       art, music)
 *
 * Live navigates on tab click (full page per filter); here the filter is
 * client-side (implementation plan §2.2): the click updates the URL query
 * and dispatches `chips:filter`, which `article-list` listens to.
 */

function filterIdOf(href) {
  try {
    return new URL(href, window.location).searchParams.get('filter') || '';
  } catch {
    return '';
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  const heading = rows[0]?.querySelector('h1, h2, h3');
  const links = rows
    .map((r) => r.querySelector('a'))
    .filter(Boolean)
    .map((a) => ({
      label: a.textContent.trim(),
      href: a.getAttribute('href'),
      id: filterIdOf(a.getAttribute('href')),
    }));

  const current = new URLSearchParams(window.location.search).get('filter') || '';

  block.textContent = '';
  if (heading) {
    const head = document.createElement('div');
    head.className = 'grid-container chips-head';
    head.append(heading);
    block.append(head);
  }

  const bar = document.createElement('div');
  bar.className = 'chips-bar';
  bar.innerHTML = `<div class="chips-scroll"><div class="grid-container chips-rule"><ul class="chips-list">${links
    .map((l) => `<li class="chip-tab${l.id === current ? ' chip-tab-active' : ''}" data-filter-id="${l.id}">
      <a href="${l.href}" role="link" aria-current="${l.id === current}">${l.label}</a>
    </li>`)
    .join('')}</ul></div></div>`;
  block.append(bar);

  const tabs = [...bar.querySelectorAll('.chip-tab')];
  tabs.forEach((tab) => {
    tab.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      const id = tab.dataset.filterId;
      tabs.forEach((t) => {
        t.classList.toggle('chip-tab-active', t === tab);
        t.querySelector('a').setAttribute('aria-current', String(t === tab));
      });
      const url = new URL(window.location);
      if (id) url.searchParams.set('filter', id);
      else url.searchParams.delete('filter');
      window.history.pushState({ filter: id }, '', url);
      document.dispatchEvent(new CustomEvent('chips:filter', { detail: { id } }));
    });
  });

  // browser back/forward keeps tabs + list in sync
  window.addEventListener('popstate', () => {
    const id = new URLSearchParams(window.location.search).get('filter') || '';
    tabs.forEach((t) => {
      const on = t.dataset.filterId === id;
      t.classList.toggle('chip-tab-active', on);
      t.querySelector('a').setAttribute('aria-current', String(on));
    });
    document.dispatchEvent(new CustomEvent('chips:filter', { detail: { id } }));
  });
}
