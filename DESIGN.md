<!--
_provenance:
  writtenBy: stardust:replica
  mode: bounded-single
  synthesizedFrom:
    - stardust/current/pages/ch-en-collections-code-11-59-collection.json
    - stardust/current/css-lift-1440.json
    - stardust/current/css-lift-360.json
-->

# DESIGN — Audemars Piguet (captured system, bounded to one page)

All values lifted from the live site's own CSS (`:root` custom properties
and computed styles). Source: css-lift-1440.json / css-lift-360.json.

## Palette (site's own `--color-*` tokens)

- black `#000` (page ground), white `#fff` (text on dark)
- light-beige `#f6f5f3` (light section ground: product grid)
- beige89 `#e7e4df`, white-gold `#c9b586` (accent)
- brand-color `#02291f`, brand-green `#456148` (footer ground family)
- greys: `#c4c4c4`, `#818181`, `#757575`, `#656565`, `#8b8c8c`, `#eee`, `#1b1b1b`

## Typography

- Primary: `"Helvetica Neue Web", sans-serif` — weights 100/300/400/500.
  Display: 100 (56px/1 desktop, 40px/1 mobile), uppercase, ls -1%.
  Body: 300 16px/23.84px. Labels: 500 14px/24px (ls 0.21px) and
  500 12px/16px (ls 1.8px, product refs).
- Secondary (display accents): `"Times Now", serif` 250 italic —
  60px/49.8px desktop, 44px/36.52px mobile, uppercase, ls -0.02em.
- Replica substitution per register R-01: local Helvetica Neue fallback +
  self-hosted Cormorant Garamond Medium Italic behind the brand names.

## Spacing scale (site's own `--spacing-*`)

4 / 8 / 16 / 20 / 24 / 32 / 48 / 64 / 80 / 96 / 120 / 136 px.

## Container model

`.grid-container` max-width 1920px, full-width at 1440; Foundation-style
grid (`grid-x`/`cell`, 12-col); content gutters via cell classes
(e.g. hero text `small-12 medium-7 large-4`).

## Components (captured on this page)

Video hero (full-bleed, play/pause control) · dual-text editorial ·
lookbook (5-element layered imagery) · carousel layout-1 (product cards) ·
carousel layout-2 (story/collection cards) · product grid with search +
filters (43/60/11 refs via JSON) · text-image dark left (boutique) ·
CTA link rows (48px rule + label grid) · site header (dark, transparent
over hero) · footer (brand-green ground).

## Motion (measured 2026-07-30, home refinements batch)

Scroll-triggered reveals: line-split text (`js-reveal-effect-line`),
left-wipe blocks, image reveals. IntersectionObserver + CSS transitions.
Radius 0 everywhere; no shadows in captured sections.

Measured values (replicate on every new page — implemented in
`scripts/reveal.js`, `blocks/carousel`, `blocks/header`, `styles/styles.css`):

- **Generic reveal**: translateY 20px→0 + opacity 0→1, ~1.4s
  `cubic-bezier(0.45, 0, 0.15, 1)`, 200ms stagger per text line.
- **Storybook carousel cascade**: all card figures rise together on section
  trigger; card text forms ONE global 200ms-stagger queue across cards
  (per card: title lines → desc lines → CTA → one empty gap slot). Text is
  split into rendered lines (SplitText-alike), not authored lines.
- **Header scroll machine**: fixed chrome; `y ≤ 50px` transparent + white
  logo; scroll DOWN past 50 → slide away `translateY(-100%)` 0.3s
  `cubic-bezier(0.4, 0, 0.2, 1)`; any UP scroll → white background panel
  slides down (same timing) + dark logo/links; both thresholds exactly 50px.
- **Swiper physics** (all storybook carousels): 300ms ease snap, 10px gap,
  1 slide per step, drag threshold 5px, long-swipe 300ms/ratio .5, edge
  resistance `overshoot^0.85`, grab cursor. Desktop arrows always present:
  48px circle, `rgb(0 0 0 / 30%)` fill (50% hover), 1px #fff border, 16px
  chevron, disabled → opacity 0 over .5s. Mobile: arrows hidden, dots
  advance with active slide (`all .2s ease-in`).
- **CTA rule-line hover**: `.ap-link::before` width 48px→12px,
  `width .3s ease-in-out, background .3s ease-in`, line anchored at the
  label end (justify-self: end).
- **Reduced motion**: every one of the above collapses to no-transition,
  content visible (`prefers-reduced-motion: reduce`).

## Chrome geometry (measured, shared across pages)

