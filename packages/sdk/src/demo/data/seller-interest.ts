import type { SellerInterestExample } from "@bba/contracts";
import { octoberBoats } from "./october";

/** Invented search counts and price bands, explicitly identified as examples in the UI. */
const interest: Readonly<Record<number, readonly [buyers: number, lowCents: number, highCents: number]>> = {
  7701: [38, 7_000_000, 8_600_000],
  7702: [24, 1_700_000, 2_300_000],
  7703: [19, 3_700_000, 4_700_000],
  7704: [16, 10_000_000, 12_500_000],
  7705: [31, 11_500_000, 14_500_000],
  7706: [28, 3_400_000, 4_300_000],
  7707: [42, 1_500_000, 2_200_000],
  7708: [21, 7_300_000, 9_200_000],
  7709: [35, 3_200_000, 4_100_000],
  7710: [47, 2_500_000, 3_300_000],
  7711: [14, 8_400_000, 10_500_000],
  7712: [33, 15_000_000, 19_000_000],
};

export const sellerInterestExamples: readonly SellerInterestExample[] = octoberBoats.map((boat) => {
  const [buyerCount, priceLowCents, priceHighCents] = interest[boat.number]!;
  return { model: boat.title, boatType: boat.type, yearBuilt: boat.yearBuilt, lengthCm: boat.lengthCm, buyerCount, priceLowCents, priceHighCents, referenceCents: boat.marketEuros * 100 };
});

/** A fictional human adviser shown only in the local assistance demonstration. */
export const demoBoatExpert = { name: "Camille Moreau", initials: "CM" } as const;
