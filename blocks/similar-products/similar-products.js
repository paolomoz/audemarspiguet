/**
 * similar-products — PDP "Others you might like" (live ap-similar-products):
 * content column (display h2 + Browse CTA, reabsorbed from the section head)
 * beside a product-card rail fed by refs baked from the live inline JSON
 * (snapshot: /data/similar/<ref>.json). Live swiper physics (300ms ease,
 * 10px gap, 5px threshold, resistance ^0.85, desktop arrows, mobile dots).
 *
 * Authoring rows: [ img ][ ref p, title p (<strong>collection</strong>
 * product), subtitle p, link ].
 */

const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<path fill="currentColor" d="M10.8536 8.35355L11.2071 8L10.5 7.29289L10.1464 7.64645L10.8536 8.35355ZM10.1464 7.64645L5.14644 12.6464L5.85356 13.3536L10.8536 8.35355L10.1464 7.64645Z"></path>'
  + '<path fill="currentColor" d="M10.1464 8.35356L10.5 8.70711L11.2071 8L10.8536 7.64644L10.1464 8.35356ZM10.8536 7.64644L5.85355 2.64644L5.14644 3.35356L10.1464 8.35356L10.8536 7.64644Z"></path></svg>';

const SPEED = 300;
const THRESHOLD = 5;
const LONG_SWIPES_MS = 300;
const RESISTANCE = 0.85;

function initRail(block, viewport, track, dots) {
  const slides = [...track.children];
  if (!slides.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prev = block.querySelector('.sim-nav-prev');
  const next = block.querySelector('.sim-nav-next');

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
      [...dots.children].forEach((d, i) => d.classList.toggle('dot-active', i === active));
    }
  };

  const goTo = (i) => {
    const off = offsets();
    x = off[Math.max(0, Math.min(i, off.length - 1))];
    apply(true);
  };

  if (prev) prev.addEventListener('click', () => goTo(nearestIndex(x) - 1));
  if (next) next.addEventListener('click', () => goTo(nearestIndex(x) + 1));

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
    if (performance.now() - startT < LONG_SWIPES_MS && Math.abs(dx) > THRESHOLD) {
      goTo(nearestIndex(startTrackX) + Math.sign(dx));
    } else {
      goTo(nearestIndex(x));
    }
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('click', (e) => {
    if (dragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  viewport.addEventListener('dragstart', (e) => e.preventDefault());

  let raf = 0;
  const remeasure = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => apply(false));
  };
  window.addEventListener('resize', remeasure);
  new ResizeObserver(remeasure).observe(viewport);
  apply(false);
}

export default function decorate(block) {
  // reabsorb the section head (h2 + browse CTA) into the content column
  const headWrapper = block.parentElement?.previousElementSibling;
  const content = document.createElement('div');
  content.className = 'sim-content';
  if (headWrapper && headWrapper.classList.contains('default-content-wrapper')) {
    const h2 = headWrapper.querySelector('h2');
    if (h2) content.append(h2);
    const cta = headWrapper.querySelector('a');
    if (cta) {
      cta.className = 'ap-cta';
      content.append(cta);
    }
    headWrapper.remove();
  }

  const track = document.createElement('ul');
  track.className = 'sim-track';
  [...block.children].forEach((row) => {
    const [imgCell, textCell] = [...row.children];
    if (!imgCell || !textCell) return;
    const li = document.createElement('li');
    li.className = 'sim-slide';
    const card = document.createElement('a');
    card.className = 'sim-card';
    const link = textCell.querySelector('a');
    if (link) card.href = link.href;

    const aside = document.createElement('div');
    aside.className = 'sim-card-aside';
    const img = imgCell.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'lazy');
      aside.append(img);
    }
    card.append(aside);

    const ps = [...textCell.querySelectorAll('p')].filter((p) => !p.querySelector('a'));
    if (ps[0]) {
      const ref = document.createElement('p');
      ref.className = 'sim-card-ref';
      ref.textContent = ps[0].textContent.trim();
      card.append(ref);
    }
    if (ps[1]) {
      const h4 = document.createElement('h4');
      h4.className = 'sim-card-title';
      const strong = ps[1].querySelector('strong');
      const b = document.createElement('b');
      b.textContent = strong ? strong.textContent.trim() : '';
      if (strong) strong.remove();
      const span = document.createElement('span');
      span.textContent = ps[1].textContent.trim();
      h4.append(b, span);
      card.append(h4);
    }
    if (ps[2]) {
      const sub = document.createElement('p');
      sub.className = 'sim-card-sub';
      sub.textContent = ps[2].textContent.trim();
      card.append(sub);
    }
    li.append(card);
    track.append(li);
  });

  const viewport = document.createElement('div');
  viewport.className = 'sim-viewport';
  viewport.append(track);
  ['prev', 'next'].forEach((dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `sim-nav sim-nav-${dir}`;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous product' : 'Next product');
    btn.innerHTML = CHEVRON;
    viewport.append(btn);
  });

  const dots = document.createElement('div');
  dots.className = 'sim-dots';
  for (let i = 0; i < track.children.length; i += 1) {
    const dot = document.createElement('span');
    dot.className = i === 0 ? 'dot dot-active' : 'dot';
    dots.append(dot);
  }

  const root = document.createElement('div');
  root.className = 'sim-root';
  root.append(content, viewport, dots);
  block.replaceChildren(root);

  initRail(block, viewport, track, track.children.length > 1 ? dots : null);
}
