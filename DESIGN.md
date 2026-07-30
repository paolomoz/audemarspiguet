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
