# Tidebid — motion, scrolling and interaction audit

2026-10-05. Requested analysis before the next imagery phase. Covers the new hero and the retained homepage, catalogue, lot, seller, account, explanation and overlay interfaces. This is an audit and an implementation plan; the effects below are proposals unless explicitly described as existing.

## Main finding

The hero establishes a useful editorial direction. The rest of the prototype has inconsistent interaction behavior and repeats rounded panels, small interface text and illustrated boat cards. Smoothness will improve most through stable layouts, clear scrolling and immediate responses, followed by a restrained common motion system. Section composition and photography must develop together.

## What was inspected

- Source: `apps/web/src/app/globals.css`, home feature components, shared Countdown, `features/reference/platform.jsx` and `seller-estimator.jsx`.
- The running preview in the Codex browser at its normal 1026 × 771 viewport and a temporary 390 × 844 mobile viewport, with ordinary motion enabled.
- Homepage section geometry, live animation styles, sign-in dialog keyboard behavior, seller headers/footers, estimator scrolling and slider changes, mobile lot browsing, document overflow and a lot/Back navigation sequence.
- Existing hero QA and its mobile Lighthouse report. Existing screenshot tests use reduced motion globally; they do not prove normal entrance timing, frame rate or scrolling performance.

No scrolling FPS or field INP measurement was taken. Root re-rendering and layout-animation costs below are source-based performance risks, not measured dropped frames. Back returned near the previous lot-row position in the browser check; an unconditional route scroll reset exists in source, but a universal Back failure was not reproduced.

## Confirmed problems to fix first

| Priority | Finding | Evidence | Required correction |
| --- | --- | --- | --- |
| First | Mobile homepage overflows horizontally | At 390px, document width was 534px. The Live activity panel and its rows extended past the viewport. `platform.jsx:663–674` | Allow grid children and text columns to shrink; use a deliberate mobile arrangement for title, price and timestamp. Keep scrolling inside the intended lot rail. Do not hide document overflow to conceal the cause. |
| First | Dialog keyboard focus remains behind the overlay | Opening Sign in left focus on the header trigger. Pressing Tab moved to the underlying “Voir les lots” link. `platform.jsx:432–445`; seller modal has the same structural omission at `seller-estimator.jsx:397` | Shared accessible dialog: initial focus, contained Tab sequence, inert background, accessible title, Escape, return to trigger and page scroll lock. |
| First | Seller page duplicates navigation | Two headers and two footers are mounted. Both sticky headers occupied top=0 after scrolling. `platform.jsx:1211–1218`, `seller-estimator.jsx:227` | Use one common page shell and one sticky header. Remove duplicate footer and competing layers. |
| First | Scroll targets land under the header | “Calculer mes pertes” ended with estimator top=0 and header bottom=65 on desktop. `seller-estimator.jsx:211,266`; lot mobile action also uses unoffset scroll at `platform.jsx:856` | Shared sticky-header offset, target scroll margin and intentional focus destination. Respect reduced motion in programmatic scrolling. |
| First | Calculator totals disappear on input changes | One length adjustment restarted vmUp on all three numeric outputs; computed opacity was 0 immediately after the change. Values are keyed by rounded estimates. `seller-estimator.jsx:257,309,324` | Keep numeric nodes mounted and update totals immediately. Any visual feedback should surround the value, without hiding or moving it on every input event. |
| First | Reduced motion is limited to the hero | Hero has the preference override. Reference ping, tb-up, tb-in, tb-flash, vm-up and explicit smooth scrolling do not. `globals.css:142`, `platform.jsx:431,1206–1208`, `seller-estimator.jsx:211,225` | Apply one policy across the app: immediate content, no decorative movement or repeated pulse, instant programmatic scrolling, functional timers retained. |
| Next | Some principal actions lack keyboard equivalents | Lot card is a clickable article; gallery opener a clickable div. `platform.jsx:471,822` | Real links for lot navigation and buttons for the gallery; preserve independent watchlist controls. |
| Next | Route and focus behavior is incomplete | Every route-key change calls scrollTo(0,0); no heading focus/route announcement or explicit per-route restoration. Filter state is only partly reflected in the hash. `platform.jsx:1159–1188` | New-page navigation should set a sensible heading focus. Keep filter/scroll state during catalogue interaction and restore it when returning from a lot. Test browser Back/Forward rather than assuming the source reset always wins over browser restoration. |
| Next | Skip link is home-specific | `#home-hero` is absent on other routes; the hash parser treats unknown hashes as home. `layout.tsx:36`, `platform.jsx:1159` | Persistent main-content target and skip behavior that does not change the current route. |
| Next | Mobile demo controls overlap content | The floating Demo dock overlapped the seller length slider during inspection. `platform.jsx:584`; seller bottom bar at `seller-estimator.jsx:387` | Keep development controls out of the public composition and account for mobile bottom safe areas. |

