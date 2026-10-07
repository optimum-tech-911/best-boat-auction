# DESIGN_V1_1.md — Homepage v2, motion, diagrams and page roadmap

This file extends `docs/design/DESIGN_SYSTEM.md`. Where they differ, this file wins. The rules of section 0 of DESIGN_SYSTEM.md still apply: no invention, conformance checklist, screenshot baselines.

The screenshots attached to a task show the **current state**. Use them to locate sections, never as the target.

---

## 1. Review of the current build

| # | Section | Keep | Fix |
| --- | --- | --- | --- |
| S1 | Live bids and latest results | Two-column idea, aliases, relative times | Unbalanced columns (7 rows against 2); green live dot (must be orange); "Vendu" pills; no thumbnails; too few results |
| S2 | Seller band | Navy panel with photo, strong serif headline | No mini estimator, so the cost-of-waiting hook is missing; "Photo d'illustration" label on a marketing image |
| S3 | "Inspectez avant d'enchérir" | Editorial layout: image left, list with dividers right | The "commissaire de justice" claim is not decided (Q1); icons in teal; illustration label |
| S4 | Boat types | Bordered editorial grid, numerals, serif names, counts | The sloep photo is a close-up while the others show whole boats; check the "III" marks on the motorboat hull; no hover or reveal |
| S5 | Next lots to close | Card anatomy, price and countdown hierarchy, orange countdown under 1 h | "Express" and "Clôture imminente" pills over the photos; round heart buttons; arrows sitting under the button; real brand names; "SÉLECTION DE DÉMONSTRATION" shown publicly |
| S6 | Hero and header | Typography, buttons, rail states | Image (being regenerated); "34 lots" and "20:00" format; the header does not follow G1 |
| S7 | Sell page | Results hierarchy (1 108 € headline) | Teal pills and teal labels; 16–24 px radii; pill toggles; € before the amount in French; bars in teal |

---

## 2. G0 — Global corrections (apply everywhere)

- **G0-1 No pills.** Labels on images use C-06 (2 px radius, ivory). Statuses use C-07 (dot plus uppercase text). Filters and options use C-05 (4 px radius). The only fully round elements allowed are dots, avatar initials and slider thumbs.
- **G0-2 Teal discipline.** Teal-700 only for bid buttons, text links, the focus ring and the active-tab underline. Everything currently teal changes to the following:

| Element now in teal | Becomes |
| --- | --- |
| Selected chips, slider fills, progress bars | navy-900 |
| Field labels, eyebrows | stone-600 |
| Icons | navy-900 |
| Chart segments | the chart palette (G0-11) |

- **G0-3 Live dot.** The live dot is orange-600, 8 px, static, always next to the word "EN DIRECT".
- **G0-4 Radii.** Nothing above 8 px. Panels and cards 6 px, inputs and buttons 4 px, dialogs 8 px.
- **G0-5 Watch button.** The heart becomes a 36 px square (4 px radius), ivory at 92% opacity, as in C-10.
- **G0-6 Illustration labels.** Remove "Photo d'illustration" from every marketing image (hero, story, seller band, categories). In demo mode, lot photos get one discreet caption per section ("Photos d'illustration · données de démonstration", caption style, stone-600), not one per image.
- **G0-7 Truthful claims.** Remove "Un commissaire de justice indépendant supervise la clôture…" and any bailiff or notary claim. They may only appear in an auction whose sale mode is `regulated` and whose partner is named.
- **G0-8 Header.** Apply blueprint G1 exactly:
  - Navigation: "Ventes en cours · Résultats · Calendrier · Comment ça marche".
  - The search field becomes a search icon that opens an overlay.
  - The FR/EN toggle becomes the C-24 menu with all four languages.
  - "Se connecter" becomes the text link "Connexion".
  - Add the primary button "Vendre mon bateau".
  - The bell icon is shown only to signed-in users.
