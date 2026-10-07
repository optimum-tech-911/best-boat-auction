# Dependencies

Direct dependencies only; versions are pinned in each `package.json` and `pnpm-lock.yaml`.

## Runtime (apps/web)

| Package | Why |
| --- | --- |
| next, react, react-dom | Application framework (App Router, server components). |
| lucide-react | Icons used by the design system. |
| server-only | Keeps server modules (request context, demo cookies) out of client bundles. |

## Runtime (packages)

| Package | Used by | Why |
| --- | --- | --- |
| country-flag-icons | ui | Bidders' country flags in bid histories (SVG, no network). |
| lucide-react | ui | Icons inside shared components. |

`@bba/domain`, `@bba/contracts`, `@bba/sdk`, `@bba/i18n` and `@bba/ui` are workspace packages.

## Development

| Package | Why |
| --- | --- |
| typescript, turbo | Type checking and the monorepo task runner. |
| tailwindcss, postcss, autoprefixer | Styles from the design-system preset. |
| eslint, eslint-config-next | Linting, including React Compiler rules. |
| @playwright/test, @axe-core/playwright | Browser tests and accessibility checks. |
| @fontsource/instrument-serif, @fontsource/inter | Self-hosted font files (loaded through next/font/local). |
| vitest | Unit tests of domain, i18n and sdk. |
| fast-check | Property-based tests of the bidding engine's invariants. |
| @types/node, @types/react, @types/react-dom | Type definitions. |

Removed in this pass: `lighthouse` (unused).
