# Design v1.1 conformance and QA

The user-supplied brief is `DESIGN_V1_1.md`. Its base `DESIGN_SYSTEM.md` is missing. This checklist records implemented behavior and remaining dependencies; it does not declare the full thirteen-task roadmap complete.

| Item | Status | Evidence / remaining dependency |
| --- | --- | --- |
| G0-1 / G0-4 / G0-5 | Implemented | No pill utilities; panels 6 px, controls 4 px, dialogs 8 px, watch control 36 px square. Round dots, avatars and slider thumbs are allowed. |
| G0-2 / G0-11 | Implemented | Navy selections, stone labels, navy icons, chart tokens 1–7; bid buttons and links use deep teal. Contrast checked on seven routes in both locales. |
| G0-3 | Implemented | Static orange live dot beside EN DIRECT / LIVE. |
| G0-6 | Implemented | No marketing-photo overlay labels. Closing rail, market and lot gallery have section captions; the catalogue uses the shared demo bar and existing lot descriptions. |
| G0-7 | Implemented | No visible bailiff/notary assertions; demo payment flow identifies pending provider and unconnected payment. |
| G0-8 | Implemented with language exception | Four navigation entries; modal search; text sign-in; seller CTA; bell only after sign-in. FR/EN menu preserves the earlier user instruction. |
| G0-9 | Partial, truthful current fixtures | Hero and home use actual SDK fixtures, 15 live lots and two previous results. The exact 12-boat seed and September results require missing DESIGN_SYSTEM §14.3. |
| G0-10 / G0-12 | Implemented | Localized dates / amounts, French euro suffix, shared custom slider. |
| H1 | Implemented with asset dependency | Composition retained; M17 desktop only. Regenerated hero file has not been supplied. |
| H2 / H3 | Implemented | One-card arrows, mouse dragging, native snap, progress line; sticky four-step story with inspection photo, SC-02, SC-03 and explicitly illustrative handover code/QR. |
| H4 | Implemented with asset dependency | Image reveals and hover feedback; actual counts. Existing landscape sloep shown uncropped; regenerated photo absent. |
| H5 / H6 | Implemented | Debounced mini estimate; three seller-prefill values survive locale changes; inspection copy and navy icons, ruled dividers. |
| H7 | Partial, balanced current fixtures | Thumbnails, dates, outcomes and prices from available data; two live rows match two existing results. Six results and September sale await source data. FLIP insertion and an inert oldest-row exit fade are implemented. |
| H8 / H9 | Implemented provisionally | Three dated calendar entries and simulated newsletter. Existing footer retained because G2 blueprint is missing. |
| SELL-V2 | Implemented | SC-05, SC-06, waiting tabs, fee table and SC-01 mini; unchanged reference estimate totals. |
| HOW-V2 | Implemented for frontend demonstration | SC-01/02/03/04/07, interactive reference examples, FAQ and seller CTA. Pure production domain implementations / vector checks remain deferred. |
| D5–D11 | Deferred | Base page blueprints, domain work, portals/admin and integrations not present. Global visual corrections apply to existing catalogue, lot and account routes. |
| No-JS / reduced motion | Verified | SSR editorial headings and hero image visible without JS; all sections visible with reduced motion; focus and native dialogs preserved. |
| Performance | Partial | Production mobile lab: 90/100, LCP 3.6 s, CLS 0, TBT 50 ms. LCP remains above 2.5 s; field INP and production-service budgets are not verified. |

## Review artifacts

- `output/design-v1-1/before/`: homepage, seller, catalogue, lot and explanatory-page captures at 390, 1280 and 1920 px.
- `output/design-v1-1/after/`: final production captures with reduced motion. For complete full-page screenshot painting, the capture script exposes content-visibility sections and eagerly requests lazy images only in the QA page.
- `output/design-v1-1/motion/`: actual production normal-motion recordings at 1280 px for home, seller, explanatory journey and calendar, plus observations. All groups reached visible state; the final isolated recording run observed no page errors, horizontal overflow or scroll-period long tasks.
- `output/design-v1-1/hero-before/`: preserved earlier hero baselines. Updated baselines retain the composition; the brief changes fixture values, date formats and radii.
- `output/design-v1-1/lighthouse-mobile.json`: local production mobile Lighthouse. Synthetic figures are not field measurements of INP.

## Validation

2026-10-06, local macOS / installed Chrome:

- `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.
- `pnpm test`: 40 behavior checks pass. They cover navigation/search, French/English, prefilled estimator values, carousel arrows/dragging, live hero/catalogue amount agreement, diagram labels, fixture counts, keyboard focus, native dialogs, media assignment and reduced motion.
- `pnpm test:visual`: 32 reviewed hero comparisons pass at 390/768/1280/1920 px in both locales and all four sale states. Changing countdowns and bid numerals are masked; their behavior is checked separately. Earlier baselines are preserved.
- Additional production keyboard check passes: Enter moves the carousel, focus stays visible, and selecting the fourth story link fills the shared observer fallback to 100% with CSS scroll animation disabled.
- Seven brand checks pass again after lossless logo optimization, including the three WebP resources and favicon/sharing assets. Visible logo pixels and alpha match their supplied PNG counterparts; originals remain.
- `pnpm --filter @tidebid/web check:design` passes. It scans active web/UI sources for prohibited radius utilities and literal radii and verifies the chart palette. Browser checks additionally inspect rendered radii and run axe on home, sell, how, calendar, catalogue, lot and account in French and English: zero reported WCAG A/AA violations.
- Review captures include before/after home, seller, catalogue, lot and explanatory pages at 390, 1280 and 1920 px. Normal-motion recordings cover home, seller, explanatory journey and calendar. All observed reveal groups finish visible; the final isolated run observed no page errors, horizontal overflow or scroll-period long tasks. A prior concurrent screenshot/video pass produced one 74 ms homepage task, prompting the isolated repeat.

The final production mobile Lighthouse run uses the default simulated mobile profile at `127.0.0.1:3001/fr`: performance 90/100, FCP 1.5 s, LCP 3.6 s, TBT 50 ms and CLS 0. Transferred JavaScript is 206,263 bytes including response headers. These figures do not establish field INP, a 75th-percentile LCP or the original lot-page JavaScript budget. The LCP target remains unmet; final asset delivery, reference-UI splitting and production hosting still require performance work. The temporary measurement server is stopped after review.
