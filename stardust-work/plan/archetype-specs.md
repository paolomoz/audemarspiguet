# Page-archetype specifications — audemarspiguet.com → EDS

Evidence: live-page probes 2026-07-30 (module orders read from raw publish HTML),
pilot capture (`stardust-work/current/`), product feed snapshots. Block authoring
contracts follow the pilot conventions: blocks reabsorb their section's default
content where the live design fuses them; plain anchors + `.ap-link` for CTAs
(never button classes); `.grid-container` gutters 92.5px/20px; scroll-reveal via
`scripts/reveal.js`.

Shared chrome (all archetypes): `header` (meganav, R-03 flyouts pending),
`footer` (link columns, newsletter form, language selector), locale banner,
overlay/loader utilities. Shared page config: metadata (title, description, og:*,
page_category for dataLayer), auto-blocked hero where applicable.

---

## A — Module page  *(pilot-proven pattern; ~310 pages/locale)*

**Paths:** `home`, `news/{cat}/{slug}`, `about/**`, `watch/{slug}` (non-listing),
`services/*` (non-FAQ), `collections/{name}`, `legal/*`, `masterclasses` shell.

**Definition:** freeform stack of editorial modules; every other archetype embeds
this vocabulary. No page-level data dependencies; all content authored.

**Module → block map (composition observed on live home, order):**

| # | Live module | EDS block | Status | Authoring contract |
|---|---|---|---|---|
| 1 | `ap-primary-hero` ×3 (stacked full-bleed video/image heroes, h1 overlay, CTA, play/pause) | `hero (primary)` | **build** — extend pilot `hero` with variant `primary`: poster+mp4 cell, heading cell, CTA cell; multiple hero sections stack | 1 col × 3 rows: media / heading / link |
| 2 | `ap-carousel-container` > `ap-carousel` (releases) | `carousel (releases)` | pilot ✅ | section head default content + card rows |
| 3 | `ap-dual-text` | `dual-text` | **build** — two text columns, Times Now italic accent role, reveal stagger | 1 row × 2 cols (rich text each) |
| 4 | `ap-lookbook` ×2 | `lookbook` | pilot ✅ (R-04 full-width) | 5 media cells |
| 5 | `ap-dual-text-image` | `dual-text-image` | **build** — text pair + offset image | 2 rows: texts / image |
| 6 | `ap-text-image` ×4 | `text-image` | pilot ✅ | image cell + text cell (+reverse variant) |
| 7 | `ap-carousel` (stories) | `carousel (stories)` | pilot ✅ | |
| 8 | `ap-video` | `video` | **build** — Dynamic Media mp4, autoplay/loop/muted or click-play w/ controls, poster | 1–2 cells: poster / video URL |
| 9 | `ap-chip` (articles only) | `chips` | **build** — category chip row linking to news filters | list of links |
| 10 | `ap-faq`/`ap-accordion` (services/faq) | `accordion` | **build** — h3 label + rich body per item, ARIA disclosure | 2 cols × N rows: question / answer |

**Gate:** stitch-shot vs live at 1440+360, <10% diff, Δheight ~0, content-diff 0
structural red (pilot bar).

---

## B — Product listing  *(~16 pages/locale)*

**Paths:** `watch-collection/{family}` (12), `watch-collection` (all-watches, also
the search-icon target), `watch/{year}-novelties` (4). Identical module set
verified on royal-oak, code-1159, 2026-novelties.

**Composition:** `hero` → `product-listing` (pilot block = ap-filter + ap-product-grid
fused: search bar, sticky toolbar, segment switch core/legacy/special, facet
filters, card grid — 4-up per R-05).

**Data contract:** 3 endpoints per page `.products.{core-collection,legacy,special}.json`
→ `{results:[{allTags[], reference, collectionTitle(+En), productTitle(+En),
mainImage{link,tabletLink,tabletWideLink,mobileLink}, extraImages[], link{href,label},
size, sizeUnit, materials(+En)}]}` — no pagination, no prices. Facet taxonomy
(`ap:com/commerce/{complication,size,mechanism,case-material,collection}/...`) +
swatch images: move from inlined Vue props to `/config/filters.json` sheet per locale.
Feeds served by PIM adapter (interim: `/data/*.json` snapshots, pilot pattern).

**Remaining build:** `compare-modal` (R-02): compare toggle in sticky toolbar,
localStorage selection (max 3), modal spec table; quick-view variant on card hover.

---

## C — Product detail page (PDP)  *(566/locale, ~14.7k total — generated)*

**Path:** `watch-collection/{family}/{reference}`.

**Composition (observed order, code-1159/26398BC.OO.D002CR.02):**

