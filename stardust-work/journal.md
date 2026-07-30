# Stardust journal — audemarspiguet.com → EDS

## 2026-07-30 — Pilot kickoff: replica of /ch/en/collections/code-11-59-collection

**Prompt history:** (1) "migrate audemarspiguet.com to EDS, starting with 1
page … clone it to the same path" → routed to `stardust:replica`
(same-design migration), bounded single-page entry. (2) Pre-flight page
assessment delivered (AEM Sites + Vue islands, 10 modules, product grid fed
by 3 public JSON endpoints, licensed fonts, Scene7 media). (3) "proceed with
the pilot. maximise for fidelity" → hands-on run, pure-replica bias, gate
target well under the 10% bar.

**Decisions:**
- Replica pipeline, NOT redesign: extract --single → bounded promotion →
  recreate → source-fidelity gate (1440+360) → deploy to DA.
- fstab.yaml added → content.da.live/paolomoz/audemarspiguet; .gitignore
  hardened (.env, qa/) before any commit (token hygiene).
- Fonts (register R-01, applied): local Helvetica Neue fallback + self-hosted
  Cormorant Garamond; brand names stay first in stacks. AP font CDN CORS is
  pinned to tapptic-design.zeroheight.com — hotlinking impossible.
- Compare/quick-view modal (R-02) and meganav flyouts/search overlay (R-03)
  deferred — interaction-only, zero resting-state pixels.
- Product data snapshotted to stardust-work/current/data/ (43+60+11=114 refs),
  to be served from the EDS origin.
- Media hotlinked from Dynamic Media for the pilot.

**Capture learnings (recorded for site-scope run):**
- crawl.mjs fullPage screenshot fails two ways on this site: OneTrust
  re-injects after dismissal, and Chromium fullPage:true blanks bands on
  ~30k-px-tall pages. Authoritative ground truth = stitch-shot.mjs --settle.
- Vue grid + lazysizes need dwell scrolling (~900ms/step) to hydrate; fast
  scroll leaves black voids. 43-card grid hydrates reliably with dwell.
- Headless capture works (no bot block) with real-Chrome UA + standard
  headers at 2026-07-30.

**Open questions:** none blocking. Next: Phase 3 recreation.

## 2026-07-30 (later) — Pilot delivered end-to-end

**Gate (phase 4):** 1440 PASS 8.44%/Δ0 (best 5.84% when video frames matched;
trajectory 22.88→9.03→8.49→5.84). 360 PASS 8.82%/Δ0 (trajectory
23.76→20.93→13.21→12.06→9.20→8.82). Content-diff 0 structural red both widths.
Key 360 findings: live mobile cards are content-hugging with a 14px title in a
~200px box (wrap threshold fitted at 185px); footer collapses to accordions;
mobile pagination dots; header swaps to mini monogram.

**Deploy (phase 5):** blocks hero / columns.editorial / lookbook / carousel
(3 variants) / product-listing (fed from /data snapshot of AP's product JSON)
/ text-image + AP header/footer chrome; content docs
/ch/en/collections/code-11-59-collection, /nav, /footer authored in DA and
published. David's-Model lint 0 red. Deployed computed-style gate green at
both widths (43 cards, all grids grid/flex, 0 errors, 0 broken images).
**Final proof: live audemarspiguet.com vs deployed EDS = 8.39% / Δ−2px** after
three padding compensations found by the post-deploy probe.

**Learnings for site scope:** the prototype's padding compensations must be
carried into block CSS explicitly (they got lost once); zsh arrays are 1-based
(a deploy loop silently skipped /footer); --no-save playwright/pixelmatch get
pruned by every real npm i — reinstall all three together.

**Open:** R-01 font licensing before production; R-02 compare/quick-view;
R-03 meganav flyouts + search overlay; reveal-on-scroll motion (dropped per
deploy #14 — candidate for a motion pass); legacy/special product tabs.