- Header: 120px desktop / 84px mobile (live home renders 80px mobile);
  white-bar state swaps logo assets (both variants authored in `/nav`).
- Footer: **80px side padding at desktop** (not the page's 92.5px);
  link columns 4 × 158.75px flush right; column titles 500 12/16 +1.8
  tracking, mb 16; items 300 14/20 #fff, li line-height 20 (pitch 28);
  language button 500 14/20 + 24px world icon (flyout deferred, R-06);
  legal 500 14/20, 22px gaps, eSSENTIAL-Accessibility badge 61×23, ICP
  right-aligned; copyright 300 14/21, padding 20/98 bottom.
- Footer social: 10 brand glyphs extracted from AP's own icomoon.woff2 as
  inline SVGs (`blocks/footer/social-icons.js`), 21×21, 16px gaps; mobile
  grid `repeat(5, auto)` space-between.
- Light-chrome pages (e.g. /ch/en/stores): metadata `theme: light` →
  `body.light` → dark resting header (bar-state colorway WITHOUT the white
  panel) — overrides in `blocks/header/header.css`. Main offset is
  page-measured: stores = 120px desktop / **80px mobile** (home's mobile
  constant is 84).

## Store locator (archetype E, measured 2026-07-30 off /ch/en/stores)

Probes: `stardust-work/current/stores-{1440,360}-lift.json` + AP
store-locator CSS chunk. Implemented in `blocks/store-locator`.

- App: desktop height `calc(100vh - 130px)` under the 120px offset
  (never a lifted px — stitch viewport is 900), pad 40/92.5; sidebar 420px
  (pad 2 0 0, 20 right, overflow-y scroll, transparent-at-rest custom
  scrollbar); map flex-1 ml 20; mobile map 300px full-bleed
  (margin 0 −20px 20px), list DOM-reordered after the map below 1025px.
- Search row: form pad 8 0, border-bottom 1px `#8b8c8c`, textarea 16/24
  w300 (16/20 mobile), placeholder `#c4c4c4`, 32px magnifier ml 16.
- Chips: pad 8, 500 12/16 ls 1.8 uppercase; unchecked border `#c4c4c4`;
  checked bg/border #000 text #fff; gap 10, row margin 16 0; filters row
  margin 50 0 15.
- Store card: figure 1px transparent border; img h 200 cover; caption #000
  pad 30 30 10; name 100 30/40 ls −0.3 (24/32 ls −0.22 mobile) + 1px pad on
  h2 and a; role 500 12/14.4; hours mt 20, bt 1px `#757575`, pad 20 0 10,
  state/today 500 14/18.06, day rows grid 75px/1fr pad 10 12 0;
  address/phone 300 14/20.86 margin 10 0, 16px icons mr 8 top −2;
  appointment CTA min-h 64 pad 20 16, 1px white frame drawn as OUTLINE
  (outside layout — border adds +2px); explore CTA pad 24 0 (20 0 mobile),
  underlined label. Card icons = icomoon outlines e926/e923/e925/e924
  (fontkit extraction, same method as footer socials).

## FAQ accordion + contact form (archetype A+, measured 2026-07-30)

Probes: `faq-accordion-probe.mjs`, aplus lifts. Implemented in
`blocks/accordion`, `blocks/form`.

- **Accordion motion**: content `height .3s ease-in-out, margin .3s
  ease-in-out` (live `--accordion-animation-duration: 300ms`, height via
  per-content CSS var); opened content margin 0 0 24px (20 mobile). Icon
  plus→minus: vertical hand rotates 270° with ~1s expo-out tail →
  `transform 1s cubic-bezier(0.16, 1, 0.3, 1)`; 16px grid box, 24px svg,
  1px round-cap currentColor strokes. Trigger focus-visible pad 12px L/R,
  `padding .2s ease-in-out`.
- **Accordion type**: question 300 16/24 #000; answer 300 16/24 `#757575`
  pad-b 24; answer links 300 17/22.95 `#818181` underline ls 0.26; group
  h2 100 30/30 ls −1% + 6px pad + 24.9px mb (mobile 22/22, mb 19); item
  pitch 73 (title 24 + gap 24 + 1px `#8b8c8c` border + gap 24), 20px gaps
  mobile. All items closed at rest.
- **Form metrics**: label 500 12/16 ls 1.8 uc `#757575` (focus-within →
  #000, `color .3s ease-in-out`); control box 40px (8/24/7+1px border);
  underline `#c4c4c4` → #000 when filled; row pitch 86; name row
  120/241/241 gap 10; phone row 204/408 gap 10; card select 306px
  `#f6f5f3` pad 30/30/33; textarea 230px 1px `#c4c4c4` pad 15; submit
  320×64 #000 500 14/24; select placeholder `#757575`, chevron ≈12×8 1px.

## Store detail (archetype F, measured 2026-07-30 off /ch/en/stores/ap-house-geneva)

Probes: `stardust-work/current/ap-house-geneva-probe-{1440,360}.json`.
Implemented in `blocks/boutique-hero`, `blocks/carousel` (gallery/boutiques).

- **boutique-hero**: pad-top 224/120; locator link mb 88/64; role 12/11.4
  ls 1.8 (mb 56) / 10/10 ls 2 (mb 24); hero photo ratio 2.7 @1440 /
  1.5203 @360; contact card 422px pad 32/31/31 (absolute-right desktop;
  in-flow with −32px photo overlap mobile), title 32→23.7 w100 uppercase;
  hours rows 17/22.95 pitch 31 (today+status w500); CTAs 360×64 1px #fff
  border; quote band 38/45.98 w200 pad 200/144 — 24/34.08 pad 50 mobile.
- **boutiqueCarousel band**: head gutter 100px @1440 / 24px @360 (NOT the
  page 92.5/20 pad); section pad 104 (gallery bottom 111 = 104 + 6.8 live
  inline-img overhang; boutiques 105). White bands.
- **store-card (nearby)**: 412×547 / 304.5×580.6, img 240h 1px inset,
  caption pad 30, name 30/40 / 24/32 w100, divider 1px `#757575` +
  pad-top 32, status 14/18.06, address bottom-anchored (mb 10 + pad 30).
- **Mobile dots on white**: active 24×12 border 2px #000 r12 m0/2;
  inactive 6×6 border 1px #000 m0/1; gap 4; right-aligned mr 24;
  `all .2s ease-in`.
- **Mobile hours accordion**: divider `#757575`, 40px row, chevron =
  icomoon e907 rotate 180° `.7s ease-in-out`; panel expand live 87→291px,
  replicated as max-height .5s ease-in-out (expand is interaction-only).
- Quirk: live "Contact details" declares font-family "Times Now" but
  RENDERS the thin sans (HN ultralight) — replicate with HN stack w100.

## News index (archetype D, measured 2026-07-30 off /ch/en/news)

Probes: `news-lift-{1440,360}.json`, news-loadmore-probe. Implemented in
`blocks/chips`, `blocks/article-list`.

- **Filter tabs**: 500 14/20, pad 16px 8px, mb −1px, gap 64 (16 <1025),
  active #000 + 2px #000 underline, inactive `#757575`, hover underline
  `#757575`, `color .15s ease-in-out, border-color .15s ease-in-out`;
  container rule 1px `#c4c4c4`; bar mb 50; wrapper overflow-x auto,
  scrollbar hidden.
- **Article cards**: basic title 100 30/40 (24/32 mobile) uppercase; huge
  (featured) title 100 30/30 (22/22); desc 300 16/24; vertical gap 16;
  chip 500 12/16 ls 1.8 pad 8 border 1px `#c4c4c4` transition .1s; card
  hover picture opacity .56 (`.3s ease-in-out`).
- **List grid**: ul `width calc(100% + 17px)`, margin 0 −5px (−8 mobile);
  item `calc(33.3333% − 10px)` mr 10 mb 140 desktop / 100% mb 100 mobile /
  50%−11px mb 160 tablet; featured margin 25 0 120 (mb 100 mobile); huge
  content grid 2×1fr col-gap 64 row-gap 8.
- **Load-more CTA** (ap-cta--secondary, theme-light): min-h 64, pad 20/16,
  min-w 260/max-w 320, centered mt 50; border lives on ::before (1px #000,
  `border .3s ease-in`); hover text+border `#757575`. Semantics: 12/page
  via `news.newslist[.filter=<id>].page=N.json`; append auto-scrolls first
  new row to viewport top; filtered pages drop the featured card.
- **Renditions**: basic card ≥1501 560×401 / ≥1025 480×510 / ≥768 960×1021
  / <768 590×600 (separate narrow asset); featured ≥1025 `?size=900,0`
  served 900×394 — the SERVED rendition's natural ratio sets rendered
  height, not the master's.
- ⚠ Chrome correction: live mobile header is **80px** on light pages
  (pilot foundation carries 84 in `--nav-height`) — blocks carry scoped
  −4px compensations; reconcile globally post-batch.
