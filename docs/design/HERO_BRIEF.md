# D1 — Homepage hero

## Scope

Redesign only the homepage hero, directly beneath the existing header. The remaining sections and header are reference UI for now. Follow the user's 2026-10-05 frontend-first direction. Final photography and production integrations arrive later.

## Editorial direction

Premium European maritime auction house: event/editorial presentation inspired by RM Sotheby's, marine photography and clear transactional information. Avoid SaaS aesthetics, large rounded containers, floating cards, glassmorphism, decorative tech motion, floating boats, parallax and scroll hijacking.

Desktop: full-width photograph, about 740–820 px / 82vh. Boat toward the right; left-aligned content on the global grid, at most about 680 px wide, vertically centred slightly above the midpoint. Protect the left text with:

```css
linear-gradient(90deg, rgba(6,20,32,.86) 0%, rgba(6,20,32,.60) 38%, rgba(6,20,32,.16) 68%, rgba(6,20,32,0) 100%)
```

Mobile: approximately 90svh and at least 700 px, expandable for translations, larger text or small screens. Portrait art direction, boat visible in upper half, lower text protected by a vertical gradient. Stacked, nearly full-width buttons and a compact auction footer.

## French copy

- Eyebrow: VENTES AUX ENCHÈRES • BATEAUX EN EUROPE
- Heading: Des bateaux remarquables. / Vendus autrement.
- Description: Achetez et vendez des bateaux aux enchères en ligne, avec des offres en temps réel, des informations transparentes et des visites avant-vente.
- Primary: Voir les lots →
- Secondary: Vendre mon bateau
- Trust: Enchérisseurs vérifiés · Paiement sécurisé · Frais transparents

Use Instrument Serif (72–84 px desktop; 44–52 px mobile) and Inter. Use the tokens in decision 0003 and tabular numerals.

## Auction rail

Flat horizontal rail with a fine top border. Four typed fixtures: open with a long countdown, closing live with next lot/countdown/current bid and extension notice, upcoming with next sale and submission deadline, and closed with results. The supplied closing example is October, 34 lots, Jeanneau Sun Odyssey 410, 04:28, €42,500. Preview controls and an explicit demonstration label sit beneath the hero.

## Components and data

AuctionHero, HeroMedia, HeroContent, HeroActions, HeroTrustLine and HeroAuctionStatus live in the home feature. LiveIndicator and Countdown live in packages/ui. Text and formatting live in packages/i18n. Data comes from a separate packages/sdk fixture through typed contracts. Draft en/nl/de copy for later native review.

## Motion, media, accessibility

Desktop photo scale 1.025 → 1 over 1200 ms; restrained staggered text/rail entrance; arrow moves 4 px on hover. Mobile displays its photograph immediately to prioritise the first paint. No continuous decorative animation. Reduced motion disables these effects. Countdown uses role=timer and aria-live=off. Live status is expressed in words and a dot. Strong contrast and visible keyboard focus.

Use picture and Next getImageProps for desktop/mobile art direction, explicit dimensions and sizes, eager load and high priority only for the hero. Local credited placeholder until the final images arrive. No autoplay video.

## Review criteria

Check widths 390, 768, 1280 and 1920 in fr/en for all four states; smoke-check nl/de and small-screen/reduced-motion rendering. Verify working CTAs, no hero accessibility violations, production build, lint and typecheck. Record screenshot baselines. Report the production Lighthouse results and any limitation caused by the retained reference UI. Final photography requires a refreshed visual approval.
