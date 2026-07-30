/**
 * reveal — AP-style scroll-reveal motion, measured off the live site
 * (motion-probe 2026-07-30): translateY(20px→0) + opacity(0→1), ~1.4s,
 * slow-start/long-tail ease, 200ms stagger per text line.
 * Loaded from loadLazy(); honors prefers-reduced-motion.
 */

const STAGGER = 200;

/** Wrap a heading's <br>-delimited segments in .reveal-line spans,
 * keeping <em>/<strong> runs intact (AP's js-reveal-effect-line). */
function splitBrSegments(el) {
  if (el.dataset.revealSplit) return [...el.querySelectorAll(':scope > .reveal-line')];
  const segs = [];
  let cur = document.createElement('span');
  cur.className = 'reveal-line';
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName === 'BR') {
      segs.push(cur);
      cur = document.createElement('span');
      cur.className = 'reveal-line';
      n.remove();
    } else {
      cur.append(n);
    }
  });
  segs.push(cur);
  el.append(...segs);
  el.dataset.revealSplit = 'true';
  return segs;
}

export default function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const main = document.querySelector('main');
  if (!main) return;

  const items = [];

  // display headings: per authored line, staggered
  main.querySelectorAll('h1, main .section h2').forEach((h) => {
    splitBrSegments(h).forEach((line, i) => items.push({ el: line, index: i }));
  });

  // body copy + CTAs: whole-element rise, staggered after their heading
  main.querySelectorAll(
    '.hero-cell p, .hero-cell .ap-link, .columns.editorial p, .columns.editorial a, '
    + '.carousel-aside .ap-link, .carousel-head .ap-link, .ti-content p, .ti-content .ap-link, '
    + '.pl-group-heading',
  ).forEach((el) => items.push({ el, index: 2 }));

  // media: figures, collage tiles, product cards — staggered within their group
  const groupCounts = new Map();
  main.querySelectorAll('.carousel .slide figure, .lookbook .lb-el, .ti-media, .product-card').forEach((el) => {
    const group = el.closest('.carousel-track, .lookbook-collage, .pl-grid') || el;
    const n = groupCounts.get(group) || 0;
    groupCounts.set(group, n + 1);
    items.push({ el, index: n % 4 });
  });

  items.forEach((it) => {
    it.el.classList.add('reveal-init');
    it.el.style.transitionDelay = `${Math.min(it.index, 8) * STAGGER}ms`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });

  items.forEach((it) => io.observe(it.el));
}
