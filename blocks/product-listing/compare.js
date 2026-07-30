/**
 * product-listing compare module (inconsistency register R-02).
 *
 * Replicates the live site's `<ap-product-grid :is-compare-enabled="true">`
 * behavior: the toolbar "Compare" toggle puts the grid into compare mode
 * (28px checkbox per card, top right), a fixed status bar slides up from the
 * bottom (3 slots, thumbs + plus placeholders, Cancel / Compare CTAs), and
 * submitting opens the full-screen "Watch Comparison" overlay (Case / Dial /
 * Bracelet / Calibre sections, calibre front/back flip).
 *
 * Data: snapshot of AP's `.compare.<b64refs>.json` servlet under /data
 * (the live endpoint sends no CORS headers — same policy as the grid feed).
 * The live `modal-fragment` experience fragment 404s on audemarspiguet.com
 * itself and is ignored by their code; the authorable strings (title +
 * labels) live in a DA fragment doc instead (default
 * /ch/en/fragments/compare-modal), fetched as .plain.html.
 *
 * All motion measured off live (see DESIGN.md §Motion + compare-lift JSONs):
 * status bar slide-up translateY(100%)+fade .3s; overlay slide-up-fade
 * translateY(10%)+fade .3s; checkbox inner scale 0→1 .35s ease-in-out;
 * calibre flip rotateY .5s. Honors prefers-reduced-motion.
 */

import { loadCSS } from '../../scripts/aem.js';
import { CROSS_ICON, ARROW_360_ICON, INFO_ICON } from './compare-icons.js';

const MAX_ITEMS = 3;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

const DEFAULT_LABELS = {
  title: 'Watch <em>Comparison</em>',
  prompt: 'Select at least two watches to compare',
  cancel: 'Cancel',
  compare: 'Compare',
  close: 'Close',
  remove: 'remove selected watches',
  'switch-back': 'Switch to back',
  'switch-front': 'Switch to front',
  ref: 'Ref.',
  'section-case': 'Case',
  'section-dial': 'Dial',
  'section-bracelet': 'Bracelet',
  'section-calibre': 'Calibre',
  material: 'Material',
  setting: 'Setting',
  size: 'Size',
  thickness: 'Thickness',
  'water-resistance': 'Water resistance',
  description: 'Description',
  name: 'Name',
  functions: 'Functions',
  mechanism: 'Mechanism',
  diameter: 'Diameter',
  'frequency-hz': 'Frequency Hz',
  'frequency-vph': 'Frequency Vph',
  jewels: 'Jewels',
  'power-reserve': 'Power reserve',
  parts: 'Parts',
};

