/**
 * carousel — swipeable card track (releases / stories / collections /
 * novelties / services variants). Reconstructive: one authored row per slide.
 *
 * Behavior replicates the live ap-storybook-carousel Swiper config (probed
 * 2026-07-30): speed 300ms ease, spaceBetween 10, slidesPerGroup 1, snap on
 * release (longSwipesRatio .5, longSwipesMs 300, threshold 5px), grab cursor,
 * edge resistance ^0.85, desktop arrows (48px circle, disabled → opacity 0),
 * mobile pagination dots advancing with the active slide.
 *
 * Section head (h2 + optional browse link) is DEFAULT CONTENT before the
 * block (D1); the block reabsorbs it into the aside/head slot so the
 * decorated DOM matches the replica prototype.
 *
 * Authoring rows: [ image cell | text cell (title p, desc p, CTA link) ].
 * Collections variant: image cell holds photo + wordmark images; text cell
 * holds only the CTA link.
 */

const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<path fill="currentColor" d="M10.8536 8.35355L11.2071 8L10.5 7.29289L10.1464 7.64645L10.8536 8.35355ZM10.1464 7.64645L5.14644 12.6464L5.85356 13.3536L10.8536 8.35355L10.1464 7.64645Z"></path>'
  + '<path fill="currentColor" d="M10.1464 8.35356L10.5 8.70711L11.2071 8L10.8536 7.64644L10.1464 8.35356ZM10.8536 7.64644L5.85355 2.64644L5.14644 3.35356L10.1464 8.35356L10.8536 7.64644Z"></path></svg>';

/* masterclass card info icons — lifted verbatim from the live ap-masterclass-card SVGs */
export const ICON_TYPE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7.5 14L2.81322 11.5865V7.26797L0 5.84073L7.5 2L15 5.84073V11.4089H14.0012V6.34302L12.1868 7.26797V11.5865L7.5 14ZM7.5 8.52837L12.6981 5.84073L7.5 3.1531L2.3019 5.84073L7.5 8.52837ZM7.5 12.8393L11.188 10.9281V7.78559L7.5 9.68007L3.81204 7.78559V10.9281L7.5 12.8393Z" fill="currentColor"></path></svg>';
export const ICON_CLOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10.71 11.1362L11.4246 10.4215L8.5 7.49692V3.38462H7.5V7.92596L10.71 11.1362ZM8.00135 15C7.03712 15 6.13071 14.8178 5.28212 14.4535C4.43365 14.0891 3.69013 13.5878 3.05154 12.9494C2.41295 12.3111 1.91135 11.5669 1.54673 10.7169C1.18224 9.86705 1 8.95891 1 7.9925C1 7.02609 1.18218 6.11744 1.54654 5.26654C1.9109 4.41564 2.41224 3.6741 3.05058 3.04192C3.68891 2.40974 4.43308 1.91135 5.28308 1.54673C6.13295 1.18224 7.04109 1 8.0075 1C8.97391 1 9.88256 1.18372 10.7335 1.55115C11.5845 1.91859 12.3247 2.41724 12.9542 3.04712C13.5837 3.67699 14.0821 4.41769 14.4492 5.26923C14.8164 6.12077 15 7.03058 15 7.99865C15 8.96288 14.8178 9.8693 14.4535 10.7179C14.0891 11.5663 13.591 12.3099 12.959 12.9485C12.3271 13.5871 11.5851 14.0887 10.7329 14.4533C9.8807 14.8178 8.97019 15 8.00135 15ZM8.00923 14C9.6691 14 11.0826 13.4135 12.2496 12.2404C13.4165 11.0673 14 9.65077 14 7.99077C14 6.3309 13.4165 4.91744 12.2496 3.75039C11.0826 2.58346 9.6691 2 8.00923 2C6.34923 2 4.93269 2.58346 3.75962 3.75039C2.58654 4.91744 2 6.3309 2 7.99077C2 9.65077 2.58654 11.0673 3.75962 12.2404C4.93269 13.4135 6.34923 14 8.00923 14Z" fill="currentColor"></path></svg>';

/* live catalogue vocabularies (embedded Adobe-Commerce-shaped feed) */
export const MC_TYPE_LABELS = { 1: 'Masterclass Chronicles', 2: 'Hands-On Masterclass' };
export const MC_LEVEL_LABELS = { 1: 'Newbie', 2: 'Timekeeper' };

/* live swiper physics (probed values) */
const SPEED = 300;
const THRESHOLD = 5;
const LONG_SWIPES_MS = 300;
const RESISTANCE = 0.85;

