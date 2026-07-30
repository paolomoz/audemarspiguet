/**
 * newsletter — white full-width band: display heading, teaser, subscribe CTA
 * ("Get the Latest News"). Template-slotted (fixed composition, deploy #95).
 *
 * Authoring rows (positional):
 *  1. heading (h2, italic accent via <em>)
 *  2. teaser paragraph
 *  3. CTA link (authored <strong><a> — decorateButtons classes it .button.primary)
 */
export default function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const [headingCell, textCell, ctaCell] = rows;

  const heading = headingCell?.querySelector('h1, h2, h3') || headingCell;
  const text = textCell?.querySelector('p') || textCell;
  const cta = ctaCell?.querySelector('a');

  const wrap = document.createElement('div');
  wrap.className = 'grid-container';

  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML;
    wrap.append(h2);
  }
  if (text && text.textContent.trim()) {
    const p = document.createElement('p');
    p.className = 'nl-teaser';
    p.textContent = text.textContent.trim();
    wrap.append(p);
  }
  if (cta) {
    cta.classList.add('button', 'primary');
    wrap.append(cta);
  }

  block.replaceChildren(wrap);
}
