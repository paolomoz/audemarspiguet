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
- Product data snapshotted to stardust/current/data/ (43+60+11=114 refs),
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