function initCarousel(block, viewport, track, dots) {
  const slides = [...track.children];
  if (!slides.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const prev = block.querySelector('.carousel-nav-prev');
  const next = block.querySelector('.carousel-nav-next');

  let x = 0;
  let maxX = 0;
  let dragged = false;

  const offsets = () => slides.map((s) => s.offsetLeft - slides[0].offsetLeft);
  const nearestIndex = (pos) => {
    const off = offsets();
    let best = 0;
    off.forEach((o, i) => { if (Math.abs(o - pos) < Math.abs(off[best] - pos)) best = i; });
    return best;
  };

  const apply = (animate) => {
    maxX = Math.max(0, track.scrollWidth - viewport.clientWidth);
    x = Math.max(0, Math.min(x, maxX));
    track.style.transition = animate && !reduced.matches ? `transform ${SPEED}ms ease` : 'none';
    track.style.transform = `translate3d(${-x}px, 0, 0)`;
    if (prev) prev.disabled = x <= 0;
    if (next) next.disabled = x >= maxX - 1;
    if (dots) {
      const active = nearestIndex(x);
      [...dots.children].forEach((d, i) => {
        d.classList.toggle('dot-active', i === active);
      });
    }
  };

  const goTo = (i) => {
    const off = offsets();
    const idx = Math.max(0, Math.min(i, off.length - 1));
    x = off[idx];
    apply(true);
  };

  if (prev) prev.addEventListener('click', () => goTo(nearestIndex(x) - 1));
  if (next) next.addEventListener('click', () => goTo(nearestIndex(x) + 1));

  /* drag / swipe — followFinger with edge resistance, snap on release */
  let startX = 0;
  let startTrackX = 0;
  let startT = 0;
  let tracking = false;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    tracking = true;
    dragged = false;
    startX = e.clientX;
    startTrackX = x;
    startT = performance.now();
    maxX = Math.max(0, track.scrollWidth - viewport.clientWidth);
    viewport.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!tracking) return;
    const dx = startX - e.clientX;
    if (!dragged && Math.abs(dx) <= THRESHOLD) return;
    if (!dragged) {
      dragged = true;
      viewport.setPointerCapture(e.pointerId);
    }
    let pos = startTrackX + dx;
    if (pos < 0) pos = -((-pos) ** RESISTANCE);
    else if (pos > maxX) pos = maxX + (pos - maxX) ** RESISTANCE;
    x = pos;
    track.style.transition = 'none';
    track.style.transform = `translate3d(${-x}px, 0, 0)`;
  });

  const release = (e) => {
    if (!tracking) return;
    tracking = false;
    viewport.classList.remove('is-dragging');
    if (!dragged) return;
    const dx = startX - e.clientX;
    const dur = performance.now() - startT;
    if (dur < LONG_SWIPES_MS && Math.abs(dx) > THRESHOLD) {
      // short swipe: advance one slide in the swipe direction
      goTo(nearestIndex(startTrackX) + Math.sign(dx));
    } else {
      // long swipe: snap to the nearest slide (ratio 0.5)
      goTo(nearestIndex(x));
    }
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);

  // a dragged gesture must not trigger the slide link
  viewport.addEventListener('click', (e) => {
    if (dragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  viewport.addEventListener('dragstart', (e) => e.preventDefault());

  // re-measure whenever the viewport lays out or resizes — decorate runs
  // while the section may still be hidden (clientWidth 0 → stale maxX)
  let raf = 0;
  const remeasure = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => apply(false));
  };
  window.addEventListener('resize', remeasure);
  new ResizeObserver(remeasure).observe(viewport);

  apply(false);
}

/**
 * masterclass variant — slides fed from the catalogue snapshot
 * (/data/masterclass-*.json, extracted from the live page's server-embedded
 * <ap-masterclass-card :product> attributes; Adobe-Commerce-shaped, CHF).
 * Authoring rows: [ link to catalogue JSON | level label (Newbie/Timekeeper) ],
 * optional [ background | #hex ] row (live authors a bg color per rail).
 */
