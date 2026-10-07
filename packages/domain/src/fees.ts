import { applyRate, type BasisPoints, type Cents } from "./money";
import type { AuctionRules } from "./rules";

/** The buyer's premium rate is chosen by the lot's start price. */
export function premiumRate(startCents: Cents, rules: AuctionRules): BasisPoints {
  const tier = rules.premiumTiers.find((candidate) => candidate.startBelowCents === null || startCents < candidate.startBelowCents);
  if (!tier) throw new Error("The premium tiers must end with an open tier.");
  return tier.rate;
}

export interface BuyerCostInput {
  hammerCents: Cents;
  startCents: Cents;
  /** VAT on the boat: 0 for private sellers and the margin scheme. */
  vatOnHammer?: BasisPoints;
}

export interface BuyerCost {
  hammerCents: Cents;
  vatOnHammer: BasisPoints;
  vatOnHammerCents: Cents;
  premiumRate: BasisPoints;
  premiumCents: Cents;
  vatOnPremium: BasisPoints;
  vatOnPremiumCents: Cents;
  totalCents: Cents;
}

/**
 * total = H + round(H · v_lot) + P + round(P · v_fee), with P = round(H · r(start)).
 * Every line rounds half-up to the cent.
 */
export function buyerTotal({ hammerCents, startCents, vatOnHammer = 0 }: BuyerCostInput, rules: AuctionRules): BuyerCost {
  const rate = premiumRate(startCents, rules);
  const vatOnHammerCents = applyRate(hammerCents, vatOnHammer);
  const premiumCents = applyRate(hammerCents, rate);
  const vatOnPremiumCents = applyRate(premiumCents, rules.vatOnPremium);
  return {
    hammerCents,
    vatOnHammer,
    vatOnHammerCents,
    premiumRate: rate,
    premiumCents,
    vatOnPremium: rules.vatOnPremium,
    vatOnPremiumCents,
    totalCents: hammerCents + vatOnHammerCents + premiumCents + vatOnPremiumCents,
  };
}

export const brokerContributions = ["boat", "client", "boatAndClient"] as const;
export type BrokerContribution = (typeof brokerContributions)[number];

/** A broker who brings the boat keeps the commission of their sales mandate, paid by the seller under that mandate. */
export function keepsMandateCommission(contribution: BrokerContribution): boolean {
  return contribution !== "client";
}

/** A broker's share of the house's buyer's commission, before VAT: earned only for bringing the buyer. */
export function brokerCommission(premiumCents: Cents, contribution: BrokerContribution, rules: AuctionRules): Cents {
  return contribution === "boat" ? 0 : applyRate(premiumCents, rules.brokerTerms.buyerIntroductionShare);
}
