/**
 * reveal — AP-style scroll-reveal motion, measured off the live site
 * (motion-probe 2026-07-30): translateY(20px→0) + opacity(0→1), ~1.4s,
 * slow-start/long-tail ease, 200ms stagger per text line.
 *
 * Storybook carousels (all .carousel variants) get the live cinematic
 * cascade (reveal-probe 2026-07-30): every card figure rises together on
 * section trigger; card text lines then reveal in one global 200ms-stagger
 * queue, card by card (per card: title lines, desc lines, CTA, then one
 * empty gap slot — matches live per-card base delays 254/1854/2841ms).
 *
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

/** Split a plain-text element into its rendered lines (AP SplitText-alike):
 * wrap words, group by offsetTop, rewrap groups as block .reveal-line spans.
 * Wrap points are the natural ones, so resting-state rendering is unchanged. */
function splitRenderedLines(el) {
  if (el.dataset.revealSplit) return [...el.querySelectorAll(':scope > .reveal-line')];
  const words = el.textContent.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  el.textContent = '';
  const spans = words.map((w) => {
    const s = document.createElement('span');
    s.textContent = w;
    el.append(s, ' ');
    return s;
  });
  const groups = [];
  let top = null;
  spans.forEach((s) => {
    if (top === null || Math.abs(s.offsetTop - top) > 1) {
      groups.push([]);
      top = s.offsetTop;
    }
    groups[groups.length - 1].push(s);
  });
  const lines = groups.map((g) => {
    const line = document.createElement('span');
    line.className = 'reveal-line';
    g.forEach((w, i) => {
      line.append(w.textContent + (i < g.length - 1 ? ' ' : ''));
    });
    return line;
  });
  el.replaceChildren(...lines);
  el.dataset.revealSplit = 'true';
  return lines;
}

export default function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const main = document.querySelector('main');
  if (!main) return;

  const items = [];

  // display headings: per authored line, staggered
  main.querySelectorAll('h1, main .section h2').forEach((h) => {
    splitBrSegments(h).forEach((line, i) => items.push({ el: line, delay: i * STAGGER }));
  });

  // body copy + CTAs: whole-element rise, staggered after their heading
  main.querySelectorAll(
    '.hero-cell p, .hero-cell .ap-link, .columns.editorial p, .columns.editorial a, '
    + '.carousel-aside .ap-link, .carousel-head .ap-link, .ti-content p, .ti-content .ap-link, '
    + '.pl-group-heading',
  ).forEach((el) => items.push({ el, delay: 2 * STAGGER }));

  // media: collage tiles, product cards — staggered within their group
  const groupCounts = new Map();
  main.querySelectorAll('.lookbook .lb-el, .ti-media, .product-card').forEach((el) => {
    const group = el.closest('.lookbook-collage, .pl-grid') || el;
    const n = groupCounts.get(group) || 0;
    groupCounts.set(group, n + 1);
    items.push({ el, delay: (n % 4) * STAGGER });
  });

  // storybook carousels: cinematic cascade, one trigger per carousel
  const cascades = new Map();
  main.querySelectorAll('.carousel').forEach((car) => {
    const cardItems = [];
    let slot = 0;
    car.querySelectorAll('.carousel-track > .slide').forEach((slide) => {
      const fig = slide.querySelector('figure');
      if (fig) cardItems.push({ el: fig, delay: 0 });
      slide.querySelectorAll('h4 p, .desc p').forEach((p) => {
        splitRenderedLines(p).forEach((line) => {
          cardItems.push({ el: line, delay: STAGGER + slot * STAGGER });
          slot += 1;
        });
      });
      const cta = slide.querySelector('figcaption .ap-link');
      if (cta) {
        cardItems.push({ el: cta, delay: STAGGER + slot * STAGGER });
        slot += 1;
      }
      slot += 1; // inter-card gap slot (measured on live)
    });
    if (cardItems.length) cascades.set(car, cardItems);
  });

  const prime = (it) => {
    it.el.classList.add('reveal-init');
    it.el.style.transitionDelay = `${it.delay}ms`;
  };
  items.forEach(prime);
  cascades.forEach((list) => list.forEach(prime));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      if (cascades.has(e.target)) {
        cascades.get(e.target).forEach((it) => it.el.classList.add('reveal-in'));
      } else {
        e.target.classList.add('reveal-in');
      }
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });

  items.forEach((it) => io.observe(it.el));
  cascades.forEach((list, car) => io.observe(car));
}
