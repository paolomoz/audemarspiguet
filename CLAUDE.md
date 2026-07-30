# audemarspiguet.com → AEM Edge Delivery (EDS) migration

Same-design ("replica") migration of audemarspiguet.com to EDS, page by page.
Pilot page delivered: `/ch/en/collections/code-11-59-collection` — cloned from
the live site at the same path, source-fidelity-gated, live at
https://main--audemarspiguet--paolomoz.aem.live/ch/en/collections/code-11-59-collection

EDS developer basics: see @AGENTS.md (boilerplate conventions, block dev, lint).

## Deployment coordinates

- **Code**: this repo (`paolomoz/audemarspiguet`), branch `main` → AEM Code Sync.
- **Content**: DA (Document Authoring), org/site `paolomoz/audemarspiguet`
  (da.live/#/paolomoz/audemarspiguet). `fstab.yaml` → content.da.live.
- **Auth**: `DA_TOKEN` in `/Users/paolo/.claude/.env` (IMS dev token, ~24h —
  preflight by decoding `created_at`+`expires_in`; a 401 with empty body = expired).
- **Deploy a page**: sanitise (`stardust-work/scripts/sanitise.js`) → `PUT
  admin.da.live/source/paolomoz/audemarspiguet/<path>.html` (multipart field
  `data`, type text/html) → `POST admin.hlx.page/preview/paolomoz/audemarspiguet/main/<path>`
  → same for `/live/`. Verify delivered `.plain.html` (one h1, no about:error)
  + a computed-style probe (`stardust-work/scripts/deployed-gate.mjs <url> <width>`).

## Design content (captured source-of-truth)

The design target IS the live audemarspiguet.com (preserve mode — no creative
decisions; see `stardust-work/direction.md`). Captured evidence:

- `PRODUCT.md`, `DESIGN.md`, `DESIGN.json` (repo root) — descriptive brand/design
  spec synthesized from the live site's own `:root` tokens and computed styles.
- `stardust-work/current/` — extraction: hydrated DOM, per-page JSON, content
  manifests (`content-manifest*.json` — verbatim copy per section), CSS lifts
  (`css-lift-{1440,360}.json`), geometry (`geom-{1440,360}.json`), stitched
  ground-truth screenshots, AP source CSS bundle, product JSON snapshots (`data/`).
- `stardust-work/replica/inconsistency-register.md` — the ONLY permitted design
  deltas. R-01 fonts (licensed, substituted — see `fonts/LICENSING.md`),
  R-02 compare/quick-view deferred, R-03 meganav flyouts deferred,
  R-04 full-width lookbook (user), R-05 4-up product grid (user).
- `stardust-work/replica/progress.json` — gate ledger: prototype PASS 1440
  8.44%/Δ0 + 360 8.82%/Δ0; deployed final proof vs live site 8.39%/Δ−2px.
- `stardust-work/journal.md` — narrative log + capture/deploy learnings
  (read this first in a new session). `stardust-work/state.json` — page states.

## EDS implementation

- **Blocks** (`blocks/`): `hero` (video, template-slotted), `lookbook` (5-tile
  collage, proportional/full-width per R-04), `carousel` (variants `releases`/
  `stories`/`collections`; section head is default content the block reabsorbs),
  `product-listing` (search + sticky toolbar + grid fed from `/data/*.json`
  snapshots of AP's `.products.*.json` endpoints; 4-up per R-05),
  `text-image`, `columns.editorial`, AP `header`/`footer` chrome (template-
  slotted from authored `/nav` + `/footer` DA docs).
- **Foundation** (`styles/styles.css`): AP tokens, type roles (HN 100 display,
  Times Now italic accents), `.ap-link` rule+label CTA (plain anchors, NOT
  buttons), `.grid-container` (max 1920, pad 92.5px/20px), scroll-reveal CSS.
- **Motion** (`scripts/reveal.js`, wired in `loadLazy`): measured off the live
  site — 20px rise + fade, 1.4s `cubic-bezier(0.45,0,0.15,1)`, 200ms line
  stagger; honors `prefers-reduced-motion`.
- **Fonts**: brand faces are licensed and NOT shipped (`fonts/LICENSING.md`).
  Stacks name brand first; local Helvetica Neue + self-hosted Cormorant
  Garamond render today. ⚠️ resolve licensing before production.
- **Content docs** (`content/`): mirrors of what's in DA (page, nav, footer).
  Edit → sanitise → PUT → preview/live. Media currently hotlinked from
  dynamicmedia.audemarspiguet.com (pilot policy).

## Working on this project

- Replica rule: any visual change vs the live site needs an inconsistency-
  register entry — otherwise it's a defect, however tasteful.
- Capture tooling gotchas (details in journal): AP pages need dwell-scroll
  hydration; use `stardust-work/scripts/replica/stitch-shot.mjs`, never
  Playwright `fullPage:true`; AP font CDN is CORS-locked; playwright/pixelmatch
  are `--no-save` installs pruned by any real `npm i` — reinstall together.
- Next pages (site scope): re-run extract with `--prep`; sibling collection
  pages inherit the gated archetype (blocks above are the pattern library).
