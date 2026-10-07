# Image checklist

## First design pass: two hero files

1. `assets/raw/heroes/home.jpg`: at least 2400 × 1350, preferably 3000 px wide. A premium yacht or sailboat on calm water, occupying the right third. The left side should be calm and spacious for text. Keep the complete boat inside the useful crop; avoid strong logos, captions, watermarks and a busy marina.
2. `assets/raw/heroes/home-mobile.jpg`: 1080 × 1920 portrait. Ideally the same boat and setting, photographed or cropped for mobile, with the vessel in the upper half. Text occupies the lower half. A landscape image is suitable only if a convincing portrait crop exists.

Keep the original high-resolution image and permission/license information. Supply clean photography, without a dark overlay baked in. The website applies the text-protection overlay and generates responsive AVIF/WebP renditions.

After replacing the source files, copy them into `apps/web/public/images/heroes/`, update dimensions in `apps/web/src/features/home/hero-media-data.ts`, and verify desktop/mobile crops. Only the selected hero rendition has high fetch priority.

## Later homepage pass: suggested starter collection

An initial homepage image library can start with 14 files: these two hero renditions, six category photographs (motorboat, sailboat, RIB, sloep, catamaran, speedboat), four cover photographs for featured boats, one owner/boat photograph for the seller section, and one genuine inspection/handover photograph for the trust section. Some photographs may be reused where the subject and crop fit. These are planning suggestions; the final count follows the next section designs.

The current prototype's “Closing next” rail shows eight boats. Keeping eight distinct photographed covers makes the starter collection 18 files before reuse. The homepage seller block is still proposed; its owner photograph should follow that block's final composition. Read MOTION_AUDIT.md before commissioning images so the crops match the next section designs.

Boat-detail galleries are separate: start with about 8–12 genuine images per demonstration boat, covering exterior, cockpit/deck, cabin, helm, engine, equipment and visible defects. Real listings must use photographs of the actual vessel.
