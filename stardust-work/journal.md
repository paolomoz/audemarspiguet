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

## 2026-07-30 (later) — Full-site analysis + implementation plan

**Prompt:** "analyse the full site and provide an implementation plan" — URL list,
page types/blocks, dynamic capabilities incl. martech, PIM integration for PDPs,
multi-language.

**Delivered (stardust-work/plan/):** `implementation-plan.md` (main plan),
`url-inventory.md` + `urls-all.txt` (24,710 URLs from all 26 locale sitemaps,
raw XML kept in `sitemaps/`).

**Key findings:** 7 archetypes cover the whole site; ~22 new blocks on top of the
pilot's 8. Same-language editions are identical path sets → author 9 language
masters, generate 26 editions. PDPs (~14.7k) have no headless JSON (.model.json
404) → generate via PIM adapter + JSON2HTML/BYOM overlay (Mustache → block markup),
prices stay client-side (parity — live grid feed has no price fields). Martech is
GTM `GTM-NGNW85W` + GA4 + OneTrust + first-party Target at.js (no Launch/AA);
Helix RUM already runs on live. Stores = Yext master data (baked-in on detail
pages, runtime on locator). No external search service — header search is the
all-watches grid. Critical path: PIM access + font licensing.

## 2026-07-30 (later) — Archetype 2 delivered: /ch/en/home (module page)

**Replica:** bounded extract (dwell-hydrated DOM + per-module lift at 1440/360)
→ prototype from pilot foundation + 5 new module styles → gate PASS 1440
2.95%/Δ2 (17.56→6.87→4.57→2.95) + 360 9.18%/Δ3 (37.51→10.55→9.18),
content-diff 0 red.

**Capture learnings:** (1) stitch-shot uses a 900px viewport at EVERY width —
live 100vh heroes measured 844 in the 844-vp DOM lift but render 900 in
stitched captures; prototype must use 100vh, never the lift's fixed px.
(2) New `--freeze-video` flag on stitch-shot (pause + seek t=0.001, applied
SYMMETRICALLY) kills video-frame variance: hero bands went 32-56% → 0.1-2%.
Retro-applies to any video-bearing page. (3) Live serves mobile art-direction
renditions (header_narrow_*) for big editorial images — hero got a <picture>
source; dti/chronicles/boutique logged as 360 residuals.

**Deploy:** blocks extended (hero primary / carousel novelties+services /
lookbook layout-a+b / text-image right+spaced) + new dual-text,
dual-text-image, newsletter. DA doc /ch/en/home published. Deployed gate green
both widths. **Final proof: live vs EDS = 1440 3.64%/Δ-5px, 360 8.35%/Δ-16px**
(pilot was 8.39%).

**Font fix with site-wide effect (R-01):** styles.css stack had
helvetica-neue-fallback (Arial @ size-adjust 94.3%) BEFORE local Helvetica
Neue — every device rendered scaled Arial, wrapping body copy 1 line early vs
live. Reordered (real HN first) + recalibrated size-adjust to 97.2% (HN
advance width). Pilot page re-gated green after the change.

**Learnings:** deployed final proof caught 3 defects the prototype gate
couldn't (hero img cover selector, lookbook variant padding inheritance, the
font-stack order) — block CSS ≠ prototype CSS; always re-proof deployed.
DA_TOKEN expired mid-run (hard stop, user refreshed); babel/core pruned by
--no-save installs breaks npm lint — reinstall together.

## 2026-07-30 (later) — Home motion + chrome refinements (6-item batch)

**Prompt:** measure-first parity pass on /ch/en/home: novelties cinematic
reveal, scroll-state header, language switcher, real carousel behavior,
ap-link hover, footer parity. No creative decisions; live measurements only.

**Measured (probes in stardust-work/scripts/: refine-probe-1440, reveal-probe*,
footer-probe, detail-probe, pilot-swiper-probe):**
- Storybook reveal: ALL card figures rise together on section trigger (20px,
  ~1.3-1.4s, same curve as generic reveal); text content forms ONE global
  200ms-stagger queue across cards (per card: title lines, desc lines, CTA,
  +1 gap slot — live card bases measured 254/1854/2841ms). Lines are
  rendered-line splits (GSAP SplitText-alike).
