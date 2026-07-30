/**
 * store-locator-simple — PDP boutique-finder strip (live
 * ap-store-locator-simple / ap-standalone-store-locator--white): white band,
 * display title + primary CTA beside a map panel.
 *
 * The live map is a runtime Google Maps instance (key from AP page config,
 * geolocated center) — third-party runtime surface, deferred like R-02/R-03;
 * the block renders the map panel at exact live geometry as a neutral ground
 * so the strip keeps its resting-state footprint. Maps JS wiring is plan
 * §2.2 / §3.4 scope (loads on interaction only).
 *
 * Authoring rows (key | content): title | h2 (line + <em> line), cta | link.
 */

export default function decorate(block) {
  const rows = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = [...row.children];
    if (!keyCell || !valueCell) return;
    rows[keyCell.textContent.trim().toLowerCase()] = valueCell;
  });

  const root = document.createElement('div');
  root.className = 'sls-root grid-container';

  const content = document.createElement('div');
  content.className = 'sls-content';
  const title = rows.title ? rows.title.querySelector('h2, h3') : null;
  if (title) content.append(title);
  const cta = rows.cta ? rows.cta.querySelector('a') : null;
  if (cta) {
    cta.className = 'ap-cta';
    content.append(cta);
  }

  const map = document.createElement('div');
  map.className = 'sls-map';
  map.setAttribute('role', 'img');
  map.setAttribute('aria-label', 'Map of Audemars Piguet boutiques');

  root.append(content, map);
  block.replaceChildren(root);
}
