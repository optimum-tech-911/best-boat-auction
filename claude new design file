# DESIGN_SYSTEM.md — Best Boat Auction

This file is part of the spec. It defines every visual decision, so Codex builds from it and never improvises.

---

## 0. Rules for Codex (normative)

1. Every UI task names the sections and blueprint IDs it implements (for example "C-10, H2"). Read them before planning.
2. Use only the tokens and components defined here. **Never invent** a colour, font, font size, spacing value, radius, shadow, breakpoint, animation, icon set or component.
3. If something is not covered, use the closest existing pattern and state it in the pull request. If no pattern fits, stop and ask.
4. Every UI pull request contains a **conformance checklist**: every bullet of each blueprint it implements, ticked, each with a screenshot reference.
5. `scripts/check-design-tokens` runs in CI and fails on raw colour literals (hex, rgb, hsl) or arbitrary Tailwind values (`[13px]`, `[#…]`) anywhere outside `packages/ui/src/tokens`.
6. An approved section gets a Playwright screenshot baseline. Changing a baseline outside the task's scope is forbidden.
7. `docs/design/HERO_BRIEF.md` remains the source for the hero. Where it conflicts with this file, this file wins, except for the hero's own layout and copy.

---

## 1. Brand

- **Name:** Best Boat Auction. Always three capitalised words, never translated, never abbreviated in text. The monogram "BBA" is used only for the favicon, app icon and social avatar.
- **Temporary wordmark** (until a designed logo is delivered): "Best Boat Auction" in Instrument Serif 400, 26 px on desktop and 22 px on mobile, letter-spacing −0.01em. Navy-900 on light surfaces, ivory-100 on dark ones. No symbol, no anchor icon.
- **Favicon and app icon:** a capital "B" in Instrument Serif, ivory-100 on navy-900, square with a 4 px radius at 32 px.
- **Tagline:** fr "Des bateaux remarquables. Vendus autrement." · en "Remarkable boats. Sold differently."
- **Voice:** calm, precise, expert. Facts and numbers instead of adjectives. French uses "vous".

---

## 2. Colour tokens

| Token | Hex | Use |
| --- | --- | --- |
| `navy-950` | #061420 | Footer, photo overlays, admin closing board |
| `navy-900` | #0B1F33 | Main text on light surfaces, primary buttons, dark bands |
| `navy-700` | #1E3A52 | Hover of primary buttons |
| `ivory-100` | #F6F4EF | Page background; text on dark surfaces |
| `white` | #FFFFFF | Inputs, bid panel, dialogs, tables, toasts |
| `stone-100` | #EFEBE4 | Subtle fills, skeletons, row hover |
| `stone-200` | #E6E1D8 | Dividers |
| `stone-300` | #D8D2C6 | Borders of inputs, panels, chips |
| `stone-600` | #6B6559 | Secondary text on light surfaces |
| `mist-300` | #A9B4BF | Secondary text on dark surfaces |
| `teal-700` | #2E7477 | Bid buttons, links, focus ring, active tab underline |
| `teal-800` | #235B5E | Hover of teal elements |
| `teal-50` | #E8F1F0 | Flash after a price change |
| `orange-600` | #C86B32 | Urgency: live dot, countdown numerals of 24 px and up |
| `orange-800` | #9A4E22 | Urgency text under 24 px |
| `success-700` | #2F6B4F | Leading, won, paid |
| `success-50` | #E7F0EA | Success backgrounds |
| `danger-700` | #A63A32 | Outbid, errors, destructive admin actions |
| `danger-50` | #F7E8E6 | Error backgrounds |

**Rules**

- Teal is reserved for bidding actions, links, focus rings and active tabs. It is never used as a background band.
- Orange means time urgency only: under 1 hour before closing, a soft-close extension, the live dot. It never colours prices and is never decorative.
- Status is never shown by colour alone: always a word, plus a dot or an icon.
- Dark bands use navy-900 or navy-950 with ivory text, never teal or orange.
- **Allowed text pairs** (contrast checked):

| Pair | Contrast |
| --- | --- |
| navy-900 on ivory-100 | 15.2:1 |
| stone-600 on ivory-100 | 5.4:1 |
| teal-700 on ivory-100 | 4.9:1 |
| white on teal-700 | 5.4:1 |
| orange-800 on ivory-100 | 5.5:1 |
| danger-700 on ivory-100 | 5.8:1 |
| success-700 on ivory-100 | 6.2:1 |
| ivory-100 on navy-950 | 16.9:1 |
| mist-300 on navy-950 | 8.8:1 |

- orange-600 is under 4.5:1 on both ivory and navy, so it is allowed only for numerals of 24 px and up or for non-text marks.
- The Tailwind theme contains only these colours; the default palette is removed.

---

## 3. Typography

**Fonts** (via next/font, self-hosted): **Instrument Serif** 400 and 400 italic for display; **Inter** variable 400, 500 and 600 for everything else. No other fonts, no bold serif.

**Numerals:** every price, countdown, count and table number uses Inter with `font-variant-numeric: tabular-nums lining-nums`.

| Token | Font | Desktop size / line | Tracking | Mobile | Use |
| --- | --- | --- | --- | --- | --- |
| `display-xl` | Instrument Serif | 80 / 76 | −0.02em | 48 / 48 | Hero heading only |
| `display-l` | Instrument Serif | 56 / 58 | −0.015em | 40 / 42 | Page titles (H1) |
| `display-m` | Instrument Serif | 40 / 44 | −0.01em | 32 / 36 | Section titles (H2), lot page title |
| `display-s` | Instrument Serif | 28 / 32 | −0.005em | 24 / 28 | Lot page section titles, empty states |
| `display-xs` | Instrument Serif | 24 / 28 | 0 | 22 / 26 | Lot card titles, editorial card titles |
| `title-l` | Inter 600 | 20 / 28 | −0.01em | 18 / 26 | Panel and dialog titles |
| `title-m` | Inter 600 | 16 / 24 | 0 | 16 / 24 | List titles, group headers |
| `body-l` | Inter 400 | 18 / 30 | 0 | 17 / 28 | Hero description, long descriptions |
| `body-m` | Inter 400 | 16 / 26 | 0 | 16 / 26 | Default text |
| `body-s` | Inter 400 | 14 / 22 | 0 | 14 / 22 | Meta and helper text |
| `caption` | Inter 500 | 12 / 16 | 0.01em | 12 / 16 | Fine print |
| `eyebrow` | Inter 600, uppercase through CSS | 12 / 16 | 0.12em | 11 / 16 | Eyebrows, labels above prices |
| `num-xl` | Inter 600 tabular | 44 / 48 | −0.02em | 36 / 40 | Current bid on the lot page, estimator monthly total |
| `num-l` | Inter 600 tabular | 28 / 32 | −0.01em | 24 / 28 | Lot page countdown, result figures |
| `num-m` | Inter 600 tabular | 20 / 28 | −0.01em | 18 / 24 | Price and countdown on lot cards |
| `num-s` | Inter 500 tabular | 14 / 20 | 0 | 14 / 20 | Tables, bid history |

