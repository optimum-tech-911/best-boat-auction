# Supplied image assignments

2026-10-05. The user supplied 20 auction example images in `the boats examplers/` and 9 editorial images in `images/`.

The repeated source suffixes 1–10 and visual families suggest ten pairs of complementary exterior views. Nine pairs are assigned by boat type and silhouette to existing demonstration listings. The closed-cabin classic pair has a separate generic demonstration listing. The files do not identify their actual manufacturer/model; these assignments are provisional visual matches, not verified vessel identities. The user was asked for any exact model-to-file correspondence. Existing demo notices and illustrative-photo captions remain visible.

## Auction examples

Each assigned pair has a fixed first-image cover across homepage, catalogue, account and bid review. Its two images appear in the lot gallery, thumbnails and enlarged view in the same order. The old palette-based random photo selection is removed. Covers and main galleries use the original 4:3 ratio; enlarged images use `contain` to preserve their complete frame.

All source filenames below begin with `Image ChatGPT 5 oct. 2026, ` and end in `.png`, inside `the boats examplers/`.

| Demo listing | Visual family | First source | Second source |
| --- | --- | --- | --- |
| Etap 21i | Compact monohull sailboat | `19_10_43-3` | `19_10_48-3` |
| Terhi 450 C | Open outboard motorboat | `19_10_41-1` | `19_10_46-1` |
| Zodiac Medline 7.5 | RIB with beige cockpit | `19_10_42-2` | `19_10_47-2` |
| Interboat 22 Classic | Open launch | `19_10_49-8` | `19_10_55-8` |
| Saffier SE 24 Lite | Low-profile daysailer | `19_10_46-5` | `19_10_51-5` |
| Bavaria Cruiser 37 | Modern cruising monohull | `19_10_44-4` | `19_10_49-4` |
| Linssen Grand Sturdy 34.9 AC | Dark-hulled cabin motorboat | `19_10_47-6` | `19_10_52-6` |
| Lagoon 380 S2 | Cruising catamaran | `19_10_48-7` | `19_10_53-7` |
| Brig Eagle 670 | RIB with grey console | `19_10_51-9` | `19_10_56-9` |
| Vedette classique (generic demo) | Classic closed-cabin motorboat | `19_10_53-10` | `19_10_57-10` |

The last pair depicts a wooden closed-cabin motorboat and does not match the open-cabin Rapsody specification. It therefore has a separate “Vedette classique” example listing, with no manufacturer or verified model stated. Its fictional price/specification/location values live in `packages/sdk/src/additional-demo-boats.ts` and are explicitly identified as fictional beside the lot title. Existing boats and their prices are preserved. Actual manufacturer/model identification remains pending.

Other listings retain a single, explicitly illustrative category view: Hallberg-Rassy and Contest use the supplied sailing monohull, Sea Ray and Frauscher use the supplied sports motorboat, Princess uses the supplied flybridge yacht, and Rapsody uses the open-launch example. The existing credited powerboat image remains the generic illustration for the Jeanneau Merry Fisher. A monohull listing no longer receives the hero's catamaran as a fallback, and unrelated photographs are no longer combined into a gallery.

## Editorial placement

All source filenames below use the same prefix/suffix inside `images/`.

| Source | Subject | Placement |
| --- | --- | --- |
| `18_43_20-1` | Owner preparing a mooring line | Seller estimator introduction |
| `18_43_21-2` | Motor yacht underway | Motorboat category and illustrative yacht fallback |
| `18_43_22-3` | Sailing monohull underway | Sailboat category and monohull fallback |
| `18_43_23-4` | Sports motorboat on a lake | Speedboat category and sports-boat fallback |
| `18_43_25-6` | RIB on turquoise water | RIB category |
| `18_43_26-7` | Catamaran at anchor | Catamaran category |
| `18_43_27-8` | Visitors at a boat | Inspection/trust section |
| `18_43_28-9` | Boat keys handed over | Homepage seller invitation |
| `18_43_29-10` | Marina at sunset | How-it-works introduction |

The open-launch category uses its matching supplied auction example. Category photographs are decorative within already-labeled navigation buttons; other images have descriptive French/English alternative text. Section images keep the existing restrained motion and lazy loading. Responsive source sizes account for the extra pixel width needed when a landscape image fills a portrait container.

## Retained images and originals

The current Miquel Gelabert hero photograph is retained: its 2600 px desktop source and dedicated portrait rendition fit the locked composition better than the new marina/exterior examples. Hero layout, preload behavior and screenshot baselines remain unchanged. Previous generic demonstration sources are preserved on disk; unused ones are no longer selected by the active media fixtures.

Original user PNGs remain untouched. WebP derivatives retain the original dimensions and image content, using quality 90: 68.6 MB of source files becomes approximately 7.9 MB of public source images. Next generates responsive AVIF/WebP delivery variants; only the hero receives eager/high-priority loading.

`assets/supplied-media.json` records every source, public path, dimensions, original SHA-256 and byte sizes. Regenerate derivatives with `pnpm --filter @tidebid/web exec node scripts/import-supplied-images.mjs`. Typed image assignments live in `packages/sdk/src/demo-media.ts`; localized descriptions live in `packages/i18n/src/media-copy.ts`.
