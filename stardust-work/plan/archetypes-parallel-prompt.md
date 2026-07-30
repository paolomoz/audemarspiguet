# Prompt: build all remaining archetypes in parallel agents (new session)

Build the remaining audemarspiguet.com → EDS archetypes from
stardust-work/plan/implementation-plan.md §2, using parallel agents — one per
archetype — each reporting structured results back to you for consolidation
into the design context and docs. Read stardust-work/journal.md and CLAUDE.md
first; the measured motion/chrome values in DESIGN.md §Motion/§Chrome and
DESIGN.json `extensions.motion|chrome` are settled — REUSE them, never
re-measure or re-derive. Replica mode throughout (stardust-work/direction.md):
no creative decisions; any unavoidable delta gets an inconsistency-register
entry (stardust-work/replica/inconsistency-register.md, next id R-07).

## Work packages (one agent each, parallel)

- **D — News index** (`/ch/en/news`): main-article + card list + category
  chips/tabs + load-more → `article-list` block fed by per-locale query-index
  (EDS-native), `chips` block. Client-side category filter.
- **E — Store locator** (`/ch/en/stores`): full-page map+list. Biggest dynamic
  lift: Yext master data + Google Maps. If keys/quotas block the map, build the
  list+geolocation resting state pixel-true and register the live-map defer.
- **F — Store detail** (`/ch/en/stores/geneve` or similar): boutique-hero with
  Yext entity baked at publish, gallery carousel (reuse carousel block),
  nearby-stores carousel. Template for 76 generated pages/locale.
- **G — Masterclasses** (`/ch/en/masterclasses` + detail): hero +
  masterclass-search (embedded catalogue, CHF prices) + cards + banner.
- **A+ — Module-page completion**: FAQ page (`/ch/en/services/faq`) →
  `accordion` block; one form page (`/ch/en/form/contact-us`) → `form` block
  (static/resting parity; submission backend + reCAPTCHA deferred with a
  register entry).
- **B+ — Listing completion**: R-02 compare + quick-view modal on the pilot
  page (localStorage state, XF modal content recreated as authored fragment).
- **C — PDP archetype sample**: clone ONE representative PDP
  (`/ch/en/watch-collection/code-1159/{ref}` — pick a live ref) as a static
  archetype: product-info, featured-products, strap-selector, specifications,
  similar-products, store-locator-simple. Data baked from capture; the PIM
  adapter/JSON2HTML generation path stays future work (critical path note in
  plan §4). Prices client-side-absent exactly like live grid feeds.

## Per-agent protocol (each agent, independently)

1. Extract its page with the existing pipeline: dwell-scroll hydration,
   `stardust-work/scripts/replica/stitch-shot.mjs --settle --freeze-video`
   ground truth at 1440+360 (NEVER Playwright fullPage), content manifest,
   CSS/geometry lift. Store under `stardust-work/current/` (namespaced per
   page) and gates under `stardust-work/replica/gates/<page>-<width>/`.
2. Build blocks + authored content doc(s). Reuse the pattern library
   (hero/carousel/lookbook/text-image/dual-text/newsletter + chrome) before
   writing any new block; new blocks follow AGENTS.md conventions and the
   foundation tokens. Wire reveal motion via scripts/reveal.js (values are
   settled); interactive behavior must honor prefers-reduced-motion.
3. Gate: pixel ≤10% AND height Δ≈0 at both widths vs its own captured
   baseline + content-diff 0 structural red. Fix top-down by band; a hot band
   contaminates everything below it.
4. Report back (structured, no prose dumps): blocks added/extended, authored
   docs + DA paths needed, gate numbers + trajectories + residuals, any NEW
   measured design values (candidate DESIGN.md/DESIGN.json additions), any
   register-entry candidates with evidence, journal-paragraph draft, and open
   risks. Agents do NOT edit shared files themselves: CLAUDE.md, DESIGN.md,
   DESIGN.json, journal, progress.json, register, styles/styles.css and the
   header/footer blocks are orchestrator-owned (agents propose diffs for
   styles.css/chrome if truly needed).

## Orchestrator (you) — serialize the shared surface

- Preflight DA_TOKEN (decode created_at+expires_in) BEFORE spawning agents;
  content PUTs are orchestrator-run: sanitise → PUT admin.da.live → preview →
  live (per CLAUDE.md), one page at a time.
- Give each agent an isolated worktree; merge code sequentially; `npm run
  lint` after each merge. Trap: `npm i --no-save X` prunes other --no-save
  packages — reinstall playwright+pixelmatch+pngjs+fontkit+@babel/core
  together if any agent touched node_modules.
- Consolidate agent reports: fold new measured values into DESIGN.md/
  DESIGN.json extensions, register entries (sequential ids), one journal
  section per archetype + a batch summary, progress.json records per page
  (gate numbers, residuals, deploy block lists).
- Deploy each gated page, run `stardust-work/scripts/deployed-gate.mjs` at
  1440+360, then the final pixel proof vs its captured baseline
  (stitch-shot --settle --freeze-video, pixel-compare).
- Regression sweep: shared chrome (header/footer/styles) means EVERY new
  block merge can move existing pages — re-run deployed-gate on /ch/en/home
  and the pilot after the last merge; home must hold 3.64%@1440/Δ0 and
  8.39%@360; the pilot's whole-page pixel proof is gate-blocked by R-04/R-05
  (verify per-band: carousel bands ≤~2%, footer band clean).
- Live-content drift is real (footer went 10→8 socials intra-day): gate
  against captured baselines only; note drift in the journal, refresh
  baselines deliberately, never mid-batch.
- Commit per archetype on `project-context`; push; merge to main only after
  the full regression sweep is green (PR if review policy requires).

Deliverable: all remaining archetypes live on aem.live with per-page gate
records, updated register/journal/progress.json, DESIGN context extended with
any new measured values, and both existing pages verified unregressed.
