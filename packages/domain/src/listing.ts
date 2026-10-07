import type { Cents } from "./money";
import { isValidPoint, type GeoPoint } from "./geo";
import type { ListingFeature, ListingPackId, SellerOffer } from "./offers";

/** The steps of the listing form, in order. */
export const listingSteps = ["boat", "location", "presentation", "price", "contact"] as const;
export type ListingStep = (typeof listingSteps)[number];

export interface ListingRules {
  /** A listing without the professional photo shoot needs at least this many photos. */
  minimumPhotos: number;
  minimumStartCents: Cents;
  oldestYear: number;
  lengthMetres: { min: number; max: number };
  descriptionMinLength: number;
}

export const defaultListingRules: ListingRules = {
  minimumPhotos: 3,
  minimumStartCents: 100_000,
  oldestYear: 1900,
  lengthMetres: { min: 2, max: 60 },
  descriptionMinLength: 40,
};

/** What the seller entered, as the rules need it. */
export interface ListingInput {
  make: string;
  model: string;
  yearBuilt: number | null;
  lengthMetres: number | null;
  description: string;
  location: { berth: GeoPoint; countrySupported: boolean } | null;
  pack: ListingPackId;
  photoCount: number;
  startCents: Cents | null;
  reserveCents: Cents | null;
  seller: { name: string; email: string; phone: string; role: "owner" | "broker"; agency: string };
  consent: boolean;
}

export const listingIssueCodes = [
  "make_required",
  "model_required",
  "year_invalid",
  "length_invalid",
  "description_too_short",
  "location_required",
  "country_unsupported",
  "photos_required",
  "start_required",
  "start_too_low",
  "reserve_below_start",
  "name_required",
  "invalid_email",
  "phone_required",
  "agency_required",
  "consent_required",
] as const;
export type ListingIssueCode = (typeof listingIssueCodes)[number];

export interface ListingIssue {
  step: ListingStep;
  field: string;
  code: ListingIssueCode;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True when the pack, or a pack it extends, includes the feature. */
export function packIncludes(packId: ListingPackId, feature: ListingFeature, offer: SellerOffer): boolean {
  let current = offer.packs.find((pack) => pack.id === packId);
  while (current) {
    if (current.adds.includes(feature)) return true;
    const parent = current.extends;
    current = parent ? offer.packs.find((pack) => pack.id === parent) : undefined;
  }
  return false;
}

/** The photos the seller must supply: none when the pack includes the professional photo shoot. */
export function photosRequired(packId: ListingPackId, offer: SellerOffer, rules: ListingRules = defaultListingRules): number {
  return packIncludes(packId, "professionalPhotos", offer) ? 0 : rules.minimumPhotos;
}

/** Every problem that keeps a listing from being submitted, by step, in form order. */
export function checkListing(input: ListingInput, offer: SellerOffer, currentYear: number, rules: ListingRules = defaultListingRules): ListingIssue[] {
  const issues: ListingIssue[] = [];
  const add = (step: ListingStep, field: string, code: ListingIssueCode) => issues.push({ step, field, code });

  if (!input.make.trim()) add("boat", "make", "make_required");
  if (!input.model.trim()) add("boat", "model", "model_required");
  if (input.yearBuilt === null || input.yearBuilt < rules.oldestYear || input.yearBuilt > currentYear) add("boat", "yearBuilt", "year_invalid");
  if (input.lengthMetres === null || input.lengthMetres < rules.lengthMetres.min || input.lengthMetres > rules.lengthMetres.max) add("boat", "lengthMetres", "length_invalid");
  if (input.description.trim().length < rules.descriptionMinLength) add("boat", "description", "description_too_short");

  if (!input.location || !isValidPoint(input.location.berth)) add("location", "location", "location_required");
  else if (!input.location.countrySupported) add("location", "location", "country_unsupported");

  if (input.photoCount < photosRequired(input.pack, offer, rules)) add("presentation", "photos", "photos_required");

  if (input.startCents === null) add("price", "startCents", "start_required");
  else if (input.startCents < rules.minimumStartCents) add("price", "startCents", "start_too_low");
  if (input.reserveCents !== null && input.startCents !== null && input.reserveCents < input.startCents) add("price", "reserveCents", "reserve_below_start");

  if (!input.seller.name.trim()) add("contact", "name", "name_required");
  if (!emailPattern.test(input.seller.email.trim())) add("contact", "email", "invalid_email");
  if (!input.seller.phone.trim()) add("contact", "phone", "phone_required");
  if (input.seller.role === "broker" && !input.seller.agency.trim()) add("contact", "agency", "agency_required");
  if (!input.consent) add("contact", "consent", "consent_required");

  return issues;
}