## Existing hero: retain the direction

The desktop photo settles from scale 1.025 to 1 over 1200ms. Eyebrow enters over 350ms after 80ms; heading over 500ms after 150ms; supporting text/actions/trust/rail enter over 450ms with delays from 240–350ms. CTAs move their arrow by 4px over 180ms. Mobile shows the photograph immediately. Reduced motion disables entrance and hover movement.

These effects use transform and opacity and have no decorative loop. Keep the content and LCP image available immediately; do not add an image-loading gate or observer-based hero reveal. The live hero dot is static, and the timer remains quiet for assistive technology.

The closing fixture can reach 00:00 while its explicitly selected preview state remains “EN DIRECT.” This is a demonstration-state boundary, not a real server-authoritative closing process. Later state previews should include expiry/extension transitions; production status must follow authoritative data rather than a client-side assumption.

## Homepage section plan

Timings are proposed design values, not requirements from an accessibility standard.

| Section | Current behavior | Proposed motion and composition | Mobile / scrolling | Image direction |
| --- | --- | --- | --- | --- |
| Header | Stable sticky header, blurred background, pill navigation | Keep its dimensions stable. Short 150–180ms link/focus feedback. Avoid hiding or shrinking it while browsing. Align its visual language during the header design pass. | One sticky layer; deliberate compact navigation. | None |
| Hero and auction rail | Editorial entrance already implemented | Retain the opening. Show real numbers immediately; keep live status written in words. | Current art direction; fewer effects on mobile. | Same vessel/setting in landscape and portrait compositions |
| Closing next | Eight 288px cards in a native horizontal rail; hidden scrollbar; 4px card lift and heavy hover shadow | Photography-led row with thin framing. Heading and visible group reveal once: 360–440ms, 8–12px travel. Fine-pointer image scale about 1.015 over 220ms; calmer border/link feedback. | The existing partial next-card peek is useful. Retain native momentum, add restrained desktop previous/next controls and proximity snapping. No autoplay. | Clean exterior covers, room around bow/stern for responsive crops |
| Browse by type | Six equal illustrated cards, static section, shadow hover | Quieter category grid. One group entrance; at most 30–40ms stagger on desktop. Keep names readable throughout. | Reveal the group together rather than six delayed cards. | Six recognisable vessel types, consistent light and horizons |
| Viewing / trust block | Five rounded icon cards, no entrance | Pair genuine inspection/viewing photography with a typographic list. Reveal the photo/text group once over about 400ms and 10px. Static icons and claims. | Stack image and text; avoid staggered verification-like effects. | Owner-guided viewing or practical onboard inspection |
| Live activity | Continuous ping; each mounted row slides 16px over 300ms | Static live dot; reserve a compact feed area. New rows use a 160–200ms fade; changed amounts get a brief local background highlight. Preserve the reader’s scroll and focus during bursts. | Reformat title/price/time to solve the confirmed overflow. | Photography optional; information takes priority |
| Recent results | Mostly static rows inside a rounded panel | Calm results list with thin separators and optional small thumbnails. A single group entrance is enough; no animated price count-up. | Legible name and price; no sideways document movement. | Reuse the actual sold-vessel cover if thumbnails are added |
| Seller editorial hook — proposed, currently missing | PDF calls for a compact cost-of-waiting hook; the homepage does not yet have it | Short owner-focused block linking to the seller journey, with a simple estimate or three inputs. Do not reproduce the full calculator dashboard. One 400ms group entrance. | Immediate response to inputs; one clear CTA. Its final page position needs the composition pass. | Owner beside/on a vessel with space for copy |
| Footer | Static multi-column ending | Keep it calm. Only 120–180ms link/focus feedback. | Clear stacking and generous touch targets. | None |

## Other journeys

