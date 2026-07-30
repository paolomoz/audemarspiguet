# Font licensing — audemarspiguet.com EDS pilot

⚠️ **FONT LICENSING REQUIRED BEFORE GOING LIVE**

| File / stack position | Family | Foundry | Status |
|---|---|---|---|
| *(not shipped)* | Helvetica Neue Web (Neue Helvetica 25/35/45/65) | Linotype / Monotype | **Licensed to audemarspiguet.com — NOT redistributed.** Stack falls back to local Helvetica Neue (Apple platforms) / metric-adjusted Arial. Drop the licensed woff2 into `fonts/` + `styles/fonts.css` to activate with zero code change. |
| *(not shipped)* | Times Now | Commercial | Same policy. Serif accents currently render Cormorant Garamond. |
| *(not shipped)* | MyriadPro | Adobe | Used by source site for RU locale only — not needed for this pilot. |
| `cormorant-garamond-medium-italic.woff2` | Cormorant Garamond | Catharsis Fonts (SIL OFL 1.1) | ✅ Free to self-host. This is the fallback audemarspiguet.com itself declares behind Times Now. |

**Remove path:** if brand-font licensing is confirmed, add the licensed woff2
files and their `@font-face` rules to `styles/fonts.css` — the stacks already
name the brand families first. If Cormorant must be removed, delete its
`@font-face`; serif accents fall back to Times New Roman.
