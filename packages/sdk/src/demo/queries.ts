import type { BoatType, CatalogueFacets, CatalogueFilters, CatalogueQuery, CountryCode, Fuel } from "@bba/contracts";
import type { LotRecord } from "./house";

/* Catalogue search, filters, facets and sorting over the demonstration lots. */

const typeKeywords: Readonly<Record<BoatType, string>> = {
  sailboat: "voilier voiliers sailboat sailboats sailing yacht",
  motorboat: "bateau a moteur bateaux moteur motorboat motorboats motor yacht cruiser",
  speedboat: "vedette vedettes speedboat speedboats runabout",
  rib: "semi-rigide semi-rigides rib ribs pneumatique",
  sloep: "sloep sloeps",
  catamaran: "catamaran catamarans multicoque",
};

const countryKeywords: Readonly<Record<CountryCode, string>> = {
  AT: "autriche austria", BE: "belgique belgium", DE: "allemagne germany", ES: "espagne spain",
  FR: "france", HR: "croatie croatia", IT: "italie italy", NL: "pays-bas netherlands holland",
};

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function searchText(lot: LotRecord): string {
  const { boat } = lot;
  return normalize(`${boat.title} ${boat.number} ${boat.city} ${typeKeywords[boat.type]} ${countryKeywords[boat.country]}`);
}

const priceOf = (lot: LotRecord) => lot.engine.priceCents ?? lot.engine.startCents;

type Facet = "types" | "countries" | "fuels";

function matches(lot: LotRecord, filters: CatalogueFilters, now: number, ignore?: Facet): boolean {
  const { boat } = lot;
  if (filters.query) {
    const haystack = searchText(lot);
    if (!normalize(filters.query).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))) return false;
  }
  if (ignore !== "types" && filters.types?.length && !filters.types.includes(boat.type)) return false;
  if (ignore !== "countries" && filters.countries?.length && !filters.countries.includes(boat.country)) return false;
  if (ignore !== "fuels" && filters.fuels?.length && !(boat.engines && filters.fuels.includes(boat.engines.fuel))) return false;
  const price = priceOf(lot);
  if (filters.priceMinCents !== undefined && price < filters.priceMinCents) return false;
  if (filters.priceMaxCents !== undefined && price > filters.priceMaxCents) return false;
  if (filters.lengthMinCm !== undefined && boat.lengthCm < filters.lengthMinCm) return false;
  if (filters.lengthMaxCm !== undefined && boat.lengthCm > filters.lengthMaxCm) return false;
  if (filters.yearMin !== undefined && boat.yearBuilt < filters.yearMin) return false;
  if (filters.yearMax !== undefined && boat.yearBuilt > filters.yearMax) return false;
  if (filters.maxEngineHours !== undefined && (boat.engines?.hours ?? 0) > filters.maxEngineHours) return false;
  if (filters.noReserveOnly && boat.reserveEuros !== null) return false;
  if (filters.closingWithin24h && !(lot.closedAt === null && lot.engine.endsAt - now <= 86_400_000)) return false;
  return true;
}

function count<K extends string>(lots: readonly LotRecord[], key: (lot: LotRecord) => K | undefined): Partial<Record<K, number>> {
  const counts: Partial<Record<K, number>> = {};
  for (const lot of lots) {
    const value = key(lot);
    if (value !== undefined) counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

export function facetsFor(lots: readonly LotRecord[], filters: CatalogueFilters, now: number): CatalogueFacets {
  return {
    types: count(lots.filter((lot) => matches(lot, filters, now, "types")), (lot) => lot.boat.type),
    countries: count(lots.filter((lot) => matches(lot, filters, now, "countries")), (lot) => lot.boat.country),
    fuels: count(lots.filter((lot) => matches(lot, filters, now, "fuels")), (lot): Fuel | undefined => lot.boat.engines?.fuel),
  };
}

export function runQuery(lots: readonly LotRecord[], query: CatalogueQuery, now: number, archive: boolean): { matched: LotRecord[]; facets: CatalogueFacets } {
  const matched = lots.filter((lot) => matches(lot, query, now));
  const byClosing = archive
    ? (a: LotRecord, b: LotRecord) => (b.closedAt ?? 0) - (a.closedAt ?? 0)
    : (a: LotRecord, b: LotRecord) => a.engine.endsAt - b.engine.endsAt || a.boat.number - b.boat.number;
  const sorters = {
    closing: byClosing,
    price_asc: (a: LotRecord, b: LotRecord) => priceOf(a) - priceOf(b),
    price_desc: (a: LotRecord, b: LotRecord) => priceOf(b) - priceOf(a),
    newest_build: (a: LotRecord, b: LotRecord) => b.boat.yearBuilt - a.boat.yearBuilt,
    length: (a: LotRecord, b: LotRecord) => b.boat.lengthCm - a.boat.lengthCm,
  } as const;
  matched.sort(sorters[query.sort ?? "closing"]);
  return { matched, facets: facetsFor(lots, query, now) };
}
