import type { BidKind, BidRejectionCode, Cents } from "@bba/domain";
import type { CountryCode, Instant, LotLiveState } from "./catalogue";

/**
 * One line of a lot's public bid history: amount, time and a stable pseudonym per bidder
 * per auction with a country flag. It never marks which bids were automatic, except to the
 * bidder who placed them.
 */
export interface BidHistoryEntry {
  lotId: string;
  seq: number;
  alias: string;
  country: CountryCode;
  amountCents: Cents;
  at: Instant;
  isViewer: boolean;
  /** Only present on the viewer's own bids. */
  automatic?: boolean;
}

/** A bid as it appears in the homepage's live activity. */
export interface ActivityEntry extends BidHistoryEntry {
  lotNumber: number;
  lotTitle: string;
}

export type ViewerLotStatus = "leading" | "outbid" | "awaiting_seller" | "won" | "lost";

/** The viewer's own position on a lot. Their max bid is private to them. */
export interface ViewerPosition {
  lotId: string;
  status: ViewerLotStatus;
  maxBidCents: Cents | null;
  lastBidCents: Cents;
}

export interface PlaceBidRequest {
  lotId: string;
  kind: BidKind;
  amountCents: Cents;
  /** A repeated key returns the first result. */
  idempotencyKey: string;
}

export type PlaceBidResult =
  | { ok: true; state: LotLiveState; position: ViewerPosition; bids: BidHistoryEntry[] }
  | { ok: false; code: BidRejectionCode; minimumCents?: Cents };