**Rules**

- Serif only at 22 px and above, only for headings and boat names. Never on buttons, labels, prices, tables or forms.
- At most three type tokens inside one component.
- Body text is at most 68 characters wide (a `measure` utility).
- Headings use sentence case in every language. Eyebrows are written in sentence case and uppercased by CSS.
- Never type thin spaces or currency formats by hand: always the packages/i18n formatters.

---

## 4. Layout

- **Breakpoints:** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536.
- **Container:** content up to 1312 px wide. Side padding 20 px under 640, 32 px from 640, 48 px from 1024, 64 px from 1440.
- **Grid:** 4 columns with 16 px gutters on mobile, 8 columns with 24 px gutters on tablet, 12 columns with 32 px gutters on desktop.
- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128. Nothing else.
- **Section rhythm:** 96 px between homepage and editorial sections on desktop, 64 px on mobile. 40 px from a section header to its content (24 px on mobile).
- **Padding:** panels 24 px (20 on mobile); dialogs 32 px (24 on mobile); table cells 12 px × 16 px.
- **Header height:** 72 px on desktop, 60 px on mobile, sticky. Sticky elements below it start at 96 px from the top.

---

## 5. Shape and elevation

- **Radii:** `radius-xs` 2 px (badges, checkboxes) · `radius-s` 4 px (buttons, inputs, chips, thumbnails) · `radius-m` 6 px (card images, panels, toasts) · `radius-l` 8 px (dialogs, top corners of sheets). Fully round only for dots and avatar initials.
- **Borders:** 1 px stone-300 for inputs, panels and chips; 1 px stone-200 for dividers; on dark surfaces 1 px ivory at 16% opacity.
- **Shadows (only two exist):**
  - `shadow-dialog`: `0 24px 48px -12px rgba(6,20,32,.28)` for dialogs and sheets.
  - `shadow-pop`: `0 8px 24px -8px rgba(6,20,32,.20)` for menus and toasts.
  - Cards, buttons and panels never have shadows.
- **Overlays:**
  - `overlay-hero`: as in HERO_BRIEF.md.
  - `overlay-hero-mobile`: `linear-gradient(180deg, rgba(6,20,32,0) 0%, rgba(6,20,32,.35) 45%, rgba(6,20,32,.88) 100%)`.
  - `overlay-tile`: `linear-gradient(180deg, rgba(6,20,32,0) 50%, rgba(6,20,32,.72) 100%)`.
- **Blur:** only on the hero auction rail (`backdrop-filter: blur(8px)`). Nowhere else; no glassmorphism.

---

## 6. Motion

**Durations:** `fast` 120 ms (colour, opacity) · `base` 180 ms (arrow nudge, toggles) · `panel` 240 ms (menus, dialogs, sheets, toasts) · `reveal` 450 ms (section reveal) · `hero` 1200 ms (hero image settle).

**Easing:** `standard` cubic-bezier(0.2, 0, 0, 1) · `exit` cubic-bezier(0.4, 0, 1, 1).

**Allowed animations** (complete list):

1. The hero entrance from HERO_BRIEF.md.
2. Section reveal, once, on first entry into view: opacity 0 → 1 and translateY 12 px → 0 over 450 ms, staggered 60 ms between at most 4 cards.
3. Card image hover: scale 1 → 1.03 over 600 ms, standard easing.
4. Arrow nudge in links and buttons: translateX 0 → 4 px over 180 ms.
5. Price change: the new value fades in from translateY 4 px (240 ms), and the price block flashes teal-50, fading over 1200 ms.
6. Status change (leading, outbid, extended): the status line slides down over 240 ms.
7. Dialog: fade plus scale 0.98 → 1. Sheet: translateY 100% → 0. Both 240 ms.
8. Toast: translateY 8 px → 0 with fade, 240 ms; auto-dismiss after 6 s.
9. Skeleton: opacity pulse between 0.6 and 1 every 1600 ms.

**Forbidden:** parallax, scroll hijacking, autoplay carousels, looping decorative animation (including pulsing live dots), bounce, confetti, numbers counting up from zero, typing effects, blinking timers.

**Reduced motion:** every transform is removed and only opacity changes of 120 ms or less remain.

---

## 7. Icons and flags

- Icons: lucide-react only, stroke 1.5, sizes 16 (inline), 20 (buttons, inputs), 24 (navigation). Colour inherits from the text.
- Every icon-only control has an accessible label. Never put icons inside decorative circles or boxes. No emoji.
- Country flags: SVG flags from `country-flag-icons` at 16 × 12 px, always next to the country code or name.

---

## 8. Imagery

- **Art direction:** editorial marine photography. Natural soft morning or golden-hour light, calm water, true colours, realistic detail. The boat is the subject. People appear only from behind, as silhouettes or as hands. No text, logos, brand names, registration numbers or watermarks.
- **Fixed ratios:**

| Use | Ratio |
| --- | --- |
| Hero, desktop | 16:9 |
| Hero, mobile | 9:16 |
| Every lot image | 4:3 |
| Category tiles | 4:5 |
| Seller image | 4:5 |
| Editorial and story images | 3:2 |

- Every image has an explicit aspect ratio, `object-fit: cover` and a focal point taken from `docs/ASSETS.md`.
- Full-bleed images have no radius; images inside grids and cards use `radius-m`.
- Text never sits on a photo without an overlay token.
- **Missing photo:** a stone-100 block with a centred 24 px lucide `Image` icon in stone-600 and the text "Photo à venir" (body-s).

---

## 9. Copy rules

- French first, "vous", sentence case. The brand name is always "Best Boat Auction".
- **Money** only through the formatters: fr "42 500 €" · en "€42,500" · nl "€ 42.500" · de "42.500 €".
- **Dates:** fr long form "lundi 19 octobre 2026 à 20 h 00"; short form "19 oct. · 20 h 00". Always the 24-hour clock.
- **Countdown:**

| Time left | Format |
| --- | --- |
| 24 h or more | "12 j 04 h" |
| 1 h or more | "4 h 12 min" |
| Under 1 h | "04:28" |
| Ended | "Clôturé" |

- **Button vocabulary (fr):** Voir les lots · Voir la vente · Enchérir · Définir mon maximum · Confirmer l'enchère · Surenchérir · Vendre mon bateau · Calculer · Être rappelé · S'inscrire à la visite · Suivre.
- **Never:** exclamation marks; unproven superlatives ("incroyable", "garanti", "meilleur prix"); invented scarcity ("dernière chance"). Real deadlines are the only urgency.
- Copy is tested with the German version, which runs about 30% longer.

---

## 10. Components

Shared components live in `packages/ui`. Domain components (lot card, bid panel) live in `apps/web` and are built from them.

**C-01 Button**

- **Sizes:**

| Size | Height | Horizontal padding | Text | Icon |
| --- | --- | --- | --- | --- |
| lg | 52 px | 28 px | Inter 600, 16 px | 20 px |
| md | 44 px | 20 px | Inter 600, 15 px | 20 px |
| sm | 36 px | 14 px | Inter 600, 14 px | 16 px |

  All sizes use `radius-s` and an 8 px gap between icon and text.
