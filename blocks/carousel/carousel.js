/**
 * carousel — swipeable card track (releases / stories / collections /
 * novelties / services / gallery / boutiques variants). Reconstructive:
 * one authored row per slide.
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
 *
 * Store-detail variants (archetype F, generated from the Yext entity — see
 * data/store-ap-house-geneva.json):
 *  - gallery: full-width photo slides; row cells = [desktop | tablet |
 *    mobile] renditions (Yext photoGallery / c_tabletGallery /
 *    c_mobileGallery) folded into one art-directed <picture>.
 *  - boutiques: dark store cards over `c_nearbyBoutique` refs; row =
 *    [ photo | info cell (name link p, role p, hours p per day, timezone p,
 *    address link p) ]; open/closed status computed client-side like live.
 */

const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<path fill="currentColor" d="M10.8536 8.35355L11.2071 8L10.5 7.29289L10.1464 7.64645L10.8536 8.35355ZM10.1464 7.64645L5.14644 12.6464L5.85356 13.3536L10.8536 8.35355L10.1464 7.64645Z"></path>'
  + '<path fill="currentColor" d="M10.1464 8.35356L10.5 8.70711L11.2071 8L10.8536 7.64644L10.1464 8.35356ZM10.8536 7.64644L5.85355 2.64644L5.14644 3.35356L10.1464 8.35356L10.8536 7.64644Z"></path></svg>';

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

/* gallery slide: one art-directed <picture> per row (desktop|tablet|mobile) */
function buildGallerySlide(row) {
  const cells = [...row.children];
  const imgs = cells.map((c) => c.querySelector('img')).filter(Boolean);
  if (!imgs.length) return null;
  const li = document.createElement('li');
  li.className = 'slide';
  const fig = document.createElement('figure');
  const pic = document.createElement('picture');
  const [desktop, tablet, mobile] = imgs;
  if (mobile) {
    const s = document.createElement('source');
    s.media = '(max-width: 767px)';
    s.srcset = mobile.currentSrc || mobile.src;
    pic.append(s);
  }
  if (tablet) {
    const s = document.createElement('source');
    s.media = '(max-width: 1024px)';
    s.srcset = tablet.currentSrc || tablet.src;
    pic.append(s);
  }
  desktop.setAttribute('loading', 'lazy');
  pic.append(desktop);
  fig.append(pic);
  li.append(fig);
  return li;
}

/* boutiques slide: dark store card — name, role, divider, live open/closed
   status + today's hours (computed from authored week + timezone), address
   pinned to the card bottom. Mirrors live .store-card. */
function buildStoreSlide(row, oh, icons, labels) {
  const [imgCell, infoCell] = [...row.children];
  if (!imgCell || !infoCell) return null;
  const ps = [...infoCell.querySelectorAll('p')];
  const nameLink = ps[0]?.querySelector('a');
  const role = ps[1]?.textContent.trim() || '';
  const addrLink = ps[ps.length - 1]?.querySelector('a');
  const timezone = ps[ps.length - 2]?.textContent.trim();
  const hourLines = ps.slice(2, ps.length - 2).map((p) => p.textContent);

  const li = document.createElement('li');
  li.className = 'slide';
  const card = document.createElement('a');
  card.className = 'store-card';
  if (nameLink) card.href = nameLink.href;
  const fig = document.createElement('figure');
  const img = imgCell.querySelector('img');
  if (img) {
    img.setAttribute('loading', 'lazy');
    fig.append(img.closest('picture') || img);
  }
  const cap = document.createElement('figcaption');

  const name = document.createElement('div');
  name.className = 'sc-name';
  name.textContent = nameLink ? nameLink.textContent.trim() : ps[0]?.textContent.trim() || '';
  cap.append(name);
  if (role) {
    const r = document.createElement('div');
    r.className = 'sc-role';
    r.textContent = role;
    cap.append(r);
  }

  const days = oh.parseHours(hourLines);
  if (days.length) {
    const { open, today } = oh.openStatus(days, timezone);
    const hoursRow = document.createElement('div');
    hoursRow.className = 'sc-hours';
    const status = document.createElement('span');
    status.className = 'sc-status';
    const icon = document.createElement('span');
    icon.className = 'sc-icon';
    icon.innerHTML = icons.date;
    const statusText = document.createElement('span');
    statusText.textContent = open ? labels[0] : labels[1];
    status.append(icon, statusText);
    const todayHours = document.createElement('span');
    todayHours.className = 'sc-today';
    (today && !today.closed ? today.intervals : [labels[2]]).forEach((iv) => {
      const d = document.createElement('span');
      d.textContent = iv;
      todayHours.append(d);
    });
    hoursRow.append(status, todayHours);
    cap.append(hoursRow);
  }

  if (addrLink) {
    const infos = document.createElement('div');
    infos.className = 'sc-infos';
    const icon = document.createElement('span');
    icon.className = 'sc-icon';
    icon.innerHTML = icons.location;
    addrLink.className = 'sc-address';
    addrLink.prepend(icon);
    infos.append(addrLink);
    cap.append(infos);
  }

  fig.append(cap);
  card.append(fig);
  li.append(card);
  return li;
}

export default async function decorate(block) {
  const isReleases = ['releases', 'novelties', 'services'].some((v) => block.classList.contains(v));
  const isGallery = block.classList.contains('gallery');
  const isBoutiques = block.classList.contains('boutiques');

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

  if (isGallery) {
    [...block.children].forEach((row) => {
      const li = buildGallerySlide(row);
      if (li) track.append(li);
    });
  } else if (isBoutiques) {
    const [oh, iconsMod] = await Promise.all([
      import('../boutique-hero/opening-hours.js'),
      import('../boutique-hero/icons.js'),
    ]);
    const icons = iconsMod.default;
    // optional single-cell config row: "Open now | Closed now | Closed"
    let labels = ['Open now', 'Closed now', 'Closed'];
    [...block.children].forEach((row) => {
      if (row.children.length === 1 && row.textContent.includes('|') && !row.querySelector('img')) {
        labels = row.textContent.split('|').map((s) => s.trim());
        row.remove();
      }
    });
    [...block.children].forEach((row) => {
      const li = buildStoreSlide(row, oh, icons, labels);
      if (li) track.append(li);
    });
  } else {
    [...block.children].forEach((row) => {
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
  }

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
