/**
 * dual-text — full-width display heading with an indented body column
 * ("YOON & VERBAL", "Crafting time since 1875").
 * Template-slotted (fixed composition, deploy #95).
 *
 * Authoring rows (positional):
 *  1. heading (h2, italic accent via <em>)
 *  2. body paragraph (+ optional CTA link in its own paragraph)
 */
export default function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const [headingCell, bodyCell] = rows;

  const heading = headingCell?.querySelector('h1, h2, h3') || headingCell;
  const wrap = document.createElement('div');
  wrap.className = 'grid-container';

  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML;
    wrap.append(h2);
  }

  const body = document.createElement('div');
  body.className = 'dt-body';
  if (bodyCell) {
    const cta = bodyCell.querySelector('a');
    [...bodyCell.querySelectorAll('p')]
      .filter((p) => !p.querySelector('a') && p.textContent.trim())
      .forEach((p) => {
        const out = document.createElement('p');
        out.textContent = p.textContent.trim();
        body.append(out);
      });
    if (cta) {
      cta.classList.add('ap-link');
      body.append(cta);
    }
  }
  wrap.append(body);

  block.replaceChildren(wrap);
}
