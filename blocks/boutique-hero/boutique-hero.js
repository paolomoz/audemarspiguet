/**
 * boutique-hero — store-detail hero (ap-boutique-hero): locator link, store
 * name, role line, full-bleed photo, black contact card (hours computed
 * client-side from authored Yext hours + timezone, exactly like the live
 * Vue component computes from the baked entity), and the closing quote.
 *
 * Template for the generated stores/{slug} pages (76/locale): every row is a
 * labeled [key | value] pair emitted mechanically from the Yext entity — see
 * data/store-ap-house-geneva.json for the source contract.
 *
 * Rows (label | value):
 *  link        <a> to the stores index ("Explore all boutiques")
 *  name        <h1> store name
 *  role        retailer-type line ("AP House | Service Center")
 *  image       hero photo (photoGallery[0])
 *  panel-title contact card heading ("Contact details")
 *  timezone    IANA timezone (Yext `timezone`)
 *  hours       one <p> per day: "Monday 10:00 — 18:30" / "Sunday Closed"
 *  labels      "Open now | Closed now | Closed" (locale strings)
 *  address     <a href=maps-search> "line1, postalCode city"
 *  email       <a href=mailto:> "Contact us"
 *  phone       <a href=tel:> mainPhone
 *  appointment <a> CTA (bookAppointmentPageUrl?storeId=meta.id)
 *  masterclass <a> CTA (c_masterclass) — optional
 *  quote       closing paragraph (c_quoteBoutiquePages)
 */

import ICONS from './icons.js';
import { parseHours, openStatus, rotateFromToday } from './opening-hours.js';

function readRows(block) {
  const conf = {};
  [...block.children].forEach((row) => {
    const [keyCell, valCell] = [...row.children];
    if (!keyCell || !valCell) return;
    conf[keyCell.textContent.trim().toLowerCase()] = valCell;
  });
  return conf;
}

function iconRow(cls, icon, child) {
  const row = document.createElement('div');
  row.className = `bh-row ${cls}`;
  const i = document.createElement('span');
  i.className = 'bh-icon';
  i.innerHTML = ICONS[icon];
  row.append(i, child);
  return row;
}

function buildHours(conf) {
  const lines = [...conf.hours?.querySelectorAll('p') || []].map((p) => p.textContent);
  const days = parseHours(lines);
  if (!days.length) return null;
  const labels = (conf.labels?.textContent || 'Open now | Closed now | Closed')
    .split('|').map((s) => s.trim());
  const [openLabel, closedNowLabel, closedLabel] = labels;
  const timezone = conf.timezone?.textContent.trim();
  const { open, today, todayIdx } = openStatus(days, timezone);

  const wrap = document.createElement('div');
  wrap.className = 'bh-hours';

  // status header: calendar icon + open/closed + today's intervals
  const status = document.createElement('span');
  status.textContent = open ? openLabel : closedNowLabel;
  const header = iconRow('bh-hours-status', 'date', status);
  const todayHours = document.createElement('span');
  todayHours.className = 'bh-hours-today';
  (today && !today.closed ? today.intervals : [closedLabel]).forEach((iv) => {
    const d = document.createElement('span');
    d.textContent = iv;
    todayHours.append(d);
  });
  header.append(todayHours);

  // week list rotated from today (live order); today's row is bold
  const list = document.createElement('ul');
  list.className = 'bh-hours-week';
  rotateFromToday(days, todayIdx).forEach((d) => {
    const li = document.createElement('li');
    if (d.idx === todayIdx) li.className = 'bh-today';
    const day = document.createElement('span');
    day.textContent = d.label;
    const val = document.createElement('span');
    val.textContent = d.closed ? closedLabel : d.intervals.join(', ');
    li.append(day, val);
    list.append(li);
  });

  // mobile: collapsed accordion with chevron (live ap-dropdown)
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'bh-hours-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Opening hours');
  const chevron = document.createElement('span');
  chevron.className = 'bh-chevron';
  chevron.innerHTML = ICONS.arrow;
  toggle.append(header, chevron);
  toggle.addEventListener('click', () => {
    const expanded = wrap.classList.toggle('bh-open');
    toggle.setAttribute('aria-expanded', String(expanded));
  });

  wrap.append(toggle, list);
  return wrap;
}

export default function decorate(block) {
  const conf = readRows(block);

  // title area
  const title = document.createElement('div');
  title.className = 'grid-container bh-title';
  const link = conf.link?.querySelector('a');
  if (link) {
    link.classList.add('ap-link');
    title.append(link);
  }
  const h1 = conf.name?.querySelector('h1');
  if (h1) title.append(h1);
  if (conf.role?.textContent.trim()) {
    const role = document.createElement('div');
    role.className = 'bh-role';
    role.textContent = conf.role.textContent.trim();
    title.append(role);
  }

  // full-bleed photo
  const media = document.createElement('div');
  media.className = 'bh-image';
  const img = conf.image?.querySelector('picture, img');
  if (img) media.append(img.closest('picture') || img);

  // black contact card, absolute right on desktop
  const cardOuter = document.createElement('div');
  cardOuter.className = 'grid-container bh-contact';
  const card = document.createElement('div');
  card.className = 'bh-card';
  cardOuter.append(card);

  if (conf['panel-title']?.textContent.trim()) {
    const t = document.createElement('div');
    t.className = 'bh-card-title';
    t.textContent = conf['panel-title'].textContent.trim();
    card.append(t);
  }
  const hours = buildHours(conf);
  if (hours) card.append(hours);

  const infos = document.createElement('div');
  infos.className = 'bh-infos';
  const addr = conf.address?.querySelector('a');
  if (addr) infos.append(iconRow('bh-address', 'location', addr));
  const email = conf.email?.querySelector('a');
  if (email) infos.append(iconRow('bh-email', 'mail', email));
  const phone = conf.phone?.querySelector('a');
  if (phone) infos.append(iconRow('bh-phone', 'phone', phone));
  if (infos.children.length) card.append(infos);

  ['appointment', 'masterclass'].forEach((key) => {
    const a = conf[key]?.querySelector('a');
    if (a) {
      a.className = 'bh-cta';
      card.append(a);
    }
  });

  // closing quote
  let quote = null;
  if (conf.quote?.textContent.trim()) {
    quote = document.createElement('div');
    quote.className = 'grid-container bh-quote';
    const inner = document.createElement('p');
    inner.textContent = conf.quote.textContent.trim();
    quote.append(inner);
  }

  block.replaceChildren(...[title, media, cardOuter, quote].filter(Boolean));

  // scroll-reveal for the hero copy (same measured motion as scripts/reveal.js;
  // h1 is picked up globally there, these are the block-local elements)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const items = [link, title.querySelector('.bh-role'), quote?.firstElementChild].filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('reveal-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    items.forEach((el) => {
      el.classList.add('reveal-init');
      io.observe(el);
    });
  }
}