- **G0-9 Data truth.** Every count, date and name comes from the mock API: "12 lots", never "34". "SÉLECTION DE DÉMONSTRATION" becomes the sale's eyebrow (for example "VENTE D'OCTOBRE · CLÔTURE LUNDI 19 OCT. DÈS 20 H"). The demo indication lives only in the demo bar and the G0-6 caption.
- **G0-10 Formats.** Dates as "lundi 19 octobre · 20 h 00"; money inputs in French as "60 000 €" with the symbol after the amount. Always through the packages/i18n formatters.
- **G0-11 New tokens.**

  | Token | Value |
  | --- | --- |
  | `chart-1` | navy-900 #0B1F33 |
  | `chart-2` | navy-700 #1E3A52 |
  | `chart-3` | navy-500 #3E5F7D |
  | `chart-4` | mist-300 #A9B4BF |
  | `chart-5` | stone-600 #6B6559 |
  | `chart-6` | stone-300 #D8D2C6 |
  | `chart-7` | stone-200 #E6E1D8 |

  These are for diagrams and charts only. Each segment shows its value in text, never by colour alone.
- **G0-12 C-26 Slider.** A 4 px track in stone-200 with a navy-900 fill. A 20 px white thumb with a 2 px navy-900 border. The teal focus ring. The value shown next to the label in num-s.

---

## 3. Motion and scroll v1.1

**Page types**

- **Editorial pages** (home, sell, "Comment ça marche", calendar, results) use the effects below.
- **Transactional pages** (catalogue, lot, bidding, account, seller portal, after-sale, admin) use functional motion only: animations 5–8 of DESIGN_SYSTEM.md section 6, plus M15 and M18. A buyer about to bid must never wait for an animation.

**New effects** (added to the allowed list):

| ID | Effect | Specification |
| --- | --- | --- |
| M10 | Masked image reveal | On first entry into view: `clip-path: inset(6%)` → `inset(0)` and scale 1.06 → 1, 900 ms, standard easing, once. Editorial images only. Category tiles stagger by 60 ms. |
| M11 | Heading rise | Section heading block: translateY 24 px → 0 with opacity 0 → 1, 600 ms; the eyebrow 120 ms earlier. Whole block, no line splitting, so it works in all four languages. |
| M12 | Divider draw | The section's 1 px top divider scales from 0 to 100% width, origin left, 800 ms, when the section enters. |
| M13 | Sticky story progress | For H3 (section 5). The progress rail fill follows scroll position through the steps: CSS scroll-driven animation inside `@supports (animation-timeline: view())`, with an IntersectionObserver fallback that fills by step. |
| M14 | Carousel | Horizontal scroll-snap, mouse drag on desktop, arrow buttons move one card with smooth scrolling, a 2 px progress line under the track (its thumb follows scroll position), a 64 px fade mask on the right edge on desktop. Never autoplay. |
| M15 | Live row insertion | A new row enters at the top: its height animates from 0 using the FLIP technique (240 ms), then a teal-50 background flash fades over 1200 ms. At most 6 rows; the oldest fades out. |
| M16 | Diagram draw | When a diagram enters view: SVG lines draw through stroke-dashoffset (900 ms), nodes fade in staggered by 120 ms, once. |
| M17 | Hero settle on scroll | While the hero scrolls out, its image scales 1 → 1.04 and its text opacity goes 1 → 0.7. CSS scroll-driven animation only, no JavaScript. Off below 1024 px and with reduced motion. |
| M18 | Sticky lot sub-navigation | The active link's underline slides to the new link (240 ms) as sections pass. |

**Implementation rules**

- Use only CSS, one shared `useInView` hook (IntersectionObserver) and the CSS scroll-driven animations above. Add no animation library.
- Animate only `transform`, `opacity` and `clip-path`. Never animate layout properties.
- Start states apply only when JavaScript runs (a `js` class added to `<html>` by an inline script). Content is visible without JavaScript, and the hero's largest image is never hidden.
- Below-the-fold sections use `content-visibility: auto` with a size hint.
- With reduced motion, M10–M17 become a 120 ms opacity change, and smooth scrolling is off.
- Every animated section's pull request includes a Playwright video at 1280 px and a reduced-motion screenshot.

