import type { LotLiveState, LotOutcome, ViewerLotStatus } from "@bba/contracts";
import { formatLength, interpolate, type Locale, type Messages } from "@bba/i18n";
import type { StatusTone } from "@bba/ui";

/** The strings an auction component needs, picked on the server and passed to the client. */
export interface AuctionMessages {
  lot: Messages["lot"];
  status: Messages["status"];
  types: Messages["categories"]["singular"];
  countries: Messages["countries"];
  closesIn: string;
  photoComing: string;
}

export function auctionMessages(messages: Messages): AuctionMessages {
  return {
    lot: messages.lot,
    status: messages.status,
    types: messages.categories.singular,
    countries: messages.countries,
    closesIn: messages.countdown.closesIn,
    photoComing: messages.common.photoComing,
  };
}

export function outcomeStatus(outcome: LotOutcome, messages: AuctionMessages["status"]): { tone: StatusTone; text: string } {
  switch (outcome) {
    case "sold": return { tone: "sold", text: messages.sold };
    case "awaiting_seller": return { tone: "waiting", text: messages.awaitingSeller };
    case "not_awarded": return { tone: "waiting", text: messages.notAwarded };
    case "unsold": return { tone: "waiting", text: messages.unsold };
  }
}

export function viewerStatus(status: ViewerLotStatus, messages: AuctionMessages["status"]): { tone: StatusTone; text: string } {
  switch (status) {
    case "leading": return { tone: "leading", text: messages.leading };
    case "outbid": return { tone: "outbid", text: messages.outbid };
    case "won": return { tone: "leading", text: messages.won };
    case "lost": return { tone: "waiting", text: messages.lost };
    case "awaiting_seller": return { tone: "waiting", text: messages.awaitingSeller };
  }
}

/** "Enchère actuelle", "Prix de départ" or "Enchère finale", with the amount it labels. */
export function priceLabel(state: LotLiveState, startCents: number, messages: AuctionMessages["lot"]): { label: string; cents: number } {
  if (state.priceCents === null) return { label: messages.startingPrice, cents: startCents };
  return { label: state.phase === "closed" ? messages.finalBid : messages.currentBid, cents: state.priceCents };
}

/** "2016 · 11,40 m · Voilier". */
export function lotSpecs(lot: { yearBuilt: number; lengthCm: number; type: keyof AuctionMessages["types"] }, locale: Locale, messages: AuctionMessages): string {
  return interpolate(messages.lot.specs, { year: lot.yearBuilt, length: formatLength(lot.lengthCm, locale), type: messages.types[lot.type] });
}