| Area | Proposed behavior |
| --- | --- |
| Catalogue filters and tabs | Keep controls, focus and scroll position stable. Optional 120–160ms result-content fade after an explicit user change, with an accessible result-count update. Do not wait for animation before showing results. Do not reorder visible live lots automatically on every bid. |
| Lot gallery | Fixed image dimensions; 160–220ms crossfade on an intentional image change. Add keyboard arrows and appropriate native swipe behavior. Keep thumbnail selection immediate. Do not fade through blank space or shift the bidding panel. |
| Lot description, specifications, viewing and location tabs | Correct tab semantics and stable controls. Optional 120–160ms content transition only on selection. Keep essential auction data independent of these transitions. |
| Bid panel, extensions and outbid notices | Update amounts immediately. A single 450–600ms background highlight may acknowledge an actual changed bid. Avoid rolling digits, animated counting or a flash every timer tick. State notices must remain readable in text. |
| Seller opening and estimator | Use the same editorial visual direction as the homepage. One opening entrance; permanent numeric nodes. Bar feedback about 150–200ms through transform, or immediate while dragging. Current width transition is 500ms and can lag repeated input changes. |
| Seller four steps | One section/group reveal. Static step numbers; avoid an animated progress sequence that suggests completed verification or payment. |
| Seller comparison table | Stable table, clear row hierarchy and responsive overflow confined to the table when needed. No animated reordering or per-cell entrance. |
| FAQs and explanation disclosures | Accessible expanded state; optional 180–220ms expansion and restrained chevron rotation. If reliable height animation cannot be achieved without layout jumps, use immediate expansion. Preserve focus. |
| How it works / cost and proxy-bid examples | One entrance per explanatory group. Calculated values update immediately; no monetary count-up. Let the user control examples without turning them into continuously animated scenes. |
| My bids and watchlist | Prioritise stable rows and explicit status text. A single local highlight for an actual status change. Keep watched lots navigable by keyboard. No repeated entrance on each clock tick. |
| Dialogs, menus and toasts | Fix interaction semantics first. Enter 180–220ms with 4–8px travel, exit about 120ms. Keep toast layout stable, announcements restrained and controls clear of mobile bottom bars. |

## Common motion rules for the next implementation

1. Native page scrolling and horizontal touch scrolling. No scroll hijacking, smooth-scroll library, large parallax or continuous decorative animation.
2. Use CSS transform/opacity for the usual transitions. A lightweight shared IntersectionObserver can trigger lower-section entrances once and then stop observing them. An additional animation library is not needed for this plan.
3. Keep server-rendered content visible and usable if JavaScript fails. Prepare offscreen entrances only after enhancement is available. Never delay the hero image or CTA for motion; reveal immediately if keyboard focus enters a prepared group.
4. Common timing families: interaction 150–180ms, panel/gallery 180–220ms, section entrance 360–440ms. Travel 8–12px desktop, 4–8px mobile. Restrict desktop stagger to a few visible elements, with no long cumulative waits.
5. Motion follows events: initial visit, first section entry, an intentional selection or a real data change. Ordinary clock ticks should only change timer text.
6. Hover image effects apply only when hover and fine-pointer capabilities exist. Keyboard focus has a separate visible style; touch interaction does not depend on hover.
7. Isolate ticking countdowns and relevant live-data subscriptions. The current prototype updates root state/context each second (`platform.jsx:1180`), re-running much of the reference interface. Measure before declaring a frame-rate improvement.
8. Expand reduced-motion coverage before adding new transitions. Numeric values, filters and navigation must remain fully functional with all decorative motion removed.

## Implementation order and review gates

1. Interaction foundation: mobile overflow, shared shell/dialog, anchor offsets, calculator update stability, keyboard actions, reduced motion and route focus/restoration.
2. Homepage composition and common motion: apply the editorial language below the hero, improve the lot rail, then add one-time entrances and restrained feedback. Keep the current hero design baseline as the reference.
3. Seller and lot journeys: stable estimator, purposeful gallery, disclosures and auction-update feedback.
4. Imagery: select/commission images against the approved section crops, replace placeholders and refresh screenshot baselines.

Before calling the motion pass complete, check normal and reduced motion at 390, 768, 1280 and 1920px; keyboard-only navigation and modal focus; catalogue → lot → Back/Forward continuity; estimator dragging; active live-row updates; sticky offsets; horizontal document width; and touch scrolling. Record desktop/mobile motion clips or equivalent timed inspection as well as screenshots. Performance testing should include active interactions and CPU throttling; existing Lighthouse TBT is not an INP or scroll-frame-rate measurement.

The existing whole-page mobile lab report remains 93 performance, 96 accessibility, LCP 3.1s, TBT about 58ms and CLS 0. It is the previous hero report, not a new performance certification of the proposed motion.

## Image handoff

The current checklist's 14-file homepage collection assumes four initial featured covers: two hero renditions, four lot covers, six category photos, one owner/boat photo and one viewing/inspection photo. Retaining eight distinct lot covers makes that 18 files before reuse. Lot galleries are separate, about 8–12 genuine photographs per demonstration boat.

Do not commission photos for every rounded prototype card. Finalise the section compositions first. Hero photos need text space; covers need crop margins; category images need clear silhouettes; owner/inspection images need real human context. See IMAGE_CHECKLIST.md for dimensions and licensing notes.

## Primary implementation references

- [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — focus containment, initial/return focus, inert background and dialog naming.
- [MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — user preference detection.
- [MDN Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — asynchronous visibility observation for section entrances.
- [web.dev animation performance guide](https://web.dev/articles/animations-guide) — prefer transform/opacity and investigate layout/paint costs.
