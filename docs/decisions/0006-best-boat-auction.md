# Best Boat Auction identity and two-language frontend

2026-10-05. The user renamed the product **Best Boat Auction**, supplied logo variants and favicons, requested French as the main language with English as the secondary language, and asked for professional motion and interaction throughout the frontend. The screenshot singled out the demonstration/replay/state/language toolbar below the hero.

This extends decision 0003 to the shared header, footer and lower homepage, and supersedes decision 0005's public preview toolbar and four-language presentation. The locked hero's composition, typography and image handling remain unchanged.

## Identity and public controls

Original logo files under `logos` are preserved. Shared `BrandLogo` frames the supplied horizontal, monogram and stacked artwork without altering its pixels or proportions. The header uses the horizontal artwork, the dark footer uses a white rendering and prototype dialogs use the monogram. The supplied browser, Apple and Android icons are installed through Next's metadata conventions and an application manifest. Localized social images use the supplied horizontal artwork. The production origin is deferred and configurable through `NEXT_PUBLIC_SITE_URL`.

Only `/fr` and `/en` are public locale routes. The shared language links preserve auction query parameters and the current prototype hash route. Dutch/German hero drafts remain archived in the locale package. Presentation translations and formatting live in `packages/i18n`; prototype auction rules remain isolated in the reference JavaScript.

The public homepage has no demonstration toolbar. Hero preview/replay controls and reference simulation controls require `?preview=1`. Demonstration identification remains visible in the selection and footer; every sample lot photograph is labeled as illustrative. These photographs do not represent the named fixture boats.

## Editorial presentation and motion

The solid ivory header, flat photo-led lot rail, numbered category tiles, tall inspection photograph, navy seller invitation, ruled activity/results and navy footer apply the established maritime palette. Supplied illustrations are replaced in the active frontend with credited temporary maritime photographs. Root prototypes and the original PDF remain untouched.

Off-screen section groups reveal once, over 720 ms/24 px on desktop and 520 ms/14 px on mobile. Headings and images have restrained entry effects; category delays are capped at 150 ms. Fine-pointer imagery scales to 1.035 and arrows shift 4 px. Reference route entries last 420 ms, with short card staggering. Continuous decorative motion, scroll hijacking and parallax are excluded. Normal numeric updates retain their immediate behavior.

Progressive enhancement, reduced motion, visible keyboard focus, focus-triggered visibility and native modal behavior remain required. The photo gallery opens with a keyboard-operable button. New fixtures and display controls use the shared SDK/UI packages.

The file `claude new design file` exists but contained zero bytes when inspected. No instructions were inferred from that empty file; this pass follows the user's written request and the established visual records.

## Deferred scope and verification

Final lot photography, native language review, production domain and all real auction/authentication/payment integrations remain deferred. Supabase and Stripe are not implemented. Internal workspace package names remain `@tidebid/*` to preserve existing imports; the visible product identity is Best Boat Auction.

Run lint, typecheck, production build, hero/motion/brand browser checks and the locked hero screenshot comparisons. `docs/design/BRAND_QA.md` records the resulting verification and review artifacts.
