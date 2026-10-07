import { boatTypes, countryCodes, type BoatStorage, type BoatType, type Fuel, type ListingRequest } from "@bba/contracts";
import { boatConditions, listingPackIds, type BoatCondition, type ListingInput, type ListingPackId } from "@bba/domain";
import type { Place } from "@/lib/geocoding";

/** The listing form as the seller fills it in; numbers stay text while typed. */
export interface ListingDraft {
  boatType: BoatType;
  make: string;
  model: string;
  yearBuilt: number | null;
  length: string;
  condition: BoatCondition;
  fuel: Fuel | "none";
  powerHp: string;
  hours: string;
  description: string;
  place: Place | null;
  storage: BoatStorage;
  trailerIncluded: boolean;
  pack: ListingPackId;
  startCents: number | null;
  reserveCents: number | null;
  /** The value the seller gave the estimator, shown as a guide for the starting price. */
  estimateCents: number | null;
  role: "owner" | "broker";
  agency: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

/** A photo chosen in the browser; the file is uploaded when the storage service is connected. */
export interface DraftPhoto {
  id: string;
  file: File;
  url: string;
}

export interface DraftPrefill {
  type?: BoatType;
  lengthMetres?: number;
  valueCents?: number;
  pack?: ListingPackId;
}

export const DRAFT_STORAGE_KEY = "bba-listing-draft:v1";

export function emptyDraft(prefill: DraftPrefill, locale: "fr" | "en"): ListingDraft {
  return {
    boatType: prefill.type ?? "motorboat",
    make: "",
    model: "",
    yearBuilt: null,
    length: prefill.lengthMetres === undefined ? "" : String(prefill.lengthMetres).replace(".", locale === "fr" ? "," : "."),
    condition: "good",
    fuel: "diesel",
    powerHp: "",
    hours: "",
    description: "",
    place: null,
    storage: "afloat",
    trailerIncluded: false,
    pack: prefill.pack ?? "base",
    startCents: null,
    reserveCents: null,
    estimateCents: prefill.valueCents ?? null,
    role: "owner",
    agency: "",
    name: "",
    email: "",
    phone: "",
    consent: false,
  };
}

export function isPackId(value: unknown): value is ListingPackId {
  return typeof value === "string" && (listingPackIds as readonly string[]).includes(value);
}

/** "6,90" or "6.9" → 6.9; null when not a number. */
export function parseDecimal(text: string): number | null {
  const value = Number.parseFloat(text.replace(",", ".").trim());
  return Number.isFinite(value) ? value : null;
}

function parseWhole(text: string): number | null {
  const value = Number.parseInt(text.replace(/\D/g, ""), 10);
  return Number.isFinite(value) ? value : null;
}

export interface StoredDraft {
  draft: ListingDraft;
  step: number;
}

function isPlace(value: unknown): value is Place {
  if (value === null || typeof value !== "object") return false;
  const place = value as Partial<Place>;
  return typeof place.label === "string" && typeof place.countryCode === "string" && typeof place.point?.latitude === "number" && typeof place.point.longitude === "number";
}

/** A stored draft, if it still has the expected shape; anything else is ignored. Consent is always asked again. */
export function parseStoredDraft(raw: string | null, stepCount: number): StoredDraft | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as { draft?: Partial<ListingDraft>; step?: unknown };
    const value = stored.draft;
    if (!value || typeof value !== "object") return null;
    if (!boatTypes.includes(value.boatType as BoatType) || !boatConditions.includes(value.condition as BoatCondition) || !isPackId(value.pack)) return null;
    if (typeof value.make !== "string" || typeof value.description !== "string" || typeof value.name !== "string") return null;
    const step = typeof stored.step === "number" && Number.isInteger(stored.step) ? Math.min(Math.max(stored.step, 0), stepCount - 1) : 0;
    return { draft: { ...emptyDraft({}, "fr"), ...value, place: isPlace(value.place) ? value.place : null, consent: false }, step };
  } catch {
    return null;
  }
}

export function storeDraft(draft: ListingDraft, step: number): void {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ draft, step }));
  } catch {
    // Private windows and full storage: the form keeps working without the saved draft.
  }
}

export function readStoredDraft(stepCount: number): StoredDraft | null {
  try {
    return parseStoredDraft(window.localStorage.getItem(DRAFT_STORAGE_KEY), stepCount);
  } catch {
    return null;
  }
}

export function clearStoredDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function isSupportedCountry(code: string): boolean {
  return (countryCodes as readonly string[]).includes(code);
}

/** The draft as the house rules check it. */
export function toListingInput(draft: ListingDraft, photoCount: number): ListingInput {
  return {
    make: draft.make,
    model: draft.model,
    yearBuilt: draft.yearBuilt,
    lengthMetres: parseDecimal(draft.length),
    description: draft.description,
    location: draft.place ? { berth: draft.place.point, countrySupported: isSupportedCountry(draft.place.countryCode) } : null,
    pack: draft.pack,
    photoCount,
    startCents: draft.startCents,
    reserveCents: draft.reserveCents,
    seller: { name: draft.name, email: draft.email, phone: draft.phone, role: draft.role, agency: draft.agency },
    consent: draft.consent,
  };
}

/** The request sent to the seller service, once the rules pass. */
export function toListingRequest(draft: ListingDraft, photos: readonly DraftPhoto[]): ListingRequest {
  const place = draft.place;
  if (!place || !isSupportedCountry(place.countryCode) || draft.yearBuilt === null || draft.startCents === null) {
    throw new Error("The listing is incomplete: check it with checkListing first.");
  }
  return {
    boatType: draft.boatType,
    make: draft.make.trim(),
    model: draft.model.trim(),
    yearBuilt: draft.yearBuilt,
    lengthMetres: parseDecimal(draft.length) ?? 0,
    condition: draft.condition,
    engine: draft.fuel === "none" ? { powerHp: null, hours: null, fuel: null } : { powerHp: parseWhole(draft.powerHp), hours: parseWhole(draft.hours), fuel: draft.fuel },
    description: draft.description.trim(),
    location: { berth: place.point, label: place.label, city: place.city, country: place.countryCode as ListingRequest["location"]["country"] },
    storage: draft.storage,
    trailerIncluded: draft.trailerIncluded,
    pack: draft.pack,
    photos: photos.map((photo) => ({ name: photo.file.name, bytes: photo.file.size })),
    startCents: draft.startCents,
    reserveCents: draft.reserveCents,
    seller: { name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), role: draft.role, agency: draft.agency.trim() },
    consent: draft.consent,
  };
}
