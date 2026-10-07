# Motion implementation verification

2026-10-05. Verification of the implemented homepage and seller motion pass, after the earlier audit. Final photographs remain deferred.

## Results

- `pnpm lint`, `pnpm typecheck`, `pnpm build`: pass on the final application source.
- `pnpm test`: 30 browser checks pass in installed Chrome, including the original hero checks and ten motion/interaction checks.
- `pnpm test:visual`: 32 existing hero comparisons pass, French/English, four auction states, widths 390, 768, 1280 and 1920. No baseline images were changed.
- The hero and preview controls have no axe violations in the tested WCAG 2/2.1/2.2 AA scope, across four languages and four states. This is not a whole-site accessibility certification.

Normal-motion tests record computed opacity on browser animation frames before scrolling/replay, and assert real intermediate values and final visibility. This avoids missing short transitions during tool round trips. Checks cover once-only section reveals, no re-entry during auction clock updates, actual hero replay timing, unchanged countdown node/deadline, and seller sections appearing after lazy route mounting.

Reduced-motion tests confirm immediate visibility, disabled hero/section/reference decorative effects and live preference changes. Dialog checks confirm native modal state, focus inside the dialog through keyboard navigation, scroll locking, Escape and return to its trigger. The skip link keeps the seller route and focuses shared content. Native rail controls scroll their own row at all four review widths without document overflow. At 390 px the French homepage and embedded seller fit the viewport; a slider adjustment retains its total node and shows the updated number immediately. The seller mounts one header and one footer.

## Visible evidence

`apps/web/scripts/record-motion-preview.mjs` records the actual local production build with normal motion and native wheel input. It produces:

- `output/qa/tidebid-motion-desktop.webm` and `.mp4`: 1280 × 800, English, opening, homepage scroll and replay.
- `output/qa/tidebid-motion-mobile.webm` and `.mp4`: 390 × 844, French, opening, homepage scroll and replay.
- `output/qa/tidebid-desktop.png` and `tidebid-mobile.png`: viewport screenshots.
- `output/qa/motion-preview-observations.json`: all four homepage reveal groups finish visible at opacity 1; document widths equal 1280 and 390 respectively; no page errors.

MP4 copies were encoded locally from the recordings. Generated review artifacts are ignored source outputs. Full-page captures also exist; fixed navigation appears at the captured scroll position, so use the viewport screenshots or clips to assess normal page composition.

The Codex browser was refreshed to the final build. Normal motion was enabled, the hero animation was present and offscreen homepage groups were waiting for entry. The English homepage was left open, with the replay and language controls below the hero.

## Limits and next work

The pass applies visible motion to the homepage and seller groups, fixes shared modal/skip behavior and keeps the hero composition locked. Lower-page illustration placeholders remain pending final imagery. Catalogue/lot/account journeys still contain reference UI and English copy; gallery transitions and complete navigation focus/history restoration are future work. Dutch/German body translations need native review and currently fall back to English.

No new Lighthouse, field INP or scrolling frame-rate measurement is claimed. Existing performance reports predate this pass. Production authentication, auctions and payments remain unimplemented demonstrations.