**Still forbidden:** parallax backgrounds, scroll hijacking, autoplay, looping decorative animation, numbers counting up from zero.

---

## 4. Diagrams (SC-01 to SC-07)

All diagrams are hand-built SVG components in `packages/ui/diagrams`:

- They scale through `viewBox`, use only tokens, take their text from i18n and their values from props (data or packages/domain).
- Each has a `<title>`, a `<desc>`, and a visually hidden text version for screen readers.
- Under 768 px they switch to a vertical layout where noted.

**SC-01 Sale journey**

- Six nodes on a line: Dépôt du bateau → Visite → Enchères en ligne → Clôture → Paiement → Remise.
- Under each node: its real date from the auction (for example "avant le 26 oct.", "sam. 14 nov. · 10 h – 12 h", "lun. 16 nov. dès 20 h", "sous 4 jours", "sous 14 jours").
- Horizontal on desktop, vertical on mobile.
- **Mini version:** three nodes (Dépôt, Visite, Clôture) for the calendar strip and the sell page.

**SC-02 Soft close**

- A time axis from 19:55 to 20:03, with a marker "20:00 · clôture prévue".
- A bid marker at 19:57:30, and an arrow showing the new end at "20:02:30".
- The shaded last-5-minutes window in stone-200.
- Caption: "Une offre dans les 5 dernières minutes prolonge le lot de 5 minutes. Personne ne gagne à la dernière seconde."
- Values come from the settings (window and extension).

**SC-03 Escrow flow**

- Three nodes: "Acheteur" → "Compte séquestre · établissement agréé" → "Vendeur".
- Four numbered steps along the arrows: 1 Paiement · 2 Signature du transfert · 3 Remise avec votre code · 4 Versement au vendeur.
- **Tracker mode** (after-sale pages): the `currentStep` prop marks finished steps in navy-900, the current one with an orange-600 dot, and the following ones in stone-300.

**SC-04 Maximum bid explained** (interactive)

- A price scale with two markers: "Votre maximum" and "Maximum concurrent".
- The resulting price and leader are computed by packages/domain `applyBid`.
- Two money inputs let the reader try values.
- Caption: "Le système enchérit pour vous, palier par palier, jusqu'à votre maximum."

**SC-05 Cost anatomy**

- One horizontal stacked bar, 16 px high, `radius-s`. Segments use chart-1 to chart-7 in decreasing order of size.
- Below it, a two-column legend: a 10 px colour square, the label, the monthly value in num-s, and the percentage.

**SC-06 Cost of waiting**

- A 12-month axis with the cumulative holding cost as a navy-900 line over a stone-100 area.
- Markers at 3, 6 and 12 months, each with its value; the selected period's marker is emphasised.
- Values come from `estimateHoldingCost`.

**SC-07 Price breakdown**

- One stacked bar: "Votre enchère" (chart-1) · "Frais acheteur" (chart-3) · "TVA sur les frais" (chart-5), with the total at the right end in title-m.
- Values come from `buyerTotal`.

---

## 5. Homepage v2 (section order and target)

1. **H1 Hero.**
   - Keep the brief; add M17.
   - Rail: lot count, sale date and the next lot from data.
   - Use the regenerated `heroes/home.jpg`.
2. **H2 Next lots to close (carousel).**
   - Header row:
     - Left: eyebrow from data, H2 "Les prochains lots à clôturer", the existing sub-line.
     - Right, aligned with the H2 baseline: previous and next buttons (36 px square, 1 px stone-300, chevron icons) and the link "Tous les lots (12) →".
   - Track (M14): about 3.4 cards visible from 1024 px (3 full cards and a peek), 1.15 under 768 px. Gap 32 px on desktop, 16 px on mobile.
   - Cards: C-10 with G0 applied: no overlay pills; an orange countdown under 1 h; one C-06 badge "Sans prix de réserve" where it applies.
   - One G0-6 caption under the track.
