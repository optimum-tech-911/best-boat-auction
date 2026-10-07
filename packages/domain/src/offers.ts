import type { Cents } from "./money";

/*
 * What the house offers sellers. Listing is free; paid packs add production and promotion, and
 * optional services can be added to any pack. Prices include VAT. Like the auction rules, the offer
 * is versioned, and each listing stores the version it was bought with.
 */

export const listingFeatures = [
  "listing",
  "copywriting",
  "sellerPhotos",
  "distribution",
  "auctionManagement",
  "professionalPhotos",
  "shortVideo",
  "visualEditing",
  "featured",
  "socialContent",
  "droneVideo",
  "virtualTour",
  "premiumPlacement",
  "targetedCampaign",
  "personalSupport",
] as const;
export type ListingFeature = (typeof listingFeatures)[number];

export const listingPackIds = ["base", "boost", "premium"] as const;
export type ListingPackId = (typeof listingPackIds)[number];

export interface ListingPack {
  id: ListingPackId;
  priceCents: Cents;
  /** The pack it extends, whose features it includes. */
  extends: ListingPackId | null;
  /** The features it adds. */
  adds: readonly ListingFeature[];
}

export const optionalServiceIds = ["survey", "virtualTour", "cleaning", "drone", "transport"] as const;
export type OptionalServiceId = (typeof optionalServiceIds)[number];

export interface OptionalService {
  id: OptionalServiceId;
  /** The starting price, or null when it is quoted case by case. */
  fromCents: Cents | null;
}

export interface SellerOffer {
  version: string;
  packs: readonly ListingPack[];
  services: readonly OptionalService[];
}

export const defaultSellerOffer: SellerOffer = {
  version: "2026-10-06",
  packs: [
    { id: "base", priceCents: 0, extends: null, adds: ["listing", "copywriting", "sellerPhotos", "distribution", "auctionManagement"] },
    { id: "boost", priceCents: 39_000, extends: "base", adds: ["professionalPhotos", "shortVideo", "visualEditing", "featured", "socialContent"] },
    { id: "premium", priceCents: 69_000, extends: "boost", adds: ["droneVideo", "virtualTour", "premiumPlacement", "targetedCampaign", "personalSupport"] },
  ],
  services: [
    { id: "survey", fromCents: null },
    { id: "virtualTour", fromCents: 29_000 },
    { id: "cleaning", fromCents: 19_000 },
    { id: "drone", fromCents: 25_000 },
    { id: "transport", fromCents: null },
  ],
};
