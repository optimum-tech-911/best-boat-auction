import { applyBid, type AuctionRules, type Cents, type EngineLot } from "@bba/domain";

export type MaxBidOutcome =
  | { ok: true; priceCents: Cents; leader: "yours" | "rival" }
  | { ok: false; field: "yours" | "rival"; minimumCents: Cents };

/**
 * SC-04's worked example, run through the real bidding engine: the competing maximum is placed
 * first on a fresh lot, then the reader's. Equal maximums go to the earlier one, as in the
 * specification's test vectors 1 to 4.
 */
export function compareMaxBids({ startCents, rivalCents, yoursCents }: { startCents: Cents; rivalCents: Cents; yoursCents: Cents }, rules: AuctionRules): MaxBidOutcome {
  const lot: EngineLot = {
    status: "live",
    startCents,
    reserveCents: null,
    priceCents: null,
    leader: null,
    leaderCeilingCents: 0,
    leaderCeilingAt: 0,
    endsAt: Number.MAX_SAFE_INTEGER,
    extensions: 0,
  };
  const first = applyBid(lot, { bidder: "rival", kind: "max", amountCents: rivalCents }, 1, rules);
  if (!first.ok) return { ok: false, field: "rival", minimumCents: first.minimumCents ?? startCents };
  const second = applyBid(first.lot, { bidder: "yours", kind: "max", amountCents: yoursCents }, 2, rules);
  if (!second.ok) return { ok: false, field: "yours", minimumCents: second.minimumCents ?? startCents };
  return { ok: true, priceCents: second.lot.priceCents ?? startCents, leader: second.lot.leader === "yours" ? "yours" : "rival" };
}