3. **H3 How it works (sticky story).**
   - Header: eyebrow "COMMENT ÇA MARCHE", H2 "Quatre étapes, des règles claires".
   - **From 1024 px:** two parts.
     - Left 5 columns, sticky at 120 px from the top: the header and a vertical progress rail. The rail is 2 px wide and 240 px high, stone-300 with a navy-900 fill (M13), with labels 01 Inspectez · 02 Enchérissez · 03 Payez en séquestre · 04 Récupérez. The active label is navy-900, the others stone-600.
     - Right 7 columns: four step panels, each at least 70vh high with content centred vertically. Each panel: numeral (display-m, stone-600), title (display-s), text (body-l, stone-600, at most 3 lines) and its visual:
       - 01: the viewing-day photo (3:2, M10) and a bordered block "Samedi 17 octobre · 10 h – 12 h" from data.
       - 02: SC-02 (M16).
       - 03: SC-03 (M16).
       - 04: a handover-code vignette: six digit boxes in num-l, a 120 px QR, and the caption "Le vendeur saisit votre code à la remise des clés."
   - **Under 1024 px:** no sticky part; the steps stack with their visuals, each revealed on entry.
   - Closing link: "Tout savoir sur les enchères →" to the "Comment ça marche" page.
4. **H4 Boat types.**
   - Keep the current bordered grid.
   - Add M10 on the images (60 ms stagger), an image scale of 1.03 and an arrow nudge on hover, counts from data.
   - Use the regenerated sloep image (the whole boat in context).
5. **H5 Seller band.**
   - Keep the navy panel and photo layout (photo with M10, no label).
   - New content:
     - Eyebrow "VENDRE VOTRE BATEAU" and H2 "Chaque mois, votre bateau vous coûte de l'argent."
     - The C-25 mini estimator: three inverse inputs in one row (type, longueur, valeur).
     - Live result "≈ 1 108 € par mois" in num-xl ivory, using animation 5 when it changes (150 ms debounce), with the caption "Estimation indicative à partir de moyennes publiques" (mist-300).
     - Buttons: primary-inverse "Calculer le coût complet →" (opens /sell with the three values prefilled) and secondary-inverse "Vendre mon bateau".
6. **H6 Inspect before bidding.**
   - Keep the current layout; add M10 on the image, M11 on the heading, M12 on the dividers.
   - The list, with navy-900 icons:

   | Item | Text |
   | --- | --- |
   | Une visite avant chaque vente | (unchanged) |
   | Des offres horodatées et publiques | Chaque offre est horodatée et visible dans l'historique du lot. |
   | Une clôture prolongée si nécessaire | (unchanged) |
   | Un paiement protégé | Les fonds sont détenus par un établissement de paiement agréé jusqu'à la remise du bateau. |
   | Des frais transparents | (unchanged) |

7. **H7 The market right now.**
   - Header: eyebrow "EN CE MOMENT", H2 "Le marché en direct".
   - Stat strip of three figures from data, in num-l with body-s labels and 1 px dividers between them: "12 lots en vente" · "86 enchères aujourd'hui" · "Prochaine clôture dans 04:52" (C-08). A figure of 0 is hidden.
   - Two columns (7 and 5), rows 64 px high, top-aligned:
     - **Left, "Enchères en direct"**, with the orange dot and an "EN DIRECT" eyebrow. Six rows: 56 × 42 thumbnail, "Enchérisseur 3355" (title-m), "sur Solenne 38 · il y a 1 min" (body-s, stone-600), amount in num-m on the right. New rows enter with M15. Link "Voir les lots en cours →".
     - **Right, "Derniers résultats".** Six C-17 rows: thumbnail, title, date, final price in num-m, C-07 status (VENDU, NON ATTRIBUÉ). Link "Tous les résultats →".
8. **H8 Upcoming sales.**
   - Three columns from the calendar, the next sale marked by a 2 px navy-900 top border.
   - Each column: month in display-s and SC-01 mini with real dates.
   - Below: the link "Vendre mon bateau →".
9. **H9 Newsletter** and **G2 footer**, as specified in DESIGN_SYSTEM.md.

