---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-07-30T10:40:00Z
  againstInput: https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection
  readArtifacts:
    - stardust/current/pages/ch-en-collections-code-11-59-collection.json
    - stardust/current/css-lift-1440.json
    - stardust/current/css-lift-360.json
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of
https://www.audemarspiguet.com/ch/en/collections/code-11-59-collection,
single-page pilot for an EDS migration (repo paolomoz/audemarspiguet,
DA org/site paolomoz/audemarspiguet, same content path).

Synthesized (bounded-single): current/pages/ch-en-collections-code-11-59-collection.json
+ Phase-3 CSS lift (css-lift-1440.json, css-lift-360.json)
→ PRODUCT.md · DESIGN.md · DESIGN.json (at 2026-07-30T10:40:00Z).

Permitted deltas: ONLY the entries of stardust/replica/inconsistency-register.md
(3 entries: 1 applied — font substitution; 2 deferred).

Fidelity: ia verbatim · design verbatim · content verbatim.
User directive: "maximise for fidelity" — gate target is well below the 10%
pixel bar; iterate the full 3-iteration budget per breakpoint if needed.

## Pilot scope notes (platform scope, not design deltas)

- OneTrust consent banner, Adobe Target/Analytics, Teads pixel: not
  replicated (third-party scripts, dismissed from source captures too).
- Login/account, language selector behavior: static links, no auth flows.
- Media stays hotlinked from dynamicmedia.audemarspiguet.com (Scene7) —
  zero asset-migration risk; swap to DA-hosted assets in a later phase.
- Product data: the 3 live `.products.*.json` endpoints are snapshotted in
  stardust/current/data/ and will be served from the EDS origin (CORS on
  audemarspiguet.com is pinned to another origin).
- Fonts: AP's font CDN blocks cross-origin use (ACAO pinned to
  tapptic-design.zeroheight.com). See register R-01.
