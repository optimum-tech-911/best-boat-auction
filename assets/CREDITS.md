# Asset credits

## Temporary hero photography

Photo by Miquel Gelabert, Palma de Mallorca, via Unsplash.

- Photo: https://unsplash.com/photos/white-and-black-sail-boat-on-sea-during-daytime-bRGy5Wd5BB4
- License: https://unsplash.com/license
- Source: https://images.unsplash.com/photo-1581271164789-7c97932822d3
- Desktop and mobile renditions saved under assets/raw/heroes and apps/web/public/images/heroes.
- Temporary illustrative photography. It is not a photograph of the Jeanneau in the demonstration rail.

## Fonts

Instrument Serif and Inter are distributed by their authors under the SIL Open Font License; files and license notices are included in the installed @fontsource packages.

## Supplied Best Boat Auction identity

The user supplied the original raster logo variants and favicon package under `logos/`. Active artwork copies are in `apps/web/public/brand`; browser/application icons are in the web public directory and `src/app/favicon.ico`. Source files remain unchanged. Shared SVG framing removes transparent margins without editing the raster files. The app-icon mockup and stationery presentation remain source/reference artwork rather than new interface illustrations.

## Temporary catalogue and section photography

These photographs are illustrative only, do not depict the named demo lots and must be replaced with actual licensed lot photography before real sales. The same photo may be reused across demonstration cards.

- `sailing-deck.jpg`: Alexander Henke, [Unsplash photograph](https://unsplash.com/photos/white-and-black-boat-on-sea-during-daytime-BHO_FPANh4I), [Unsplash license](https://unsplash.com/license). Source: https://images.unsplash.com/photo-1585136387191-cdb1ed180764.
- `powerboat.jpg`: Chase Baker, [Unsplash photograph](https://unsplash.com/photos/white-and-blue-yacht-on-sea-during-daytime-P3EU2dniWKA), [Unsplash license](https://unsplash.com/license). Source: https://images.unsplash.com/photo-1620604499628-f437712f61f7.
- `catamaran.jpg`: Wolfgang Hasselmann, [Unsplash photograph](https://unsplash.com/photos/a-white-catamaran-sails-on-a-dark-choppy-ocean-ETxr1vVXRL0), [Unsplash license](https://unsplash.com/license). Source: https://images.unsplash.com/photo-1760439819123-4746fde137dd.
- `sailing-yacht.jpg`: identical copy of the Miquel Gelabert hero photograph credited above.

Local files: `apps/web/public/images/demonstration/`. Media mappings are in `packages/sdk/src/demo/data/media.ts`.

## User-supplied editorial and auction examples

The user provided 9 editorial images in `images/` and 20 example boat images in `the boats examplers/`. They are used as illustrative maquette artwork; filenames do not establish a verified vessel or manufacturer identity. Originals remain unchanged. No external photographer attribution or license was inferred for these supplied files.

Named WebP copies are in `apps/web/public/images/editorial/` and `apps/web/public/images/boats/examples/`. `assets/supplied-media.json` records their exact sources, original SHA-256 hashes, dimensions and derivative sizes. `docs/design/IMAGE_USAGE.md` documents the listing/section assignments and retained photographs.

## Lot photographs (`bestboatauction boats/`)

The user supplied 24 photographs of eight boat models, with their sources in `bestboatauction boats/SOURCES.csv`. They come from manufacturers' and dealers' websites (Terhi, Star Yachting and others); **none carries a reuse licence and the copyright stays with each rights holder**. Some show brand or dealer signage, registration names or people facing the camera.

They illustrate the demonstration lots of this private maquette only. They must not be published, shared publicly or used for real sales without the rights holders' permission; replace them with the client's own photographs before launch.

`pnpm import:lot-photos` writes the web versions to `apps/web/public/images/lots/`, records them in `assets/lot-photos.json` and generates `packages/sdk/src/demo/data/lot-photos.generated.ts`.
