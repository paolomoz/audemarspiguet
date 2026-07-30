/**
 * text-image — dark image-left band ("Find a boutique").
 * Template-slotted (fixed composition, deploy #95).
 *
 * Authoring rows (positional):
 *  1. image
 *  2. heading (h2, italic accent via <em>)
 *  3. paragraph
 *  4. CTA link
 */
export default function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const [imgCell, headingCell, textCell, ctaCell] = rows;

  const media = imgCell?.querySelector('picture, img');
  const heading = headingCell?.querySelector('h1, h2, h3') || headingCell;
  const text = textCell?.querySelector('p') || textCell;
  const cta = ctaCell?.querySelector('a');

  const wrap = document.createElement('div');
  wrap.className = 'grid-container';
  const grid = document.createElement('div');
  grid.className = 'ti-grid';

  const mediaCol = document.createElement('div');
  mediaCol.className = 'ti-media';
  if (media) mediaCol.append(media);

  const content = document.createElement('div');
  content.className = 'ti-content';
  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML;
    content.append(h2);
  }
  if (text && text.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = text.textContent.trim();
    content.append(p);
  }
  if (cta) {
    cta.classList.add('ap-link');
    content.append(cta);
  }

  grid.append(mediaCol, content);
  wrap.append(grid);
  block.replaceChildren(wrap);
}
