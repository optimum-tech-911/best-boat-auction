# Supplied example imagery

2026-10-05. The user authorized using the new editorial images and the 20 auction boat examples, matching them appropriately and retaining existing photographs where they remain suitable.

Import all 20 auction images as ten visual-family pairs. Nine pairs are provisionally associated with existing demonstration listings by type. The closed-cabin classic pair has its own generic “Vedette classique” example listing, with its manufacturer/model unspecified and its new SDK fixture values visibly identified as fictional. These associations do not verify the actual model or vessel identity. `docs/design/IMAGE_USAGE.md` records the source filenames, target listings and limitations. Keep explicit illustration/demo identification.

Media selection uses the listing's brand/model key and explicit view index, not a palette/variant offset. The cover, thumbnail, main gallery, account and bid review therefore use the same ordered sources. An unassigned listing receives one appropriate category illustration instead of a gallery of different boats. Monohull and catamaran images remain distinct.

The nine editorial images serve categories, inspection, seller invitation, seller introduction and the explanatory journey. Preserve the locked hero photograph and composition: its existing high-resolution desktop and portrait art direction remain suitable. No screenshot baselines are changed for this pass.

Keep user originals intact and create named WebP derivatives without changing their image content. Record source hashes and dimensions, use Next's responsive optimization, lazy-load lower content and provide French/English descriptions. Final actual-vessel photography, verified model identification and production integrations remain deferred. Existing business rules and auction amounts are preserved. The additional generic listing has its own strictly typed demonstration fixture in the SDK.

Run lint, typecheck, build, image/interaction checks and locked hero comparisons. Record the completed checks in `docs/design/IMAGE_QA.md`.
