import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * footer — AP green footer, slotted from the authored /footer fragment.
 * /footer sections: 1 = brand logos, 2 = language line, 3 = link columns
 * (h3 + list pairs), 4 = social links, 5 = legal links, 6 = copyright.
 */
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
    const langRow = document.createElement('div');
    langRow.className = 'ap-footer-lang';
    langRow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z"></path></svg>';
    const span = document.createElement('span');
    span.textContent = lang.textContent.trim();
    langRow.append(span);
    main.append(langRow);
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
      a.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="1.2"></rect></svg>';
      icons.append(a);
    });
    row.append(icons);
    if (legal) {
      const legalRow = document.createElement('div');
      legalRow.className = 'ap-footer-legal';
      legal.querySelectorAll('a').forEach((a) => legalRow.append(a));
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