| # | Live module | EDS block | Contract |
|---|---|---|---|
| 1 | `ap-product-info` (gallery, kicker=collection, h1=product title, price slot, favourite, appointment CTA `/{loc}/form/appointment?reference=…`) | `product-info` | **build**; price/favourite are client islands — price fetched `/price/{market}/{ref}.json`, hidden if absent (live parity) |
| 2 | `ap-video` hero film | `video` | shared with A |
| 3 | `ap-featured-products` (case width/thickness/dial/strap callouts) | `product-highlights` | **build**; 2 cols × N rows label/value + media |
| 4 | carousels ×3 (campaign) | `carousel` | pilot ✅ |
| 5 | `ap-video` ×7 (craft loops) | `video` | shared |
| 6 | `ap-strap-selector` | `strap-selector` | **build**; feed `{collection}.strapselector.json` via adapter; swaps gallery imagery; deep-link `?strap=` param parity |
| 7 | `ap-text-image` | `text-image` | pilot ✅ |
| 8 | `ap-specifications` (spec table + user-guide PDF) | `specifications` | **build**; definition-list table, PDF link from DAM |
| 9 | `ap-similar-products` (inline JSON refs) | `similar-products` | **build**; carousel of product cards resolved from grid feed |
| 10 | `ap-store-locator-simple` (boutique finder strip, Maps) | `store-locator-simple` | **build**; loads Maps JS on interaction only |

**Generation:** NOT authored. Mustache template (repo `templates/pdp.html`) emitting
exactly these blocks, rendered by JSON2HTML overlay from PIM-adapter
`/product/{country}/{lang}/{reference}.json`; editorial slots (#4/#5) included from
authored DA fragments `/{loc}/fragments/pdp/{family}`. Bulk publish over the
reference list; nightly diff re-publish. See implementation-plan §4.

**Gate:** template-level (one gated PDP per family × 1440/360), then structural
probe across all refs (h1 present, spec count, image count, 0 console errors).

---

## D — News index  *(1/locale)*

**Path:** `news`. **Composition:** h1 "Latest Stories" → `ap-main-article`
(featured) → category tabs (`origin|savoir-faire|art|music` — ja adds `styling`,
`watch-expert`) → 12-card grid (`ap-article`) → load-more.

**EDS block:** `article-list` — **build**. Fed by per-locale `query-index`
(`helix-query.yaml` indexing `/{loc}/news/**`: title, description, image, category,
publish date). Featured article authored as first row; tabs filter client-side on
the category column; load-more pages the index (replaces the live clientlib JS —
functional parity, better SEO). Card = image / category / title / description /
link, matching live card CSS.

---

## E — Store locator  *(1/locale)*

**Path:** `stores`. **Composition:** SSR h1 "Where to find us" → `ap-store-locator`
full-page app: map (Google Maps; Baidu for CN editions) + searchable/filterable
list (`?filter=service` deep-link), geolocate, book-appointment + contact CTAs.

**EDS block:** `store-locator` — **build** (largest single block). Data: stores
adapter endpoint (Yext Live API proxy, edge-cached ~1h) returning entity set
(`meta.id`, name, `address`, `yextDisplayCoordinate`, `hours.*.openIntervals`,
`mainPhone`, `c_retailerType_v2`, `c_slug`, photo). Maps keys via placeholders;
maps JS loaded on first interaction (perf). Initial center by CDN geo. Filter
chips: boutique / AP House / service centre (retailerType).

---

## F — Store detail  *(76/locale; hreflang only own-country 5)*

**Path:** `stores/{slug}`. **Composition:** `ap-boutique-hero` (name h1, address,
hours, phone, email, appointment CTA — full Yext entity baked in at publish) →
`ap-video` → gallery carousel (`ap-boutique-carousel-gallery-slide`, mktgcdn
photos) → nearby-stores carousel (`c_nearbyBoutique` refs).

**EDS blocks:** `boutique-hero`, `boutique-gallery` (carousel variant),
`nearby-stores` (carousel variant) — **build**. Pages generated from Yext entities
(same generator pattern as PDPs — JSON2HTML or materialized), refreshed on Yext
webhook/schedule; hours rendered server-side with client-side "open now" state.
hreflang restricted to the page's own country editions (helix-sitemap per-tree
exception or metadata override).

---

## G — Masterclasses  *(2/locale)*

**Path:** `masterclasses`, `masterclasses/detail`. **Composition:**
`ap-primary-hero` → `ap-text-image` → `ap-masterclass-search` (location select +
6 SSR cards: image, type, level, duration, CHF `priceRange.minimumPrice.regularPrice`,
detail link) → carousels → `ap-masterclass-banner`.

**EDS blocks:** `masterclass-search` + `masterclass-banner` — **build**. Catalogue
as published JSON sheet (interim snapshot of the embedded catalogue; source-system
discovery pending — price shape suggests Adobe Commerce). Booking flows through
`/form/appointment` + `.booksession.` via forms adapter. Detail page is archetype A
+ booking form.

---

## Cross-archetype build inventory (net-new)

Blocks: `hero(primary)`, `dual-text`, `dual-text-image`, `video`, `chips`,
`accordion`, `compare-modal`, `article-list`, `store-locator`, `boutique-hero`,
`boutique-gallery`, `nearby-stores`, `product-info`, `product-highlights`,
`strap-selector`, `specifications`, `similar-products`, `store-locator-simple`,
`masterclass-search`, `masterclass-banner`, `form` (+ header meganav/search
overlay, footer `newsletter-form`).

Build order (value ÷ dependency): **A-complete (home) → D (news) → C (PDP, PIM
critical path) → B-complete (compare) → F → E → G → forms/chrome.**
