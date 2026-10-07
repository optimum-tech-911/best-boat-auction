# Best Boat Auction — frontend maquette

An online boat auction house: monthly sales with about 30 days of bidding, a viewing for every boat, free listing with optional packs, a 10 % buyer's commission and escrow payment until handover. French by default, English as the second language.

Everything runs on a deterministic demonstration backend. No real sale, payment, authentication or e-mail takes place, and every page says so.

## Run locally

Node.js 22.13 or newer and pnpm (version pinned in `package.json`; install it once with `npm install --global pnpm@11.25.0`).

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000/fr (or `/en`). Use `pnpm`, not `npm install`, for this workspace.

## Deploy to Cloudflare

Use a **Workers** project with OpenNext, rather than the Vite/React Pages preset. The site has dynamic Next.js pages and a demo API; its build does not produce `dist`. Run `pnpm build:cloudflare`, then `pnpm preview:cloudflare` locally or `pnpm deploy:cloudflare` from an authenticated terminal. All original public images are preserved in the Worker asset bundle. See [the exact dashboard settings and commands](docs/CLOUDFLARE_DEPLOYMENT.md).

## Checks

```sh
pnpm lint          # ESLint, then the design-token check
pnpm typecheck     # every package
pnpm test          # unit tests: domain rules, formatters, demo backend
pnpm build         # production build
pnpm start         # serve the build on port 3000
pnpm test:e2e      # Playwright: routes, filters, bidding, seller funnel, forms, accessibility, motion
pnpm test:visual   # hero screenshot baselines (update with pnpm test:visual:update after review)
```

Playwright uses the installed Google Chrome; set `PLAYWRIGHT_CHANNEL=chromium` for Playwright's own browser (CI).

## Demonstration controls

Add `?preview=1` to any page to show the preview bar: it moves the demonstration clock to **Vente ouverte** (live sale), **Clôture en direct** (three minutes before the first lot closes) or **Vente terminée** (results), and back to the real time. Bids, the signed-in demonstration account and the watchlist stay in this browser; **Réinitialiser la démonstration** clears them.

## Pages

| Page | French | English |
| --- | --- | --- |
| Home | `/fr` | `/en` |
| Current sale, results | `/fr/ventes`, `/fr/resultats` | `/en/auctions`, `/en/results` |
| Lot | `/fr/ventes/7701-solenne-38` | `/en/auctions/7701-solenne-38` |
| Calendar | `/fr/calendrier` | `/en/calendar` |
| How it works | `/fr/comment-ca-marche` | `/en/how-it-works` |
| Sell my boat | `/fr/vendre-mon-bateau` | `/en/sell-my-boat` |
| Brokers, services | `/fr/courtiers`, `/fr/services` | `/en/brokers`, `/en/services` |
| My bids, settings | `/fr/mon-compte`, `/fr/mon-compte/parametres` | `/en/account`, `/en/account/settings` |
| Legal pages | `/fr/mentions-legales`, `/fr/conditions-generales`, `/fr/confidentialite`, `/fr/cookies` | `/en/legal-notice`, `/en/terms`, `/en/privacy`, `/en/cookies` |
| Component gallery | `/fr/dev/ui` | `/en/dev/ui` |

## Architecture

```
apps/web            Next.js 16 app: routes (app/[locale]), features, layout components
packages/domain     Business rules and their tests: bidding engine, fees, calendar, estimator, offers
packages/contracts  Backend ports (catalogue, live, bidding, account, seller, engagement, brokers)
packages/sdk        Demonstration backend implementing the ports, with the demo boats and sales
packages/i18n       French and English messages, localized routes, formatters, brand name
packages/ui         Design tokens, Tailwind preset, components, motion, SVG diagrams
packages/config     Shared TypeScript settings
```

- Pages read data through `getRequestContext()` (`apps/web/src/lib/backend.ts`). Connecting Supabase means implementing the `Backend` interface of `packages/contracts` and returning it there; browser-side live updates go through `LiveAuctionProvider`.
- Fees, totals, increments, closing times and the holding-cost estimate all come from `packages/domain`. The house's settings are versioned objects: `defaultAuctionRules`, `defaultSaleCalendarRules`, `defaultSellerOffer`, `defaultHoldingCostParameters`.
- Text lives in `packages/i18n/src/messages` (French is the reference shape). The trading name is one constant, `packages/i18n/src/brand.ts`.
- Colours, sizes, type and motion come from `packages/ui/src/tokens`; `pnpm check:design` rejects anything else.

## Photography

Lot photographs come from the `bestboatauction boats` folder; regenerate the web versions with `pnpm import:lot-photos`. They are third-party photographs without a reuse licence: fine for this private maquette, not for publication (see `assets/CREDITS.md`). Lots without photos show "Photo à venir".

## Decisions and open questions

- `docs/decisions/0009-design-system-and-client-model.md`: the current architecture and the business rules taken from the client's presentation.
- `docs/design/DESIGN_SYSTEM.md`, `docs/design/DESIGN_V1_1.md`: the design references.
- `docs/design/COMPETITIVE_REVIEW.md`: what the reference sites do and what the maquette takes from them.
- `docs/QUESTIONS.md`: decisions pending with the client.
- `docs/SPEC.md`: the original platform specification.
