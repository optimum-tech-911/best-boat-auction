# Cloudflare deployment verification

2026-10-07. The Vite/React Pages preset expected `dist` after a successful Next.js build. This pass adds a separately built OpenNext Worker, keeping the existing Next.js application and ordinary development commands.

## Build and runtime

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Lockfile unchanged and dependencies up to date |
| `pnpm lint` | Passed, including authored design-token checks |
| `pnpm typecheck` | Passed |
| `pnpm test` | 119 passed: 74 domain, 29 SDK, 16 i18n |
| `pnpm build` | Passed |
| `pnpm build:cloudflare` | Passed |
| Wrangler deploy dry-run | Passed; 191 assets, Worker gzip 2,398.04 KiB |
| `/fr`, `/en`, manifest and both sharing-image routes in local Worker runtime | HTTP 200 |
| Desktop 1280 × 900 and mobile 390 × 844 Chrome homepage checks | No page errors or horizontal overflow; screenshots reviewed |
| Original public files delivered over Worker HTTP | All 71 returned HTTP 200 with matching SHA-256 hashes |
| `/_next/image` for the homepage hero without an Images binding | HTTP 200, original source bytes preserved |

The Worker sharing-image route originally failed because its logo was read from a local filesystem path. It now reads the same logo through `ASSETS`; standard Next.js keeps its filesystem fallback. Both runtimes return the same composition, source logo and localized tagline. Renderer output is not expected to be byte-identical across runtimes.

## Browser suite and existing limitations

The existing 46-test browser suite ran against the local Worker: **43 passed, 3 failed**. A second run of the affected tests against standard Next.js reproduced the same three failures:

- The homepage lot-sheet explorer applies `lg:opacity-60` to unselected information, reducing contrast for some labels and its countdown. Axe reports a serious color-contrast violation.
- Two seller tests still look for buttons opening the former lead dialog. The current website instead uses links to the seller listing page for the sale and pack actions. These tests time out on both runtimes.

These existing design/test issues were recorded without changing the site's copy, interaction design or auction information in this deployment pass. No browser-test exclusions or snapshot updates were added. The new `PLAYWRIGHT_BASE_URL` setting lets the existing suite target either runtime:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8788 pnpm test:e2e
```

## Preservation

Before implementation, SHA-256 hashes were recorded for 281 existing source, content, asset, prototype and PDF files. None were removed. The only changed file in that set is the sharing-image route described above. All 71 pre-existing public files are identical in the source tree, the Worker bundle and their HTTP responses. Auction fixtures, translations, boat-to-photo mappings, original photos, logos, favicons, prototypes and PDFs are unchanged.

Local verification artifacts are in ignored `output/cloudflare/`, including the preservation manifest, comparison report, HTTP/runtime report and desktop/mobile screenshots. The build creates `.open-next` and `.wrangler` directories; these are ignored and excluded from the authored-source token scan.

## Publication status

The Worker is prepared and verified locally, but has not been published. Wrangler is not authenticated to the user's Cloudflare account. The connected repository must receive the deployment changes and the Worker build settings in [the deployment guide](../CLOUDFLARE_DEPLOYMENT.md) must be applied before a live deployment. No account resources, domain settings, credentials, paid image services, authentication or payment integrations were changed.

## Local development recovery after dependency installation

The user's follow-up showed a Turbopack `module factory is not available` error on a boat page. The development server had started at 10:13, before the deployment dependencies were installed. Its browser error referenced the older pnpm Next.js package path (peer `supports-color@7.2.0`); the current installation resolves a different path (peer `supports-color@10.2.2`). The Next.js version itself remained 16.3.8. The running development process had retained stale module references after installation.

With the user's explicit approval, the identified local server was stopped, its generated `.next/dev` directory was moved to ignored `output/local-recovery/` for diagnosis, and `pnpm dev` was restarted on port 3000. No application source, public asset, translation, fixture or browser storage was changed in this recovery. Future dependency changes require stopping and restarting the development server.

Chrome checks then passed on the restarted development server, standard Next.js production server and local Cloudflare Worker: homepage, catalogue, all 12 current boat-detail pages, the English Solenne page, and catalogue-to-boat navigation. Each runtime returned HTTP 200 for all 16 page checks, with no error boundary or page errors. Development and Worker lot screenshots were reviewed. The 281-file preservation comparison remains unchanged from the deployment pass: only the previously adapted sharing-image route differs from the original manifest.

The runtime reports and screenshots are in `output/local-recovery/`. These checks verify local development and both local production runtimes; they do not establish the state of a live Cloudflare hostname.