/* live price rendering: "95 200 CHF" (space thousands, nbsp before code) */
function formatPrice(price) {
  const amount = String(price.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${amount}\u00a0${price.currency}`;
}

function pictureHTML(image, cls) {
  if (!image || !(image.link || image.tabletLink || image.mobileLink)) return '';
  const link = image.link || image.tabletLink;
  return `<picture class="${cls}">
    <source media="(min-width: 1025px)" srcset="${link}">
    <source media="(min-width: 768px)" srcset="${image.tabletLink || link}">
    <img src="${image.mobileLink || link}" alt="" loading="lazy">
  </picture>`;
}

export default function initCompare({
  block, toggle, products, dataPath, fragmentPath, activate,
}) {
  const storeKey = `ap-compare:${window.location.pathname}`;
  let selected = [];
  let active = false;
  const labels = { ...DEFAULT_LABELS };
  let compareData = null;
  let bar = null;
  let overlay = null;
  let lastFocus = null;

  try {
    const saved = JSON.parse(window.localStorage.getItem(storeKey) || '{}');
    if (Array.isArray(saved.refs)) selected = saved.refs.slice(0, MAX_ITEMS);
    active = !!saved.active;
  } catch { /* fresh state */ }

  const persist = () => {
    try {
      window.localStorage.setItem(storeKey, JSON.stringify({ refs: selected, active }));
    } catch { /* full/blocked */ }
  };

  const productByRef = (ref) => products.find((p) => p.reference === ref);

  /* authorable strings from the fragment doc (title + label table) */
  const labelsReady = (async () => {
    try {
      const resp = await fetch(`${fragmentPath}.plain.html`);
      if (!resp.ok) return;
      const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
      const h1 = doc.querySelector('h1');
      if (h1) labels.title = h1.innerHTML;
      doc.querySelectorAll('.compare-labels > div').forEach((row) => {
        const [k, v] = row.children;
        if (k && v && v.textContent.trim()) labels[k.textContent.trim()] = v.textContent.trim();
      });
    } catch { /* defaults stand */ }
  })();

  /* ---------------- status bar ---------------- */

  function barItemsHTML() {
    let html = '';
    for (let i = 0; i < MAX_ITEMS; i += 1) {
      const ref = selected[i];
      const p = ref && productByRef(ref);
      if (p) {
        const img = p.mainImage || {};
        const src = img.mobileLink || img.tabletLink || img.link || '';
        html += `<div class="compare-status-bar__item compare-status-bar__item--populated">
          <button type="button" class="compare-status-bar__remove-button" data-ref="${ref}" aria-label="${labels.remove}">
            <i class="compare-status-bar__close-icon" aria-hidden="true">${CROSS_ICON}</i>
            <img src="${src}" alt="${p.collectionTitle || ''} ${p.productTitle || ''}">
          </button>
        </div>`;
      } else {
        html += `<div class="compare-status-bar__item">
          <div class="compare-status-bar__plus-icon" aria-hidden="true"></div>
        </div>`;
      }
    }
    return html;
  }

  function renderBarContent() {
    const container = bar.querySelector('.compare-status-bar__container');
    const left = selected.length
      ? `<div class="compare-status-bar__items">${barItemsHTML()}</div>`
      : `<div class="compare-status-bar__empty-label">${labels.prompt}</div>`;
    container.innerHTML = `${left}
      <div class="compare-status-bar__ctas">
        <button type="button" class="ap-button ap-button-secondary compare-status-bar__cancel-button">${labels.cancel}</button>
        <button type="submit" class="ap-button ap-button-primary compare-status-bar__submit-button" ${selected.length < 2 ? 'disabled' : ''}>${labels.compare}</button>
      </div>`;
    container.querySelector('.compare-status-bar__cancel-button').addEventListener('click', () => {
      selected = [];
      exitCompareMode(); // eslint-disable-line no-use-before-define
    });
    container.querySelector('.compare-status-bar__submit-button')
      .addEventListener('click', () => openOverlay()); // eslint-disable-line no-use-before-define
    container.querySelectorAll('.compare-status-bar__remove-button').forEach((btn) => {
      btn.addEventListener('click', () => setSelected(btn.dataset.ref, false)); // eslint-disable-line no-use-before-define
    });
  }

  function showBar() {
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'ap-compare';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = `<div class="compare-status-bar">
      <div class="grid-container"><div class="compare-status-bar__container"></div></div>
    </div>`;
    block.append(bar);
    renderBarContent();
    /* live: Vue slide-up — translateY(100%)+opacity 0 → 0/1, .3s */
    const sb = bar.querySelector('.compare-status-bar');
    if (!REDUCED.matches) {
      sb.classList.add('compare-status-bar--enter');
      requestAnimationFrame(() => requestAnimationFrame(() => sb.classList.remove('compare-status-bar--enter')));
    }
  }

  function hideBar() {
    if (!bar) return;
    const sb = bar.querySelector('.compare-status-bar');
    const node = bar;
    bar = null;
    if (REDUCED.matches) { node.remove(); return; }
    sb.classList.add('compare-status-bar--enter'); /* same geometry as leave-to */
    sb.addEventListener('transitionend', () => node.remove(), { once: true });
    window.setTimeout(() => node.remove(), 400);
  }

  /* ---------------- checkboxes ---------------- */

  function setSelected(ref, on) {
    if (on && !selected.includes(ref)) {
      if (selected.length >= MAX_ITEMS) {
        const input = block.querySelector(`.ap-checkbox__input[value="${CSS.escape(ref)}"]`);
        if (input) input.checked = false;
        return;
      }
      selected.push(ref);
    }
    if (!on) selected = selected.filter((r) => r !== ref);
    const input = block.querySelector(`.ap-checkbox__input[value="${CSS.escape(ref)}"]`);
    if (input) {
      input.checked = selected.includes(ref);
      input.setAttribute('aria-checked', String(input.checked));
    }
    persist();
    if (bar) renderBarContent();
  }

  function addCheckboxes() {
    block.querySelectorAll('.pl-grid .product-card').forEach((card) => {
      if (card.querySelector('.ap-checkbox')) return;
      const ref = card.querySelector('.product-ref')?.textContent.trim();
      if (!ref) return;
      const box = document.createElement('div');
      box.className = 'ap-checkbox ap-product-card__cta';
      box.innerHTML = `<label class="ap-checkbox__wrapper">
        <input type="checkbox" class="ap-checkbox__input" value="${ref}" name="${ref}" aria-checked="${selected.includes(ref)}">
        <span class="ap-checkbox__box" aria-hidden="true"></span>
      </label>`;
      const input = box.querySelector('input');
      input.checked = selected.includes(ref);
      input.addEventListener('change', () => setSelected(ref, input.checked));
      card.prepend(box);
    });
  }

  function removeCheckboxes() {
    block.querySelectorAll('.pl-grid .ap-checkbox').forEach((cb) => cb.remove());
  }

  function enterCompareMode() {
    active = true;
    persist();
    toggle.setAttribute('aria-expanded', 'true');
    block.classList.add('pl-compare-mode');
    addCheckboxes();
    showBar();
  }

  function exitCompareMode() {
    active = false;
    persist();
    toggle.setAttribute('aria-expanded', 'false');
    block.classList.remove('pl-compare-mode');
    removeCheckboxes();
    hideBar();
  }

  /* ---------------- comparison overlay ---------------- */

  async function loadCompareData() {
    if (compareData) return compareData;
    try {
      const resp = await fetch(dataPath);
      compareData = await resp.json();
    } catch {
      compareData = {};
    }
    return compareData;
  }

  function specRow(entries, labelKey, getter) {
    const values = entries.map(getter);
    if (!values.some((v) => v)) return '';
    return `<div class="compare__table-row">${values.map((v) => `
      <div class="compare-table-row__cell compare__table-cell">${v ? `
        <div class="compare-table-row__details">
          <p class="compare-table-row__label">${labels[labelKey]}</p>
          <p class="compare-table-row__description">${v}</p>
        </div>` : ''}
      </div>`).join('')}</div>`;
  }

  function imageRow(entries, getter, modifier) {
    const values = entries.map(getter);
    if (!values.some((v) => v)) return '';
    const mod = modifier ? ` compare-table-row__image-container--${modifier}` : '';
    return `<div class="compare__table-row">${values.map((img) => `
      <div class="compare-table-row__cell compare__table-cell">
        <div class="compare-table-row__image-container${mod}">${pictureHTML(img, 'compare__table-row-image')}</div>
      </div>`).join('')}</div>`;
  }

  function sectionHeader(labelKey, first) {
    return `<div class="compare-table__section-header compare__table-row${first ? ' compare-table__section-header--first' : ''}">
      <div class="compare-table__section-header-cell compare__table-cell">
        <h2 class="compare-table__heading">${labels[`section-${labelKey}`]}</h2>
      </div>
    </div>`;
  }

  function calibreFlipRow(entries) {
    const values = entries.map((e) => e.calibre && e.calibre.image);
    if (!values.some((v) => v && v.front)) return '';
    const btn = `<div class="compare__table-row"><div class="compare__table-cell compare-table__flip-cell">
      <button type="button" class="ap-button ap-button-tertiary compare__table-row__flip-button" data-front-label="${labels['switch-front']}" data-back-label="${labels['switch-back']}">
        <span class="compare__flip-label">${labels['switch-back']}</span>
        <i class="compare__flip-icon" aria-hidden="true">${ARROW_360_ICON}</i>
      </button>
    </div></div>`;
    const row = `<div class="compare__table-row">${values.map((img) => `
      <div class="compare-table-row__cell compare__table-cell">
        <div class="compare-table-row__image-container compare-table-row__image-container--gray">
          <div class="compare__table-row-flip-image">
            <figure class="compare__table-row-flip-image-inner">
              ${pictureHTML(img && img.front, 'compare__table-row-flip-image-front')}
              ${pictureHTML(img && img.back, 'compare__table-row-flip-image-back')}
              ${pictureHTML(img && img.front, 'compare__table-row-flip-image-reference')}
            </figure>
          </div>
        </div>
      </div>`).join('')}</div>`;
    return btn + row;
  }

  function headHTML(entries) {
    const cells = entries.map((e) => `
      <div class="compare-table-head__cell compare-table-head__cell-main compare__table-cell">
        <div class="compare-table-head__main-data-container">
          <div class="compare-table-head__picture"><img src="${(e.card.image && (e.card.image.mobileLink || e.card.image.link)) || ''}" alt="" loading="lazy"></div>
          <div class="compare-table-head__details">
            <p class="compare-table-head__reference">${e.card.reference}</p>
            <p class="compare-table-head__collection">${e.card.collection || ''}</p>
            <p class="compare-table-head__name">${e.card.name || ''}</p>
            <p class="compare-table-head__case-and-material">${[e.card.caseWidth ? e.card.caseWidth.replace(' ', '') : '', e.card.materials].filter(Boolean).join(', ')}</p>
          </div>
        </div>
      </div>`).join('');
    const priceCells = entries.map((e) => {
      const priced = e.price && e.price.price;
      const label = priced ? formatPrice(e.price.price) : (e.price && e.price.message) || '';
      const tooltip = priced && e.price.tooltip
        ? `<span class="compare-table-head__tooltip" tabindex="0" title="${e.price.tooltip.trim()}"><i aria-hidden="true">${INFO_ICON}</i></span>` : '';
      return `<div class="compare-table-head__cell compare-table-head__price-cells compare__table-cell">
        <div class="compare-table-head__price-container">
          <p class="compare-table-head__price-container-price"><span>${label}</span>${tooltip}</p>
          <p class="compare-table-head__price-container-reference">${labels.ref} ${e.card.reference}</p>
        </div>
      </div>`;
    }).join('');
    return `<div class="compare-table-head">
      <div class="compare-table-head__row compare__table-row">${cells}</div>
      <div class="compare__table-row">${priceCells}</div>
    </div>`;
  }

  function mobileHeaderHTML(entries) {
    return `<div class="compare-table-mobile-header grid-container">${entries.map((e, i) => `
      <div class="compare-table-mobile-header__button-wrapper">
        <button type="button" class="compare-table-mobile-header__button${i === 0 ? ' compare-table-mobile-header__button--active' : ''}" data-index="${i}" aria-label="${e.card.reference}">
          <img class="compare-table-mobile-header__image" src="${(e.card.image && (e.card.image.mobileLink || e.card.image.link)) || ''}" alt="">
          <span class="compare-table-mobile-button-border" aria-hidden="true"></span>
        </button>
      </div>`).join('')}</div>`;
  }

  function tableHTML(entries) {
    return `
      ${headHTML(entries)}
      ${sectionHeader('case', true)}
      ${imageRow(entries, (e) => e.watchCase && e.watchCase.image, 'black')}
      ${specRow(entries, 'material', (e) => e.watchCase && e.watchCase.material)}
      ${specRow(entries, 'setting', (e) => e.watchCase && e.watchCase.setting)}
      ${specRow(entries, 'size', (e) => e.watchCase && e.watchCase.size)}
      ${specRow(entries, 'thickness', (e) => e.watchCase && e.watchCase.thickness)}
      ${specRow(entries, 'water-resistance', (e) => e.watchCase && e.watchCase.waterResistance)}
      ${sectionHeader('dial')}
      ${imageRow(entries, (e) => e.dial && e.dial.image)}
      ${specRow(entries, 'description', (e) => e.dial && e.dial.description)}
      ${sectionHeader('bracelet')}
      ${imageRow(entries, (e) => e.bracelet && e.bracelet.image)}
      ${specRow(entries, 'description', (e) => e.bracelet && e.bracelet.description)}
      ${sectionHeader('calibre')}
      ${calibreFlipRow(entries)}
      ${specRow(entries, 'name', (e) => e.calibre && e.calibre.name)}
      ${specRow(entries, 'functions', (e) => e.calibre && e.calibre.functions)}
      ${specRow(entries, 'mechanism', (e) => e.calibre && e.calibre.mechanism)}
      ${specRow(entries, 'diameter', (e) => e.calibre && e.calibre.diameterMm)}
      ${specRow(entries, 'frequency-hz', (e) => e.calibre && e.calibre.frequencyHz)}
      ${specRow(entries, 'frequency-vph', (e) => e.calibre && e.calibre.frequencyVph)}
      ${specRow(entries, 'jewels', (e) => e.calibre && e.calibre.jewels)}
      ${specRow(entries, 'power-reserve', (e) => e.calibre && e.calibre.powerReserve)}
      ${specRow(entries, 'parts', (e) => e.calibre && e.calibre.parts)}`;
  }

  function closeOverlay() {
    if (!overlay) return;
    const node = overlay;
    overlay = null;
    document.documentElement.classList.remove('ap-compare-scroll-locked');
    document.removeEventListener('keydown', onOverlayKeydown); // eslint-disable-line no-use-before-define
    const finish = () => node.remove();
    if (REDUCED.matches) finish();
    else {
      /* live: slide-up-fade leave — translateY(10%)+fade, .3s */
      node.classList.add('ap-compare-overlay--leave');
      node.addEventListener('transitionend', finish, { once: true });
      window.setTimeout(finish, 400);
    }
    if (lastFocus) lastFocus.focus();
  }

  function onOverlayKeydown(e) {
    if (e.key === 'Escape') closeOverlay();
  }

  async function openOverlay() {
    if (selected.length < 2 || overlay) return;
    lastFocus = document.activeElement;
    await labelsReady;
    const data = await loadCompareData();
    const entries = selected.map((ref) => data[ref]).filter(Boolean);
    if (entries.length < 2) return;

    overlay = document.createElement('div');
    overlay.className = 'ap-compare-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', labels.title.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    overlay.innerHTML = `
      <div class="ap-overlay-item__container">
        <header class="ap-overlay-item__header"><div class="grid-container">
          <button type="button" class="ap-button ap-button-tertiary ap-overlay-item__close-button" aria-label="${labels.close}">${CROSS_ICON}</button>
        </div></header>
        <div class="ap-overlay-item__content"><div class="compare-table">
          <header class="compare-table__header grid-container"><h1 class="compare-table__title">${labels.title}</h1></header>
          <div class="compare-table__intersection-target"></div>
          ${mobileHeaderHTML(entries)}
          <div class="compare-table__wrapper"><div class="grid-container">
            <div class="compare-table__table" style="--compare-cols: ${entries.length};">${tableHTML(entries)}</div>
          </div></div>
        </div></div>
      </div>`;
    document.body.append(overlay);
    document.documentElement.classList.add('ap-compare-scroll-locked');
    document.addEventListener('keydown', onOverlayKeydown);

    overlay.querySelector('.ap-overlay-item__close-button').addEventListener('click', closeOverlay);

    /* calibre front/back flip — rotateY .5s, all columns at once (live) */
    const flipBtn = overlay.querySelector('.compare__table-row__flip-button');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        const flipped = overlay.classList.toggle('ap-compare-overlay--flipped');
        flipBtn.querySelector('.compare__flip-label').textContent = flipped ? flipBtn.dataset.frontLabel : flipBtn.dataset.backLabel;
      });
    }

    /* live: stuck mini-header gains a full-bleed 1px bottom border */
    const mobileHeader = overlay.querySelector('.compare-table-mobile-header');
    const sentinel = overlay.querySelector('.compare-table__intersection-target');
    const stickyObserver = new IntersectionObserver(([entry]) => {
      mobileHeader.classList.toggle('compare-table-mobile-header--sticky', !entry.isIntersecting);
    }, { root: overlay.querySelector('.ap-overlay-item__container'), rootMargin: `-${window.innerWidth >= 768 ? 150 : 80}px 0px 0px 0px` });
    stickyObserver.observe(sentinel);

    /* mobile product-jump header: scroll the snap wrapper to the column */
    const wrapper = overlay.querySelector('.compare-table__wrapper');
    const mobileBtns = [...overlay.querySelectorAll('.compare-table-mobile-header__button')];
    const setActive = (i) => mobileBtns.forEach((b, j) => b.classList.toggle('compare-table-mobile-header__button--active', i === j));
    mobileBtns.forEach((btn) => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      const cell = overlay.querySelector('.compare-table-head__row').children[i];
      wrapper.scrollTo({ left: cell.offsetLeft - 20, behavior: REDUCED.matches ? 'auto' : 'smooth' });
      setActive(i);
    }));
    wrapper.addEventListener('scroll', () => {
      const cells = [...overlay.querySelector('.compare-table-head__row').children];
      const x = wrapper.scrollLeft + wrapper.clientWidth / 2;
      const i = cells.findIndex((c) => x >= c.offsetLeft && x < c.offsetLeft + c.offsetWidth);
      if (i >= 0) setActive(i);
    }, { passive: true });

    /* live: slide-up-fade enter — from translateY(10%)+opacity 0, .3s */
    if (!REDUCED.matches) {
      overlay.classList.add('ap-compare-overlay--enter');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.remove('ap-compare-overlay--enter')));
    }
    overlay.querySelector('.ap-overlay-item__close-button').focus({ preventScroll: true });
  }

  /* ---------------- wire up ---------------- */

  loadCSS(`${window.hlx.codeBasePath}/blocks/product-listing/compare.css`);

  toggle.addEventListener('click', () => {
    if (active) exitCompareMode();
    else enterCompareMode();
  });

  if (active || activate) enterCompareMode();
}
