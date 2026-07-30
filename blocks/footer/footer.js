import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { SOCIAL_ICONS, WORLD_ICON } from './social-icons.js';

/**
 * footer — AP green footer, slotted from the authored /footer fragment.
 * /footer sections: 1 = brand logos, 2 = language line, 3 = link columns
 * (h3 + list pairs), 4 = social links, 5 = legal links (may carry the
 * accessibility badge image), 6 = copyright.
 * Social icons: the live site's own icomoon glyphs (see social-icons.js).
 * Language flyout deferred (R-06) — resting-state button only, per live.
 */

const ICON_BY_LABEL = {
  x: 'twitter-x',
  twitter: 'twitter-x',
};

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  const sections = [...fragment.querySelectorAll(':scope .section')];
  const [brands, lang, cols, social, legal, copy] = sections;

  const footer = document.createElement('div');
  footer.className = 'ap-footer grid-container';

  if (brands) {
    const row = document.createElement('div');
    row.className = 'ap-footer-brands';
    brands.querySelectorAll('picture, img').forEach((m) => row.append(m.closest('picture') || m));
    footer.append(row);
  }

  const main = document.createElement('div');
  main.className = 'ap-footer-main';
  if (lang) {
    // live: ap-language-selector-button (world icon + label); the open
    // flyout is deferred (register R-06), resting state matches live
    const langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.className = 'ap-footer-lang';
    langBtn.setAttribute('aria-label', 'select a language');
    langBtn.innerHTML = WORLD_ICON;
    const span = document.createElement('span');
    span.textContent = lang.textContent.trim();
    langBtn.append(span);
    main.append(langBtn);
  }
  if (cols) {
    const colWrap = document.createElement('div');
    colWrap.className = 'ap-footer-cols';
    let current = null;
    [...cols.querySelectorAll('h3, ul')].forEach((el) => {
      if (el.tagName === 'H3') {
        current = document.createElement('div');
        colWrap.append(current);
        current.append(el);
      } else if (current) {
        current.append(el);
      }
    });
    main.append(colWrap);
  }
  footer.append(main);

  if (social) {
    const row = document.createElement('div');
    row.className = 'ap-footer-socialrow';
    const icons = document.createElement('div');
    icons.className = 'ap-footer-social';
    social.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim();
      const key = ICON_BY_LABEL[label.toLowerCase()] || label.toLowerCase();
      a.setAttribute('aria-label', label);
      if (SOCIAL_ICONS[key]) a.innerHTML = SOCIAL_ICONS[key];
      icons.append(a);
    });
    row.append(icons);
    if (legal) {
      const legalRow = document.createElement('div');
      legalRow.className = 'ap-footer-legal';
      legal.querySelectorAll('a').forEach((a) => {
        if (a.querySelector('img, picture')) a.classList.add('ap-footer-a11y-badge');
        legalRow.append(a);
      });
      const extra = legal.textContent.trim();
      if (extra.includes('沪ICP')) {
        const span = document.createElement('span');
        span.textContent = '沪ICP备13031168号-1';
        legalRow.append(span);
      }
      row.append(legalRow);
    }
    footer.append(row);
  }

  if (copy) {
    const p = document.createElement('p');
    p.className = 'ap-footer-copy';
    p.textContent = copy.textContent.trim();
    footer.append(p);
  }

  block.replaceChildren(footer);
}
