import type { BoatType } from "./catalogue";

/** Frontend demonstration of saved buyer searches; not a production valuation or analytics result. */
export interface SellerInterestExample {
  model: string;
  boatType: BoatType;
  yearBuilt: number;
  lengthCm: number;
  buyerCount: number;
  priceLowCents: number;
  priceHighCents: number;
  referenceCents: number;
}