---

## 6. Sell page v2 (changes from the current state)

- **Inputs:** C-05 chips, eyebrow labels in stone-600, C-26 sliders, the value input in French format ("60 000 €"), 4 px radii, panels with a 6 px radius.
- **Results panel:**
  - Keep the 1 108 € headline and its sub-line.
  - Replace the per-row bars with SC-05 (bar plus legend).
  - Keep it sticky at 96 px from the top on desktop.
- **Waiting panel:**
  - navy-900 background, 6 px radius.
  - C-03 tabs on dark: active tab in ivory with a 2 px ivory underline.
  - The value in num-xl ivory, then SC-06 (M16).
  - "Valeur aujourd'hui" and "Dans 12 mois" blocks with a 1 px ivory border at 16% opacity and 4 px radius.
- **Selling costs:** a C-17 two-row table ("Courtier (8 %)" and "Frais vendeur Best Boat Auction") with a difference line "Vous gardez 4 600 € de plus" (title-m, success-700).
- **Next sale:** SC-01 mini with real dates, then the primary lg button "Vendre à la vente du 16 novembre".
- **Motion:** the page is editorial, so M10, M11 and M16 apply; nothing moves while the user changes an input except the price animation.

---

## 7. Roadmap for the remaining pages

| Order | Task | Page type | Diagrams | Motion |
| --- | --- | --- | --- | --- |
| 1 | G0 Global corrections | All | — | — |
| 2 | DATA-1 Demo data upgrade | — | — | — |
| 3 | HV2-1 Homepage: H2 and H3 | Editorial | SC-02, SC-03 | M10, M11, M13, M14, M16, M17 |
| 4 | HV2-2 Homepage: H4 to H9 | Editorial | SC-01 mini | M10, M11, M12, M15 |
| 5 | SELL-V2 Sell page | Editorial | SC-01 mini, SC-05, SC-06 | M10, M11, M16 |
| 6 | HOW-V2 "Comment ça marche" | Editorial | SC-01 to SC-04, SC-07 | M10, M11, M16 |
| 7 | D5 Catalogue, results, calendar | Transactional (calendar editorial) | SC-01 mini on calendar | M14 none; skeletons |
| 8 | D6 Lot page | Transactional | SC-02 in "Conditions" | M18 |
| 9 | D7 Bidding | Transactional | SC-07 in the review dialog (static) | Functional plus M15 for the bid history |
| 10 | D9 Account and My bids | Transactional | — | Functional |
| 11 | D10 Seller portal and after-sale | Transactional | SC-03 in tracker mode | Functional |
| 12 | D11 Admin | Transactional | — | M15 on the closing board |
| 13 | F3 Demo polish and client preview | All | — | Review videos |

---

## 8. Task prompts

Every prompt below ends with:

```text
Follow the Task workflow in AGENTS.md. Apply docs/design/DESIGN_SYSTEM.md and docs/design/DESIGN_V1_1.md exactly.
The attached screenshots show the current state, not the target. Include the conformance checklist,
before/after screenshots at 390, 1280 and 1920 px, and for animated sections a Playwright video at 1280 px
plus a reduced-motion screenshot.
```

```text
TASK G0 — Global design corrections
Read: DESIGN_V1_1.md sections 1 and 2 · DESIGN_SYSTEM.md sections 2–10 and G1
Scope: apps/web (all existing routes), packages/ui
Build: apply G0-1 to G0-12 on every existing page and component, plus C-26. Change nothing else.
Done when: every G0 item has a before/after screenshot; scripts/check-design-tokens passes; no
fully round element remains except dots, avatar initials and slider thumbs.
```

