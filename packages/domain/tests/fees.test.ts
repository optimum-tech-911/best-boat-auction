import { describe, expect, it } from "vitest";
import { applyRate, brokerCommission, buyerTotal, defaultAuctionRules, defaultSellerOffer, keepsMandateCommission, premiumRate, type AuctionRules } from "../src";

// The specification's invoice vectors use premium tiers by start price and the Netherlands' 21 % VAT
// on the premium; the engine supports both, so they stay verified against the house's own settings.
const rules: AuctionRules = {
  ...defaultAuctionRules,
  premiumTiers: [
    { startBelowCents: 2_500_000, rate: 1_800 },
    { startBelowCents: 10_000_000, rate: 1_200 },
    { startBelowCents: null, rate: 800 },
  ],
  vatOnPremium: 2_100,
};

describe("buyerTotal: specification test vectors", () => {
  it("16 · start 18,000 €, hammer 21,000 €", () => {
    expect(buyerTotal({ startCents: 1_800_000, hammerCents: 2_100_000 }, rules)).toMatchObject({
      premiumRate: 1_800, premiumCents: 378_000, vatOnPremiumCents: 79_380, totalCents: 2_557_380,
    });
  });

  it("17 · start 25,000 €, hammer 30,000 €", () => {
    expect(buyerTotal({ startCents: 2_500_000, hammerCents: 3_000_000 }, rules)).toMatchObject({
      premiumRate: 1_200, premiumCents: 360_000, vatOnPremiumCents: 75_600, totalCents: 3_435_600,
    });
  });

  it("adds VAT on the boat when the seller charges it", () => {
    const cost = buyerTotal({ startCents: 1_800_000, hammerCents: 2_100_000, vatOnHammer: 2_000 }, rules);
    expect(cost.vatOnHammerCents).toBe(420_000);
    expect(cost.totalCents).toBe(2_100_000 + 420_000 + 378_000 + 79_380);
  });
});

describe("the house's buyer's commission", () => {
  it("is 10 % of the hammer price, plus France's 20 % VAT on it", () => {
    expect(buyerTotal({ startCents: 8_000_000, hammerCents: 10_000_000 }, defaultAuctionRules)).toMatchObject({
      premiumRate: 1_000, premiumCents: 1_000_000, vatOnPremiumCents: 200_000, totalCents: 11_200_000,
    });
  });

  it("does not depend on the start price", () => {
    expect(premiumRate(100_000, defaultAuctionRules)).toBe(premiumRate(50_000_000, defaultAuctionRules));
  });
});

describe("premium tiers", () => {
  it.each([[24_999, 1_800], [25_000, 1_200], [99_999, 1_200], [100_000, 800]])("start %i € pays %i bps", (start, rate) => {
    expect(premiumRate(start * 100, rules)).toBe(rate);
  });
});

describe("seller offer", () => {
  it("lists boats for free, with two paid packs that build on each other", () => {
    expect(defaultSellerOffer.packs.map((pack) => [pack.id, pack.priceCents, pack.extends])).toEqual([
      ["base", 0, null],
      ["boost", 39_000, "base"],
      ["premium", 69_000, "boost"],
    ]);
  });
});

describe("broker remuneration", () => {
  const premiumCents = 1_000_000;

  it("keeps the broker's own mandate commission when they bring the boat", () => {
    expect(keepsMandateCommission("boat")).toBe(true);
    expect(brokerCommission(premiumCents, "boat", defaultAuctionRules)).toBe(0);
  });

  it("pays half of the buyer's commission to the broker who brings the buyer", () => {
    expect(keepsMandateCommission("client")).toBe(false);
    expect(brokerCommission(premiumCents, "client", defaultAuctionRules)).toBe(500_000);
  });

  it("pays both when the broker brings the boat and the buyer", () => {
    expect(keepsMandateCommission("boatAndClient")).toBe(true);
    expect(brokerCommission(premiumCents, "boatAndClient", defaultAuctionRules)).toBe(500_000);
  });
});

describe("applyRate", () => {
  it("rounds half up to the cent", () => {
    expect(applyRate(5, 1_000)).toBe(1); // 0.5 cent
    expect(applyRate(4, 1_000)).toBe(0); // 0.4 cent
    expect(applyRate(378_000, 2_100)).toBe(79_380);
  });
});
