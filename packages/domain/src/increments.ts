import type { Cents } from "./money";
import type { AuctionRules } from "./rules";

/** The smallest step above a given price, from the increment table. */
export function increment(priceCents: Cents, rules: AuctionRules): Cents {
  let step = rules.increments[0]?.stepCents ?? 0;
  for (const band of rules.increments) {
    if (priceCents >= band.fromCents) step = band.stepCents;
  }
  return step;
}

/** The start price when there are no bids, else the current price plus its step. */
export function nextMinimum(lot: { startCents: Cents; priceCents: Cents | null }, rules: AuctionRules): Cents {
  return lot.priceCents === null ? lot.startCents : lot.priceCents + increment(lot.priceCents, rules);
}
