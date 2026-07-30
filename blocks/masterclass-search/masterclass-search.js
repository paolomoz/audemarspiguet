/**
 * masterclass-search — "Find Your Masterclass" band (live ap-masterclass-search).
 * Centered display heading + description + location chips derived from the
 * catalogue snapshot (/data/masterclass-*.json — live embeds the catalogue
 * server-side; the snapshot follows the product-listing feed convention).
 *
 * Authoring rows (positional):
 *  1. heading (h2, italic accent via <em>)
 *  2. description paragraph
 *  3. link to the catalogue JSON snapshot
 *
 * Live behavior note: the chips are the search's location facet. The ch/en
 * catalogue carries a single location (AP House Geneva), so the resting
 * surface is a static chip row — there is nothing filterable client-side.
 */
export default async function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const [headingCell, textCell, feedCell] = rows;

  const heading = headingCell?.querySelector('h1, h2, h3') || headingCell;
  const text = textCell?.querySelector('p') || textCell;
  const feed = feedCell?.querySelector('a');

  const head = document.createElement('div');
  head.className = 'mcs-heading';
  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML;
    head.append(h2);
  }
  if (text && text.textContent.trim()) {
    const p = document.createElement('p');
    p.className = 'mcs-desc';
    p.textContent = text.textContent.trim();
    head.append(p);
  }

  const locations = document.createElement('div');
  locations.className = 'mcs-locations';

  block.replaceChildren(head, locations);

  if (feed) {
    try {
      const resp = await fetch(new URL(feed.getAttribute('href'), window.location.href).pathname);
      const data = await resp.json();
      const seen = new Set();
      (data.items || []).forEach((p) => {
        (p.locations || []).forEach(({ location }) => {
          if (!location || seen.has(location.id)) return;
          seen.add(location.id);
          const name = (location.translations || []).find((t) => t.locale === 'en')?.data
            || location.apHouseDefaultName || '';
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'mcs-location';
          chip.setAttribute('aria-pressed', 'false');
          const span = document.createElement('span');
          span.textContent = name;
          chip.append(span);
          locations.append(chip);
        });
      });
    } catch (e) {
      /* feed unavailable — heading still renders */
    }
  }
}
