/** A point on the Earth, in decimal degrees (WGS 84, as GPS and OpenStreetMap use). */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * A boat's exact berth is shared only with registered visitors and the buyer. The public page shows
 * a circle of this radius around a rounded point, which always contains the berth.
 */
export const PUBLIC_AREA_RADIUS_METERS = 2_000;

const EARTH_RADIUS_METERS = 6_371_008.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** The great-circle distance between two points (haversine). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The public centre of a berth: rounded to two decimals, at most about 800 m away, so the exact
 * position cannot be read from the page while the circle still contains it.
 */
export function publicArea(point: GeoPoint): GeoPoint {
  const round = (value: number) => Math.round(value * 100) / 100;
  return { latitude: round(point.latitude), longitude: round(point.longitude) };
}

export function isValidPoint(point: GeoPoint): boolean {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
}

/** The point at a distance and bearing from a start point. */
function destination(start: GeoPoint, distance: number, bearingRadians: number): GeoPoint {
  const angular = distance / EARTH_RADIUS_METERS;
  const lat1 = toRadians(start.latitude);
  const lon1 = toRadians(start.longitude);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRadians));
  const lon2 = lon1 + Math.atan2(Math.sin(bearingRadians) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2));
  return { latitude: toDegrees(lat2), longitude: ((toDegrees(lon2) + 540) % 360) - 180 };
}

/** A closed ring of [longitude, latitude] pairs approximating a circle, for map layers (GeoJSON order). */
export function circleRing(center: GeoPoint, radiusMeters: number, steps = 64): [number, number][] {
  const ring = Array.from({ length: steps }, (_, index) => {
    const point = destination(center, radiusMeters, (index / steps) * 2 * Math.PI);
    return [point.longitude, point.latitude] as [number, number];
  });
  const first = ring[0];
  return first ? [...ring, first] : ring;
}
