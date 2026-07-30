# audemarspiguet.com → AEM Edge Delivery Services — full-site implementation plan

Date: 2026-07-30 · Status: proposal for full-site scope, building on the delivered pilot
(`/ch/en/collections/code-11-59-collection`, source-fidelity gate PASS 8.39%/Δ−2px vs live).

Evidence base: all 26 locale sitemaps crawled (24,710 URLs — see
[`url-inventory.md`](url-inventory.md) and the raw list [`urls-all.txt`](urls-all.txt));
live-page probes of 11 representative pages (home, 2 collection indexes, PDP, news
index, article, stores index, store detail, novelties campaign, FAQ, masterclasses);
full script/martech/endpoint mining of the pilot's hydrated DOM capture.

---

## 1. Scope summary

| Dimension | Finding |
|---|---|
| URLs | 24,710 across 26 locale editions (9 languages × market overlays) |
| Unique page templates | 7 archetypes (see §2) |
| Product detail pages | 566 per locale (~14,716 total) — **generated, not authored** (§4) |
| Authored pages per locale | ~414 (980 minus PDPs) — bulk-migrated via the pilot pipeline |
| Source platform | Classic AEM Sites publish + Vue 3/Pinia islands (SSR skeleton, client hydration) |
| Data integrations | PIM product feeds, Yext (stores), Google/Baidu Maps, Salesforce MC, booking servlets, reCAPTCHA |
| Martech | GTM `GTM-NGNW85W` + GA4 + ads pixels, OneTrust consent, Adobe Target (at.js), Helix RUM already present |

Out of sitemap but in scope for parity: error pages, `/{loc}/form/*` (contact,
appointment, newsletter, extend-warranty), `/{loc}/secure/*` (account area — §3.8),
compare/quick-view, meganav flyouts, site search overlay.

Pending scope decisions with AP: Korean editions (robots-disallowed today),
`/secure/` client area (migrate vs. keep on AEM), Adobe Target continuation.

---

## 2. Page types → EDS templates and block library

The live site is one component vocabulary (~30 `ap-*` Vue components) composed into
7 archetypes. The pilot already ships 8 blocks; full scope needs ~22 more.

### 2.1 Archetypes

| # | Archetype | Paths | Pages (/locale) | Composition | Status |
|---|---|---|---|---|---|
| A | **Module page** | `home`, `news/*/*`, `about/**`, `watch/*` (non-listing), `services/*`, `collections/*`, `legal/*` | ~310 | Freeform stack: hero, carousels, text-image, dual-text, lookbook, video, chips | Pilot archetype ✅ — needs 5 more blocks |
| B | **Product listing** | `watch-collection/{family}`, `watch/{year}-novelties` | ~16 | hero + filter + product-grid fed by `.products.{segment}.json` | Pilot `product-listing` ✅ — add compare/quick-view |
| C | **Product detail (PDP)** | `watch-collection/{family}/{ref}` | 566 | product-info, featured-products, strap-selector, specifications, similar-products, store-locator-simple, videos, carousels | New — PIM-generated (§4) |
| D | **News index** | `news` | 1 | main-article + card list + category tabs + load-more | New |
| E | **Store locator** | `stores` | 1 | full-page map+list, Yext data, Google/Baidu Maps | New — biggest dynamic lift |
| F | **Store detail** | `stores/{slug}` | 76 | boutique-hero (Yext entity baked in at publish), gallery carousel, nearby stores | New — generated from Yext |
| G | **Masterclasses** | `masterclasses(+/detail)` | 2 | hero + masterclass-search (embedded catalogue w/ CHF prices) + cards + banner | New |

FAQ pages are archetype A + a new `accordion` block. Forms pages (`form/*`) are
archetype A + a new `form` block.

### 2.2 Block library (source component → EDS block)

