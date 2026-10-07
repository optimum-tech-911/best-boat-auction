import { boatTypes, catalogueSorts, countryCodes, type BoatType, type CatalogueFilters, type CatalogueSort, type CountryCode, type Fuel } from "@bba/contracts";

/*
 * The catalogue's state lives in its address (task D5): every filter, the sort, the view and the
 * number of lots shown. Links to a filtered catalogue can be shared and reload as they were.
 */

export type CatalogueView = "grid" | "order";
export const PAGE_SIZE = 12;
const fuels: readonly Fuel[] = ["diesel", "petrol", "electric"];

export interface CatalogueState {
  filters: CatalogueFilters;
  sort: CatalogueSort | null;
  view: CatalogueView | null;
  show: number;
}

export type SearchParamsRecord = Readonly<Record<string, string | string[] | undefined>>;

function first(params: SearchParamsRecord, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function list<T extends string>(params: SearchParamsRecord, key: string, allowed: readonly T[]): T[] | undefined {
  const values = (first(params, key) ?? "").split(",").filter((value): value is T => (allowed as readonly string[]).includes(value));
  return values.length ? values : undefined;
}

function number(params: SearchParamsRecord, key: string, scale = 1): number | undefined {
  const raw = first(params, key);
  if (raw === undefined || raw.trim() === "") return undefined;
  const value = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? Math.round(value * scale) : undefined;
}

export function parseCatalogueState(params: SearchParamsRecord): CatalogueState {
  const query = first(params, "q")?.trim().slice(0, 80);
  const sort = first(params, "sort");
  const view = first(params, "view");
  const show = number(params, "show");
  const filters: CatalogueFilters = {
    query: query || undefined,
    types: list(params, "type", boatTypes),
    countries: list(params, "country", countryCodes),
    fuels: list(params, "fuel", fuels),
    priceMinCents: number(params, "pmin", 100),
    priceMaxCents: number(params, "pmax", 100),
    lengthMinCm: number(params, "lmin", 100),
    lengthMaxCm: number(params, "lmax", 100),
    yearMin: number(params, "ymin"),
    yearMax: number(params, "ymax"),
    maxEngineHours: number(params, "hours"),
    noReserveOnly: first(params, "reserve") === "none" || undefined,
    closingWithin24h: first(params, "soon") === "1" || undefined,
  };
  return {
    filters,
    sort: (catalogueSorts as readonly string[]).includes(sort ?? "") ? (sort as CatalogueSort) : null,
    view: view === "grid" || view === "order" ? view : null,
    show: show && show > PAGE_SIZE ? Math.min(show, 120) : PAGE_SIZE,
  };
}

const euros = (cents: number) => String(Math.round(cents / 100));
const metres = (centimetres: number) => String(centimetres / 100);

/** The address of a catalogue state; defaults are left out so addresses stay short. */
export function catalogueSearch(state: CatalogueState): string {
  const { filters } = state;
  const entries: [string, string | undefined][] = [
    ["q", filters.query],
    ["type", filters.types?.join(",")],
    ["country", filters.countries?.join(",")],
    ["fuel", filters.fuels?.join(",")],
    ["pmin", filters.priceMinCents === undefined ? undefined : euros(filters.priceMinCents)],
    ["pmax", filters.priceMaxCents === undefined ? undefined : euros(filters.priceMaxCents)],
    ["lmin", filters.lengthMinCm === undefined ? undefined : metres(filters.lengthMinCm)],
    ["lmax", filters.lengthMaxCm === undefined ? undefined : metres(filters.lengthMaxCm)],
    ["ymin", filters.yearMin === undefined ? undefined : String(filters.yearMin)],
    ["ymax", filters.yearMax === undefined ? undefined : String(filters.yearMax)],
    ["hours", filters.maxEngineHours === undefined ? undefined : String(filters.maxEngineHours)],
    ["reserve", filters.noReserveOnly ? "none" : undefined],
    ["soon", filters.closingWithin24h ? "1" : undefined],
    ["sort", state.sort ?? undefined],
    ["view", state.view ?? undefined],
    ["show", state.show > PAGE_SIZE ? String(state.show) : undefined],
  ];
  const search = new URLSearchParams(entries.filter((entry): entry is [string, string] => Boolean(entry[1])));
  const text = search.toString().replace(/%2C/g, ",");
  return text ? `?${text}` : "";
}

/** The number of filters applied, for "Filtres (3)". */
export function activeFilterCount(filters: CatalogueFilters): number {
  return (filters.query ? 1 : 0)
    + (filters.types?.length ?? 0)
    + (filters.countries?.length ?? 0)
    + (filters.fuels?.length ?? 0)
    + (filters.priceMinCents !== undefined || filters.priceMaxCents !== undefined ? 1 : 0)
    + (filters.lengthMinCm !== undefined || filters.lengthMaxCm !== undefined ? 1 : 0)
    + (filters.yearMin !== undefined || filters.yearMax !== undefined ? 1 : 0)
    + (filters.maxEngineHours !== undefined ? 1 : 0)
    + (filters.noReserveOnly ? 1 : 0)
    + (filters.closingWithin24h ? 1 : 0);
}

export type { BoatType, CountryCode, Fuel };
