/**
 * store-locator — AP "Where to find us" locator (archetype E, /ch/en/stores).
 * Sidebar (title, place search, geolocate, category chips, store cards) +
 * map surface, fed from a snapshot of the live site's Yext entity servlet
 * (`/{loc}/stores.yextentities.json`, pages merged → /data/stores-*.json).
 *
 * Authoring rows (positional):
 *  1. title cell        — h1 (Where to / find us)
 *  2. intro cell        — paragraph
 *  3. data feed path    — link/text, e.g. /data/stores-ch-en.json
 *  4. appointment URL   — e.g. /ch/en/form/appointment
 *  5. contact URL       — e.g. /ch/en/form/contact-us
 *  6. stores base path  — e.g. /ch/en/stores
 *  7. initial center    — "lat,lng" fallback (live SSR :initial-center)
 *
 * Live parity notes:
 *  - The interactive Google Map is deferred (no Maps key on this origin);
 *    the map area renders Google's empty-canvas base #e5e3df (register
 *    candidate — see report/inconsistency register).
 *  - Initial centering: live resolves the visitor country via an ipstack
 *    servlet (AP origin, not CORS-readable from here); this block derives
 *    the market from the browser timezone with the authored center as
 *    fallback — same resting layout, register-candidate behavior delta.
 *  - Place search suggests from the snapshot's store cities/countries
 *    (live uses Google Places autocomplete — key-gated, same deferral).
 */

import { STORE_ICONS } from './icons.js';

const DESKTOP = window.matchMedia('(min-width: 1025px)');
const ZOOM = 10; // city-level: reproduces the live resting list (1 store @ Milan)

/* timezone → market anchor (stand-in for live's ipstack geo-IP) */
const TZ_CENTERS = {
  'Europe/Rome': [45.4642, 9.19], // Milan
  'Europe/Zurich': [46.2044, 6.1432], // Geneva
  'Europe/Paris': [48.8566, 2.3522],
  'Europe/London': [51.5074, -0.1278],
  'Europe/Madrid': [40.4168, -3.7038],
  'Europe/Berlin': [48.1351, 11.582], // Munich
  'Europe/Vienna': [48.2082, 16.3738],
  'Europe/Athens': [37.9838, 23.7275],
  'Europe/Moscow': [55.7558, 37.6173],
  'America/New_York': [40.7128, -74.006],
  'America/Los_Angeles': [34.0522, -118.2437],
  'America/Chicago': [41.8781, -87.6298],
  'America/Mexico_City': [19.4326, -99.1332],
  'America/Sao_Paulo': [-23.5505, -46.6333],
  'Asia/Tokyo': [35.6762, 139.6503],
  'Asia/Shanghai': [31.2304, 121.4737],
  'Asia/Hong_Kong': [22.3193, 114.1694],
  'Asia/Singapore': [1.3521, 103.8198],
  'Asia/Seoul': [37.5665, 126.978],
  'Asia/Dubai': [25.2048, 55.2708],
  'Asia/Taipei': [25.033, 121.5654],
  'Asia/Bangkok': [13.7563, 100.5018],
  'Australia/Sydney': [-33.8688, 151.2093],
};

const TYPE_LABELS = {
  AP_HOUSE: 'AP House',
  AP_BOUTIQUE: 'Boutique',
  AP_CAFE: 'AP Café',
  SERVICE_CENTER: 'Service Center',
  AP_SERVICE_CENTER: 'Service Center',
  'MULTI-BRAND': 'Official Retailer',
};

/* chips — live values/labels (hydrated DOM, boutiquesTags) */
const CHIPS = [
  { value: 'all', label: 'All categories' },
  { value: 'boutique', label: 'Boutique', types: ['AP_BOUTIQUE'] },
  { value: 'cafe', label: 'Café', types: ['AP_CAFE'] },
  { value: 'house', label: 'House', types: ['AP_HOUSE'] },
  { value: 'lab', label: 'Lab', types: ['AP_LAB'] },
  {
    value: 'service', label: 'Service center', types: ['SERVICE_CENTER', 'AP_SERVICE_CENTER'], serviceFlag: true,
  },
  { value: 'retailer', label: 'Official retailer', types: ['MULTI-BRAND'] },
];

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* ------------------------------------------------------------------ geo */

const toRad = (d) => (d * Math.PI) / 180;

function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
}

