/**
 * dual-text-image — two side-by-side image + text cells
 * ("Musée Atelier" / "Watchmaking Experiences").
 * Template-slotted (fixed composition, deploy #95).
 *
 * Authoring rows: one row per cell; the cell holds (in order)
 * image, heading (h2, italic accent via <em>), paragraph, CTA link.
 */
export default function decorate(block) {
  const wrap = document.createElement('div');
  wrap.className = 'grid-container';
  const grid = document.createElement('div');
  grid.className = 'dti-grid';

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    const out = document.createElement('div');
    out.className = 'dti-cell';

    const media = cell.querySelector('picture, img');
    if (media) out.append(media.closest('picture') || media);

    const heading = cell.querySelector('h1, h2, h3');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.innerHTML = heading.innerHTML;
      out.append(h2);
    }

    const cta = [...cell.querySelectorAll('a')].pop();
    [...cell.querySelectorAll('p')]
      .filter((p) => !p.querySelector('a') && !p.querySelector('picture, img') && p.textContent.trim())
      .forEach((p) => {
        const body = document.createElement('p');
        body.textContent = p.textContent.trim();
        out.append(body);
      });
    if (cta) {
      cta.classList.add('ap-link');
      out.append(cta);
    }
    grid.append(out);
  });

  wrap.append(grid);
  block.replaceChildren(wrap);
}
