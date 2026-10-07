# Best Boat Auction

Read README.md and the current decision records (latest: docs/decisions/0009-design-system-and-client-model.md) before changing code. The user's frontend-first direction overrides the original PDF build sequence and providers.

- Design references: docs/design/DESIGN_SYSTEM.md and docs/design/DESIGN_V1_1.md; HERO_BRIEF.md and 0003-visual-direction.md for the hero. Public preview controls belong behind `?preview=1`. Final imagery and production integrations remain deferred.
- The client's presentation (root PDF `BOOST_BOAT_AUCTIONS_Presentation_EMAIL .pdf`) sets the business model: 10 % buyer's commission, free listing with packs, about 30 days of bidding, a viewing per boat, broker shares. It wins over the specification's example rules. Open points are in docs/QUESTIONS.md.
- Use pnpm. Run pnpm lint (includes the design-token check), pnpm typecheck, pnpm test and pnpm build after implementation; run pnpm test:e2e for behaviour and pnpm test:visual for hero changes.
- New code is strict TypeScript. Business rules live in packages/domain (with tests); backend ports in packages/contracts; the demo backend in packages/sdk; messages, routes and formatters in packages/i18n; tokens, components and diagrams in packages/ui. Pages get data only through getRequestContext() in apps/web/src/lib/backend.ts.
- Use design tokens only; no raw colours or arbitrary Tailwind values outside packages/ui/src/tokens.
- French is the default; English is the only secondary public language. Native language review is pending. The trading name is the constant in packages/i18n/src/brand.ts.
- No real payment or authentication integration in this phase. Supabase and Stripe are deferred until the user supplies the integration task. Never expose server credentials in client code.
- Preserve the original root prototypes and PDFs.
- All auction data in this phase is demonstrative and must be visibly identified as such. Keep fixture values out of presentational components.
- Respect reduced motion and visible keyboard focus. Changes to the locked hero require reviewed screenshot baselines.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
