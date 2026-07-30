/**
 * accordion — AP FAQ accordion (source: ap-faq + ap-accordion, /ch/en/services/faq).
 *
 * Authoring rows (per group/section):
 *  - single-cell row → group title (h2)
 *  - two-cell row    → [question, answer (rich text)]
 * All items closed at rest (matches live resting state — 63/63 closed).
 *
 * Motion measured on live (faq-accordion-probe 2026-07-30):
 *  - content: height/margin .3s ease-in-out (--accordion-animation-duration:
 *    300ms), opened margin 0 0 24px, answer text 300 16/24 #757575
 *  - icon: plus → minus, vertical hand rotates 270° with ~1s expo-out tail
 *  - trigger: real <button aria-expanded aria-controls>, h3 header, focus
 *    padding 12px (.2s ease-in-out)
 * Honors prefers-reduced-motion via CSS (transitions collapse).
 */

let uid = 0;

const ICON_SVG = '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">'
  + '<line class="acc-ico-v" x1="100" y1="60" x2="100" y2="140" vector-effect="non-scaling-stroke"></line>'
  + '<line x1="60" y1="100" x2="140" y2="100" vector-effect="non-scaling-stroke"></line>'
  + '</svg>';

function buildItem(qCell, aCell) {
  uid += 1;
  const triggerId = `acc-trigger-${uid}`;
  const contentId = `acc-content-${uid}`;

  const item = document.createElement('div');
  item.className = 'acc-item';

  const header = document.createElement('h3');
  header.className = 'acc-header';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'acc-trigger';
  trigger.id = triggerId;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', contentId);

  const title = document.createElement('span');
  title.className = 'acc-title';
  title.textContent = qCell.textContent.trim();

  const icon = document.createElement('span');
  icon.className = 'acc-icon';
  icon.innerHTML = ICON_SVG;

  trigger.append(title, icon);
  header.append(trigger);

  const content = document.createElement('div');
  content.className = 'acc-content';
  content.id = contentId;
  content.setAttribute('role', 'region');
  content.setAttribute('aria-labelledby', triggerId);
  const text = document.createElement('div');
  text.className = 'acc-text';
  text.append(...aCell.childNodes);
  content.append(text);

  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    if (open) content.style.setProperty('--acc-content-h', `${content.scrollHeight}px`);
    trigger.setAttribute('aria-expanded', String(open));
    item.classList.toggle('acc-open', open);
  });

  item.append(header, content);
  return item;
}

export default function decorate(block) {
  const wrap = document.createElement('div');
  wrap.className = 'grid-container';
  const inner = document.createElement('div');
  inner.className = 'acc-inner';
  const list = document.createElement('div');
  list.className = 'acc-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1) {
      const src = cells[0].querySelector('h1, h2, h3, h4') || cells[0];
      const h2 = document.createElement('h2');
      h2.className = 'acc-group-title';
      h2.innerHTML = src.innerHTML;
      inner.append(h2);
    } else if (cells.length >= 2) {
      list.append(buildItem(cells[0], cells[1]));
    }
  });

  inner.append(list);
  wrap.append(inner);
  block.replaceChildren(wrap);
}
