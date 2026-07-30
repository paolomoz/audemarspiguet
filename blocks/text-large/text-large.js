/**
 * text-large — centered large-copy band (live .text--center > p > span.text-large).
 * Authoring rows (positional): 1. paragraph.
 */
export default function decorate(block) {
  const p = block.querySelector('p') || block.firstElementChild?.firstElementChild;
  const out = document.createElement('p');
  out.textContent = (p?.textContent || '').trim();
  block.replaceChildren(out);
}
