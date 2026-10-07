# Frontend first; providers deferred

2026-10-05. User direction: build an excellent, reviewable maquette first. Final images will be supplied after the base is built. Supabase and Stripe will be linked later.

This overrides the original PDF's immediate full-backend build sequence and default payment provider. This task creates a runnable Next.js frontend with shared packages, demo fixtures, integration contracts, design tokens and the hero. It does not implement a production API, database, authentication, money movements or escrow.

Future data access uses packages/sdk and packages/contracts rather than calls inside UI components. A Supabase integration may provide account/catalogue storage; authoritative auction rules still require server enforcement. A Stripe integration must be designed and verified separately for seller onboarding, marketplace payments, webhooks and payouts. This maquette makes no claim that those services already work.

The reference prototype remains available for catalogue and seller journeys, with explicit demonstration labels. The original files are preserved. This is a frontend foundation and D1 hero pass, not completion of all M0 backend infrastructure or M1 business rules.
