/**
 * strap-selector — PDP interchangeable-strap explorer (live ap-strap-selector).
 * Centered strap rail behind a fixed watch-case overlay; selecting a strap
 * slides the rail (300ms ease, live swiper physics) and crossfades the
 * info panel (live Vue fade: leave .2s ease-out, enter .3s ease-in .2s —
 * values verbatim from the live StrapSelector.css chunk).
 *
 * Authoring rows:
 *   [ "heading" | h2 ]
 *   [ "case"    | case composite img + appointment CTA link ]
 *   [ strap img | strap title (strong), price, product id ]  × N
 * First strap row = default selection (live: defaultStraps from the
 * {collection}.strapselector.json feed — snapshotted under /data/straps/).
 * "Show details" opens a drawer on live (interaction-only) — deferred.
 */

const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<path fill="currentColor" d="M10.8536 8.35355L11.2071 8L10.5 7.29289L10.1464 7.64645L10.8536 8.35355ZM10.1464 7.64645L5.14644 12.6464L5.85356 13.3536L10.8536 8.35355L10.1464 7.64645Z"></path>'
  + '<path fill="currentColor" d="M10.1464 8.35356L10.5 8.70711L11.2071 8L10.8536 7.64644L10.1464 8.35356ZM10.8536 7.64644L5.85355 2.64644L5.14644 3.35356L10.1464 8.35356L10.8536 7.64644Z"></path></svg>';

const SPEED = 300;

export default function decorate(block) {
  const rows = [...block.children];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let heading = null;
  let caseImg = null;
  let ctaLink = null;
  const straps = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const key = cells[0] ? cells[0].textContent.trim().toLowerCase() : '';
    if (key === 'heading') {
      heading = cells[1] ? cells[1].querySelector('h2, h3') : null;
    } else if (key === 'case') {
      caseImg = cells[1] ? cells[1].querySelector('img') : null;
      ctaLink = cells[1] ? cells[1].querySelector('a') : null;
    } else if (cells.length >= 2 && cells[0].querySelector('img')) {
      const ps = [...cells[1].querySelectorAll('p')].map((p) => p.textContent.trim());
      straps.push({
        img: cells[0].querySelector('img').getAttribute('src'),
        title: (cells[1].querySelector('strong') || {}).textContent || ps[0] || '',
        price: ps[1] || '',
        id: ps[2] || '',
      });
    }
  });

  const root = document.createElement('div');
  root.className = 'ss-root';
  const container = document.createElement('div');
  container.className = 'grid-container';

  if (heading) {
    heading.classList.add('ss-heading');
    container.append(heading);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'ss-wrapper';

  // strap rail
  const swiper = document.createElement('div');
  swiper.className = 'ss-swiper';
  const track = document.createElement('ul');
  track.className = 'ss-track';
  straps.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = `ss-slide${i === 0 ? ' ss-slide-active' : ''}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ss-slide-btn';
    btn.setAttribute('aria-label', s.title);
    const content = document.createElement('div');
    content.className = 'ss-slide-content';
    content.style.setProperty('--strap', `url("${s.img}")`);
    const top = document.createElement('div');
    top.className = 'ss-strap ss-strap-top';
    const bottom = document.createElement('div');
    bottom.className = 'ss-strap ss-strap-bottom';
    const hiddenCase = caseImg ? caseImg.cloneNode(true) : null;
    content.append(top);
    if (hiddenCase) {
      hiddenCase.className = 'ss-case';
      hiddenCase.setAttribute('alt', '');
      hiddenCase.setAttribute('loading', 'lazy');
      content.append(hiddenCase);
    }
    content.append(bottom);
    btn.append(content);
    li.append(btn);
    track.append(li);
  });
  swiper.append(track);

  // nav arrows (desktop)
  const nav = {};
  ['prev', 'next'].forEach((dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ss-nav ss-nav-${dir}`;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous strap' : 'Next strap');
    btn.innerHTML = CHEVRON;
    nav[dir] = btn;
  });

  // watch-case overlay
  const overlay = document.createElement('div');
  overlay.className = 'ss-overlay';
  const overlaySlide = document.createElement('div');
  overlaySlide.className = 'ss-overlay-slide';
  if (caseImg) {
    caseImg.setAttribute('loading', 'lazy');
    overlaySlide.append(caseImg);
  }
  overlay.append(overlaySlide);

  // info panel
  const info = document.createElement('div');
  info.className = 'ss-info';
  const infoText = document.createElement('div');
  infoText.className = 'ss-info-text';
  const title = document.createElement('h4');
  const details = document.createElement('a');
  details.className = 'ss-details';
  details.textContent = 'Show details';
  details.setAttribute('role', 'button');
  details.setAttribute('tabindex', '0');
  infoText.append(title, details);
  info.append(infoText);
  if (ctaLink) {
    ctaLink.className = 'ap-cta ss-cta';
    ctaLink.setAttribute('target', '_blank');
    info.append(ctaLink);
  }

  wrapper.append(swiper, nav.prev, nav.next, overlay, info);
  container.append(wrapper);
  root.append(container);
  block.replaceChildren(root);

  /* state */
  let active = 0;

  const setInfo = (s) => {
    title.replaceChildren();
    const t = document.createElement('b');
    t.textContent = s.title;
    const p = document.createElement('b');
    p.textContent = s.price;
    title.append(t, document.createElement('br'), p);
    if (ctaLink && s.id) {
      try {
        const url = new URL(ctaLink.href, window.location.href);
        url.searchParams.set('strap', s.id);
        ctaLink.href = url.toString();
      } catch (e) { /* keep authored href */ }
    }
  };

  const position = (animate) => {
    const slides = [...track.children];
    if (!slides.length) return;
    const slideW = slides[0].offsetWidth;
    const gap = 10;
    const x = (swiper.clientWidth / 2) - (slideW / 2) - active * (slideW + gap);
    track.style.transition = animate && !reduced.matches ? `transform ${SPEED}ms ease` : 'none';
    track.style.transform = `translate3d(${x}px, 0, 0)`;
    slides.forEach((li, i) => li.classList.toggle('ss-slide-active', i === active));
    nav.prev.disabled = active <= 0;
    nav.next.disabled = active >= slides.length - 1;
  };

  const select = (i) => {
    const max = track.children.length - 1;
    const next = Math.max(0, Math.min(i, max));
    if (next === active) return;
    active = next;
    position(true);
    const s = straps[active];
    if (reduced.matches) {
      setInfo(s);
      return;
    }
    // live fade: out .2s ease-out, in .3s ease-in with .2s delay
    infoText.classList.add('ss-fade-out');
    setTimeout(() => {
      setInfo(s);
      infoText.classList.remove('ss-fade-out');
      infoText.classList.add('ss-fade-in');
      setTimeout(() => infoText.classList.remove('ss-fade-in'), 500);
    }, 200);
  };

  [...track.children].forEach((li, i) => {
    li.querySelector('.ss-slide-btn').addEventListener('click', () => select(i));
  });
  nav.prev.addEventListener('click', () => select(active - 1));
  nav.next.addEventListener('click', () => select(active + 1));

  if (straps.length) setInfo(straps[0]);

  // mask bottom cut follows the rendered info-panel height (live --info-height)
  const sync = () => {
    root.style.setProperty('--info-height', `${info.offsetHeight}px`);
    position(false);
  };
  window.addEventListener('resize', sync);
  new ResizeObserver(sync).observe(wrapper);
  sync();
}
