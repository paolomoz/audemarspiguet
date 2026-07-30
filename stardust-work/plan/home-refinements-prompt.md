# Prompt: /ch/en/home motion + chrome refinements (new session)

Refine the deployed EDS homepage replica at
https://main--audemarspiguet--paolomoz.aem.live/ch/en/home against the live
original https://www.audemarspiguet.com/ch/en/home. Read
stardust-work/journal.md first (deploy/capture learnings), then work these six
items. These are interaction/motion parity items — measure each behavior on
the LIVE site first (Playwright probe: computed transitions, easings,
durations, IntersectionObserver thresholds, scroll listeners; the captured AP
CSS bundle at stardust-work/current/ap-source-css-bundle.css has the source
values — grep it before guessing). No creative decisions: replicate measured
values. Anything that can't match exactly gets an inconsistency-register entry
(stardust-work/replica/inconsistency-register.md).

1. **"Our 2026 novelties" cinematic reveal** — the live section reveals with a
   much slower, staggered cinematic effect on scroll (line-split rise + slide
   stagger across cards). Our scripts/reveal.js currently applies the generic
   AP reveal (20px rise, 1.4s cubic-bezier(0.45,0,0.15,1), 200ms line
   stagger). Measure the live novelties carousel's actual timings (per-slide
   delay, duration, distance, easing — the ap-storybook-carousel has its own
   reveal choreography) and reproduce them in the carousel block (respect
   prefers-reduced-motion).

2. **Scroll-state header** — on scrolling down past the hero, the live site
   slides in a WHITE header bar (solid background, dark logo/links). Our
   header is only the transparent-over-hero variant. Measure: trigger
   scroll offset/direction rule (likely hide-on-down, white-bar-on-up),
   heights, background, logo swap (white → black assets), transition timing.
   Implement in blocks/header/header.js (scroll listener, honoring
   reduced-motion) + CSS. Verify no CLS regression.

3. **Language switcher missing from header** — the live header carries the
   language/currency switcher (see the `#country-data` JSON model documented
   in stardust-work/plan/implementation-plan.md §3, and the ap-language-
   selector markup in stardust-work/current/pages/ch-en-home-hydrated.html).
   Add it to the /nav authored doc + header block (resting state only is
   fine; the open flyout can be deferred with a register entry like R-03).

4. **"Our Services" (and novelties) carousel functionality** — our carousel
   block is a static offset track. Implement real carousel behavior to match
   live: drag/swipe + arrow affordances where live shows them, snap points,
   and the mobile pagination dots advancing. Match live's scroll physics as
   closely as measurable (transform transition timing from the live Swiper
   config). Applies to all carousel variants (releases/stories/collections on
   the pilot page inherit it — re-gate that page after).

5. **.ap-link line-shrink hover** — live rule+label links animate the 48px
   line (shrink/retract on hover, then re-extend). Measure the exact
   transition (property, duration, easing, direction) from the live site and
   reproduce on `main .ap-link::before` in styles/styles.css site-wide.

6. **Footer parity** — our footer is missing the real social icons (live uses
   the AP icon glyphs — extract the SVGs from the hydrated DOM or icon font
   per the capture; currently generic boxes, logged as a pilot residual) and
   its font sizes/weights/margins drift from the original. Do a measured pass:
   probe live footer computed styles at 1440 + 360 (column heads, link rows,
   legal line, copyright, spacings) and correct blocks/footer/footer.css +
   the /footer authored doc. Note: footer is shared chrome — re-verify the
   pilot page after.

Verification for the whole batch: npm run lint clean; deployed-gate.mjs green
at 1440+360 on BOTH pages (/ch/en/home and
/ch/en/collections/code-11-59-collection); re-run the final pixel proof
(stardust-work/scripts/replica/stitch-shot.mjs with --settle --freeze-video vs
live, pixel-compare.mjs) expecting ≤ current 3.64%@1440 / 8.35%@360 — motion
work must not regress the resting-state numbers. For motion itself, verify by
scripted scroll-through video/frames comparison (motion-probe.mjs /
motion-smoke.mjs exist in stardust-work/scripts). Update
stardust-work/replica/progress.json residuals, the register (if any deferrals),
and stardust-work/journal.md. DA_TOKEN preflight before any content PUT
(decode created_at+expires_in; content deploy chain per CLAUDE.md).
