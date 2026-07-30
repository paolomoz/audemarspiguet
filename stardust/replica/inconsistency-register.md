# Inconsistency register — audemarspiguet.com replica (pilot: code-11-59-collection)

Everything not listed here is frozen; any design delta found by the gate is
a defect, not an improvement.

## R-01 — Licensed web fonts substituted with brand fallback stack

- **Evidence:** live page loads `Helvetica Neue Web` (Neue Helvetica 25/35/45/65,
  Linotype commercial kit) and `Times Now 400 italic` (commercial) —
  font-probe 2026-07-30 (`stardust/scripts/font-probe.mjs` output); AP font
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
