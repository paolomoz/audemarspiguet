/**
 * hero — full-bleed autoplay video hero with display heading, lede and CTA.
 * Template-slotted (fixed composition — replica archetype, deploy #95).
 *
 * Authoring rows (positional):
 *  1. video URL (plain link)
 *  2. heading (h1, italic accent via <em>)
 *  3. lede paragraph
 *  4. CTA link
 */
export default function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const [videoCell, headingCell, ledeCell, ctaCell] = rows;

  const videoUrl = videoCell?.querySelector('a')?.href || videoCell?.textContent.trim();
  const h1 = headingCell?.querySelector('h1, h2, h3') || headingCell;
  const lede = ledeCell?.querySelector('p') || ledeCell;
  const cta = ctaCell?.querySelector('a');

  const wrap = document.createElement('div');
  wrap.className = 'hero-stage';
  wrap.innerHTML = `
    <div class="hero-bg"></div>
    <div class="grid-container hero-content">
      <div class="hero-cell"></div>
    </div>
    <div class="hero-controls">
      <button type="button" aria-label="Pause video">
        <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="4" y="2" width="2.5" height="14"></rect><rect x="11" y="2" width="2.5" height="14"></rect></svg>
      </button>
    </div>`;

  if (videoUrl) {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.src = videoUrl;
    wrap.querySelector('.hero-bg').append(video);
    const btn = wrap.querySelector('.hero-controls button');
    btn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        btn.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        btn.setAttribute('aria-label', 'Play video');
      }
    });
  }

  const cell = wrap.querySelector('.hero-cell');
  if (h1) {
    const heading = document.createElement('h1');
    heading.innerHTML = h1.innerHTML;
    cell.append(heading);
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
