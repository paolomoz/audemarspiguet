import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * header — AP chrome, template-slotted from the authored /nav fragment.
 * /nav sections: 1 = brand (150-years link + AP logo link), 2 = nav links,
 * 3 = tools (icon links). Flyout panels / search overlay deferred (R-03).
 *
 * Scroll-state machine (probed on live 2026-07-30): fixed header;
 * y ≤ 50 → transparent over hero, white logo/links; scrolling DOWN past 50
 * → header slides away (translateY(-100%), .3s cubic-bezier(.4,0,.2,1));
 * any UP scroll while y > 50 → white bar slides in (background panel) with
 * dark logo/links. Live classes: ap-header--hide / ap-header--background.
 */

const ICONS = {
  watch: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5"></circle><path d="M9 5.5V2h6v3.5M9 18.5V22h6v-3.5"></path></svg>',
  boutique: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z"></path><circle cx="12" cy="10" r="2.6"></circle></svg>',
  account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path></svg>',
};
const TOOL_ORDER = ['watch', 'boutique', 'account'];

/* live trigger offset: hide on down past 50px, bar on up, clear at top */
const SCROLL_THRESHOLD = 50;

function initScrollState(headerEl) {
  // light pages (metadata Theme: light → body.light): the live header rests
  // in its bar state — white bar + dark logo/links at top (probed on
  // /ch/en/news 2026-07-30); hide-on-down/bar-on-up unchanged past 50px.
  const light = document.body.classList.contains('light');
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    if (y > SCROLL_THRESHOLD) {
      headerEl.classList.add('ap-header-bar');
      if (y !== lastY) headerEl.classList.toggle('ap-header-hidden', y > lastY);
    } else {
      headerEl.classList.toggle('ap-header-bar', light);
      headerEl.classList.remove('ap-header-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => { update(); ticking = false; });
    }
  }, { passive: true });
  update();
}

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
    // scroll-state logo swap — /nav authors white + dark variants in order
    // (live: display toggle between logo-white.svg and logo.svg assets)
    const variants = [...logoLink.children].filter((el) => el.matches('picture, img'));
    if (variants.length === 2) {
      variants[0].classList.add('ap-logo-light');
      variants[1].classList.add('ap-logo-dark');
    }
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

  // white background panel — slides down within a clipping layer so the
  // top-of-page dissolve matches live's background-panel enter/leave motion
  const bgClip = document.createElement('div');
  bgClip.className = 'ap-nav-bgclip';
  const bgPanel = document.createElement('div');
  bgPanel.className = 'ap-nav-panel';
  bgClip.append(bgPanel);

  nav.append(burger, left, center, right);
  block.replaceChildren(bgClip, nav);

  initScrollState(block.closest('header'));
}
