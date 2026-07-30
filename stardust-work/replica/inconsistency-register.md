# Inconsistency register — audemarspiguet.com replica (pilot: code-11-59-collection)

Everything not listed here is frozen; any design delta found by the gate is
a defect, not an improvement.

## R-01 — Licensed web fonts substituted with brand fallback stack

- **Evidence:** live page loads `Helvetica Neue Web` (Neue Helvetica 25/35/45/65,
  Linotype commercial kit) and `Times Now 400 italic` (commercial) —
  font-probe 2026-07-30 (`stardust-work/scripts/font-probe.mjs` output); AP font
  CDN responds `access-control-allow-origin: https://tapptic-design.zeroheight.com`
  so cross-origin loading from the EDS origin is browser-blocked.
- **Finding:** licensed font files cannot be rehosted on the new origin nor
  hotlinked cross-origin. Not a design choice — a licensing/CORS constraint.
- **Minimal change:** keep brand family names first in every stack so a
  licensed drop-in later wins with zero code change:
  `"Helvetica Neue Web", "Helvetica Neue", Helvetica, Arial, sans-serif`
  (macOS/iOS render true Helvetica Neue incl. weight 100);
  `"Times Now", "Cormorant Garamond", "Times New Roman", serif` with
  self-hosted Cormorant Garamond Medium Italic (OFL — the fallback AP itself
  ships). No other typographic change.
- **Status:** applied
- **Where:** all sections; expected gate deltas concentrated in the italic
  display accents (hero H1 line 2, section H2 line 2, FIND A BOUTIQUE).
  Addendum (archetype F, 2026-07-30): live boutiqueCarousel em-lines render
  8px/line taller @1440 (4px @360) than the Cormorant fallback — compensating
  margins recorded in blocks/carousel/carousel.css (ap-link mt 39/32, gallery
  p mt 28.5 mobile); covered here, no new id.

## R-02 — Compare feature + product quick-view modal not rebuilt

- **Evidence:** `<ap-product-grid :is-compare-enabled="true" modal-fragment="/content/experience-fragments/ap/com/commons/master/master.html">`
  (raw capture line, hydrated DOM) — modal content is an AEM experience
  fragment fetched at interaction time.
- **Finding:** interaction-only commerce features; zero pixels in the
  resting-state capture. Rebuilding them is phase-2 scope, not pilot scope.
- **Minimal change:** "Compare" label rendered in the filter bar (pixel
  parity) without the comparison drawer behavior; product cards link
  directly to watch detail pages on audemarspiguet.com.
- **Status:** deferred
- **Where:** "Search for watches" product grid section.

## R-03 — Header mega-nav flyouts and search overlay: static parity only

- **Evidence:** header experience fragment is 97KB / 59 links with
  hover/focus flyout panels and a full-screen search overlay (hydrated DOM).
- **Finding:** interaction-only surfaces, invisible in resting-state
  captures. Full parity is site-scope work (shared chrome), not pilot scope.
- **Minimal change:** header bar replicated pixel-perfect in resting state
  (logo, nav labels, utility icons, correct scroll-state morph); flyout
  panels and search overlay deferred. Footer replicated fully (all links).
- **Status:** deferred
- **Where:** global header, all pages.

## R-04 — Lookbook collage scales full-width on large viewports

- **Evidence:** user request 2026-07-30 with screenshot at ~2000px viewport
  (collage sat at fixed 1440 geometry with large black gutters).
- **Finding:** source site freezes the collage at the 1440 design width;
  user wants it to use the available width.
- **Minimal change:** convert the collage grid to proportional fr tracks +
  aspect-ratio (1440/620), side gutters narrowed 100→40fr; mobile layout
  unchanged. No other lookbook change.
- **Status:** applied
- **Where:** lookbook section, ≥768px.

## R-05 — Product grid 4 cards per row (source: 3)

- **Evidence:** user request 2026-07-30 with screenshot.
- **Minimal change:** `.pl-grid` desktop columns 3→4; card model unchanged.
- **Status:** applied
- **Where:** "Search for watches" grid, ≥768px.

## R-06 — Language/currency selector: resting-state button only, flyout deferred