- **Variants:**
  - `primary`: navy-900 background, ivory-100 text; hover navy-700. For light surfaces.
  - `primary-inverse`: ivory-100 background, navy-900 text; hover white. For dark surfaces and photos.
  - `bid`: teal-700 background, white text; hover teal-800. Used **only** for bidding actions.
  - `secondary`: transparent, 1 px stone-300 border, navy-900 text; hover border navy-900.
  - `secondary-inverse`: transparent, 1 px border of ivory at 48% opacity, ivory text; hover border ivory.
  - `link`: teal-700 text, underline with 3 px offset on hover, optional arrow with the nudge animation.
  - `destructive` (admin only): danger-700 text and 1 px danger-700 border.
- **States:** focus ring 2 px teal-700 with 2 px ivory offset (on dark surfaces: 2 px ivory ring); disabled at 40% opacity with no hover; loading shows a 16 px spinner in place of the icon, keeping label and width.

**C-02 Text input and money input**

- Height 48 px (56 px for the bid input), 1 px stone-300 border, `radius-s`, white background, 16 px horizontal padding, body-m navy text, stone-600 placeholder.
- Label above in Inter 500 14 / 20 navy, 8 px gap. Hint below in body-s stone-600, 6 px gap.
- Error: danger-700 border and a body-s danger-700 message with a 16 px AlertCircle icon. Focus: teal-700 border plus focus ring.
- Money input: whole euros, tabular numerals, thousands separators while typing, currency symbol placed by locale.

**C-03 Tabs and segmented control:** text tabs 44 px high. The active tab is navy-900 with a 2 px teal-700 underline; inactive tabs are stone-600. Never pill backgrounds.

**C-04 Checkbox and radio:** 20 px; checkbox with `radius-xs`; navy-900 when checked with an ivory mark; visible focus ring.

**C-05 Filter chip:** 36 px high, 14 px horizontal padding, 1 px stone-300 border, `radius-s`, body-s navy. Selected: navy-900 background with ivory text. The count is stone-600, or mist-300 when selected.

**C-06 Badge on images:** `radius-xs`, 4 × 8 px padding, eyebrow style at 11 px. Ivory-100 background with navy-900 text. At most one badge per image. Texts: "Sans prix de réserve", "Nouveau".

**C-07 Status line:** an 8 px static dot followed by eyebrow text, never a pill.

| Status | Text (fr) | Colour |
| --- | --- | --- |
| Leading | EN TÊTE | success-700 |
| Outbid | SURENCHÉRI | danger-700 |
| Closing soon | CLÔTURE IMMINENTE | orange-600 dot, orange-800 text |
| Extended | PROLONGÉ +5 MIN | orange-600 dot, orange-800 text |
| Awaiting seller | EN ATTENTE DU VENDEUR | stone-600 |
| Sold | VENDU | navy-900 |
| Not awarded | NON ATTRIBUÉ | stone-600 |
| Live | EN DIRECT | orange-600 dot, text in the surface's main text colour |

**C-08 Countdown** (`packages/ui`)

- Props: `endsAt`, `serverOffsetMs`, `size` (s, m, l, xl), `urgencyFromMs` (default 1 h).
- Uses the formats in section 9. Under the urgency threshold, numerals of 24 px and up turn orange-600; smaller sizes turn orange-800.
- `role="timer"`; its accessible label updates once per minute ("Clôture dans 4 minutes"). Shows "Clôturé" when ended.

**C-09 Price block:** an eyebrow label ("Enchère actuelle", "Prix de départ", "Enchère finale"), the value in a num token, and a body-s stone-600 sub-line ("12 enchères · hors frais acheteur 12 %"). Uses animation 5 when the value changes.

**C-10 Lot card** (editorial, no surrounding box)

- An `<article>`. The title is the link and its stretched area covers image and text. The watch button sits above that area. No nested interactive elements.
- **Image:** 4:3, `radius-m`. At most one C-06 badge top-left. Top-right, a 36 px square watch button (`radius-s`, ivory at 92% opacity, navy heart icon at 18 px, filled when watched, accessible label).
- **Text block**, 16 px below the image:
  1. Eyebrow, stone-600: "LOT 7706 · LELYSTAD, NL".
  2. Title in display-xs navy, one line with ellipsis.
  3. Specs in body-s stone-600: "2016 · 11,40 m · Voilier".
  4. Value row: 16 px top margin, 1 px stone-200 top border, 12 px top padding. Price block (label "Enchère actuelle", value num-m) on the left; countdown block (label "Clôture dans", C-08 size m) right-aligned.
  5. Optional C-07 status line showing the user's own status.
- **Hover:** image scale 1.03 and underlined title.

**C-11 Lot row** (closing-order view, results, admin)

- 72 px row with a 96 × 72 thumbnail (`radius-s`).
- Columns: title (title-m) with meta (body-s) · price (num-m) · bid count (num-s) · countdown (num-m, orange under 1 h) · status (C-07) · watch button.
- On mobile it stacks into two lines.

**C-12 Bid panel:** see blueprint BID.

**C-13 Dialog:** 560 px (md) or 720 px (lg) wide, `radius-l`, 32 px padding, white, `shadow-dialog`. Title-l heading and a 40 px close button top-right. Actions right-aligned, secondary before primary. Under 768 px it becomes a full-width bottom sheet with `radius-l` top corners and a maximum height of 92svh.

**C-14 Toast:** 360 px wide, white, 1 px stone-300 border, a 3 px left border in the status colour, `radius-m`, `shadow-pop`, 16 px padding. Title-m title and body-s stone-600 text. Stacked top-right on desktop, top-centre on mobile.

**C-15 Section header:** eyebrow (stone-600), then H2 in display-m, then an optional body-l stone-600 intro of at most 56 characters per line. An optional C-01 link sits right-aligned on the H2 baseline on desktop and below the H2 on mobile.

**C-16 Page tabs:** C-03 tabs with counts ("En cours (12)").

**C-17 Table**

- Header row: eyebrow stone-600 with a 1 px stone-300 bottom border.
- Rows 56 px high (public) or 44 px (admin). Numbers right-aligned and tabular.
- Row hover stone-100. No zebra striping, no vertical borders.

**C-18 Empty state:** centred, at most 420 px wide. A 24 px lucide icon in stone-600, a display-s title, body-m stone-600 text and exactly one button.

**C-19 Skeleton:** stone-100 blocks with exactly the final element sizes, so loading never shifts the layout.

**C-20 Header** and **C-21 Footer:** see blueprints G1 and G2.

**C-22 Spec list:** two-column rows: label in body-s stone-600 (40% width), value in body-m navy (60%). 1 px stone-200 dividers, title-m group headers.

**C-23 Gallery and lightbox**

