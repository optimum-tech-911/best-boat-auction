import type { GeoPoint } from "@bba/domain";
import type { BoatStorage, BoatType, CountryCode, EngineSpec, HullMaterial, LocalizedText, SpecGroup } from "@bba/contracts";

export const text = (fr: string, en: string): LocalizedText => ({ fr, en });

/** A boat of the demonstration catalogue. Amounts are written in euros for readability. */
export interface DemoBoat {
  number: number;
  /** Invented model names: AI imagery cannot depict real models, and no real brand is implied. */
  title: string;
  type: BoatType;
  yearBuilt: number;
  lengthCm: number;
  beamCm: number;
  draftCm: number;
  hull: HullMaterial;
  engines: EngineSpec | null;
  berths: number;
  storage: BoatStorage;
  trailerIncluded: boolean;
  city: string;
  country: CountryCode;
  /** The berth, from OpenStreetMap: private; the lot page shows only the rounded area around it. */
  berth: GeoPoint;
  startEuros: number;
  /** Hidden minimum. Null for a no-reserve lot. */
  reserveEuros: number | null;
  /** What the simulated bidders are prepared to pay, together. */
  marketEuros: number;
  isNew?: boolean;
  /** "full" galleries plan 8 photos, "short" galleries 3 (DESIGN_SYSTEM.md 14.3). */
  gallery: "full" | "short";
  description: LocalizedText;
  pointsOfAttention: LocalizedText[];
  equipment: Partial<Record<SpecGroup, LocalizedText[]>>;
}

/** A closed lot of the previous sale, with its recorded outcome. */
export interface DemoResult extends DemoBoat {
  outcome: "sold" | "not_awarded" | "unsold";
  finalEuros: number | null;
  bids: number;
}
