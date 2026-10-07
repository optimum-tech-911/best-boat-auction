# Best Boat Auction — frontend verification

2026-10-05. Reviewed against the user's brand/language request and screenshot, the supplied logo/favicon assets, and decisions 0003–0006. `claude new design file` was still empty (zero bytes); its proposed design prompt could not be reviewed.

## Required checks

| Check | Result |
| --- | --- |
| `pnpm lint` | Passed, no ESLint warnings |
| `pnpm typecheck` | Passed |
| `pnpm build` | Passed, Next production build |
| `pnpm test` | 29 passed: 7 brand/language/assets/journey checks, 12 hero checks, 10 motion/interaction checks |
| `pnpm test:visual` | 32 passed against the existing hero baselines; no baselines updated |

Chrome browser checks ran against the local preview. Public French/English routes, default French redirect, disabled Dutch/German routes, locale-preserving query/hash navigation, supplied favicons/touch icons/manifest, branded sharing image and actual lot share URLs were verified. The French form check covers minimum-offer validation, simulated sign-in, translated review rows, confirmation gating and opening the photo gallery with the keyboard; it does not place an actual bid.

The public French homepage stays inside the viewport at 320, 390, 768, 1280 and 1920 px. Automated WCAG A/AA axe checks found no violations on the public homepage after correcting card text and category-number contrast. This is an automated homepage result, not certification of every retained prototype screen.

Motion checks cover one-time reveals, late-mounted seller sections, replay without resetting the auction clock, changing the reduced-motion preference, slider totals without remounting, native lot-rail movement, skip-link behavior and dialog focus/scroll restoration. Public toolbar removal and its explicit `?preview=1` availability are both checked.

## Visual and motion review artifacts

Inspected the French desktop and mobile introduction/full-page screenshots and French sharing image. The header/footer use supplied artwork, public pages show only FR/EN, mobile navigation uses flat tabs, the screenshot's debug toolbar is absent, and the hero composition remains unchanged.

- `output/brand-review/introduction-fr-1280.png`
- `output/brand-review/introduction-fr-390.png`
- `output/brand-review/homepage-fr-1280.png`
- `output/brand-review/homepage-fr-390.png`
- `output/brand-review/social-fr.png`
- `output/qa/best-boat-auction-motion-desktop.webm` (English, 1280 × 800)
- `output/qa/best-boat-auction-motion-mobile.webm` (French, 390 × 844)
- `output/qa/best-boat-auction-desktop-full.png`
- `output/qa/best-boat-auction-mobile-full.png`

The normal-motion recordings use native wheel scrolling. `output/qa/motion-preview-observations.json` reports no JavaScript errors or horizontal overflow for either recording; all five homepage reveal groups ended visible at opacity 1. Regenerate with `pnpm --filter @tidebid/web exec node scripts/record-motion-preview.mjs` while the local preview is running.

## Limits

Photography remains temporary, illustrative and sometimes reused between demo lots; credits are in `assets/CREDITS.md`. Actual vessel photography, the deployment origin, native French/English review and production integrations are deferred. The preview remains non-indexable. Browser assets and social images have been verified locally; publishing and external social-platform caches are outside this pass.

Internal package names and preserved root prototypes retain their historical Tidebid names. No real auction, authentication, payment, database, Supabase or Stripe service was introduced.