- Main image 4:3, `radius-m`. A thumbnail row below: 4:3 thumbnails, 88 px wide, 8 px gap, 2 px navy-900 outline on the active one. A secondary sm button "Voir les 32 photos".
- The lightbox is full screen on navy-950. Images are shown contain-fitted, with 48 px arrow buttons and a "3 / 32" counter (num-s, ivory). It supports keyboard arrows, Escape and swipe.

**C-24 Language switch:** the current language code ("FR") with a chevron. Its menu lists "Français, English, Nederlands, Deutsch", each in its own language.

**C-25 Mini estimator** (homepage seller band)

- Three inverse inputs in a row: boat type (select), length (metres), value (money).
- Result: eyebrow "Estimation" followed by num-xl ivory "1 108 €" and body-m mist-300 "par mois".
- A primary-inverse link-button "Calculer le coût complet →".
- Values come from `estimateHoldingCost` with default parameters.

---

## 11. Page blueprints

**G1 Header**

- **Desktop (from 1024 px):** 72 px high, ivory-100 background, 1 px stone-300 bottom border.
  - Left: the wordmark.
  - Navigation, 24 px gap, body-m 500 navy: "Ventes en cours", "Résultats", "Calendrier", "Comment ça marche".
  - Right:
    - Search icon button (opens a search overlay).
    - Heart icon with the watch count.
    - C-24 language switch.
    - "Connexion" link, or 32 px navy initials once signed in.
    - Primary md button "Vendre mon bateau".
- **Mobile:** 60 px high. Wordmark left; search and menu icons right. The menu opens a full-screen sheet:
  - Navigation links in display-s.
  - Language switch.
  - "Connexion".
  - A primary lg full-width "Vendre mon bateau" button.
- **Behaviour:** always solid and sticky. It never turns transparent and never shrinks.
- **Mobile bottom bar:**
  - Lot pages show the bid bar (blueprint BID).
  - Every other public page shows a 64 px ivory bar with a stone-300 top border and a primary md "Vendre mon bateau" button, full width minus padding.

**G2 Footer**

- Navy-950 background, 80 px top padding, 40 px bottom padding.
- Row 1: wordmark (ivory), a one-line description in mist-300, and a newsletter field (inverse input with button).
- Row 2: four link columns: Acheter, Vendre, Best Boat Auction, Aide.
- Row 3, in mist-300 caption: "© 2026 Best Boat Auction · Mentions légales · CGU · Confidentialité · Cookies", plus the language switch.
- One trust sentence: "Les paiements sont détenus par un établissement de paiement agréé jusqu'à la remise du bateau."

**H1 Hero:** HERO_BRIEF.md, aligned by task D1.1.

**H2 Closing next**

- C-15 header: eyebrow "VENTE D'OCTOBRE · CLÔTURE LUNDI 19 OCT.", H2 "Clôtures à venir", link "Voir les 12 lots →".
- Content: lot cards (C-10) in order of closing time. 4 per row from 1280 px; 3 from 1024 px; 2 from 640 px. Under 640 px, a horizontal row of cards at 85% width with scroll snapping, scrolled only by the user.

**H3 How it works (strip)**

- A 1 px stone-300 top border and 4 columns (2 × 2 on tablet, stacked on mobile).
- Each column: numeral in display-m stone-600, title in title-l navy, text in body-m stone-600 (at most two lines).

| No. | Title | Text |
| --- | --- | --- |
| 01 | Inspectez | Une journée de visite a lieu le samedi précédant chaque vente. |
| 02 | Enchérissez | En direct ou avec un maximum automatique. Une enchère tardive prolonge le lot de 5 minutes. |
| 03 | Payez en séquestre | Votre paiement reste protégé jusqu'à la remise du bateau. |
| 04 | Récupérez | Signez le transfert en ligne et récupérez le bateau avec votre code de remise. |

- Below the columns: the link "Comment ça marche →".

**H4 Categories**

- C-15 header: eyebrow "PARCOURIR", H2 "Par type de bateau".
- Six 4:5 tiles: 6 per row from 1280 px, 3 × 2 from 768 px, 2 × 3 from 640 px, a horizontal row under 640 px.
- Each tile: the image with `overlay-tile`, the name bottom-left in display-xs ivory, and the count in body-s ivory at 80% ("8 lots en vente").
- Hover: image scale 1.03.

**H5 Seller band**

- Full-bleed navy-900, 96 px vertical padding, 12-column grid.
- Left 6 columns:
  - Eyebrow (mist-300): "VENDRE VOTRE BATEAU".
  - H2 (display-m, ivory): "Chaque mois, votre bateau vous coûte de l'argent."
  - One body-l line in mist-300.
  - C-25 mini estimator.
  - Buttons: primary-inverse "Calculer le coût complet →" and secondary-inverse "Vendre mon bateau".
- Right 5 columns, after a 1-column offset: the seller image at 4:5 with `radius-m`.

**H6 Trust**

- C-15 header: eyebrow "POURQUOI BEST BOAT AUCTION", H2 "Acheter en confiance".
- Three columns. Each: a 3:2 image (`radius-m`), a title in display-xs and text in body-m stone-600.

| Image | Title | Text |
| --- | --- | --- |
| Viewing day | Une visite avant chaque vente | Inspectez le bateau avec son propriétaire avant d'enchérir. |
| Marina | Votre argent protégé | Le paiement est détenu par un établissement agréé jusqu'à la remise des clés. |
| Handover | Des frais clairs, avant d'enchérir | Chaque enchère affiche le total que vous paierez si vous gagnez. |

**H7 Recent results**

- C-15 header: eyebrow "RÉSULTATS", H2 "Ventes récentes", link "Tous les résultats →".
- Six C-17 rows:
  - A 64 × 48 thumbnail.
  - Title (title-m) and meta.
  - Final bid (num-s, right-aligned).
  - Number of bids.
  - C-07 status (VENDU or NON ATTRIBUÉ).
  - Closing date.
- On mobile, rows stack.

**H8 Upcoming sales**

- C-15 header: eyebrow "CALENDRIER", H2 "Prochaines ventes".
- Three columns separated by 1 px stone-200 lines. Each: month in display-s, "Clôture lundi 16 novembre dès 20 h" (body-m), the viewing day (body-s stone-600) and "Dépôt des bateaux avant le 26 octobre" (body-s stone-600).
- After the columns: the link "Vendre mon bateau →".

**H9 Newsletter**

- A 1 px stone-300 top border.
- Display-s line "Les nouveaux lots, chaque mois."
- Email input with the button "S'inscrire".
- Consent caption below.

**CAT Catalogue and results**

- **Page header:**
  - Breadcrumb (body-s).
  - Eyebrow: "VENTE D'OCTOBRE · CLÔTURE LUNDI 19 OCTOBRE DÈS 20 H".
  - H1 (display-l): "Vente d'octobre".
  - Body-l stone-600: "12 bateaux · visite samedi 17 octobre, 10 h – 12 h".
