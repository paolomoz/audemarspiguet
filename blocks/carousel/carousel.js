/**
 * carousel — static-offset card track (releases / stories / collections
 * variants). Reconstructive: one authored row per slide.
 *
 * Section head (h2 + optional browse link) is DEFAULT CONTENT before the
 * block (D1); the block reabsorbs it into the aside/head slot so the
 * decorated DOM matches the replica prototype.
 *
 * Authoring rows: [ image cell | text cell (title p, desc p, CTA link) ].
 * Collections variant: image cell holds photo + wordmark images; text cell
 * holds only the CTA link.
 */
export default function decorate(block) {
  const isReleases = ['releases', 'novelties', 'services'].some((v) => block.classList.contains(v));

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

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  const count = track.children.length;
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('span');
    dot.className = i === 0 ? 'dot dot-active' : 'dot';
    dots.append(dot);
  }

  block.replaceChildren(...[head, track, dots].filter(Boolean));
}
