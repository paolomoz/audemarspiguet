/**
 * hero — full-bleed autoplay media hero with display heading, lede and CTA.
 * Template-slotted (fixed composition — replica archetype, deploy #95).
 *
 * Authoring rows (positional):
 *  1. media: video URL (plain link) OR image; `primary` variant may add a
 *     second image row = mobile art-direction source (max-width 767px)
 *  2. heading (h1 on the page's lead hero, h2 on the rest; italic via <em>)
 *  3. lede paragraph
 *  4. CTA link
 */
export default function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);

  // collect leading media rows (image cell or lone video link, no heading)
  const media = [];
  while (rows.length) {
    const cell = rows[0];
    if (!cell || cell.querySelector('h1, h2, h3')) break;
    const img = cell.querySelector('picture, img');
    const link = cell.querySelector('a');
    const isVideo = link && /\.(mp4|m3u8)|\/is\/content\//.test(link.href);
    if (img) media.push({ type: 'img', el: img.closest('picture') || img });
    else if (isVideo) media.push({ type: 'video', src: link.href });
    else break;
    rows.shift();
  }
  const [headingCell, ledeCell, ctaCell] = rows;

  const heading = headingCell?.querySelector('h1, h2, h3') || headingCell;
  const lede = ledeCell?.querySelector('p') || ledeCell;
  const cta = ctaCell?.querySelector('a');

  const wrap = document.createElement('div');
  wrap.className = 'hero-stage';
  wrap.innerHTML = `
    <div class="hero-bg"></div>
    <div class="grid-container hero-content">
      <div class="hero-cell"></div>
    </div>`;

  const bg = wrap.querySelector('.hero-bg');
  const primary = media[0];
  if (primary?.type === 'video') {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.src = primary.src;
    bg.append(video);

    const controls = document.createElement('div');
    controls.className = 'hero-controls';
    controls.innerHTML = `
      <button type="button" aria-label="Pause video">
        <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="4" y="2" width="2.5" height="14"></rect><rect x="11" y="2" width="2.5" height="14"></rect></svg>
      </button>`;
    const btn = controls.querySelector('button');
    btn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        btn.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        btn.setAttribute('aria-label', 'Play video');
      }
    });
    wrap.append(controls);
  } else if (primary?.type === 'img') {
    const desktopImg = primary.el.tagName === 'PICTURE' ? primary.el.querySelector('img') : primary.el;
    desktopImg.setAttribute('loading', 'eager');
    desktopImg.setAttribute('fetchpriority', 'high');
    const mobile = media[1];
    if (mobile?.type === 'img') {
      // art-directed picture: mobile rendition below 768px
      const pic = document.createElement('picture');
      const mobileImg = mobile.el.tagName === 'PICTURE' ? mobile.el.querySelector('img') : mobile.el;
      const source = document.createElement('source');
      source.media = '(max-width: 767px)';
      source.srcset = mobileImg.currentSrc || mobileImg.src;
      pic.append(source, desktopImg);
      bg.append(pic);
    } else {
      bg.append(primary.el);
    }
  }

  const cell = wrap.querySelector('.hero-cell');
  if (heading) {
    const level = heading.tagName?.match(/^H[1-6]$/) ? heading.tagName.toLowerCase() : 'h1';
    const h = document.createElement(level);
    h.innerHTML = heading.innerHTML;
    cell.append(h);
  }
  if (lede && lede.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = lede.textContent.trim();
    cell.append(p);
  }
  if (cta) {
    cta.classList.add('ap-link');
    cell.append(cta);
  }

  block.replaceChildren(wrap);
}
