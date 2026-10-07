# Competitive review

2026-10-06. The client named four reference sites. This note records what each does well, what the maquette takes from it, and what it deliberately leaves out.

## BoatAuction.com (boatauction.com/fr)

The closest model, and the one the original specification follows.

- Monthly sales closing on a Monday evening, lots one minute apart, 5-minute extension in the last 5 minutes.
- Tiered buyer's premium (18 / 12 / 8 % by start price) plus VAT on it; a live cost calculator in the bid box; normal or automatic (maximum) bidding.
- Payment to escrow within two days, collection within 14 days.
- Lot pages: large gallery, specification groups, "points of attention", viewing-day registration, map, similar lots.
- "Bailiff supervision" and judicial auctions as trust signals.

Taken: the bidding mechanics, the total shown before confirming, points of attention, similar lots. Changed to the client's model: a single 10 % commission, a viewing per boat.

## YachtBid (yachtbid.com)

- Countdown on every card, a featured auction, "newest yachts", a four-step "how it works".
- Seller promise "sell in 3 months", success rate, "Hall of Fame" of sold yachts, partner logos.
- A broker programme ("your broker fee is protected") and published company details.
- Bidding requires a paid bid access or membership.

Taken: the broker programme and broker space, a recently sold showcase (results and market section), escrow reassurance. Left out: claims we cannot support yet (success rates, statistics, partner logos) and paid bid access.

## Boathouse Auctions (boathouseauctions.com)

- Time-certain selling ("four weeks or less"), urgency for buyers, seller testimonials, broker partner logos.
- A cost-of-ownership calculator.

Taken: time-certain selling (about 30 days, fixed closing date) in the comparison table. The maquette's holding-cost estimator already goes further: monthly cost, line-by-line breakdown, waiting cost and broker comparison. Testimonials wait for real sellers.

## LesAnciennes (lesanciennes.com), classic cars

- Public questions on each lot, answered by the seller; "reserve met / not met"; number of bids and of people saving the lot; bid history; a highlights box; a "buy with us" box explaining the process.
- An ecosystem beyond auctions: classifieds, events, professional directory.

Taken: public questions and answers on each lot, the follower count, the reserve indicator, the services ecosystem (financing, insurance, services) and the "around this boat" block on each lot.

## Where the maquette goes further

- Every fee and total comes from one tested rules package and is shown before bidding.
- The seller sees what keeping the boat costs, what waiting costs and what selling costs, before leaving any contact details.
- Viewing, questions, documents and conditions on one lot page, with the next steps and services around the boat.
- French and English throughout, accessible (keyboard, screen readers, reduced motion), and a backend contract ready for Supabase and Stripe.
