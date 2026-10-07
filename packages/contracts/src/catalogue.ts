import type { BasisPoints, Cents, SaleMode } from "@bba/domain";
import type { Locale } from "@bba/i18n";

/** UTC instant in milliseconds. Adapters convert database timestamps at the boundary. */
export type Instant = number;

/** Text written once per language. */
export type LocalizedText = Readonly<Record<Locale, string>>;

export const boatTypes = ["sailboat", "motorboat", "speedboat", "rib", "sloep", "catamaran"] as const;
export type BoatType = (typeof boatTypes)[number];

export const countryCodes = ["AT", "BE", "DE", "ES", "FR", "HR", "IT", "NL"] as const;
export type CountryCode = (typeof countryCodes)[number];

export interface MediaImage {
  src: string;
  width: number;
  height: number;
  /** CSS object-position, from docs/ASSETS.md: "50% 55%". */
  focalPoint: string;
  alt: LocalizedText;
}

export type SalePhase = "upcoming" | "live" | "closing" | "closed";

export interface SaleSummary {
  /** Year and month: "2026-10". */
  id: string;
  mode: SaleMode;
  phase: SalePhase;
  submissionDeadlineAt: Instant;
  opensAt: Instant;
  /** The period in which each boat's viewing is fixed with its seller or broker. */
  viewingsFrom: Instant;
  viewingsUntil: Instant;
  closingStartsAt: Instant;
  /** The scheduled close of the sale's last lot, before any extension. */
  closingEndsAt: Instant;
  lotCount: number;
}

export type LotPhase = "scheduled" | "live" | "closed";

/** The outcome of a closed lot, as the public results archive shows it. */
export type LotOutcome = "sold" | "awaiting_seller" | "not_awarded" | "unsold";

/** "none" for a no-reserve lot; "undisclosed" when the seller keeps the reserve status private. */
export type ReserveStatus = "none" | "met" | "not_met" | "undisclosed";

/** Everything about a lot that changes while it is live. */
export interface LotLiveState {
  lotId: string;
  /** Per-lot sequence number of the last change; a gap means a missed update. */
  seq: number;
  phase: LotPhase;
  outcome: LotOutcome | null;
  priceCents: Cents | null;
  nextMinimumCents: Cents | null;
  bidCount: number;
  leaderAlias: string | null;
  endsAt: Instant;
  scheduledEndsAt: Instant;
  extensions: number;
  reserve: ReserveStatus;
}

export interface LotSummary {
  id: string;
  number: number;
  /** Route parameter: "7701-solenne-38". */
  slug: string;
  saleId: string;
  title: string;
  type: BoatType;
  yearBuilt: number;
  lengthCm: number;
  location: { city: string; country: CountryCode };
  cover: MediaImage | null;
  noReserve: boolean;
  isNew: boolean;
  startCents: Cents;
  premiumRate: BasisPoints;
  /** People following the lot besides the viewer, so the summary is the same for everyone. */
  watchers: number;
  state: LotLiveState;
}

export type HullMaterial = "polyester" | "steel" | "aluminium" | "wood" | "hypalon";
export type Fuel = "diesel" | "petrol" | "electric";
export type Drive = "inboard" | "outboard" | "sterndrive" | "saildrive";
export type BoatStorage = "afloat" | "ashore" | "indoors";

export interface EngineSpec {
  count: number;
  make: string;
  powerHp: number;
  hours: number;
  fuel: Fuel;
  drive: Drive;
}

export const specGroups = ["general", "engine", "navigation", "rigging", "comfort", "deck"] as const;
export type SpecGroup = (typeof specGroups)[number];

export interface DocumentLink {
  id: string;
  title: LocalizedText;
  /** Restricted documents show a lock and "Réservé aux enchérisseurs inscrits". */
  visibility: "public" | "registered_bidders";
  pages: number;
}

export interface SaleConditions {
  mode: SaleMode;
  premiumRate: BasisPoints;
  vatOnPremium: BasisPoints;
  vatOnHammer: BasisPoints;
  sellerDecisionHours: number;
  paymentDays: number;
  collectionDays: number;
  softCloseWindowMinutes: number;
  extensionMinutes: number;
}

/** The viewing fixed for a boat with its seller or the broker who brought it. */
export interface LotViewing {
  startsAt: Instant;
  endsAt: Instant;
  arrangedWith: "seller" | "broker";
}

export interface LotQuestion {
  id: string;
  /** The asker's bidder number, never their name. */
  askedBy: string;
  askedAt: Instant;
  question: LocalizedText;
  answer: LocalizedText;
  answeredAt: Instant;
}

export interface LotDetail extends LotSummary {
  gallery: MediaImage[];
  /** The number of photos planned for the final gallery, for "Voir les 8 photos". */
  plannedPhotoCount: number;
  description: LocalizedText;
  pointsOfAttention: LocalizedText[];
  beamCm: number;
  draftCm: number;
  hull: HullMaterial;
  engines: EngineSpec | null;
  berths: number;
  storage: BoatStorage;
  trailerIncluded: boolean;
  /** Equipment by group, as the category template orders it. */
  equipment: Partial<Record<SpecGroup, LocalizedText[]>>;
  viewing: LotViewing | null;
  documents: DocumentLink[];
  /** Public questions, each published with the seller's answer. */
  questions: LotQuestion[];
  conditions: SaleConditions;
  /** Approximate position, about 2 km from the berth. */
  area: { latitude: number; longitude: number };
}

export const catalogueSorts = ["closing", "price_asc", "price_desc", "newest_build", "length"] as const;
export type CatalogueSort = (typeof catalogueSorts)[number];

export interface CatalogueFilters {
  query?: string;
  types?: readonly BoatType[];
  countries?: readonly CountryCode[];
  priceMinCents?: Cents;
  priceMaxCents?: Cents;
  lengthMinCm?: number;
  lengthMaxCm?: number;
  yearMin?: number;
  yearMax?: number;
  fuels?: readonly Fuel[];
  maxEngineHours?: number;
  noReserveOnly?: boolean;
  closingWithin24h?: boolean;
}

export interface CatalogueQuery extends CatalogueFilters {
  sort?: CatalogueSort;
  /** Page size; "Voir plus de lots" asks for the next page. */
  limit?: number;
  offset?: number;
}

/** Counts per filter value, computed with every other filter applied. */
export interface CatalogueFacets {
  types: Partial<Record<BoatType, number>>;
  countries: Partial<Record<CountryCode, number>>;
  fuels: Partial<Record<Fuel, number>>;
}

export interface CataloguePage {
  lots: LotSummary[];
  total: number;
  facets: CatalogueFacets;
}

export interface MarketStats {
  liveLotCount: number;
  /** Bids placed in the featured sale since bidding opened. */
  bidCount: number;
  /** The countries of the bidders of the featured sale, each once. */
  bidderCountries: CountryCode[];
  nextClosingAt: Instant | null;
}