- **Tabs (C-16):** "En cours (12)" · "Résultats (2)". Right-aligned view switch: "Grille" · "Ordre de clôture" (C-11 rows). "Ordre de clôture" becomes the default within 1 hour of the first closing.
- **Desktop layout:** a 280 px filter sidebar, sticky at 96 px. Results in 3 columns from 1280 px, 2 columns from 1024 px. Gaps: 32 px between columns, 56 px between rows.
- **Under 1024 px:** a toolbar with the secondary button "Filtres (3)" (opens a full-height sheet whose sticky footer button reads "Afficher 8 résultats") and the sort select.
- **Filters**, as collapsible groups with title-m headers and 1 px dividers:
  - Type (checkboxes with counts).
  - Prix actuel (two money inputs).
  - Longueur and Année (two inputs each).
  - Pays.
  - Marque (searchable list).
  - Carburant.
  - Heures moteur (maximum).
  - Options: "Sans prix de réserve", "Clôture sous 24 h".
- **Active filters:** removable selected C-05 chips with ×, plus the link "Tout effacer".
- **Paging:** secondary button "Voir plus de lots" with "12 sur 34". No infinite scroll.
- **Results tab:** cards show the price block "Enchère finale" and the C-07 outcome instead of the countdown.
- **Empty:** C-18 "Aucun lot ne correspond" with the button "Effacer les filtres".

**CAL Calendar page**

- H1 "Calendrier des ventes", then C-17 rows for the next 12 sales.
- Columns: month · closing date and time · viewing day · submission deadline · state (C-07: EN COURS, À VENIR, TERMINÉE) · link.

**HOW "Comment ça marche" page**

- Sections in order:
  - The H3 steps, expanded with two sentences each.
  - Fees: a C-17 table of buyer premium tiers and a C-17 table of seller fees by length.
  - A cost calculator (start price and bid → breakdown table from `buyerTotal`).
  - The FAQ.
  - A dark CTA band (navy-900, H2 display-m, primary-inverse button).

**LOT Lot page**

- **Title block:**
  - Breadcrumb.
  - Eyebrow: "LOT 7706 · VENTE D'OCTOBRE".
  - H1 (display-m): the lot title.
  - Body-l stone-600: "Voilier · 2016 · 11,40 m · Lelystad, Pays-Bas".
  - Right-aligned: secondary sm "Suivre" (heart icon) and "Partager".
- **Grid (from 1024 px):** content in 8 columns; the bid panel (BID) in 4 columns, sticky at 96 px. Under 1024 px the panel follows the gallery and the mobile bid bar appears.
- **Gallery:** C-23.
- **Key facts strip:**
  - Six facts: Année, Longueur, Largeur, Tirant d'eau, Moteur, Couchages.
  - Label in eyebrow stone-600, value in title-m.
  - 1 px dividers between facts; 3 × 2 under 1024 px.
- **Section navigation:** sticky at 72 px, ivory background with a bottom border. Links: "Présentation · Caractéristiques · Visite · Localisation · Documents · Conditions". The active link is underlined in teal through scroll tracking.
- **Sections**, each with a display-s H2 and 64 px apart:
  - **Présentation:** body-l, 68-character measure, including "Points d'attention".
  - **Caractéristiques:** C-22 groups: Général, Moteur et électricité, Navigation et électronique, Gréement (sailboats only), Confort, Équipement de pont.
  - **Visite:** date block plus the inline registration form.
  - **Localisation:** approximate map at 21:9 (`radius-m`) and the approximation note.
  - **Documents:** list with icons; documents restricted to registered bidders show a lock and "Réservé aux enchérisseurs inscrits".
  - **Conditions de vente:** premium tier, VAT regime, sale-mode text (including the brokerage banner text), payment and collection deadlines.
- **Lots similaires:** H2 plus 4 C-10 cards.

**BID Bid panel, review and mobile bar**

- **Desktop panel:** white, 1 px stone-300 border, `radius-m`, 24 px padding, 4 columns wide. In order:
  1. "Clôture dans" eyebrow with C-08 size l on the left; the closing date and time in body-s stone-600 on the right. The C-07 extended line when the lot has been extended.
  2. A divider.
  3. C-09 price block at num-xl, label "Enchère actuelle", sub-line "12 enchères · Voir l'historique".
  4. Reserve line, when the lot shows it: C-07 "PRIX DE RÉSERVE ATTEINT" (success-700) or "PRIX DE RÉSERVE NON ATTEINT" (stone-600).
  5. The user's status:
     - C-07 line with one sentence ("Vous êtes en tête avec un maximum de 15 000 €.").
     - When outbid: the secondary button "Surenchérir à 14 500 €", prefilled with the next minimum.
  6. C-03 control: "Enchère simple" | "Enchère maximale".
  7. C-02 money input at 56 px with the value in num-l. Hint: "Minimum 14 500 € · palier 500 €".
  8. Three secondary sm quick amounts: the minimum, plus one step, plus three steps.
  9. Cost line: "Total estimé si vous gagnez" (body-s) with the value in title-m tabular, and the link "Détail des frais" (popover with the breakdown).
  10. Bid button, lg, full width: "Enchérir 14 500 €" or "Définir mon maximum à 20 000 €".
  11. Fine print (caption stone-600): "Enchère ferme et définitive. Hors frais acheteur 12 % et TVA sur ces frais." In brokerage mode, add "Vente sous réserve d'acceptation du vendeur (72 h)."
  12. Bid history: C-17 rows with the pseudonym, flag, amount and time ago. The user's own rows read "Vous" in navy 600. Six rows, then "Tout voir".
- **Closed lot:** the panel shows the C-07 outcome and the price block "Enchère finale", with no input.
- **Signed out:** the input is usable; pressing the bid button opens sign-in, then returns to the review.
- **Review dialog** (C-13 md):
  - Title "Vérifiez votre enchère".
  - Lot row: 96 × 72 thumbnail, title, meta.
  - Breakdown table: Votre enchère · TVA sur le prix · Frais acheteur (12 %) · TVA sur les frais (20 %) · divider · "Total si vous gagnez" in title-m.
  - Consent checkbox with the binding text for the sale mode.
  - Buttons: secondary "Modifier", and the bid button "Confirmer l'enchère de 14 500 €", disabled until the box is ticked.
  - At twice the minimum or more: an inline alert in danger-50 with danger-700 text, "Ce montant est nettement supérieur au minimum de 14 500 €."
- **Mobile bar:** 64 px, sticky at the bottom. Left: the price in num-m and the countdown in num-s. Right: the bid button md "Enchérir", which opens a bottom sheet containing items 1–11.

**SELL "Vendre mon bateau" page** (from the prototype, restyled)

