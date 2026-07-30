/**
 * lookbook — 5-tile editorial media collage (fixed composition,
 * template-slotted per deploy #95).
 *
 * Authoring rows (positional, one media cell each):
 *  1. left tall image      2. left short image
 *  3. center video URL (plain link) or image
 *  4. right short image    5. right tall image
 */
const SLOTS = ['left-tall', 'left-short', 'center', 'right-short', 'right-tall'];

export default function decorate(block) {
  const cells = [...block.children].map((r) => r.firstElementChild);
  const collage = document.createElement('div');
  collage.className = 'lookbook-collage';

  cells.slice(0, 5).forEach((cell, i) => {
    const tile = document.createElement('div');
    tile.className = `lb-el lb-${SLOTS[i]}`;
    const media = cell?.querySelector('picture, img');
    const link = cell?.querySelector('a');
    if (media) {
      tile.append(media);
    } else if (link) {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.src = link.href;
      tile.append(video);
    }
    collage.append(tile);
  });

  block.replaceChildren(collage);
}