/* web-mercator viewport bounds for a canvas centered on `c` at `zoom` */
function mapBounds(c, zoom, w, h) {
  const world = 256 * (2 ** zoom);
  const mercY = (lat) => {
    const s = Math.sin(toRad(lat));
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * world;
  };
  const invMercY = (y) => {
    const n = Math.PI - (2 * Math.PI * y) / world;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };
  const cx = ((c.lng + 180) / 360) * world;
  const cy = mercY(c.lat);
  return {
    west: ((cx - w / 2) / world) * 360 - 180,
    east: ((cx + w / 2) / world) * 360 - 180,
    north: invMercY(cy - h / 2),
    south: invMercY(cy + h / 2),
  };
}

function resolveCenter(fallback) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_CENTERS[tz]) {
      const [lat, lng] = TZ_CENTERS[tz];
      return { lat, lng };
    }
  } catch { /* fall through */ }
  return fallback;
}

/* -------------------------------------------------------------- entities */

function entityCoord(e) {
  const c = e.yextDisplayCoordinate || {};
  return { lat: c.latitude, lng: c.longitude };
}

function roleLabel(e) {
  const type = e.c_retailerType_v2;
  const base = TYPE_LABELS[type] || '';
  const svc = e.c_serviceCenter && !/SERVICE_CENTER/.test(type || '');
  return svc ? `${base} | Service Center` : base;
}

function fmtInterval(iv) {
  return `${iv.start} — ${iv.end}`;
}

/* "now" in the entity's own timezone */
function nowIn(timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return { day: get('weekday'), hm: `${get('hour')}:${get('minute')}` };
  } catch {
    const d = new Date();
    return { day: DAY_LABELS[d.getDay()], hm: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
  }
}

function openState(e) {
  const { day, hm } = nowIn(e.timezone);
  const key = day.toLowerCase();
  const dayHours = (e.hours || {})[key] || {};
  const intervals = dayHours.openIntervals || [];
  const open = !dayHours.isClosed
    && intervals.some((iv) => iv.start <= hm && hm < iv.end);
  return {
    open,
    todayKey: key,
    todayText: intervals.length ? fmtInterval(intervals[0]) : 'Closed',
  };
}

/* --------------------------------------------------------------- render */