- Header: fixed; y≤50 transparent/white logo; down past 50 → hide
  (translateY(-100%), .3s cubic-bezier(.4,0,.2,1)); ANY up-scroll → white
  background panel (slides down inside clip) + dark logo/links. Threshold 50px
  both ways (binary-searched).
- Swiper (all ap-storybook-carousels, home + pilot): speed 300ms, gap 10,
  slidesPerGroup 1, threshold 5px, longSwipes 300ms/.5, resistance .85,
  grabCursor; desktop arrows always shown (48px circle, rgba(0,0,0,.3),
  1px #fff border, 16px chevron, disabled → opacity 0 .5s); mobile: arrows
  hidden, indicator dots (transition all .2s ease-in).
- .ap-link--line::before: width 48→12px on hover, `width .3s ease-in-out,
  background .3s ease-in`, line anchored at label end (justify-self:end).
- Language selector: live header carries NONE at any width — resting surface
  is the footer "Change language / currency" button (world icon 24px,
  500 14px/20px); picker is a body-level overlay on #country-data → R-06
  (deferred like R-03). Footer button replicated.
- Footer 1440: pad 80 (not 92.5), col pitch 158.75 flush right (725/884/1043/
  1201), li line 20 (was inheriting 23.84 → pitch 32 vs live 28), titles mb16,
  links 300 14px/20px #fff, legal 500 14px gap 22 + eA badge img (61x23,
  authored) + ICP right-aligned, copyright 300 14px pad 20/98. 360: cols mt8,
  social grid repeat(5,auto)/16, socialrow mt58, legal mt64, ICP own row +65,
  copy pad 16/33. Social icons: extracted the 10 glyph outlines from AP's own
  icomoon.woff2 (same-origin etc.clientlibs; codepoints from the CSS bundle)
  → inline SVGs in blocks/footer/social-icons.js. Pixel-identical render.

**Found & fixed beyond the six:** columns.editorial paragraph column had
drifted to x=100 (live: 199) on main — lost container compensation (the
journal's recorded trap, second occurrence). Restored (margin-left 199).

**Verification:** lint clean; deployed-gate green 4/4; reduced-motion: zero
transitions, all content visible. Deployed cascade timing matches live (200ms
queue, ~615ms card gap). Header CLS = 0 (was already overlay; absolute→fixed).
**Pixel proofs vs captured baselines: home 1440 3.64%/Δ0 (Δ was -5); home 360
8.39%/Δ-31** (was 8.35/Δ-16 — footer rows now match live EXACTLY relative to
footer start; the +0.04pp/Δ shift is the R-01 mobile paragraph-wrap residual
(+27px upstream, band-correlation-located at dti/chronicles/boutique) that the
old compressed footer happened to cancel). Pilot: 360 12.78%/Δ3 vs pre-batch
main 12.91%/Δ-70 (batch improves; 12.x = never-proofed prototype→deployed gap);
1440 whole-page gate-blocked by R-04/R-05 (Δ~2300px by design), 27.73% vs
pre-batch 28.32%, carousel bands 0.6-2.1% clean.

**Learnings:**
- npm i --no-save X still prunes the other --no-save packages — reinstall
  playwright+pixelmatch+pngjs+fontkit+@babel/core together (bit us again).
- helix media-hashes authored img srcs → can't derive logo variants from URL;
  author BOTH logo assets in /nav and tag by position.
- In a nowrap flex row, an img is the only shrinkable item — it absorbs ALL
  overflow (eA badge rendered 11px). flex:none on legal items.
- Uniform +4-9pp across every band = whole-page micro-offset or font delta,
  not a local defect; find offset origin with a band cross-correlation scan
  before touching sections.
- Pixel-gate captures inject transition:none at freeze — CSS-transition
  reveals snap to final state; GSAP (live) does not, but the settle pass +
  chunk cadence gives it time. Cascades up to ~25s are capture-safe.

**Open:** merge PR project-context→main (review required — direct merge
blocked by policy); R-01 fonts; R-02; R-03; R-06 language flyout; live footer
today serves 8 socials (Line/X removed) vs captured 10 — baseline kept, note
for next capture refresh.
