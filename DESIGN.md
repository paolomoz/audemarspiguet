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

## Motion

Scroll-triggered reveals: line-split text (`js-reveal-effect-line`),
left-wipe blocks, image reveals. IntersectionObserver + CSS transitions.
Radius 0 everywhere; no shadows in captured sections.