```text
TASK DATA-1 — Demo data upgrade
Read: DESIGN_SYSTEM.md 14.3 · DESIGN_V1_1.md G0-9 · docs/ASSETS.md
Scope: apps/mock-api seed, docs/ASSETS.md
Build: replace the prototype lots with the 12 demo boats of DESIGN_SYSTEM.md 14.3 (title, type, length,
year, location, start price, reserve; Kerlys 31 without reserve). Remove the "flash" auction from public
pages: the demo clock shows closings instead. Add a past sale "Vente de septembre" with 10 closed lots
(7 sold, 2 not awarded, 1 unsold), bid histories generated through packages/domain, each using a category
image as its photo. Lot photos load from assets/raw/lots/<number>-<slug>/ when the files exist, otherwise
the placeholder. Every count and date on every page comes from this data.
Done when: home, catalogue and results show only the demo boats and the past sale; counts match the data.
```

```text
TASK HV2-1 — Homepage: next lots carousel and "Comment ça marche" story
Read: DESIGN_V1_1.md sections 3, 4 (SC-02, SC-03) and 5 (H1, H2, H3)
Scope: apps/web home (sections H1 to H3 only), packages/ui (diagrams, carousel)
Build: H2 as specified with M14; H3 sticky story with M13, its four visuals, SC-02 and SC-03 with M16;
M17 on the hero. The rest of the page stays unchanged.
Done when: the carousel works by mouse drag, trackpad, arrows and keyboard; the progress rail follows
scrolling in Chrome and in a browser without scroll-driven animations (fallback); reduced motion shows
static content.
```

```text
TASK HV2-2 — Homepage: boat types to footer
Read: DESIGN_V1_1.md sections 3, 4 (SC-01 mini) and 5 (H4 to H9) · DESIGN_SYSTEM.md C-25, G2
Scope: apps/web home (sections H4 to H9 and footer), apps/mock-api (stats endpoint)
Build: H4 adjustments, H5 with the live mini estimator, H6 copy and icons, H7 with stats and M15,
H8 with SC-01 mini, H9 and G2.
Done when: the mini estimator shows "1 108 €" for a 10 m motorboat valued at 60 000 € and passes its values
to /sell; a new demo bid appears at the top of "Enchères en direct" with M15.
```

```text
TASK SELL-V2 — Sell page
Read: DESIGN_V1_1.md sections 2, 3, 4 (SC-01 mini, SC-05, SC-06) and 6 · DESIGN_SYSTEM.md SELL
Scope: apps/web sell route, packages/ui
Build: every change in section 6.
Done when: the worked example shows 1 108 € with SC-05 segments matching the estimator lines; switching
3/6/12 months updates the value and the SC-06 marker; values passed from the homepage are prefilled.
```

```text
TASK HOW-V2 — "Comment ça marche" page
Read: DESIGN_V1_1.md sections 3 and 4 · DESIGN_SYSTEM.md HOW · docs/SPEC.md "Auction rules and bidding engine"
Scope: apps/web how-it-works route, packages/ui
Build, in this order:
1. Page header.
2. SC-01 full version with the next sale's dates.
3. "Enchérir": SC-04 interactive, then SC-02.
4. "Les frais": the premium and seller-fee tables, plus SC-07 with a calculator (start price, bid).
5. "Payer et récupérer": SC-03 and the handover-code vignette.
6. FAQ accordion.
7. Dark call-to-action band.
Done when: SC-04 gives the same results as test vectors 1–4 of the spec; SC-07 matches buyerTotal for
test vectors 16 and 17.
```

**For D5, D6, D7, D9, D10 and D11**, use the prompts in DESIGN_SYSTEM.md section 15 and add this line to each:

```text
Also apply DESIGN_V1_1.md: G0 corrections, the motion rules for this page type (section 3) and the
diagrams listed for this task in section 7.
```

---

## 9. Animation review checklist (every animated pull request)

- [ ] The Playwright video shows each effect once, with no jump or flicker.
- [ ] With reduced motion, all content is visible and nothing moves except quick fades.
- [ ] With JavaScript disabled, all content is visible.
- [ ] Lighthouse on the page: LCP, CLS and INP within the budgets; no long task above 50 ms during scrolling.
- [ ] The carousel and the sticky story work by keyboard; focus stays visible.
- [ ] No animation delays an action: the bid button, forms and links respond at once.