import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * header — AP chrome, template-slotted from the authored /nav fragment.
 * /nav sections: 1 = brand (150-years link + AP logo link), 2 = nav links,
 * 3 = tools (icon links). Flyout panels / search overlay deferred (R-03).
 */

const ICONS = {
  watch: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5"></circle><path d="M9 5.5V2h6v3.5M9 18.5V22h6v-3.5"></path></svg>',
  boutique: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z"></path><circle cx="12" cy="10" r="2.6"></circle></svg>',
  account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path></svg>',
};
const TOOL_ORDER = ['watch', 'boutique', 'account'];

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const sections = [...fragment.querySelectorAll(':scope .section')];
  const [brandSection, navSection, toolsSection] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'ap-nav';
  nav.setAttribute('aria-label', 'Main');

  const burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'ap-nav-burger';
  burger.setAttribute('aria-label', 'Hamburger menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M3 16h18"></path></svg>';

  const left = document.createElement('div');
  left.className = 'ap-nav-left';
  const brandLinks = brandSection ? [...brandSection.querySelectorAll('a')] : [];
  const brand150 = brandLinks[0];
  if (brand150) {
    brand150.classList.add('ap-nav-150');
    left.append(brand150);
  }
  const divider = document.createElement('span');
  divider.className = 'ap-nav-divider';
  left.append(divider);

  const links = document.createElement('div');
  links.className = 'ap-nav-links';
  if (navSection) {
    navSection.querySelectorAll('li').forEach((li) => {
      const a = li.querySelector('a');
      if (a) links.append(a);
      else {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = li.textContent.trim();
        links.append(b);
      }
    });
  }
  left.append(links);

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('ap-nav-open', !open);
  });

  const center = document.createElement('div');
  center.className = 'ap-nav-brand';
  const logoLink = brandLinks[1];
  if (logoLink) {
    logoLink.classList.add('ap-nav-logo');
    center.append(logoLink);
  }

  const right = document.createElement('div');
  right.className = 'ap-nav-tools';
  if (toolsSection) {
    [...toolsSection.querySelectorAll('a')].forEach((a, i) => {
      const key = TOOL_ORDER[i] || 'watch';
      a.classList.add(`ap-tool-${key}`);
      a.setAttribute('aria-label', a.textContent.trim() || key);
      a.innerHTML = ICONS[key];
      right.append(a);
    });
  }

  nav.append(burger, left, center, right);
  block.replaceChildren(nav);
}