**Existing from pilot (8):** `hero` (video, template-slotted), `lookbook` (R-04
full-width), `carousel` (variants releases/stories/collections), `product-listing`
(search + sticky toolbar + filters + grid), `text-image`, `columns.editorial`,
`header`, `footer` — plus foundation (AP tokens, type roles, `.ap-link` CTA,
`.grid-container`, scroll-reveal motion).

**New blocks (~22):**

| Block | Source component(s) | Notes |
|---|---|---|
| `hero (primary)` | `ap-primary-hero` | Home full-bleed video hero w/ play/pause — extend pilot hero |
| `dual-text` | `ap-dual-text` | Two-column editorial text |
| `dual-text-image` | `ap-dual-text-image` | |
| `video` | `ap-video` | Dynamic Media mp4, autoplay/loop/controls |
| `chips` | `ap-chip` | Article category chips |
| `accordion` | `ap-faq` + `ap-accordion` | FAQ; pure static content |
| `article-list` | `ap-news-list`, `ap-article`, `ap-main-article`, tabs | Fed by per-locale `query-index` (EDS-native replacement for the JS load-more); category filter client-side |
| `store-locator` | `ap-store-locator-wrapper` | Map + list; Yext entities via adapter (§3.4); Google Maps, Baidu fallback for CN |
| `boutique-hero` | `ap-boutique-hero` | Hours/address/contact/appointment CTA from Yext entity |
| `boutique-gallery` | carousel variant | Yext photoGallery (a.mktgcdn.com) |
| `nearby-stores` | carousel variant | From `c_nearbyBoutique` refs |
| `product-info` | `ap-product-info` | PDP hero: gallery, titles, price slot (client-fetched), favourite, appointment CTA |
| `product-highlights` | `ap-featured-products` | Case width/thickness/dial/strap callouts |
| `strap-selector` | `ap-strap-selector` | Fed by strap feed (§4.2) |
| `specifications` | `ap-specifications` | Spec table + user-guide PDF link |
| `similar-products` | `ap-similar-products` | Carousel over product feed refs |
| `store-locator-simple` | `ap-store-locator-simple` | PDP boutique-finder strip |
| `masterclass-search` | `ap-masterclass-search`, `ap-masterclass-card` | Catalogue JSON (prices/durations/locations) via sheet or adapter |
| `masterclass-banner` | `ap-masterclass-banner` | |
| `form` | Vue form pages | contact / appointment / newsletter / extend-warranty; reCAPTCHA v3; posts to form adapter (§3.6) |
| `compare-modal` | XF `modal-fragment` | Register R-02, now in scope: compare + quick-view, localStorage state |
| `quote/misc editorial` | residual `ap-*` variants | Discovered during per-page prep (`stardust:prepare-migration --prep`) |

**Chrome extensions:** meganav flyouts + search overlay (R-03, now in scope; search
routes to all-watches listing, parity with live), `language-selector` +
`locale-banner` (driven by a `country-data` sheet mirroring the live JSON block),
footer inline `newsletter-form`.

Utility components (`ap-loader`, `ap-overlay`, `ap-popin`, reveal effect) fold into
`scripts/` — reveal.js already exists.

---

## 3. Dynamic capabilities — analysis and EDS approach

The live site's dynamic surface, from robots.txt servlet disallows + DOM evidence:

