# Design system rebuild and the client's business model

2026-10-06. Supersedes the open points of 0008 that depended on the then-missing `DESIGN_SYSTEM.md`.

## Context

The user supplied `DESIGN_SYSTEM.md` (now `docs/design/DESIGN_SYSTEM.md`), asked for a clean frontend with a backend prepared for Supabase and Stripe, French and English only, the current logo, and local work without git. The client then supplied a presentation (`BOOST_BOAT_AUCTIONS_Presentation_EMAIL .pdf`, root) and four reference sites. The presentation describes the client's business model; where it conflicts with the design system's or the specification's example rules, the presentation wins.

## Architecture

- `packages/domain`: pure business rules with unit tests. Bidding engine (`applyBid`, soft close), increments, buyer total, closing outcomes, lot lifecycle, sale calendar, holding-cost estimator, seller offer (packs and services) and broker shares. Every rule is a versioned settings object (`defaultAuctionRules`, `defaultSaleCalendarRules`, `defaultSellerOffer`, `defaultHoldingCostParameters`).
- `packages/contracts`: the backend ports the frontend depends on: catalogue, live, bidding, account, seller, engagement and broker services, aggregated as `Backend`.
- `packages/sdk`: a deterministic demonstration backend implementing those ports. Server and browser build the same state for the same instant, so pages hydrate without mismatches. Viewer commands persist in `localStorage`; the demo clock and viewer live in demo cookies.
- `packages/i18n`: typed French and English messages (French is the shape), localized routes (French slugs rewritten to English route folders), formatters, and the brand name in one constant (`brand.ts`).
- `packages/ui`: tokens (single source for Tailwind and CSS variables), components, motion and SVG diagrams. `scripts/check-design-tokens.mts` runs with `pnpm lint` and rejects raw colours, arbitrary values and non-token classes.
- `apps/web`: Next.js routes and features. `src/lib/backend.ts` (`getRequestContext`) is the single seam where a Supabase-backed implementation of `Backend` replaces the demo.

The prototype UI (`features/reference`, legacy home and hero files, `packages/*/src/legacy`) was removed after the rebuild; a backup of the removed files was kept outside the repository. The root prototypes and PDFs are untouched.

## Business rules taken from the client's presentation

| Topic | Before | Now |
| --- | --- | --- |
| Buyer's commission | 18 / 12 / 8 % by start price | 10 % of the hammer price for every lot, plus 20 % VAT on the commission (to confirm) |
| Seller cost | Flat 100–500 € by length | Listing free; optional packs Boost 390 € and Premium 690 € incl. VAT; optional services (survey and transport on quotation, virtual tour from 290 €, cleaning from 190 €, drone from 250 €) |
| Bidding period | 14 days | About 30 days: opens 28 days before the monthly closing, as the previous sale closes |
| Submission deadline | 21 days before closing | 35 days before closing, a week before bidding opens, for validation and photography |
| Viewing | One Saturday viewing day per sale | One viewing per boat, fixed with the seller or the seller's broker during the bidding period |
| Brokers | Not covered | Corrected slide (2026-10-07): a broker who brings the boat keeps the commission of their own sales mandate; one who brings the buyer receives 50 % of the house's buyer's commission; bringing both earns both. Broker space: boats, bidding and sales in real time |
| Services | Not covered | Financing, insurance and services (survey, maintenance, preparation, transport, concierge) on request |
| Seller steps | Four steps | The presentation's five steps |

The specification's tiered premium vectors (16 and 17) stay verified in `packages/domain/tests/fees.test.ts` with a dedicated rules fixture: the engine supports both models.

The "before the sale" preview scenario was removed: with a ~30-day bidding period each sale opens as the previous one closes. Components still handle the `upcoming` phase.

## Ideas taken from the reference sites

See `docs/design/COMPETITIVE_REVIEW.md`. Applied: public questions and answers on each lot, follower counts, reserve status, per-boat viewings, a services block on each lot, the broker programme and space preview, packs and services, a time-to-sell comparison, a worked example of the commission, and a results summary (boats sold and amount). Not applied: unverifiable claims (success rates, bailiff supervision, statistics), membership fees to bid.

## Brand

The site keeps the supplied Best Boat Auction logo, as the user asked. The client's presentation uses the name Boost Boat Auctions with a different logo. The name is a single constant (`packages/i18n/src/brand.ts`); the logo artwork lives in `apps/web/public/brand`. The decision is open (see `docs/QUESTIONS.md`).

## Deviations from DESIGN_SYSTEM.md

- The full desktop header starts at 1280 px: the French navigation does not fit at 1024 px.
- The hero text column is 720 px wide instead of about 680 px, to keep the two-line heading.
- The sell page keeps the result headline and SC-05 sticky; the waiting panel, selling costs and next sale follow the inputs in the main column, so the sticky panel fits the viewport.
- The catalogue has no make filter: the demo data has no make field.
- September results are invented demonstration data, visibly identified as such.
- No mobile sell bar on the sell page.
- Account settings, brokers and services pages are additions beyond the blueprints.
