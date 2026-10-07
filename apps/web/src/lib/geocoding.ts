import type { GeoPoint } from "@bba/domain";
import type { Locale } from "@bba/i18n";

/**
 * Place search and reverse lookup on OpenStreetMap data, through Photon (komoot's public geocoder:
 * free, no key, fair use). The rest of the site only sees `Place`; another provider replaces this file.
 */
const ENDPOINT = "https://photon.komoot.io";
/** Search within Europe, where the house sells boats. */
const EUROPE_BBOX = "-25,34,45,72";

export interface Place {
  point: GeoPoint;
  /** "Port des Minimes, La Rochelle" */
  label: string;
  city: string;
  /** ISO 3166-1 alpha-2, upper case: "FR". */
  countryCode: string;
  countryName: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; street?: string; housenumber?: string; city?: string; town?: string; village?: string; county?: string; state?: string; country?: string; countrycode?: string };
}

function toPlace(feature: PhotonFeature): Place | null {
  const { properties: p, geometry } = feature;
  const [longitude, latitude] = geometry.coordinates;
  const city = p.city ?? p.town ?? p.village ?? p.county ?? p.state ?? "";
  const first = p.name ?? (p.street ? [p.street, p.housenumber].filter(Boolean).join(" ") : "");
  const label = [...new Set([first, city].filter(Boolean))].join(", ");
  if (!label || !p.countrycode) return null;
  return { point: { latitude, longitude }, label, city: city || first, countryCode: p.countrycode.toUpperCase(), countryName: p.country ?? "" };
}

async function query(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<Place[]> {
  const response = await fetch(`${ENDPOINT}${path}?${new URLSearchParams(params)}`, { signal });
  if (!response.ok) throw new Error(`Geocoding failed (${response.status}).`);
  const data = (await response.json()) as { features?: PhotonFeature[] };
  return (data.features ?? []).map(toPlace).filter((place): place is Place => place !== null);
}

/** Places matching the text, ports and towns first in practice; at most five. */
export function searchPlaces(text: string, locale: Locale, signal?: AbortSignal): Promise<Place[]> {
  return query("/api/", { q: text, lang: locale, limit: "5", bbox: EUROPE_BBOX }, signal);
}

/** The named place nearest a point, for the label of a position chosen on the map. */
export async function placeAt(point: GeoPoint, locale: Locale, signal?: AbortSignal): Promise<Place | null> {
  const [place] = await query("/reverse", { lat: point.latitude.toFixed(6), lon: point.longitude.toFixed(6), lang: locale, limit: "1" }, signal);
  return place ? { ...place, point } : null;
}