| Capability | Live implementation | EDS approach |
|---|---|---|
| 3.1 Product grids | Sling servlet `.products.{core-collection,legacy,special}.json` per page, no pagination, 13 fields/record, **no prices** | Keep contract identical; serve from PIM adapter with edge caching (pilot proved the snapshot variant works). Client block unchanged. |
| 3.2 Product filters/search | Facet taxonomy inlined as Vue props (`ap:com/commerce/*` tags); in-grid search bar filters client-side; **no external search service** (Algolia etc. absent; `/search` is 404 — header search = all-watches page) | Already replicated in `product-listing`. Taxonomy moves to a DA sheet (`/config/filters.json`) per locale. No search backend needed. |
| 3.3 Compare / quick-view | `:is-compare-enabled` + AEM Experience Fragment modal; `.compare.` servlet | `compare-modal` block, state in localStorage, modal markup owned by the block (no XF) |
| 3.4 Store locator | Yext is store master data. Index page fetches entities at runtime (`.yextentities*.` servlets = AEM-proxied Yext); detail pages have the full Yext entity **baked in at publish**; Google Maps + Baidu Maps (CN) keys in page config | Same split: detail pages generated at publish from Yext (§5-style generator or JSON2HTML); index locator fetches a **stores adapter** endpoint (thin worker proxying Yext Live API, hides API key, edge-cached). Maps keys via placeholders/config sheet. |
| 3.5 Wishlist/favourites | `.addfavouritewatch./.removefavouritewatch./.getfavouritewatchstatus.` servlets, tied to account | Phase with account area (§3.8). Until then: heart icon → localStorage (anonymous) or hidden — decision with AP. |
| 3.6 Forms | No native `<form>` posts; Vue pages at `/form/*` posting to AEM servlets (`.postcontactus.`, `.createnewsletter.`, `.booksession.`, `.bookappointment.`, `.requestwarrantyextend.`); reCAPTCHA v3; SFMC identity (`sfmc_id`) suggests Salesforce Marketing Cloud downstream | `form` block + **forms adapter** (worker): validates, verifies reCAPTCHA, forwards to the existing AEM servlets initially (zero backend change), later direct to SFMC/booking APIs. |
| 3.7 Masterclass booking | Catalogue embedded server-side; `priceRange.minimumPrice.regularPrice` shape suggests an Adobe-Commerce-style backend; `apCalendarId` links to Yext store IDs; booking via `.booksession.` | Catalogue as published JSON (sheet or adapter); booking through forms adapter. **Discovery item:** confirm the commerce backend. |
| 3.8 Account (`/secure/*`) | Authenticated area; `auth` cookie drives header login state | Recommend **hybrid routing**: `/secure/*` and form servlets stay on the AEM origin behind the production CDN during (and possibly after) migration; EDS header reads the `auth` cookie for login state (same apex domain). Migrating auth is a separate project. |
| 3.9 News load-more | Client JS over clientlib data (endpoint not in markup) | EDS `query-index` per locale (`helix-query.yaml`), `article-list` block paginates it — simpler and indexable |
| 3.10 Geolocation | ipstack via sessionStorage (feeds `country` in dataLayer + locale banner) | Replace with CDN geo header (or keep ipstack key) — feeds locale-banner suggestion + dataLayer |

### 3.11 Martech (full stack, verified on 11 pages — identical everywhere)

- **GTM `GTM-NGNW85W`** (pinned to env `gtm_auth=…&gtm_preview=env-1`), dataLayer +
  `dataLayerReady` promise gate. Inside/alongside: **GA4 `G-9MYQEEKY8J`**, 3 Google
  Ads accounts, Floodlight `DC-12975175`, Meta pixel `344829019033529`, Teads, CHEQ
  bot-mitigation, and preconnects for TikTok/Snap/Twitter/LINE/Baidu/Yahoo-JP pixels.
- **OneTrust** `770ff964-…` with category-gating (`optanon-category-C0004` script
  flips) — consent model must be reproduced exactly.
- **Adobe Target** first-party at.js clientlib (tenant `audemarspiguet.tt.omtrdc.net`),
  C0004-gated. No Adobe Launch, no Adobe Analytics, no AAM.
- **Helix RUM already runs on the live site** (`/.rum/@adobe/helix-rum-js@^2`) — free
  continuity on EDS.

