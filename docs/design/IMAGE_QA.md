# Supplied imagery — verification

2026-10-05. The user-supplied library includes 20 boat examples and 9 editorial visuals. See `IMAGE_USAGE.md` for the exact source-to-listing/section correspondence and identity limitations.

## Completed checks

| Check | Result |
| --- | --- |
| `pnpm lint` | Passed, no ESLint warnings |
| `pnpm typecheck` | Passed |
| `pnpm build` | Passed |
| `pnpm test` | 31 passed: brand, hero, supplied-media and motion/interaction checks |
| `pnpm test:visual` | 32 passed against the locked hero references; no baselines updated |
| Original/derivative verification | All 29 source SHA-256 hashes unchanged; all derivatives preserve source dimensions |

The assigned-media browser check visits all ten example listings through their catalogue cards. It verifies that each cover, first thumbnail and main image select view 1, that next-image movement selects view 2, and that the enlarged dialog retains that same second view with `object-fit: contain`. These are wiring/rendering checks, not verification of a photograph's manufacturer identity.

The generic “Vedette classique” listing uses the closed-cabin wooden boat pair rather than attributing it to the open-cabin Rapsody. Its fictional data notice is visible, and its manufacturer/model specification rows show “Non précisé”. Its new strictly typed fixture is separate in the SDK; existing auction rules, original fixture prices and root prototypes are preserved.

The editorial-image checks verify all six category pictures, the boat viewing and key handover sections, the seller introduction and the marina image in the explanatory journey at 390 and 1280 px. New images load lazily; monohull fallback images remain distinct from catamarans. Existing homepage checks cover containment at 320, 390, 768, 1280 and 1920 px and report no automated WCAG A/AA axe violations. Motion checks cover normal/reduced motion, one-time reveals, replay, dialogs and seller controls.

## Visual review

Inspected the category grids at desktop/mobile sizes, the inspection and handover sections, the seller image and representative monohull/RIB/catamaran/classic galleries. The initial landscape-to-portrait image selection looked soft; responsive `sizes` were adjusted to request enough pixels for those crops. Section review captures hide sticky navigation temporarily to avoid screenshot occlusion; the site's actual navigation remains present.

Review files are under `output/image-review/`:

- `boats-contact-sheet.jpg`, `editorial-contact-sheet.jpg` — all supplied originals, numbered for matching.
- `categories-1280.png`, `categories-390.png`.
- `boat-viewing-1280.png`, `boat-viewing-390.png`.
- `boat-handover-1280.png`, `boat-handover-390.png`.
- `seller-owner-1280.png`, `seller-owner-390.png`.
- `gallery-compact-sailboat.png`, `gallery-rib-beige-cockpit.png`, `gallery-cruising-catamaran.png`, `gallery-classic-motorboat.png`.

Current full homepage review screenshots are regenerated in `output/brand-review/homepage-fr-1280.png` and `homepage-fr-390.png` by the browser suite.

## Media and scope

Web derivatives total approximately 7.9 MB versus 68.6 MB of source PNGs. Next's responsive optimization handles delivery sizes; this total is the stored image library, not the initial page transfer. The import manifest records each source, public path, dimensions, byte sizes and original hash. Originals remain in the user folders.

The current high-resolution hero and dedicated mobile crop remain appropriate and are retained. The credited powerboat photograph remains a single generic motorboat illustration. All supplied examples remain clearly illustrative: exact manufacturer/model identities were not provided, and real lot photography remains a later task. No production auction, payment or authentication integration was introduced.
