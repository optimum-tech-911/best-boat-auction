import type { BoatCondition, GeoPoint, HoldingCostEstimate, HoldingCostInput, ListingIssue, ListingPackId } from "@bba/domain";
import type { BoatStorage, BoatType, CountryCode, Fuel, Instant } from "./catalogue";
import type { ViewerPosition } from "./bidding";

export const notificationTopics = ["outbid", "closingSoon", "results", "newLots"] as const;
export type NotificationTopic = (typeof notificationTopics)[number];
export type NotificationPreferences = Readonly<Record<NotificationTopic, boolean>>;

/** Bidding alerts are on by default; marketing ("newLots") needs an explicit opt-in. */
export const defaultNotificationPreferences: NotificationPreferences = { outbid: true, closingSoon: true, results: false, newLots: false };

/** A buyer bidding for a company; invoices carry its name and VAT number. */
export interface CompanyDetails {
  name: string;
  vatNumber: string;
}

/** The signed-in person. */
export interface Viewer {
  id: string;
  displayName: string;
  email: string;
  country: CountryCode;
  contactVerified: boolean;
  identityVerified: boolean;
  termsAccepted: boolean;
  notifications: NotificationPreferences;
  company: CompanyDetails | null;
}

export interface SignInRequest {
  email: string;
  /** Present when creating an account. */
  displayName?: string;
  acceptTerms?: boolean;
}

export type SignInResult = { ok: true; viewer: Viewer } | { ok: false; reason: "invalid_email" | "terms_required" | "name_required" };

/** The account settings a viewer can change; the e-mail address changes through support. */
export interface ProfileUpdate {
  displayName?: string;
  country?: CountryCode;
  notifications?: NotificationPreferences;
  company?: CompanyDetails | null;
}

export type ProfileResult = { ok: true; viewer: Viewer } | { ok: false; reason: "sign_in_required" | "name_required" | "company_name_required" | "invalid_vat_number" };

export interface MyBids {
  positions: ViewerPosition[];
  watchlist: string[];
}

export interface Notification {
  id: string;
  kind: "outbid" | "leading" | "extended" | "closing_soon" | "won" | "lost" | "awaiting_seller";
  lotId: string;
  at: Instant;
  read: boolean;
}

/* ------------------------------------------------------------- seller funnel */

export interface EstimateRequest extends Omit<HoldingCostInput, "currentYear"> {
  boatType: BoatType;
}

export interface EstimateRun {
  id: string;
  input: EstimateRequest;
  result: HoldingCostEstimate;
}

export type LeadIntent = "sell" | "report" | "callback";

export interface LeadRequest {
  intent: LeadIntent;
  name: string;
  email: string;
  phone?: string;
  /** Consent is never pre-ticked; a lead attaches to an estimate only after it. */
  consent: boolean;
  estimateId?: string;
}

export type LeadResult = { ok: true; reference: string } | { ok: false; reason: "name_required" | "invalid_email" | "phone_required" | "consent_required" };

/** Where the boat is: the berth stays private; the public page shows the rounded area around it. */
export interface ListingLocation {
  berth: GeoPoint;
  /** The place as OpenStreetMap names it: "Port des Minimes, La Rochelle". */
  label: string;
  city: string;
  country: CountryCode;
}

/** A photograph chosen by the seller; the file itself is uploaded separately (storage). */
export interface ListingPhoto {
  name: string;
  bytes: number;
}

/** A boat put up for auction from the listing form. */
export interface ListingRequest {
  boatType: BoatType;
  make: string;
  model: string;
  yearBuilt: number;
  lengthMetres: number;
  condition: BoatCondition;
  engine: { powerHp: number | null; hours: number | null; fuel: Fuel | null };
  description: string;
  location: ListingLocation;
  storage: BoatStorage;
  trailerIncluded: boolean;
  pack: ListingPackId;
  photos: ListingPhoto[];
  startCents: number;
  reserveCents: number | null;
  seller: { name: string; email: string; phone: string; role: "owner" | "broker"; agency: string };
  consent: boolean;
}

export type ListingResult =
  | { ok: true; reference: string; saleId: string; submissionDeadlineAt: Instant; closingAt: Instant }
  | { ok: false; issues: ListingIssue[] };

/* ---------------------------------------------------------------- engagement */

export interface ViewingRegistrationRequest {
  lotId: string;
  name: string;
  email: string;
  phone?: string;
  visitors: number;
}

export interface NewsletterRequest {
  email: string;
  consent: boolean;
  /** Alert only for these boat types; every new lot when absent or empty. */
  types?: BoatType[];
}

export type FormResult = { ok: true } | { ok: false; reason: "invalid_email" | "consent_required" | "invalid_request" };

/** A question to a lot's seller, published once answered. */
export interface QuestionRequest {
  lotId: string;
  text: string;
}

export type QuestionResult = { ok: true } | { ok: false; reason: "sign_in_required" | "too_short" | "lot_closed" };

export const contactTopics = ["broker", "finance", "insurance", "services"] as const;
export type ContactTopic = (typeof contactTopics)[number];

/** A request to be contacted: a broker partnership or a service around the boat. */
export interface ContactRequest {
  topic: ContactTopic;
  name: string;
  email: string;
  phone?: string;
  /** The broker's agency, or the buyer's company. */
  company?: string;
  message?: string;
  /** The lot the request is about, for financing or insuring a boat. */
  lotId?: string;
  consent: boolean;
}

export type ContactResult = { ok: true; reference: string } | { ok: false; reason: "name_required" | "invalid_email" | "company_required" | "consent_required" };
