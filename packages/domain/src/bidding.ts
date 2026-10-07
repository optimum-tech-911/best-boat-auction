import { increment, nextMinimum } from "./increments";
import { isWholeEuros, type Cents } from "./money";
import type { AuctionRules } from "./rules";
import type { LotStatus } from "./lifecycle";

export type BidderId = string;
/** What the bidder asks for: one exact amount, or a private ceiling. */
export type BidKind = "single" | "max";
/** What the engine records: a bid placed by hand, or by a max bid on the bidder's behalf. */
export type EmittedBidKind = "manual" | "auto";

/** The part of a lot the bidding engine reads and writes. */
export interface EngineLot {
  status: LotStatus;
  startCents: Cents;
  reserveCents: Cents | null;
  priceCents: Cents | null;
  leader: BidderId | null;
  /** The leader's max bid, or the price when the leader placed a single bid. */
  leaderCeilingCents: Cents;
  leaderCeilingAt: number;
  endsAt: number;
  extensions: number;
}

export interface BidCommand {
  bidder: BidderId;
  kind: BidKind;
  amountCents: Cents;
}

export interface EmittedBid {
  bidder: BidderId;
  amountCents: Cents;
  kind: EmittedBidKind;
}

/** Every rejection code of the specification, each translated by the client. */
export const bidRejectionCodes = [
  "LOT_NOT_LIVE",
  "LOT_CLOSED",
  "AUCTION_PAUSED",
  "INVALID_AMOUNT",
  "BID_TOO_LOW",
  "MAX_TOO_LOW",
  "ALREADY_LEADING",
  "AMOUNT_TOO_HIGH",
  "SIGN_IN_REQUIRED",
  "CONTACT_NOT_VERIFIED",
  "TERMS_NOT_ACCEPTED",
  "ID_CHECK_REQUIRED",
  "CARD_HOLD_REQUIRED",
  "LIMIT_EXCEEDED",
  "SELLER_CANNOT_BID",
  "ACCOUNT_SUSPENDED",
  "RATE_LIMITED",
] as const;
export type BidRejectionCode = (typeof bidRejectionCodes)[number];

export interface BidRejection {
  ok: false;
  code: BidRejectionCode;
  /** The next acceptable amount, for BID_TOO_LOW and MAX_TOO_LOW. */
  minimumCents?: Cents;
}

export interface BidAcceptance {
  ok: true;
  lot: EngineLot;
  /** Bids to store append-only, in order. The caller assigns sequence numbers and times. */
  bids: EmittedBid[];
}

export type BidResult = BidAcceptance | BidRejection;

const reject = (code: BidRejectionCode, minimumCents?: Cents): BidRejection =>
  minimumCents === undefined ? { ok: false, code } : { ok: false, code, minimumCents };

interface Outcome {
  leader: BidderId;
  ceilingCents: Cents;
  ceilingAt: number;
  priceCents: Cents | null;
}

/**
 * One pure function decides every bid. No database or clock access: the caller passes
 * `now` from the database inside a locked transaction, and replaying the same commands
 * with the same timestamps gives the same state.
 */
export function applyBid(lot: EngineLot, command: BidCommand, now: number, rules: AuctionRules): BidResult {
  if (lot.status !== "live") return reject("LOT_NOT_LIVE");
  if (now >= lot.endsAt) return reject("LOT_CLOSED");
  if (!isWholeEuros(command.amountCents)) return reject("INVALID_AMOUNT");

  const next = nextMinimum(lot, rules);
  const reserveOpen = rules.reserveAwareMaxBids && lot.reserveCents !== null && (lot.priceCents ?? 0) < lot.reserveCents;
  const emitted: EmittedBid[] = [];
  const emit = (bidder: BidderId, amountCents: Cents, kind: EmittedBidKind) => emitted.push({ bidder, amountCents, kind });
  const placedKind: EmittedBidKind = command.kind === "single" ? "manual" : "auto";

  // A. The leader raises their own max. A leader never bids against themselves.
  if (command.bidder === lot.leader) {
    if (command.kind === "single") return reject("ALREADY_LEADING");
    if (command.amountCents <= lot.leaderCeilingCents) return reject("MAX_TOO_LOW", lot.leaderCeilingCents + 100);
    let price = lot.priceCents;
    if (reserveOpen && lot.reserveCents !== null) {
      price = command.amountCents >= lot.reserveCents ? lot.reserveCents : command.amountCents;
    }
    if (price !== null && price !== lot.priceCents) emit(lot.leader, price, "auto");
    return settle(lot, { leader: lot.leader, ceilingCents: command.amountCents, ceilingAt: now, priceCents: price }, emitted, now, rules);
  }

  if (command.amountCents < next) return reject(command.kind === "single" ? "BID_TOO_LOW" : "MAX_TOO_LOW", next);

  // B. First bid on the lot.
  if (lot.leader === null) {
    let price = command.kind === "single" ? command.amountCents : lot.startCents;
    if (command.kind === "max" && reserveOpen && lot.reserveCents !== null) {
      price = command.amountCents >= lot.reserveCents ? Math.max(lot.startCents, lot.reserveCents) : command.amountCents;
    }
    emit(command.bidder, price, placedKind);
    return settle(lot, { leader: command.bidder, ceilingCents: command.amountCents, ceilingAt: now, priceCents: price }, emitted, now, rules);
  }

  // C. A challenger against the leader's ceiling.
  const leaderCeiling = lot.leaderCeilingCents;
  const challenge = command.amountCents;
  const currentPrice = lot.priceCents ?? lot.startCents;

  if (challenge > leaderCeiling) {
    if (leaderCeiling > currentPrice) emit(lot.leader, leaderCeiling, "auto"); // the leader's max is used up
    let price = command.kind === "single" ? challenge : Math.min(challenge, leaderCeiling + increment(leaderCeiling, rules));
    if (command.kind === "max" && reserveOpen && lot.reserveCents !== null) {
      price = challenge >= lot.reserveCents ? Math.max(price, lot.reserveCents) : challenge;
    }
    emit(command.bidder, price, placedKind);
    return settle(lot, { leader: command.bidder, ceilingCents: challenge, ceilingAt: now, priceCents: price }, emitted, now, rules);
  }

  emit(command.bidder, challenge, placedKind); // the challenger bids in full
  const price = challenge === leaderCeiling ? leaderCeiling : Math.min(leaderCeiling, challenge + increment(challenge, rules)); // tie: the earlier ceiling wins
  emit(lot.leader, price, "auto");
  return settle(lot, { leader: lot.leader, ceilingCents: leaderCeiling, ceilingAt: lot.leaderCeilingAt, priceCents: price }, emitted, now, rules);
}

