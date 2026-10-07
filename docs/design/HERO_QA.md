# Homepage hero — implementation review

2026-10-05. First reviewable design pass, with temporary licensed photography and demonstration auction data. These baselines record this implementation; final photography and the user's visual review will determine the final design lock.

## Checks

- Production build, ESLint and strict TypeScript checks pass.
- 20 browser behavior checks cover all four states in fr/en/nl/de, hero and preview-control accessibility, timer updates, reduced motion, keyboard focus, catalogue/seller navigation and the tablet rail.
- 32 visual baselines cover fr/en, open/closing/upcoming/closed, and widths 390/768/1280/1920. The changing countdown is masked; the rest of the hero is compared. These are macOS/Chrome baselines, with an independent regression run.
- axe reports no WCAG A/AA violations in the new hero and preview controls. The original sections below the hero have contrast issues that belong to their later redesign.
- Desktop/tablet and mobile each request only their selected hero rendition. The image uses explicit dimensions, responsive sources, a media-matched preload, eager loading and high fetch priority.

## Mobile Lighthouse

Production server at 127.0.0.1:3000, French closing state, Lighthouse 13.5.0, default simulated mobile throttling. A local lab measurement is not a field percentile or a hosting benchmark.

| Metric | Final measurement |
| --- | --- |
| Performance | 93/100 |
| Accessibility, whole reference page | 96/100 |
| First contentful paint | 1.5 s |
| Largest contentful paint | 3.1 s |
| Total blocking time | 58 ms |
| Cumulative layout shift | 0 |
| Transferred JavaScript | 175 KB |

Reports: `output/qa/home-lighthouse-final.report.html` and `.json` (generated artifacts). The 2.5 s LCP target is still unmet in this whole-page simulation. The page includes the retained prototype application; reassess with final photography, later section implementations and production hosting before launch. The 200 ms interaction target requires field INP measurement; lab total blocking time is not a substitute.

The performance refinements preserve the desktop entrance animation, show the mobile photo immediately, preload only the matching image, avoid preloading all Inter weights, and load the seller estimator when its route opens. The two temporary JPEG sources are delivered as optimized AVIF/WebP renditions at quality 75.

## Pending review

- Final desktop/mobile photographs and their crop approval.
- Native review of English, Dutch and German hero translations.
- Launch wording and the legal operating model, as recorded in QUESTIONS.md.
- Design and accessibility work on the remaining reference sections.
- Supabase, Stripe and authoritative auction services in a separate integration phase.
