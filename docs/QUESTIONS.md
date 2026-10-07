# Pending decisions

## For the client meeting

1. **Brand name and logo.** The site uses Best Boat Auction with the supplied BBA sail logo. The client's presentation says Boost Boat Auctions, with another logo. Which name and logo go live? (The name is one constant in `packages/i18n/src/brand.ts`.)
2. **Buyer's commission and VAT.** The presentation says 10 % of the final price. The site adds 20 % VAT on the commission (12 % in total for the buyer). Is the 10 % before or including VAT?
3. **Broker remuneration.** Applied from the corrected slide: the broker who brings the boat keeps their mandate commission; the broker who brings the buyer receives 50 % of the buyer's commission (before VAT), paid after handover. Confirm that the 50 % is paid on the commission excluding VAT, and who pays the mandate commission (the seller, outside the platform).
4. **Bidding period and calendar.** The site keeps one sale a month (third Monday, 20:00) with about 30 days of bidding, so each sale opens as the previous one closes. Should boats instead run on individual 30-day auctions, independent of a monthly sale?
5. **Viewings.** Each boat has a viewing fixed with the seller or the broker. Is a fixed public slot per boat right, or by appointment only?
6. **Packs.** Are the Boost and Premium packs paid when listing, or deducted from the sale? Refundable if the boat does not sell?
7. **Reserve price and seller decision.** The site lets the seller set a confidential reserve and gives 72 h to accept the best offer below it. Confirm.
8. **Financing, insurance and services partners.** Which partners, and should requests go to them directly?
9. **Identity checks and bidder deposits.** The site asks for an identity check from 25 000 €. Is a card hold or deposit wanted for large bids?
10. **Launch wording and sale mode.** Review the hero's "Ventes aux enchères" copy together with the legal sale mode before publication.

## Later stages

- **Providers.** Supabase (auth, data, realtime) and Stripe (card holds, escrow partner) are the intended integrations; the compliant money and handover flow is decided at that stage.
- **Domain.** Not chosen.
- **Photography.** Replace the supplied lot photographs (third-party copyright, see `assets/CREDITS.md`) and approve final hero crops; replacing the hero photograph requires new visual baselines.
- **Translation.** English needs native review.
- **Legal texts.** Legal notice, terms, privacy and cookies pages show their outline until counsel provides the texts.
