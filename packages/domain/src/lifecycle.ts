/** Nine main states and the side states of the specification's lot lifecycle. */
export const lotStatuses = [
  "draft",
  "in_review",
  "scheduled",
  "live",
  "seller_review",
  "awarded",
  "in_escrow",
  "papers_signed",
  "handed_over",
  "settled",
  "unsold",
  "not_awarded",
  "defaulted",
  "withdrawn",
  "disputed",
  "refunded",
] as const;
export type LotStatus = (typeof lotStatuses)[number];

export const lotEvents = [
  "seller_submits",
  "staff_approve",
  "staff_reject",
  "staff_withdraw",
  "auction_opens",
  "closes_without_bids",
  "closes_awarded",
  "closes_for_review",
  "sale_accepted",
  "sale_refused",
  "buyer_pays",
  "payment_overdue",
  "runner_up_accepts",
  "runner_up_declines",
  "both_sign",
  "handover_code_entered",
  "release_period_ends",
  "problem_raised",
  "dispute_for_seller",
  "dispute_for_buyer",
] as const;
export type LotEvent = (typeof lotEvents)[number];

type TransitionTable = Readonly<Partial<Record<LotStatus, Readonly<Partial<Record<LotEvent, LotStatus>>>>>>;

/** The transition table of the specification, which is the only way a lot changes state. */
const transitions: TransitionTable = {
  draft: { seller_submits: "in_review" },
  in_review: { staff_approve: "scheduled", staff_reject: "draft" },
  scheduled: { auction_opens: "live", staff_withdraw: "withdrawn" },
  live: {
    closes_without_bids: "unsold",
    closes_awarded: "awarded",
    closes_for_review: "seller_review",
    staff_withdraw: "withdrawn",
  },
  seller_review: { sale_accepted: "awarded", sale_refused: "not_awarded" },
  awarded: { buyer_pays: "in_escrow", payment_overdue: "defaulted" },
  defaulted: { runner_up_accepts: "awarded", runner_up_declines: "unsold" },
  in_escrow: { both_sign: "papers_signed", problem_raised: "disputed" },
  papers_signed: { handover_code_entered: "handed_over", problem_raised: "disputed" },
  handed_over: { release_period_ends: "settled", problem_raised: "disputed" },
  disputed: { dispute_for_seller: "settled", dispute_for_buyer: "refunded" },
};

export function nextLotStatus(status: LotStatus, event: LotEvent): LotStatus | null {
  return transitions[status]?.[event] ?? null;
}

export function canTransition(status: LotStatus, event: LotEvent): boolean {
  return nextLotStatus(status, event) !== null;
}

/** States after closing in which the auction result is final for the public results archive. */
export const closedLotStatuses: readonly LotStatus[] = [
  "seller_review",
  "awarded",
  "in_escrow",
  "papers_signed",
  "handed_over",
  "settled",
  "unsold",
  "not_awarded",
  "defaulted",
  "disputed",
  "refunded",
];