function cardHTML(e, cfg) {
  const id = e.meta?.id || '';
  const photo = e.photoGallery?.[0]?.image;
  const img = photo ? `<img src="${esc(photo.url)}" alt="${esc(photo.alternateText || '')}" height="200" loading="lazy">` : '';
  const addr = e.address || {};
  const addrText = [addr.line1, [addr.postalCode, addr.city].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ');
  const mapsQuery = encodeURIComponent(`${addrText}, ${addr.countryCode || ''}`);
  const state = openState(e);
  const todayIdx = DAYS.indexOf(state.todayKey);
  const rows = DAYS.map((_, i) => {
    const k = DAYS[(todayIdx + i) % 7];
    const label = DAY_LABELS[(todayIdx + i) % 7];
    const d = (e.hours || {})[k] || {};
    const ivs = d.openIntervals || [];
    const hrs = ivs.length && !d.isClosed ? ivs.map(fmtInterval).join('<br>') : 'Closed';
    return `<li${i === 0 ? ' class="sl-day-active"' : ''}><span class="sl-day">${label}</span><span class="sl-day-hours">${hrs}</span></li>`;
  }).join('');
  const email = e.emails?.[0];
  const explore = e.c_slug ? `${cfg.storesBase}/${e.c_slug}` : cfg.storesBase;
  return `<li class="sl-card" id="store-id-${esc(id)}">
    <figure>
      ${img}
      <figcaption>
        <div class="sl-card-head">
          <h2 class="sl-card-name"><a href="${esc(explore)}">${esc(e.name)}</a></h2>
          <span class="sl-card-role">${esc(roleLabel(e))}</span>
        </div>
        <div class="sl-hours">
          <button type="button" class="sl-hours-toggle" aria-expanded="false" aria-controls="sl-hours-${esc(id)}" aria-label="Opening hours">
            <span class="sl-hours-state"><i class="sl-ic sl-ic-date">${STORE_ICONS.date}</i><span>${state.open ? 'Open now' : 'Closed now'}</span></span>
            <span class="sl-hours-today">${state.todayText}</span>
            <i class="sl-ic sl-ic-chevron">${STORE_ICONS.chevron}</i>
          </button>
          <ul class="sl-hours-days" id="sl-hours-${esc(id)}">${rows}</ul>
        </div>
        <div class="sl-card-infos">
          <a class="sl-card-address" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&amp;query=${mapsQuery}">
            <p><i class="sl-ic sl-ic-location">${STORE_ICONS.location}</i><span>${esc(addrText)}</span></p>
          </a>
          ${email ? `<div class="sl-card-contact">
            <button type="button" class="sl-contact-toggle" aria-expanded="false"><i class="sl-ic sl-ic-mail">${STORE_ICONS.mail}</i> Contact us</button>
            <a class="sl-card-email" hidden href="mailto:${esc(email)}">${esc(email)}</a>
          </div>` : ''}
          ${e.mainPhone ? `<a class="sl-card-phone" href="tel:${esc(e.mainPhone)}"><i class="sl-ic sl-ic-phone">${STORE_ICONS.phone}</i><span>${esc(e.mainPhone)}</span></a>` : ''}
        </div>
        ${e.c_statusShowInMakeAnAppointmentForm ? `<a class="sl-btn-appointment" href="${esc(cfg.appointmentUrl)}?storeId=${esc(id)}">Plan an Appointment</a>` : ''}
        <a class="sl-btn-explore" href="${esc(explore)}"><span>Explore</span></a>
      </figcaption>
    </figure>
  </li>`;
}

/* ----------------------------------------------------------------- block */

export default async function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild);
  const titleCell = rows[0];
  const introCell = rows[1];
  const pick = (i) => rows[i]?.querySelector('a')?.getAttribute('href')
    || rows[i]?.textContent.trim() || '';
  const toPath = (u) => {
    try { return new URL(u, window.location).pathname; } catch { return u; }
  };
  const cfg = {
    feed: toPath(pick(2)) || '/data/stores-ch-en.json',
    appointmentUrl: toPath(pick(3)) || '/ch/en/form/appointment',
    contactUrl: toPath(pick(4)) || '/ch/en/form/contact-us',
    storesBase: toPath(pick(5)) || '/ch/en/stores',
  };
  const centerRaw = (rows[6]?.textContent.trim() || '').split(',').map(Number);
  const fallbackCenter = centerRaw.length === 2 && !Number.isNaN(centerRaw[0])
    ? { lat: centerRaw[0], lng: centerRaw[1] } : { lat: 40.7127753, lng: -74.0059728 };

  /* light-chrome page (authored `theme: light`; ensured here so the header
     resting state is dark-on-white even without the metadata head) */
  document.body.classList.add('light');

  block.innerHTML = `
    <div class="sl-wrapper">
      <aside class="sl-sidebar">
        <div class="sl-sidebar-inner">
          <div class="sl-head"></div>
          <div class="sl-controls">
            <div class="sl-search">
              <form class="sl-search-form" autocomplete="off">
                <label class="sl-sr-only" for="sl-search-input">Search for country, region, city...</label>
                <textarea id="sl-search-input" rows="1" placeholder="Search for country, region, city..." title="Search for country, region, city..." role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-controls="sl-suggestions"></textarea>
                <button type="submit" class="sl-search-btn" disabled aria-label="search"><i class="sl-ic sl-ic-search">${STORE_ICONS.search}</i></button>
              </form>
              <ul class="sl-suggestions" id="sl-suggestions" role="listbox" hidden></ul>
            </div>
            <button type="button" class="sl-geo">Use my current location</button>
            <ul class="sl-chips">${CHIPS.map((c, i) => `<li><label class="sl-chip"><input type="radio" name="sl-chip" value="${c.value}"${i === 0 ? ' checked' : ''}><span>${c.label}</span></label></li>`).join('')}</ul>
            <div class="sl-filters"><span class="sl-count"></span></div>
          </div>
          <ul class="sl-list"></ul>
        </div>
      </aside>
      <div class="sl-map" role="region" aria-label="Map"></div>
    </div>`;

  const head = block.querySelector('.sl-head');
  if (titleCell) head.append(...titleCell.childNodes);
  if (introCell) head.append(...introCell.childNodes);

  const sidebarInner = block.querySelector('.sl-sidebar-inner');
  const wrapper = block.querySelector('.sl-wrapper');
  const mapEl = block.querySelector('.sl-map');
  const listEl = block.querySelector('.sl-list');
  const countEl = block.querySelector('.sl-count');

  /* mobile DOM order (live renders the list after the map below 1025px) */
  const placeList = () => {
    if (DESKTOP.matches) sidebarInner.append(listEl);
    else wrapper.append(listEl);
  };
  placeList();
  if (DESKTOP.addEventListener) DESKTOP.addEventListener('change', placeList);

  let entities = [];
  try {
    const resp = await fetch(cfg.feed);
    const data = await resp.json();
    entities = data.entities || [];
  } catch { entities = []; }

  const state = {
    center: resolveCenter(fallbackCenter),
    chip: 'all',
    query: '',
  };

  const chipDef = () => CHIPS.find((c) => c.value === state.chip) || CHIPS[0];

  const matchChip = (e) => {
    const def = chipDef();
    if (!def.types) return true;
    if (def.types.includes(e.c_retailerType_v2)) return true;
    return Boolean(def.serviceFlag && e.c_serviceCenter);
  };

  const render = () => {
    const w = mapEl.clientWidth || 815;
    const h = mapEl.clientHeight || 690;
    let zoom = ZOOM;
    let inView = [];
    const pool = entities.filter(matchChip);
    /* widen until at least one store is in view (live zooms to results) */
    while (zoom >= 3) {
      const b = mapBounds(state.center, zoom, w, h);
      inView = pool.filter((e) => {
        const c = entityCoord(e);
        return c.lat <= b.north && c.lat >= b.south && c.lng >= b.west && c.lng <= b.east;
      });
      if (inView.length) break;
      zoom -= 1;
    }
    inView.sort((a, b2) => distanceKm(state.center, entityCoord(a))
      - distanceKm(state.center, entityCoord(b2)));
    countEl.textContent = `${inView.length} store${inView.length === 1 ? '' : 's'}`;
    listEl.innerHTML = inView.map((e) => cardHTML(e, cfg)).join('');
  };

  /* hours dropdown + contact toggles (event delegation over both homes) */
  block.addEventListener('click', (ev) => {
    const toggle = ev.target.closest('.sl-hours-toggle');
    if (toggle) {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.closest('.sl-hours').classList.toggle('sl-hours-open', !expanded);
      return;
    }
    const contact = ev.target.closest('.sl-card-contact > button');
    if (contact) {
      const email = contact.parentElement.querySelector('.sl-card-email');
      const expanded = contact.getAttribute('aria-expanded') === 'true';
      contact.setAttribute('aria-expanded', String(!expanded));
      if (email) email.hidden = expanded;
    }
  });

  /* category chips */
  block.querySelector('.sl-chips').addEventListener('change', (ev) => {
    if (ev.target.name === 'sl-chip') {
      state.chip = ev.target.value;
      render();
    }
  });

  /* place search over the snapshot's cities / countries / store names */
  const input = block.querySelector('#sl-search-input');
  const submitBtn = block.querySelector('.sl-search-btn');
  const panel = block.querySelector('.sl-suggestions');
  const places = (() => {
    const seen = new Map();
    entities.forEach((e) => {
      const a = e.address || {};
      const c = entityCoord(e);
      [a.city, a.countryCode, e.name].filter(Boolean).forEach((label) => {
        const key = label.toLowerCase();
        if (!seen.has(key)) seen.set(key, { label, coords: [] });
        seen.get(key).coords.push(c);
      });
    });
    return [...seen.values()];
  })();

  const closePanel = () => {
    panel.hidden = true;
    panel.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  };

  const goTo = (place) => {
    const lat = place.coords.reduce((s, c) => s + c.lat, 0) / place.coords.length;
    const lng = place.coords.reduce((s, c) => s + c.lng, 0) / place.coords.length;
    state.center = { lat, lng };
    input.value = place.label;
    closePanel();
    render();
  };

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    submitBtn.disabled = q.length === 0;
    if (q.length < 2) { closePanel(); return; }
    const hits = places.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 8);
    if (!hits.length) { closePanel(); return; }
    panel.innerHTML = hits.map((p, i) => `<li><button type="button" data-i="${i}">${esc(p.label)}</button></li>`).join('');
    panel.dataset.hits = JSON.stringify(hits.map((p) => p.label));
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  });

  panel.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-i]');
    if (!btn) return;
    const labels = JSON.parse(panel.dataset.hits || '[]');
    const place = places.find((p) => p.label === labels[Number(btn.dataset.i)]);
    if (place) goTo(place);
  });

  block.querySelector('.sl-search-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const place = places.find((p) => p.label.toLowerCase().includes(q));
    if (place) goTo(place);
  });

  document.addEventListener('click', (ev) => {
    if (!panel.hidden && !ev.target.closest('.sl-search')) closePanel();
  });

  /* geolocate on demand (live behavior; permission prompt only on click) */
  block.querySelector('.sl-geo').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      state.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      render();
    }, () => { /* denied — keep current center, like live */ });
  });

  render();
}
