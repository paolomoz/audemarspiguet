/**
 * accordion — FAQ accordion (live ap-faq / ap-accordion, masterclasses XF).
 * Section head (h2) is default content before the block; the block reabsorbs
 * it. Rows: [ question | answer ]. Panels animate open/close with the live
 * height transition (0.3s ease-in-out); the +/− icon is the live thin-line
 * glyph. Honors prefers-reduced-motion (no height animation).
 */

const ICON = '<svg viewBox="0 0 200 200" aria-hidden="true">'
  + '<line class="acc-v1" x1="100" y1="60" x2="100" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"></line>'
  + '<line class="acc-v2" x1="100" y1="100" x2="100" y2="140" stroke="currentColor" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"></line>'
  + '<line x1="60" y1="100" x2="100" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"></line>'
  + '<line x1="100" y1="100" x2="140" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"></line></svg>';

export default function decorate(block) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // reabsorb the section head (default content before the block wrapper)
  const headWrapper = block.parentElement?.previousElementSibling;
  let head = null;
  if (headWrapper && headWrapper.classList.contains('default-content-wrapper')) {
    head = document.createElement('div');
    head.className = 'acc-head';
    [...headWrapper.childNodes].forEach((n) => head.append(n));
    headWrapper.remove();
  }

  const list = document.createElement('div');
  list.className = 'acc-list';

  [...block.children].forEach((row, i) => {
    const [qCell, aCell] = [...row.children];
    if (!qCell) return;
    const item = document.createElement('div');
    item.className = 'acc-item';

    const h3 = document.createElement('h3');
    h3.className = 'acc-header';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'acc-trigger';
    btn.id = `acc-trigger-${i}`;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `acc-panel-${i}`);
    const label = document.createElement('span');
    label.textContent = qCell.textContent.trim();
    const icon = document.createElement('i');
    icon.className = 'acc-icon';
    icon.innerHTML = ICON;
    btn.append(label, icon);
    h3.append(btn);

    const panel = document.createElement('div');
    panel.className = 'acc-panel';
    panel.id = `acc-panel-${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', btn.id);
    panel.style.height = '0px';
    const inner = document.createElement('div');
    inner.className = 'acc-content';
    if (aCell) inner.append(...aCell.childNodes);
    panel.append(inner);

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('acc-open', !open);
      if (reduced.matches) {
        panel.style.height = open ? '0px' : 'auto';
        return;
      }
      if (open) {
        panel.style.height = `${inner.offsetHeight}px`;
        window.requestAnimationFrame(() => { panel.style.height = '0px'; });
      } else {
        panel.style.height = `${inner.offsetHeight}px`;
        panel.addEventListener('transitionend', function done() {
          if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
          panel.removeEventListener('transitionend', done);
        });
      }
    });

    item.append(h3, panel);
    list.append(item);
  });

  block.replaceChildren(...[head, list].filter(Boolean));
}
