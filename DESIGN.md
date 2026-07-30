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
