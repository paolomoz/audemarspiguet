/**
 * specifications — PDP spec module (live ap-specifications): display title,
 * user-guide link, Watch / Calibre / Warranty tabs. Watch tab: Case spec list
 * + Dial / Bracelet texts (left) and the standup image (right; art-directed
 * mobile rendition above the fold on small screens). Tab switching is
 * instant (live v-show) with the 0.3s ease-in-out label color transition.
 *
 * Authoring rows (key | content):
 *   userguide | link          image | desktop img + mobile img
 *   case | "Label: value" p's       dial | p        bracelet | p
 *   calibre | h3 + "Label: value" p's     warranty | rich text
 */

const TABS = [
  { id: 'watch', label: 'Watch' },
  { id: 'calibre', label: 'Calibre' },
  { id: 'warranty', label: 'Warranty' },
];

function specList(cell) {
  const ul = document.createElement('ul');
  ul.className = 'sp-list';
  [...cell.querySelectorAll('p')].forEach((p) => {
    const txt = p.textContent.trim();
    const idx = txt.indexOf(':');
    if (idx < 0) return;
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'sp-label';
    label.textContent = txt.slice(0, idx).trim();
    const value = document.createElement('span');
    value.className = 'sp-value';
    value.textContent = txt.slice(idx + 1).trim();
    li.append(label, value);
    ul.append(li);
  });
  return ul;
}

export default function decorate(block) {
  const rows = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = [...row.children];
    if (!keyCell || !valueCell) return;
    rows[keyCell.textContent.trim().toLowerCase()] = valueCell;
  });

  const root = document.createElement('div');
  root.className = 'sp-root';
  const container = document.createElement('div');
  container.className = 'grid-container';

  const title = document.createElement('h2');
  title.className = 'sp-title';
  title.textContent = 'Specifications';
  container.append(title);

  const imgs = rows.image ? [...rows.image.querySelectorAll('img')] : [];
  if (imgs[1]) {
    const mob = document.createElement('div');
    mob.className = 'sp-mobile-img';
    imgs[1].setAttribute('loading', 'lazy');
    mob.append(imgs[1]);
    container.append(mob);
  }

  if (rows.userguide) {
    const ug = document.createElement('div');
    ug.className = 'sp-userguide';
    const link = rows.userguide.querySelector('a');
    if (link) {
      link.className = 'sp-ug-link';
      ug.append(link);
    }
    container.append(ug);
  }

  // tabs
  const tablist = document.createElement('ul');
  tablist.className = 'sp-tabs';
  tablist.setAttribute('role', 'tablist');
  const panels = {};
  TABS.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = `sp-tab-btn${i === 0 ? ' sp-tab-btn-active' : ''}`;
    li.setAttribute('role', 'presentation');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `sp-tab-${t.id}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', `sp-panel-${t.id}`);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.textContent = t.label;
    li.append(btn);
    tablist.append(li);
    const panel = document.createElement('div');
    panel.className = 'sp-panel';
    panel.id = `sp-panel-${t.id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `sp-tab-${t.id}`);
    if (i > 0) panel.hidden = true;
    panels[t.id] = panel;
  });
  container.append(tablist);

  // watch panel
  const grid = document.createElement('div');
  grid.className = 'sp-watch-grid';
  const left = document.createElement('div');
  left.className = 'sp-watch-left';
  if (rows.case) {
    const cell = document.createElement('div');
    cell.className = 'sp-cell';
    const h3 = document.createElement('h3');
    h3.className = 'sp-subtitle';
    h3.textContent = 'Case';
    cell.append(h3, specList(rows.case));
    left.append(cell);
  }
  const halves = document.createElement('div');
  halves.className = 'sp-halves';
  [['dial', 'Dial'], ['bracelet', 'Bracelet']].forEach(([key, label]) => {
    if (!rows[key]) return;
    const cell = document.createElement('div');
    cell.className = 'sp-cell sp-cell-half';
    const h3 = document.createElement('h3');
    h3.className = 'sp-subtitle';
    h3.textContent = label;
    const text = document.createElement('div');
    text.className = 'sp-text';
    text.append(...rows[key].querySelectorAll('p'));
    cell.append(h3, text);
    halves.append(cell);
  });
  left.append(halves);
  const right = document.createElement('div');
  right.className = 'sp-watch-right';
  if (imgs[0]) {
    imgs[0].setAttribute('loading', 'lazy');
    right.append(imgs[0]);
  }
  grid.append(left, right);
  panels.watch.append(grid);

  // calibre panel
  if (rows.calibre) {
    const cal = document.createElement('div');
    cal.className = 'sp-calibre';
    const h3 = rows.calibre.querySelector('h3');
    if (h3) {
      h3.className = 'sp-subtitle';
      cal.append(h3);
    }
    const half = document.createElement('div');
    half.className = 'sp-calibre-list';
    half.append(specList(rows.calibre));
    cal.append(half);
    panels.calibre.append(cal);
  }

  // warranty panel
  if (rows.warranty) {
    const wr = document.createElement('div');
    wr.className = 'sp-text sp-text-half';
    wr.append(...rows.warranty.children);
    panels.warranty.append(wr);
  }

  container.append(panels.watch, panels.calibre, panels.warranty);
  root.append(container);
  block.replaceChildren(root);

  // tab switching (live: instant panel swap)
  const buttons = [...tablist.querySelectorAll('button')];
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b, j) => {
        b.setAttribute('aria-selected', i === j ? 'true' : 'false');
        b.parentElement.classList.toggle('sp-tab-btn-active', i === j);
        panels[TABS[j].id].hidden = i !== j;
      });
    });
  });
}