- **Hero:** split on ivory.
  - Left 6 columns:
    - Eyebrow: "VENDRE MON BATEAU".
    - H1 (display-l): "Votre bateau vous coûte de l'argent chaque mois."
    - Body-l stone-600.
    - Buttons: primary "Calculer mes pertes →" (scrolls to #estimation) and secondary "Être rappelé".
  - Right 6 columns: the seller image at 4:5, `radius-m`.
- **Estimator (#estimation), from 1024 px:**
  - **Inputs** in a 7-column white panel with three groups:
    - "Votre bateau": type chips, length slider with value, year, value input with hint.
    - "Où et comment": area chips, storage chips, winter checkbox with months.
    - "Vos frais réels (facultatif)": an accordion.
  - **Results** in a 5-column white panel, sticky at 96 px:
    - Headline in num-xl navy: "1 108 € / mois".
    - Sub-line: "13 299 € par an · 887 € par jour de navigation".
    - Breakdown rows: label, value in num-s, and a 6 px bar (navy-900 for the largest, stone-300 for the others).
    - The C-03 control "3 mois / 6 mois / 12 mois" with the value in num-l.
    - Two price blocks: "Valeur aujourd'hui" and "Dans 12 mois".
    - Fee comparison rows: "Courtier (8 %)" and "Nos frais vendeur", no strikethrough.
    - Next-sale block.
    - Buttons: primary lg "Vendre à la vente du 16 novembre", secondary "Recevoir ce rapport".
    - The link "Comment est-ce calculé ?".
- **Then:** the seller version of the H3 steps, a C-17 comparison table (Enchères · Courtier · Petite annonce), the FAQ as accordions, and a dark CTA band.

**ACC Account and My bids**

- **My bids:**
  - H1 (display-l): "Mes enchères".
  - C-16 tabs: En tête · Surenchéri · Gagnées · Perdues · En attente du vendeur.
  - Each tab lists C-11 rows with the user's status.
  - Below: the watchlist as a C-10 grid.
- **Settings:** a left list (Profil, Sécurité, Vérification d'identité, Notifications, Entreprise) and C-02 forms in a 640 px column.

**SEL Seller portal**

- **"Mes bateaux":** one row per lot with a thumbnail, title, C-07 status and statistics in num-s (vues, suivis, inscrits à la visite, enchères).
- **Decision page:**
  - An outcome panel: top bid (num-xl), runner-up, reserve status and the 72 h countdown (C-08 size l).
  - Primary "Accepter 62 000 €", secondary "Faire une contre-offre", destructive link "Refuser".
- **Intake wizard:**
  - Five numbered text steps, with the current one underlined.
  - A single 720 px column.
  - A sticky footer with "Retour" and "Continuer", plus "Enregistré il y a 3 s" in caption.

**AFT After-sale (buyer and seller)**

- A vertical timeline with C-07 dots: Adjugé → Paiement → Séquestre → Signature → Retrait → Terminé. Under it, the card for the current step with its single action.
- Payment statement: a C-17 table, with copy buttons for the IBAN and the reference.
- Handover code: six digits in num-xl with 0.2em letter-spacing, and a 160 px QR code.
- Seller code entry: six one-digit inputs, 56 px each.

**ADM Admin**

- **Density:** body-s as base text.
- **Navigation:** a 248 px navy-950 sidebar; links in mist-300, the active one in ivory with a 2 px teal-700 left border.
- **Top bar:** 56 px, white, with global search.
- **Content:** ivory-100 area with white panels (`radius-m`, 1 px stone-300).
- **Tables:** C-17 at 44 px rows with a sticky header, column filters and a bulk-action bar.
- **Forms:** 200 px label column.
- **Approval banners:** a navy outline panel with C-07 "EN ATTENTE D'APPROBATION" in stone-600.
- **Closing board:** full-screen navy-950 with dark C-11 rows, each showing countdown in num-l, extension status, bids per minute and viewer count.

---

## 12. Accessibility (hard rules)

- Only the colour pairs of section 2.
- Visible focus everywhere: 2 px teal-700 ring with 2 px offset on light surfaces, 2 px ivory ring on dark ones.
- Touch targets at least 44 × 44 px.
- Every icon-only control has an accessible label.
- Countdowns use `role="timer"`. One polite live region per page announces only meaningful changes: outbid, leading, closed.
- Forms: visible labels, errors linked with `aria-describedby`, and an error summary at the top of multi-field forms.
- `lang` set per locale; numbers and money formatted per locale.
- Reduced motion as in section 6. No information by colour alone.

---

## 13. Design QA checklist (in every UI pull request)

- [ ] Only tokens and components from this file; `scripts/check-design-tokens` passes.
- [ ] Conformance checklist for each blueprint, every item ticked with a screenshot.
- [ ] Screenshots at 390, 768, 1280 and 1920 px, in fr and en (de for any long text).
- [ ] States shown: default, loading, empty and error, plus data states (leading, outbid, extended, closed) where they apply.
- [ ] Screenshot baselines changed only for the section in scope.
- [ ] axe reports no serious or critical issue; the keyboard path was tested.
- [ ] Lighthouse budgets met on the affected pages.
- [ ] No layout shift when data loads (skeletons match the final sizes).

---

## 14. Image kit

### 14.1 How to generate

1. Generate at the largest size your image tool offers. Hero images under 2400 px wide must be upscaled 2× with an AI upscaler before saving.
2. If the tool cannot produce the exact ratio, generate the closest one. Codex crops to the exact ratio around the focal point listed in `docs/ASSETS.md`.
3. End every prompt with this suffix:

> Photorealistic editorial marine photography, natural light, true-to-life colours, realistic reflections, fine detail, full-frame camera look, no people facing the camera, no text, no logos, no brand names, no registration numbers, no watermark.

4. Save each file under `assets/raw/…` with the exact name below. List every image in `assets/CREDITS.md` with "AI-generated, tool name, date".

### 14.2 Website images (12)

| File | Ratio | Focal point | Prompt (plus the suffix) |
| --- | --- | --- | --- |
| `heroes/home.jpg` | 16:9 | 70% 55% | A modern 12-metre white cruising sailing yacht at anchor in a calm Mediterranean cove at golden hour. The yacht sits in the right third of the frame, three-quarter view. The left half is open calm sea and soft sky with very little detail. Warm low sunlight, gentle ripples, distant green headland. |
| `heroes/home-mobile.jpg` | 9:16 | 50% 30% | The same scene in vertical format (use home.jpg as the reference image): the yacht in the upper half, calm darker water filling the lower half. |
| `heroes/sell.jpg` | 4:5 | 50% 50% | Close-up of an owner's weathered hands coiling a mooring line on the teak deck of a classic motor yacht at a wooden pontoon, early morning light, shallow depth of field, marina softly blurred behind, face not visible. |
| `categories/motorboat.jpg` | 4:5 | 50% 55% | A 13-metre flybridge motor yacht cruising slowly on a calm sea, three-quarter view, soft afternoon light. |
| `categories/sailboat.jpg` | 4:5 | 50% 50% | An 11-metre cruising sailboat under full sail in a moderate breeze, heeling slightly, Atlantic coast, crisp morning light. |
| `categories/speedboat.jpg` | 4:5 | 50% 60% | An 8-metre sport runabout gliding on a calm alpine lake, light spray, mountains softly in the background, late afternoon. |
| `categories/sloep.jpg` | 4:5 | 50% 60% | A navy-blue Dutch sloep with a teak deck and cream cushions moored on a quiet tree-lined canal, soft morning light. |
| `categories/rib.jpg` | 4:5 | 50% 60% | A 7-metre rigid inflatable boat with grey tubes running along a rocky coastline, turquoise water, bright midday light. |
| `categories/catamaran.jpg` | 4:5 | 50% 55% | A 12-metre sailing catamaran at anchor in a turquoise Adriatic bay, seen from slightly above, calm water, late afternoon. |
| `story/viewing-day.jpg` | 3:2 | 50% 50% | Two people seen from behind inspecting the hull of a sailboat on a marina pontoon during a viewing day, one pointing at the deck, soft overcast light. |
| `story/handover.jpg` | 3:2 | 50% 50% | Close-up of one hand passing a set of boat keys on a cork float keyring to another hand above a wooden pontoon, boats blurred behind, warm light. |
| `story/marina.jpg` | 3:2 | 50% 50% | Aerial view of a calm European marina at golden hour, neat rows of sailboats and motor yachts, wooden pontoons, gentle reflections. |

### 14.3 Demo catalogue (12 boats, invented names)

AI cannot draw a specific real model accurately, and boat professionals will notice. So the demo uses invented model names. Before showing the client, check quickly that none of these names is a real brand.

| # | Lot title | Type | Length | Year | Location | Start price | Gallery | Boat sheet (paste into every prompt for this boat) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Solenne 38 | Voilier | 11,40 m | 2016 | Lelystad, NL | 62 000 € | Full (8) | an 11.4-metre modern cruising sailing yacht, white hull with a thin navy-blue boot stripe, light grey non-slip deck, teak-slatted cockpit seats, grey sprayhood, single aluminium mast with in-mast furling, twin wheels, stainless railings |
| 2 | Kerlys 31 | Voilier | 9,40 m | 1998 | La Trinité-sur-Mer, FR | 14 500 € · no reserve | Short (3) | a 9.4-metre classic late-1990s cruising sailboat, cream hull, varnished wooden toe-rails, blue sail covers, tiller steering, well kept |
| 3 | Ondine 24 | Voilier | 7,30 m | 2021 | Annecy, FR | 34 000 € | Short (3) | a 7.3-metre modern daysailer, sleek white hull, low cabin, black carbon mast, grey sails, small open cockpit with tiller |
| 4 | Vigie 36 Steel | Bateau à moteur | 10,80 m | 2005 | Roermond, NL | 89 000 € | Full (8) | a 10.8-metre Dutch steel motor cruiser, dark navy steel hull, white superstructure with large windows, teak side decks, aft cabin, navy canvas cockpit cover |
| 5 | Rivage 42 Fly | Bateau à moteur | 13,00 m | 2007 | Hellevoetsluis, NL | 118 000 € | Short (3) | a 13-metre flybridge motor yacht, white hull, dark tinted windows, flybridge with white bimini, swim platform, chrome railings |
| 6 | Pêcheur 7.0 | Bateau à moteur | 6,90 m | 2019 | La Rochelle, FR | 29 500 € | Short (3) | a 6.9-metre walkaround fishing boat, white hull, light grey wheelhouse with front windows, rod holders on the roof, single outboard |
| 7 | Strada 26 | Vedette | 8,00 m | 2010 | Nieuwpoort, BE | 19 000 € | Short (3) | an 8-metre sport cruiser, white hull with a navy accent stripe, low windscreen, cream cockpit seating, sterndrive |
| 8 | Lago 750 | Vedette | 7,50 m | 2016 | Gmunden, AT | 65 000 € | Short (3) | a 7.5-metre classic-style lake runabout, glossy white hull, varnished mahogany-look deck, cream leather seats, chrome windscreen frame |
| 9 | Tern 670 | Semi-rigide | 6,70 m | 2022 | Vlissingen, NL | 27 000 € | Full (8) | a 6.7-metre rigid inflatable boat, grey hypalon tubes, white hull, white centre console with small windscreen, grey seats, stainless ski arch, single 150 hp outboard |
| 10 | Calanque 750 | Semi-rigide | 7,50 m | 2017 | Antibes, FR | 24 000 € | Short (3) | a 7.5-metre rigid inflatable boat with a small cuddy cabin, navy-blue tubes, white hull, bow sun pad, twin-seat console |
| 11 | Grachten 8.8 | Sloep | 8,80 m | 2017 | Muiden, NL | 75 000 € | Full (8) | an 8.8-metre luxury Dutch sloep, deep navy hull, teak deck, cream cushions around an open cockpit, folding canvas canopy, inboard diesel |
| 12 | Alizé 40 | Catamaran | 11,80 m | 2012 | Sukošan, HR | 135 000 € | Short (3) | an 11.8-metre sailing catamaran, white hulls, grey bow trampoline, large saloon windows, white bimini over the cockpit |

The start prices cover all three buyer-premium tiers and both sides of the €25,000 identity-check threshold, so the maquette shows every fee case.

**Shot list:**

| Shot | Full gallery (8) | Short gallery (3) |
| --- | --- | --- |
| 01 | Cover: three-quarter front view on calm water, soft morning light | Same |
| 02 | Full side profile, whole boat in frame | — |
| 03 | Bow and foredeck | — |
| 04 | Stern and swim platform, low angle from the water | — |
| 05 | Cockpit seen from the stern looking forward | Same |
| 06 | Helm station with wheel and instruments | — |
| 07 | Main interior (saloon), daylight, tidy · RIB: console and seats · sloep: lounge seating from above | Same |
| 08 | Engine bay, clean technical close-up · RIB: outboard engine | — |

**Consistency method** (one ChatGPT conversation per boat):

1. Message 1: the boat sheet, shot 01 and the suffix. Pick the best result.
2. Each next message: keep the chosen 01 image as reference and write "Same boat as in the reference image, identical hull colour, deck, canvas and details. Now show: [shot]." followed by the suffix.
3. Reject any image where the boat changed (hull colour, number of masts, windows).
4. Save as `assets/raw/lots/<number>-<slug>/<NN>.jpg`, for example `lots/01-solenne-38/05.jpg`.

Totals: 12 website images, plus 32 photos for the full galleries and 24 for the short ones (56 boat photos).

---

## 15. Design tasks

**Order** (each replaces the UI part of the maquette task shown):

| Step | Task | Replaces |
| --- | --- | --- |
| 1 | D0 Brand rename and design foundations | Updates M0.4 |
| 2 | D1.1 Align the hero | Updates D1 |
| 3 | D2 Header and footer | — |
| 4 | D3 Auction components | — |
| 5 | M1.1–M1.6 Domain core (if not done) | — |
| 6 | F0 Mock API, seeded with section 14.3 instead of the prototype lots | F0 |
| 7 | D4 Homepage sections H2–H9 | M4.4 (home part) |
| 8 | D5 Catalogue, results and calendar | M4.4 (catalogue part) |
| 9 | D6 Lot page | M4.4 (lot part), M4.5 |
| 10 | D7 Bidding | M5.4 |
| 11 | D8 "Vendre mon bateau" and "Comment ça marche" | M6.1 |
| 12 | D9 Account and My bids | M3.4 |
| 13 | D10 Seller portal and after-sale | M6.3, M6.5, F1 |
| 14 | D11 Admin | F2 |
| 15 | F3 Demo polish and client preview | F3 |

Tasks D4 to D11 run in **maquette mode** (`docs/MAQUETTE_PHASE.md` section 4). Every prompt below ends with the same line, so it is written once here:

```text
Follow the Task workflow in AGENTS.md. Apply docs/design/DESIGN_SYSTEM.md exactly; include the
conformance checklist and the Design QA checklist (section 13) in the pull request.
```

```text
TASK D0 — Brand rename and design foundations
Read: docs/design/DESIGN_SYSTEM.md sections 0–10 and 12–13 · docs/design/HERO_BRIEF.md
Scope: whole repository for the rename; packages/ui, packages/i18n, scripts/, docs/
Build:
- Rename "Tidebid" to "Best Boat Auction" everywhere (code, i18n, metadata, docs titles; decision
  records keep their history). Package scope @tidebid → @bba, including the commands in AGENTS.md.
  In docs/QUESTIONS.md mark Q5: name decided, domain still open.
- Tokens: sections 2–6 as CSS variables and the Tailwind theme, with the default palette removed;
  typography utilities for every token in section 3; fonts through next/font.
- scripts/check-design-tokens, run in CI, as described in rule 5 of section 0.
- Rebuild packages/ui components C-01 to C-09, C-13 to C-19 and C-24 exactly as specified;
  /dev/ui shows every variant and state.
- Add country-flag-icons to docs/DEPENDENCIES.md; record docs/decisions/0004-design-system-v1.md.
Done when: /dev/ui matches the specs at all four widths; the token check fails on a test file containing
a raw hex colour and passes on the real code.
```

```text
TASK D1.1 — Align the hero
Read: DESIGN_SYSTEM.md sections 2–9, H1 · docs/design/HERO_BRIEF.md
Scope: apps/web home hero, packages/ui (Countdown, LiveIndicator)
Build: replace every raw value in the hero with tokens; heading display-xl; buttons primary-inverse
"Voir les lots →" and secondary-inverse "Vendre mon bateau"; the live dot is static; rail fixtures use the
demo catalogue (for example "Solenne 38", 12 lots); Countdown follows C-08; brand name Best Boat Auction.
Done when: the hero still matches HERO_BRIEF.md, uses tokens only, and its screenshot baselines are
updated in this task only.
```

```text
TASK D2 — Header and footer
Read: DESIGN_SYSTEM.md G1, G2, C-01, C-24, section 12
Scope: apps/web layout, packages/ui
Build: G1 on desktop and mobile, including the full-screen menu sheet and the mobile bottom-bar rule;
G2. Navigation targets may be placeholder pages.
Done when: keyboard navigation works through the header and the menu sheet; screenshots at all widths.
```

```text
TASK D3 — Auction components
Read: DESIGN_SYSTEM.md C-07 to C-12, C-22, C-23, C-25, section 6
Scope: apps/web/components/auction/**, /dev/ui
Build: C-10 lot card, C-11 lot row, C-22 spec list, C-23 gallery and lightbox, C-25 mini estimator
(calling estimateHoldingCost) and C-07 status lines, shown in /dev/ui with fixtures for every state: no
bids, bids, leading, outbid, closing soon, extended, closed sold, closed not awarded, no reserve,
missing photo.
Done when: every state is visible in /dev/ui and has a screenshot baseline.
```

```text
TASK D4 — Homepage sections
Read: DESIGN_SYSTEM.md H2 to H9, C-10, C-15, C-17, C-25 · docs/MAQUETTE_PHASE.md section 4
Scope: apps/web home (not the hero), apps/mock-api
Build in maquette mode: H2 to H9 in order, with data from packages/sdk. The hero stays unchanged.
Done when: the full homepage renders from the mock API in fr and en; reveal animations respect reduced motion.
```

```text
TASK D5 — Catalogue, results and calendar
Read: DESIGN_SYSTEM.md CAT, CAL, C-05, C-10, C-11, C-16, C-18
Scope: apps/web catalogue, results and calendar routes, apps/mock-api
Build in maquette mode: CAT with filters in the URL, both views, mobile filter sheet, results tab, empty
state; CAL.
Done when: every filter changes the URL and the results; "Ordre de clôture" becomes the default within an
hour of the first closing (demo clock).
```

```text
TASK D6 — Lot page
Read: DESIGN_SYSTEM.md LOT, C-22, C-23, C-10
Scope: apps/web lot route, apps/mock-api
Build in maquette mode: LOT without the bid panel (leave its column with a skeleton), including the
viewing-day form, documents with visibility and the conditions section per sale mode.
Done when: a full-gallery lot and a short-gallery lot both render perfectly at all widths.
```

```text
TASK D7 — Bidding
Read: DESIGN_SYSTEM.md BID, C-01 to C-03, C-07 to C-09, C-13, C-14, C-17 · docs/SPEC.md "Auction rules and bidding engine"
Scope: apps/web bidding components, apps/mock-api
Build in maquette mode: the desktop panel (items 1–12), the review dialog, the mobile bar and sheet, the
one-tap "Surenchérir", the closed and signed-out states, and toasts. All amounts come from packages/domain.
Done when: in two windows, two demo buyers outbid each other, the extension appears in the last 5 minutes,
and the review totals equal buyerTotal.
```

```text
TASK D8 — "Vendre mon bateau" and "Comment ça marche"
Read: DESIGN_SYSTEM.md SELL, HOW, C-25 · docs/prototypes/vendre_mon_bateau_estimator.tsx (structure and copy)
Scope: apps/web sell and how-it-works routes, apps/mock-api
Build in maquette mode: SELL and HOW. The estimator calls the mock API, which calls estimateHoldingCost.
Done when: the worked example shows "1 108 € / mois"; the lead dialog keeps its unticked consent box.
```

```text
TASK D9 — Account and My bids
Read: DESIGN_SYSTEM.md ACC, C-02, C-11, C-16
Scope: apps/web account routes, apps/mock-api
Build in maquette mode: ACC, plus sign-up, sign-in and verification screens in the same style.
Done when: each My bids tab shows its demo data and its empty state.
```

```text
TASK D10 — Seller portal and after-sale
Read: DESIGN_SYSTEM.md SEL, AFT · docs/MAQUETTE_PHASE.md (task F1)
Scope: apps/web seller and after-sale routes, apps/mock-api
Build in maquette mode: SEL (lots list, decision page, intake wizard) and AFT (timeline, payment
statement, handover code, code entry), covering everything task F1 lists.
Done when: one lot goes from closing to "Terminé" by clicking through as seller and buyer.
```

```text
TASK D11 — Admin
Read: DESIGN_SYSTEM.md ADM, C-11, C-13, C-17 · docs/MAQUETTE_PHASE.md (task F2)
Scope: apps/admin, apps/mock-api
Build in maquette mode: the ADM shell and every screen task F2 lists, including the dark closing board.
Done when: pausing an auction or voiding a bid in admin is visible on the public site in the same session.
```