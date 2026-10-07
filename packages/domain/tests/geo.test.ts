import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { circleRing, distanceMeters, isValidPoint, PUBLIC_AREA_RADIUS_METERS, publicArea } from "../src";

describe("geography", () => {
  it("measures distances like a reference (Paris to Lyon, about 392 km)", () => {
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const lyon = { latitude: 45.764, longitude: 4.8357 };
    expect(distanceMeters(paris, lyon) / 1000).toBeCloseTo(391.5, 0);
  });

  it("keeps every berth inside its public circle, without revealing it", () => {
    fc.assert(fc.property(fc.double({ min: 35, max: 71, noNaN: true }), fc.double({ min: -25, max: 40, noNaN: true }), (latitude, longitude) => {
      const berth = { latitude, longitude };
      const shown = publicArea(berth);
      const distance = distanceMeters(berth, shown);
      expect(distance).toBeLessThan(PUBLIC_AREA_RADIUS_METERS / 2);
      expect(publicArea(shown)).toEqual(shown);
    }));
  });

  it("draws a closed circle at the requested radius", () => {
    const center = { latitude: 52.52, longitude: 5.47 };
    const ring = circleRing(center, PUBLIC_AREA_RADIUS_METERS, 32);
    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[32]);
    for (const [longitude, latitude] of ring) {
      expect(distanceMeters(center, { latitude, longitude })).toBeCloseTo(PUBLIC_AREA_RADIUS_METERS, 0);
    }
  });

  it("rejects points outside the globe", () => {
    expect(isValidPoint({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidPoint({ latitude: 43.58, longitude: 7.12 })).toBe(true);
  });
});
