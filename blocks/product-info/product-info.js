/**
 * product-info — PDP hero (live ap-product-info): background art, kicker+title,
 * reference, client-fetched price, main watch image, description, appointment
 * CTA. Rows are keyed: background | title | reference | price | image |
 * description | cta (generator contract, implementation-plan §4).
 *
 * Price renders client-side at live parity: the price row authors a link to a
 * price JSON ({price:{amount,currency},tooltip,message}); hidden if absent.
 * Favourite/wishlist is account-backed on live and carries no resting-state
 * pixels — deferred (plan §3.5).
 */

const TOOLTIP_ICON = 'https://www.audemarspiguet.com/etc.clientlibs/ap-com/ui/clientlibs/publish/resources/images/icon-info.png';

function rowMap(block) {
  const map = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = [...row.children];
    if (!keyCell || !valueCell) return;
    map[keyCell.textContent.trim().toLowerCase()] = valueCell;
  });
  return map;
}

function formatPrice(amount, currency) {
  const whole = String(Math.round(amount));
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${grouped}\u00a0${currency}`;
}

async function renderPrice(el, href) {
  try {
    const resp = await fetch(href);
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.price && data.price.amount) {
      el.textContent = formatPrice(data.price.amount, data.price.currency);
      if (data.tooltip) {
        const icon = document.createElement('span');
        icon.className = 'pi-tooltip-icon';
        icon.style.backgroundImage = `url(${TOOLTIP_ICON})`;
        icon.setAttribute('role', 'img');
        icon.setAttribute('aria-label', data.tooltip.trim());
        icon.title = data.tooltip.trim();
        el.append(icon);
      }
      el.hidden = false;
    } else if (data.message) {
      el.textContent = data.message;
      el.hidden = false;
    }
  } catch (e) {
    /* price stays hidden — live parity when the price service is absent */
  }
}

export default function decorate(block) {
  const rows = rowMap(block);

  const section = document.createElement('div');
  section.className = 'pi-hero';

  // background art (desktop + mobile renditions authored as two images)
  const bgImgs = rows.background ? [...rows.background.querySelectorAll('img')] : [];
  bgImgs.forEach((img, i) => {
    const bg = document.createElement('div');
    bg.className = `pi-bg ${i === 0 ? 'pi-bg-desktop' : 'pi-bg-mobile'}`;
    bg.style.backgroundImage = `url(${img.src})`;
    section.append(bg);
  });

  const container = document.createElement('div');
  container.className = 'grid-container';
  const grid = document.createElement('div');
  grid.className = 'pi-grid';

  // text column: title + ref + price
  const text = document.createElement('div');
  text.className = 'pi-text';
  const title = rows.title ? rows.title.querySelector('h1, h2') : null;
  if (title) text.append(title);
  if (rows.reference) {
    const ref = document.createElement('div');
    ref.className = 'pi-ref';
    ref.textContent = rows.reference.textContent.trim();
    text.append(ref);
  }
  const priceLink = rows.price ? rows.price.querySelector('a') : null;
  if (priceLink) {
    const price = document.createElement('div');
    price.className = 'pi-price';
    price.hidden = true;
    text.append(price);
    renderPrice(price, priceLink.getAttribute('href'));
  }
  grid.append(text);

  // image column
  const imageCol = document.createElement('div');
  imageCol.className = 'pi-image';
  const mainImg = rows.image ? rows.image.querySelector('picture, img') : null;
  if (mainImg) {
    const img = mainImg.tagName === 'PICTURE' ? mainImg.querySelector('img') : mainImg;
    if (img) {
      img.setAttribute('loading', 'eager');
      imageCol.append(mainImg.tagName === 'PICTURE' ? mainImg : img);
    }
  }
  grid.append(imageCol);

  // paragraph column: CTA (top) + description (bottom, justify-between)
  const para = document.createElement('div');
  para.className = 'pi-paragraph';
  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'pi-cta-wrap';
  const cta = rows.cta ? rows.cta.querySelector('a') : null;
  if (cta) {
    cta.className = 'ap-cta ap-cta-secondary';
    ctaWrap.append(cta);
  }
  para.append(ctaWrap);
  const desc = rows.description ? rows.description.querySelector('p') : null;
  if (desc) para.append(desc);
  grid.append(para);

  container.append(grid);
  section.append(container);
  block.replaceChildren(section);
}
