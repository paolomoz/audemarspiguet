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
  Addendum (archetype D, 2026-07-30): live news h1 line box 57.8px@1440 /
  41@360 (Times Now italic metrics) vs substituted serif 56/40 — pinned
  min-height 58px/41px on the news h1 (blocks/chips/chips.css); covered
  here, no new id.
  Addendum (archetype G, 2026-07-30): substitute faces wrap the masterclass
  detail serif title 3 lines vs Times Now 4 (5 mobile) and one FAQ trigger
  2 vs 1 at 360 — live-box reservations applied (h1 min-height 269/223,
  ±8px heading-gap comps, FAQ mobile pad −22), all commented in
  masterclass-hero.css / masterclass-search.css / text-image.css /
  carousel.css / accordion.css; covered here, no new id.
  Addendum (orchestrator, deployed-proof finding 2026-07-30): the
  prototype-harness em line-box is NOT authoritative — the deployed EDS
  render matches live's em line-box, so em compensations must be tuned
  against a deployed/branch-preview render (store-detail boutiqueCarousel
  comps overshot +7/+8px until reset to live gaps).

## R-02 — Compare feature + product quick-view modal not rebuilt

- **Evidence:** `<ap-product-grid :is-compare-enabled="true" modal-fragment="/content/experience-fragments/ap/com/commons/master/master.html">`
  (raw capture line, hydrated DOM) — modal content is an AEM experience
  fragment fetched at interaction time.
- **Finding:** interaction-only commerce features; zero pixels in the
  resting-state capture. Rebuilding them is phase-2 scope, not pilot scope.
- **Minimal change (2026-07-30 revision, archetype B+):** compare rebuilt
  end-to-end (mode toggle, checkboxes, status bar, comparison overlay,
  localStorage state, max 3, calibre flip) from live measurements; data from
  `/data/compare-core-collection.json` snapshot (live `.compare.` servlet
  has no CORS). Quick-view: the live pilot page itself disables it
  (`:is-showing-product-card-carousel="false"`; no quick-view control
  appears on cards in any state — hover probed; the `modal-fragment` XF
  404s on audemarspiguet.com and is ignored by AP's own code) — no
  quick-view surface exists to replicate. Overlay strings authored as
  fragment `/ch/en/fragments/compare-modal` in lieu of the dead XF.
  Minor defers within scope: price tooltip = icon + native `title`;
  mini-header underline = active-tile width (live var-width progress);
  ≥1920×800 sticky-head-row variant not built (outside capture envelope).
- **Status:** applied (was deferred)
- **Where:** "Search for watches" product grid section; comparison overlay.

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

## R-11 — Masterclass booking flow deferred (Book now disabled)

- **Evidence:** live Book now enables only after location + time-slot
  selection and opens the `.booksession.` calendar flow (implementation plan
  §3.7; catalogue `apCalendarId` DR442 → AP House Geneva).
- **Finding:** interaction-only commerce flow, zero resting-state pixels —
  same class as R-02/R-03.
- **Minimal change:** EDS renders the live resting state — interactive
  location select, Book now permanently disabled (live disabled colorway
  `#C4C4C4`/`#8B8C8C`).
- **Status:** deferred
- **Where:** `blocks/masterclass-hero` (key-info card + sticky banner),
  both masterclass pages.

## R-12 — Masterclass detail URL + title normalized

- **Evidence:** the sitemap lists `/ch/en/masterclasses/detail` but live
  returns HTTP 500 there; real details live at
  `/detail/<url-encoded title>.html` (spaces and `&` in the path — not
  EDS-pathable); the live detail `<title>` is empty.
- **Finding:** live URL scheme cannot round-trip through EDS paths; the
  bare sitemap path is broken on live itself.
- **Minimal change:** the representative "Royal Oak: Design and Materials"
  detail is authored at `/ch/en/masterclasses/detail` with a real Title.
  Zero visual delta; URL/metadata only.
- **Status:** applied
- **Where:** `content/ch/en/masterclasses/detail.html`.

## R-13 — Masterclass location chips non-operative (single-location catalogue)

- **Evidence:** `ap-masterclass-search` location chips are the search facet;
  the ch/en catalogue carries exactly one location, so live's resting
  surface is a single static chip.
- **Finding:** nothing is filterable client-side with one location; resting
  pixels identical.
- **Minimal change:** chip row rendered as non-operative toggles until
  multi-location editions exist.
- **Status:** applied
- **Where:** `blocks/masterclass-search`.

## R-14 — PDP boutique-finder map not instantiated

- **Evidence:** live loads Google Maps at runtime with AP's referer-locked
  key + geolocation; in captures it renders the grey error state ("This
  page can't load Google Maps correctly") — nondeterministic third-party
  runtime either way. Bands y10000–10500@1440 9.3%, y8500–9000@360 26.3%.
- **Finding:** third-party runtime surface, same class as R-07 but WITH
  resting pixels (the error-state canvas).
- **Minimal change:** exact live panel geometry; ground color `#616264`
  sampled from the captured map state; Maps JS wiring deferred to plan
  §3.4 (load on interaction, once a licensed key exists).
- **Status:** deferred (key-blocked)
- **Where:** `blocks/store-locator-simple`, all PDPs.

## R-15 — PDP strap "Show details" drawer + favourite/wishlist deferred

- **Evidence:** the drawer is a Vue overlay (zero resting pixels); the
  favourite button requires account servlets and does not render logged-out
  (verified absent in captures).
- **Minimal change:** "Show details" rendered inert; no favourite markup.
- **Status:** deferred (plan §3.5 account scope)
- **Where:** `blocks/strap-selector`, `blocks/product-info`.

## R-16 — PDP campaign YouTube video plays via bare embed

- **Evidence:** live wraps YouTube in video.js with GTM tracking; ours
  injects a plain autoplay iframe on click. Zero resting pixels.
- **Status:** applied
- **Where:** `blocks/video`, campaign slots.

## R-17 — Comparison overlay headings rendered black (live renders them white-on-white)

- **Evidence:** live probe shows `color: rgb(255,255,255)` on `h1.title`
  and `h2.title-1` inside the compare overlay — theme-dark heading tokens
  leak from the dark pilot page into the white overlay, so "Watch
  Comparison" and the Case/Dial/Bracelet/Calibre headings are INVISIBLE for
  real users on live (a live bug, not a design).
- **Minimal change:** keep AP's own light-theme token (#000). Pixel proofs
  were run in "bug-parity" mode (headings forced white), so gate numbers
  exclude this intentional delta. If AP fixes the bug, re-proof without the
  parity injection.
- **Status:** applied
- **Where:** compare overlay (`blocks/product-listing/compare.css`).