async function buildMasterclassTrack(block, track) {
  let feedHref = null;
  let level = null;
  [...block.children].forEach((row) => {
    const [c1, c2] = [...row.children];
    const key = (c1?.textContent || '').trim().toLowerCase();
    const link = row.querySelector('a');
    if (key === 'background' && c2) {
      block.style.backgroundColor = c2.textContent.trim();
    } else if (link) {
      feedHref = link.getAttribute('href');
      level = (c2?.textContent || '').trim().toLowerCase();
    }
  });
  if (!feedHref) return;
  let items = [];
  try {
    const resp = await fetch(new URL(feedHref, window.location.href).pathname);
    const data = await resp.json();
    items = data.items || [];
  } catch (e) {
    return;
  }
  const levelId = Object.keys(MC_LEVEL_LABELS).find(
    (k) => MC_LEVEL_LABELS[k].toLowerCase() === level,
  );
  if (levelId) items = items.filter((p) => String(p.level) === String(levelId));

  items.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'slide';
    const fig = document.createElement('figure');

    const aside = document.createElement('aside');
    const imgLink = document.createElement('a');
    imgLink.className = 'img-link';
    imgLink.tabIndex = -1;
    imgLink.href = p.link?.href || '#';
    const pic = document.createElement('picture');
    if (p.smallImage?.mobileLink) {
      const source = document.createElement('source');
      source.media = '(max-width: 767px)';
      source.srcset = p.smallImage.mobileLink;
      pic.append(source);
    }
    const img = document.createElement('img');
    img.src = p.smallImage?.link || '';
    img.alt = '';
    img.loading = 'lazy';
    pic.append(img);
    imgLink.append(pic);
    aside.append(imgLink);
    fig.append(aside);

    const caption = document.createElement('figcaption');
    const h4 = document.createElement('h4');
    const titleP = document.createElement('p');
    titleP.textContent = p.name || '';
    h4.append(titleP);

    const tag = document.createElement('span');
    tag.className = 'mc-tag';
    tag.textContent = MC_LEVEL_LABELS[p.level] || '';

    const desc = document.createElement('div');
    desc.className = 'desc';
    const descP = document.createElement('p');
    descP.textContent = (p.shortDescription?.html || '').replace(/<[^>]+>/g, '').trim();
    desc.append(descP);

    const infos = document.createElement('div');
    infos.className = 'mc-infos';
    const typeRow = document.createElement('div');
    typeRow.className = 'mc-info';
    typeRow.innerHTML = `${ICON_TYPE}<span>${MC_TYPE_LABELS[p.masterclassType] || ''}</span>`;
    const hoursRow = document.createElement('div');
    hoursRow.className = 'mc-info';
    hoursRow.innerHTML = `${ICON_CLOCK}<span>${p.duration?.amount || ''} minutes</span>`;
    infos.append(typeRow, hoursRow);

    const actions = document.createElement('div');
    actions.className = 'mc-actions';
    const cta = document.createElement('a');
    cta.className = 'ap-link';
    cta.href = p.link?.href || '#';
    cta.textContent = 'Explore this masterclass';
    actions.append(cta);

    caption.append(h4, tag, desc, infos, actions);
    fig.append(caption);
    li.append(fig);
    track.append(li);
  });
}

export default async function decorate(block) {
  const isMasterclass = block.classList.contains('masterclass');
  const isReleases = ['releases', 'novelties', 'services', 'masterclass'].some((v) => block.classList.contains(v));

  // reabsorb the section head (default content before the block wrapper)
  const headWrapper = block.parentElement?.previousElementSibling;
  let head = null;
  if (headWrapper && headWrapper.classList.contains('default-content-wrapper')) {
    head = document.createElement('div');
    head.className = isReleases ? 'carousel-aside' : 'carousel-head';
    [...headWrapper.childNodes].forEach((n) => head.append(n));
    headWrapper.remove();
    head.querySelectorAll('a').forEach((a) => a.classList.add('ap-link'));
  }

  const track = document.createElement('ul');
  track.className = 'carousel-track';

  if (isMasterclass) await buildMasterclassTrack(block, track);

  [...(isMasterclass ? [] : block.children)].forEach((row) => {
    const [imgCell, textCell] = [...row.children];
    if (!imgCell) return;
    const li = document.createElement('li');
    li.className = 'slide';
    const fig = document.createElement('figure');

    const aside = document.createElement('aside');
    const cta = textCell?.querySelector('a');
    const imgLink = document.createElement('a');
    imgLink.className = 'img-link';
    imgLink.tabIndex = -1;
    if (cta) imgLink.href = cta.href;
    [...imgCell.querySelectorAll('picture, img')].forEach((m, i) => {
      if (i > 0 && m.closest('picture') && m.closest('picture') !== m) return;
      m.classList.add(i === 0 ? 'photo' : 'wordmark');
      imgLink.append(m.closest('picture') || m);
    });
    aside.append(imgLink);
    fig.append(aside);

    const caption = document.createElement('figcaption');
    if (textCell) {
      const texts = [...textCell.querySelectorAll('p, h3, h4')]
        .filter((n) => !n.querySelector('a') && n.textContent.trim());
      texts.forEach((n, i) => {
        const p = document.createElement('p');
        p.textContent = n.textContent.trim();
        if (i === 0) {
          const h4 = document.createElement('h4');
          h4.append(p);
          caption.append(h4);
        } else {
          const desc = document.createElement('div');
          desc.className = 'desc';
          desc.append(p);
          caption.append(desc);
        }
      });
      if (cta) {
        cta.classList.add('ap-link');
        caption.append(cta);
      }
    }
    fig.append(caption);
    li.append(fig);
    track.append(li);
  });

  // clipping viewport: the track slides within it (live: swiper overflow box)
  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.append(track);

  // arrows — live shows them on desktop only (48px circle, chevron icon)
  ['prev', 'next'].forEach((dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `carousel-nav carousel-nav-${dir}`;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous slide' : 'Next slide');
    btn.innerHTML = CHEVRON;
    viewport.append(btn);
  });

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  const count = track.children.length;
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('span');
    dot.className = i === 0 ? 'dot dot-active' : 'dot';
    dots.append(dot);
  }

  block.replaceChildren(...[head, viewport, dots].filter(Boolean));
  initCarousel(block, viewport, track, count > 1 ? dots : null);
}
