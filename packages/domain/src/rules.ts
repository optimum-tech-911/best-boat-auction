import type { BasisPoints, Cents } from "./money";

export interface IncrementBand {
  /** The band applies from this current price upward. */
  fromCents: Cents;
  stepCents: Cents;
}

export interface PremiumTier {
  /** The tier applies to lots whose start price is below this amount; null for the last tier. */
  startBelowCents: Cents | null;
  rate: BasisPoints;
}

/**
 * What a partner broker earns. A broker who brings the boat keeps the commission of their own sales
 * mandate, agreed with the seller; a broker who brings the buyer receives a share of the house's
 * buyer's commission. Bringing both earns both.
 */
export interface BrokerTerms {
  buyerIntroductionShare: BasisPoints;
}

/**
 * Every business rule of the specification's "Rules and their defaults" table.
 * In production these values live in a versioned settings table; each lot stores
 * the version it went live with.
 */
export interface AuctionRules {
  version: string;
  increments: readonly IncrementBand[];
  softCloseWindowMs: number;
  extensionMs: number;
  closingIntervalMs: number;
  reserveAwareMaxBids: boolean;
  premiumTiers: readonly PremiumTier[];
  vatOnPremium: BasisPoints;
  idCheckFromCents: Cents;
  /** A bid may be at most this many times the next minimum. */
  maximumBidMultiplier: number;
  /** The interface asks for a second confirmation at this multiple of the next minimum. */
  confirmationMultiplier: number;
  sellerDecisionHours: number;
  counterOfferHours: number;
  paymentDays: number;
  collectionDays: number;
  runnerUpOfferHours: number;
  defaultCreditLimitCents: Cents;
  brokerTerms: BrokerTerms;
}

const MINUTE = 60_000;

export const defaultAuctionRules: AuctionRules = {
  version: "2026-10-06",
  increments: [
    { fromCents: 0, stepCents: 5_000 },
    { fromCents: 100_000, stepCents: 10_000 },
    { fromCents: 500_000, stepCents: 25_000 },
    { fromCents: 1_000_000, stepCents: 50_000 },
    { fromCents: 2_500_000, stepCents: 100_000 },
    { fromCents: 5_000_000, stepCents: 200_000 },
    { fromCents: 10_000_000, stepCents: 500_000 },
    { fromCents: 25_000_000, stepCents: 1_000_000 },
    { fromCents: 100_000_000, stepCents: 2_500_000 },
  ],
  softCloseWindowMs: 5 * MINUTE,
  extensionMs: 5 * MINUTE,
  closingIntervalMs: 1 * MINUTE,
  reserveAwareMaxBids: true,
  // The house's buyer's commission: 10 % of the hammer price for every lot. Tiers by start price
  // remain possible (the specification's 18/12/8 % example is kept in the tests).
  premiumTiers: [{ startBelowCents: null, rate: 1_000 }],
  // VAT rate of the platform's own country: France.
  vatOnPremium: 2_000,
  idCheckFromCents: 2_500_000,
  maximumBidMultiplier: 20,
  confirmationMultiplier: 2,
  sellerDecisionHours: 72,
  counterOfferHours: 24,
  paymentDays: 4,
  collectionDays: 14,
  runnerUpOfferHours: 48,
  defaultCreditLimitCents: 25_000_000,
  // Listing a boat is free; sellers may add a paid pack (see offers.ts). A partner broker who brings
  // the buyer receives half of the buyer's commission.
  brokerTerms: { buyerIntroductionShare: 5_000 },
};