**EDS plan:** OneTrust stub loads in the lazy phase (needed early for the banner);
GTM + all pixels in `delayed.js`, gated on OneTrust consent state, reusing the same
container (AP's GTM team keeps ownership — zero tag rebuild). Reproduce the dataLayer
contract in `scripts.js`: legacy push (`page_title`, `page_category` from metadata)
plus the fully-coded-but-dormant "new tracking" schema (`template_name`,
`content_group`, `site_market`, `client_status`, `sfmc_id`, …) behind the same
`isNewTrackingEnabled` flag, sourced from a config sheet. **Target decision needed:**
at.js costs real LCP on EDS — options: drop, keep C0004-gated in delayed phase, or
move to EDS-native experimentation plugin. Recommend the plugin for A/B use-cases and
dropping at.js.

Per-page martech budget: nothing render-blocking; PSI 100 target stands (delayed
phase only fires post-LCP + post-consent).

---

## 4. PDP × PIM integration (the core architectural decision)

**Evidence:** PDPs are server-rendered by AEM from PIM data (title, specs, strap
text in raw HTML); no headless model exists (`.model.json`/`.json` → 404); the only
public product APIs are the 13-field grid feed (no prices), and
`{collection}.strapselector.json`. Price/availability render client-side behind a
non-public API. ~14,716 PDP URLs — authoring them is a non-starter; they must be
**generated from PIM data**.

### 4.1 Recommended architecture: PIM adapter + JSON2HTML (BYOM)

```
        AP PIM ──► PIM adapter (worker / IO Runtime)
                      ├─ /feeds/{country}/{lang}/{collection}.{segment}.json   (grid: 13-field parity)
                      ├─ /product/{country}/{lang}/{reference}.json            (full PDP record)
                      ├─ /straps/{country}/{lang}/{collection}.json            (strap selector)
                      └─ /price/{market}/{reference}.json                      (volatile, client-fetched)
                                    │
   EDS content source ◄── markup overlay: json2html.adobeaem.workers.dev/{org}/{site}/{branch}
                                    │  path /{country}/{lang}/watch-collection/{family}/{ref}
                                    │  → adapter /product/... → Mustache template (repo) → BYOM HTML
                                    ▼
                EDS pipeline (preview/publish, media, index, sitemap, CDN) → PDP
```

- **JSON2HTML** is Adobe's supported worker for exactly this: config maps a path
  pattern to a JSON endpoint + a Mustache template checked into this repo; the
  produced HTML enters the normal EDS preview/publish pipeline, so PDPs get EDS
  caching, media optimization, query-index inclusion, and sitemap entries like any
  page. The template emits our block markup (`product-info`, `specifications`,
  `strap-selector`, `similar-products`, …), so PDP styling is the same block library.
- **Publish workflow:** the reference list per locale is known (sitemap/PIM). Bulk
  preview+publish via the admin API over all refs (script exists in spirit from the
  pilot deploy loop). Ongoing sync: scheduled job (or PIM webhook) diffs the PIM
  export → re-publishes changed refs, publishes new ones, unpublishes + 301s
  discontinued ones. Novelty launches = publish N new paths, minutes not days.
- **Prices stay client-side** (parity with live): `product-info` fetches
  `/price/{market}/{reference}.json` at runtime; currency per market from the
  country-data sheet. Published HTML stays market-agnostic per language.
- **Editorial slots on PDPs** (campaign videos, storytelling carousels between spec
  modules): template includes locale-level authored fragments from DA
  (`/{loc}/fragments/pdp/{family}`), so marketing can still curate per family
  without touching the generator.

**Fallback option (B): full materialization** — a generator script renders the same
Mustache templates offline and PUTs 14.7k HTML docs into DA (the pilot's
sanitise→PUT→publish pipeline at scale). No runtime dependency on the json2html
worker; heavier sync tooling; identical block markup either way, so we can start
with B for the first family and switch to A without rework. Decide after PIM access
is confirmed.

**Grid feeds:** serve from the adapter with edge caching (CDN TTL ~1h) — replaces
the pilot's static `/data` snapshots and stays fresh automatically.

**PIM access is the critical-path dependency.** Until AP grants it, the adapter can
scrape-sync from the existing public feed + live PDPs (as the pilot did) — enough to
build and gate everything except price.

---

## 5. Multi-language / multi-market

**Model observed:** 9 languages × market overlays. Same-language editions are
*identical path sets* (verified: `/en/` ≡ `/us/en` ≡ `/gb/en` ≡ `/hk/en` ≡ `/ch/en`,
0 diff); per-language deltas are editorial (ja: +92 pages incl. two extra news
categories; en 980 … fr 931). Head carries 27 hreflang alternates + x-default
(store pages: only their own country's 5). Market differences are runtime concerns:
currency, legal links, analytics `site_market`.

**EDS approach:**

1. **Paths are preserved exactly** (replica rule) — DA tree mirrors
   `/{country}/{lang}/…` and `/{lang}/…`.
2. **Author 9 language masters, generate 26 editions.** The language-only edition
   (`/en/`, `/fr/`, …) is the master; country editions are produced by an automated
   propagation script (DA admin API copy) + per-subtree **bulk metadata** overlay
   (`site_market`, currency, hreflang self, market legal links). Authoring effort is
   9×, not 26×. Market-exclusive pages (e.g. ja `styling` news) live only in their
   editions.
3. **Chrome per locale:** `/{loc}/nav` and `/{loc}/footer` docs (pilot pattern),
   translated; UI strings via per-locale `placeholders.json` (EDS convention).
4. **hreflang:** `helix-sitemap.yaml` with one entry per edition, per-language
   `query-index` sources, `alternate: /{country}/{lang}/{path}` templates,
   `default: en` for x-default — EDS generates the 26 sitemaps + alternates natively
   (sitemap-index.xml in repo). Head-level hreflang links rendered by a small
   `scripts.js` routine from the same locale map (config sheet).
5. **Translation workflow:** masters → translation vendor via DA export/import
   (or connector); ja/zh-specific editorial authored directly. Content freeze +
   delta-sync during each market's migration window.
6. **Locale suggestion banner** (`ap-locale-banner`): country-data sheet + CDN geo.
7. **Korean:** exists but robots-disallowed on live — confirm before building.

---

## 6. SEO, media, delivery

- **URLs unchanged** — no redirect debt for migrated pages; `redirects.json` only
  for pruned/consolidated paths and discontinued PDPs.
- **Sitemaps/hreflang** per §5.4; robots.txt ports the servlet disallows that remain.
- **Structured data: none exists on live** (verified 11 pages, zero ld+json) — we
  can match (replica) and optionally add `Product`/`Article` schema later as an
  enhancement (register entry: SEO-positive, invisible).
- **OG/meta parity** via page metadata; canonical = self.
- **404**: rebuild light (live one is 176 KB).
- **Media:** keep hotlinking Dynamic Media (their DAM pipeline, AVIF-capable) for
  product/campaign imagery — it's the PIM/DAM source of truth; DA-uploaded imagery
  (editorial) uses EDS-optimized delivery. Yext store photos stay on a.mktgcdn.com.
- **Fonts (R-01, blocking production):** license Sans Faktura / Times Now (or
  confirm AP's existing web-font license extends to the new origin) — until then
  substituted stacks ship.
- **Performance:** PSI 100 target per page type; heaviest risks are PDP gallery,
  maps pages (load maps JS on interaction), and martech (fully delayed).

---

## 7. Migration factory (content at scale)

Per-locale authored pages (~414 × 9 language masters) go through an industrialized
version of the pilot pipeline:

1. **Extract** (`stardust:extract --prep`): dwell-scroll hydration, stitch-shot
   ground truth, content manifest per page (tooling gotchas already solved: OneTrust
   re-injection, fullPage blanking, CORS-locked font CDN).
2. **Map**: manifest → block markup (archetype A pages compose from the library;
   mapping rules per module, reviewed once per template).
3. **Load**: sanitise → PUT to DA → preview → publish (batch, rate-limited, DA_TOKEN
   preflight).
4. **Gate**: computed-style probe on every page (`deployed-gate.mjs`), pixel-diff
   sampling (every page for the first family of each archetype, then 1-in-N),
   content-diff 0 structural red required. Ledger in `progress.json`/`state.json`.

Throughput estimate once the factory runs: 30–60 pages/day/operator including QA;
the long pole is block completeness in the first 2 archetype build-outs, not volume.

---

## 8. Phasing & estimates

Assumes 2–3 EDS engineers + 1 integration engineer + content-ops + QA. Weeks are
calendar, phases overlap.

| Phase | Scope | Exit criteria | Est. |
|---|---|---|---|
| **0 — Pilot** ✅ | Collection page archetype, 8 blocks, deploy chain, gates | Done: 8.39%/Δ−2px vs live | done |
| **1 — Template completion** | Blocks for archetypes A/B/D (dual-text, video, chips, accordion, article-list, compare-modal R-02, meganav+search overlay R-03); home + news + article + FAQ on /ch/en; query-index + sitemap foundation | 4 archetypes gated on /ch/en; PSI 100 | 3–4 wks |
| **2 — PDP & PIM** | PIM adapter (+access negotiation), JSON2HTML config + Mustache templates, PDP blocks (product-info, specifications, strap-selector, similar-products, highlights, locator strip), price client service, bulk publish of 566 ch/en PDPs, sync job | All ch/en PDPs live + gated (sampled), novelty-launch drill <1h | 5–7 wks |
| **3 — Dynamic services** | Stores adapter (Yext) + locator + 76 generated store pages; forms adapter + 4 form pages; masterclasses; newsletter; favourites decision | Feature parity on /ch/en except /secure | 4–5 wks |
| **4 — Martech & SEO** | GTM port (same container), OneTrust, dataLayer contract, Target decision, hreflang head+sitemaps, robots, 404, redirects | Analytics parity sign-off vs live (side-by-side GA4) | 2–3 wks |
| **5 — Localization rollout** | 9 language masters migrated (factory §7), propagation to 26 editions, placeholders, translated chrome, per-market metadata | All editions gated; hreflang validated | 6–8 wks (parallelizable by language) |
| **6 — Hardening & cutover** | Perf/a11y audit, security review, hybrid routing for /secure + servlets, phased DNS cutover (market by market, e.g. ch → gb → us → …), rollback plan | Production traffic on EDS, error/RUM baselines green | 2–3 wks |

Critical path: **PIM access (phase 2)** and **font licensing** — start both
negotiations immediately. Total: roughly **4.5–6 months** to full cutover, with
/ch/en fully live around the end of phase 4.

---

## 9. Risks & open decisions

| # | Risk / decision | Mitigation |
|---|---|---|
| 1 | PIM API access & contract unknown (price API is non-public) | Start with scrape-sync adapter (pilot precedent); price omitted until API granted (live site also renders price client-side) |
| 2 | Font licensing (R-01) | Blocker for production; substituted stacks until resolved |
| 3 | GTM container ownership & the pinned env (`env-1`) | Reuse container; AP marketing signs off consent-gating parity |
| 4 | Adobe Target on EDS hurts LCP | Recommend EDS experimentation plugin; needs AP decision |
| 5 | `/secure/` account + favourites backend | Hybrid routing keeps it on AEM; separate project |
| 6 | Masterclass commerce backend (Adobe-Commerce-shaped prices) | Discovery spike in phase 3 |
| 7 | Yext account/API access | Needed for stores adapter + 76 generated pages; fallback: bake current entities (as live does) |
| 8 | Korean editions, `?ref=`/`?strap=` deep-link params | Scope confirmation with AP |
| 9 | JSON2HTML worker as runtime dependency | Fallback = full materialization (§4, option B); identical block markup either way |
| 10 | Editorial deltas drift during migration (news publishes weekly) | Content freeze windows per market + delta-sync crawl before each cutover |

---

*Companion files: [`url-inventory.md`](url-inventory.md) (taxonomy + counts),
[`urls-all.txt`](urls-all.txt) (all 24,710 URLs), [`sitemaps/`](sitemaps/) (raw XML).
Pilot evidence: `stardust-work/journal.md`, `stardust-work/replica/progress.json`.*
