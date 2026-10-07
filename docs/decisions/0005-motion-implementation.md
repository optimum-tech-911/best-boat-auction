# Homepage motion and interaction pass

2026-10-05. The user requested review of animations, smoothness, introduction effects and scrolling across sections, then reported that the French preview still showed no visible changes. This extends the earlier hero-only scope to implementing the motion audit and related frontend interactions. Final imagery follows this pass.

## Implemented presentation

The locked hero keeps its restrained introduction and responsive photo handling. A **Rejouer les animations / Replay animations** control beneath the hero restarts its existing entrance animations, returns to the page top and rearms the section reveals. Replay does not remount the page, reset demo auctions or replace their countdown deadline.

The homepage closing-lot rail, categories, trust content and activity/results groups use one-time opacity and vertical-position entrances. Desktop entrances last 560 ms over 18 px; mobile uses 440 ms over 10 px. Optional group delays are capped at 160 ms. Fine-pointer image hover uses a 1.025 scale over 220 ms; CTA arrows move 4 px over 180 ms. Continuous reference live-dot ping is removed. Native scrolling is retained, with explicit horizontal rail controls and local scroll snap rather than scroll hijacking or parallax.

Mobile activity and result rows use a contained layout that allows descriptive text to wrap while prices stay readable. Arriving activity uses a short 180 ms fade; ordinary numeric updates remain immediately visible.

The seller estimator accepts an embedded mode and shared locale. Embedded mode removes its duplicate header/footer. Numeric monthly and waiting totals retain their DOM nodes and update immediately; keyed entrance remounts are removed. Cost bars use `scaleX` over 180 ms instead of animating width. Its disclosures expose `aria-expanded` and `aria-controls`, and scrolling to inputs accounts for the sticky header. Existing estimator calculations remain demonstration logic and are not changed by this presentation pass.

## Progressive enhancement and accessibility

Shared `MotionObserver` and `MotionReplayButton` live in `packages/ui`. They use browser APIs and existing CSS; no new motion dependency is added. Server-rendered content is visible by default. After hydration, only off-screen reveal groups enter a waiting state. On-screen groups, groups containing keyboard focus and unsupported/failed observer cases show immediately. Lazy-mounted route groups are observed as they appear; cleanup restores the original presentation state.

Normal motion reveals a group once on entry. A keyboard focus event immediately makes its containing group visible. Reduced motion shows all groups and disables hero introductions, section entrances, image/arrow movement, activity arrivals and seller bar/disclosure motion. Programmatic seller and lot-rail scrolling uses immediate movement when reduced motion is requested. Replay remains usable without forcing motion against that preference.

Shared native modal dialogs provide focus containment, an inert background, Escape dismissal, page-position preservation and focus return after closing. The existing dialog contents and simulated business actions remain reference UI. The skip link targets the shared content region without changing the prototype hash route.

## Language and scope

French remains the default. Homepage labels, shared navigation/footer and replay text are available in French and English. Hero copy retains French, English, Dutch and German drafts. Lower homepage and seller content use English for Dutch/German until those body translations are written and reviewed. Catalogue, lot details, account and other reference screens are not fully localized by this pass.

The catalogue, lot details, bidding, identity and other underlying prototype flows retain their demonstration logic. Original root prototypes, archived copies and PDF remain untouched. Supabase, Stripe, authentication and real money movement are still deferred. Current imagery remains temporary; this work does not publish or integrate a production service.

## Verification

Run the required lint, TypeScript and production build checks, plus the relevant hero and motion browser checks. Verify normal and reduced motion, replay without a countdown reset, focus containment/return, French/English labels, slider updates without total remounts, sticky scrolling and mobile overflow. Preserve the locked hero baselines unless a deliberate visual change is reviewed. Verification results are reported after the checks complete; this record does not assert a passing count.