/** Soft close: a bid that changes the price or the leader in the last window pushes the close back. */
function settle(lot: EngineLot, outcome: Outcome, bids: EmittedBid[], now: number, rules: AuctionRules): BidAcceptance {
  const visible = outcome.priceCents !== lot.priceCents || outcome.leader !== lot.leader;
  const endsAt = visible && lot.endsAt - now < rules.softCloseWindowMs ? Math.max(lot.endsAt, now + rules.extensionMs) : lot.endsAt;
  return {
    ok: true,
    bids,
    lot: {
      ...lot,
      leader: outcome.leader,
      leaderCeilingCents: outcome.ceilingCents,
      leaderCeilingAt: outcome.ceilingAt,
      priceCents: outcome.priceCents,
      endsAt,
      extensions: lot.extensions + (endsAt > lot.endsAt ? 1 : 0),
    },
  };
}

/** The bidder facts the bidding service checks before the engine runs. */
export interface BidderStanding {
  signedIn: boolean;
  contactVerified: boolean;
  termsAccepted: boolean;
  suspended: boolean;
  hasOverdueInvoice: boolean;
  identityVerified: boolean;
  cardHoldRequired: boolean;
  cardHoldActive: boolean;
  isLinkedToSeller: boolean;
  /** Total of the bidder's leading bids on other lots. */
  leadingTotalCents: Cents;
  creditLimitCents: Cents;
}

/**
 * The checks of the specification that run before the engine, in order.
 * Returns the first failing rejection, or null when the engine may run.
 * Rate limiting needs request history and stays with the service.
 */
export function checkBidRequest(
  lot: Pick<EngineLot, "startCents" | "priceCents" | "leader">,
  command: BidCommand,
  bidder: BidderStanding,
  rules: AuctionRules,
): BidRejection | null {
  if (!bidder.signedIn) return reject("SIGN_IN_REQUIRED");
  if (!bidder.contactVerified) return reject("CONTACT_NOT_VERIFIED");
  if (!bidder.termsAccepted) return reject("TERMS_NOT_ACCEPTED");
  if (bidder.isLinkedToSeller) return reject("SELLER_CANNOT_BID");
  if (bidder.suspended || bidder.hasOverdueInvoice) return reject("ACCOUNT_SUSPENDED");
  if (command.amountCents >= rules.idCheckFromCents && !bidder.identityVerified) return reject("ID_CHECK_REQUIRED");
  if (bidder.cardHoldRequired && !bidder.cardHoldActive) return reject("CARD_HOLD_REQUIRED");
  if (bidder.leadingTotalCents + command.amountCents > bidder.creditLimitCents) return reject("LIMIT_EXCEEDED");
  if (command.amountCents > nextMinimum(lot, rules) * rules.maximumBidMultiplier) return reject("AMOUNT_TOO_HIGH");
  return null;
}

/** The interface asks for a second confirmation above this amount. */
export function confirmationThreshold(lot: Pick<EngineLot, "startCents" | "priceCents">, rules: AuctionRules): Cents {
  return nextMinimum(lot, rules) * rules.confirmationMultiplier;
}
