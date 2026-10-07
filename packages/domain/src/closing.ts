import type { Cents } from "./money";
import type { LotEvent } from "./lifecycle";

/**
 * Regulated: a public auction in which reaching the reserve (or a no-reserve lot) awards at closing.
 * Brokerage: the seller confirms every sale; the reserve is only a target shown to the seller.
 */
export type SaleMode = "regulated" | "brokerage";

export interface ClosingLot {
  priceCents: Cents | null;
  reserveCents: Cents | null;
  noReserve: boolean;
}

/** True only when a reserve exists and the price has reached it. */
export function isReserveMet(lot: Pick<ClosingLot, "priceCents" | "reserveCents">): boolean {
  return lot.priceCents !== null && lot.reserveCents !== null && lot.priceCents >= lot.reserveCents;
}

/** The specification's "Outcome at closing" table, as the lifecycle event to apply. */
export function closingEvent(lot: ClosingLot, mode: SaleMode): Extract<LotEvent, "closes_without_bids" | "closes_awarded" | "closes_for_review"> {
  if (lot.priceCents === null) return "closes_without_bids";
  if (mode === "regulated" && (lot.noReserve || isReserveMet(lot))) return "closes_awarded";
  return "closes_for_review";
}

/** In brokerage mode the seller confirms every sale, so a no-reserve badge is unavailable. */
export function canOfferNoReserve(mode: SaleMode): boolean {
  return mode === "regulated";
}