- **Evidence:** live resting-state header carries NO language selector at any
  probed width (refine-probe 2026-07-30: `.ap-header` contains zero
  `[class*=language]` elements at 1440/360). The switcher's only resting-state
  surface is the footer "Change language / currency" button
  (`ap-language-selector-button`, world icon 24px, 500 14px/20px); the picker
  itself is a body-level Vue overlay (`ap-language-selector-app`) driven by
  the `#country-data` JSON model, opened from that button (and from inside
  the R-03-deferred burger takeover).
- **Finding:** interaction-only overlay, zero resting-state pixels — same
  class as R-02/R-03. The prompt's "header language switcher" does not exist
  on the live header; footer button replicated instead (measured markup).
- **Minimal change:** footer button rendered with the live world-icon glyph
  and typography; click currently inert. Overlay + `country-data` sheet are
  site-scope chrome work (implementation plan §3).
- **Status:** deferred
- **Where:** footer (all pages); burger takeover (with R-03).

## R-07 — Store locator: live interactive map deferred (empty canvas at live geometry)

- **Evidence:** live `/ch/en/stores` loads Google Maps JS with a key
  referer-locked to audemarspiguet.com; from any other origin (and in the
  capture instrument) Maps degrades to its empty `rgb(229,227,223)` canvas +
  error dialog (stores-1440-lift.json `.CizjDb-degraded-map-dialog-view`,
  gates ch-en-stores-*/live.png).
- **Finding:** map tiles/markers cannot render without a Maps key licensed
  for the EDS origin — a key/licensing constraint, not a design choice.
- **Minimal change:** `store-locator` renders the map surface as Google's
  own empty-canvas base `#e5e3df` at live geometry; tiles/markers/zoom
  restored when a licensed Maps (or equivalent) key exists for the EDS
  origin. No new third-party dependency introduced.
- **Status:** deferred (key-blocked)
- **Where:** blocks/store-locator (`.sl-map`), /ch/en/stores.

## R-08 — Store locator: geo-IP initial centering replaced by timezone-derived market anchor

- **Evidence:** live fetches `/ch/en/home.ipstack.json` (AP-origin servlet,
  no CORS) and centers/geocodes the visitor city (netlog:
  GeocodeService.Search 45.466,9.187 = Milan); the EDS origin cannot call it.
- **Finding:** runtime-only behavior; resting layout identical either way.
- **Minimal change:** block derives the market from the `Intl` timezone
  (23-market table) with the authored SSR initial-center (NYC) as fallback —
  city-level precision instead of IP-level.
- **Status:** applied
- **Where:** blocks/store-locator/store-locator.js `TZ_CENTERS`.

## R-09 — Store locator: place search suggests from store data, not Google Places

- **Evidence:** live autocomplete is Google Places, gated by the same
  referer-locked key as R-07.
- **Finding:** interaction-only surface; resting pixels identical (panel
  styled to AP tokens from the live lift).
- **Minimal change:** suggestions/centering come from the snapshot's store
  cities/countries/names; the visible list = stores inside the computed
  web-mercator viewport at zoom 10, widening until ≥1 result (calibrated to
  reproduce the live resting state). Arbitrary-place geocoding returns with
  the Maps key (R-07).
- **Status:** applied (key-blocked for full parity)
- **Where:** blocks/store-locator.

## R-10 — Contact form: backend + interaction layer deferred (interaction-only)

- **Evidence:** `<ap-contact-us-form endpoint-get-account-data="….accountdata.json" default-local-contact="switzerland" …>` (raw capture); submission posts to the `.postcontactus.` servlet with reCAPTCHA v3; dropdowns are Vue custom listboxes (`dropdown__item` 14/300, 48px rows); validation renders on submit; local contact geo-resolves at runtime (capture rendered Italy despite the `switzerland` default).
- **Finding:** zero resting-state pixels beyond what is replicated; submission backend is commerce/backend scope (implementation plan §3.6) — same interaction-only class as R-02/R-03.
- **Minimal change:** static form with inert submit; native `<select>`s carry the short option lists verbatim (regions/salutation/method/reason). Deferred: 240-entry country + dialing-code lists, submission, validation states, geo local-contact. Interaction-time dropdown visuals are the native picker, not the live custom list.
- **Status:** deferred
- **Where:** `/ch/en/form/contact-us` (`form` block).
