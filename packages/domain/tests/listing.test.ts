import { describe, expect, it } from "vitest";
import { checkListing, defaultSellerOffer, packIncludes, photosRequired, type ListingInput } from "../src";

const complete: ListingInput = {
  make: "Jeanneau",
  model: "Merry Fisher 695",
  yearBuilt: 2019,
  lengthMetres: 6.9,
  description: "Bateau de pêche-promenade avec timonerie, entretenu chaque saison au chantier.",
  location: { berth: { latitude: 46.1468, longitude: -1.1668 }, countrySupported: true },
  pack: "base",
  photoCount: 3,
  startCents: 2_950_000,
  reserveCents: 3_100_000,
  seller: { name: "Camille Martin", email: "camille@example.fr", phone: "06 12 34 56 78", role: "owner", agency: "" },
  consent: true,
};
const check = (change: Partial<ListingInput>) => checkListing({ ...complete, ...change }, defaultSellerOffer, 2026).map((issue) => issue.code);

describe("listing rules", () => {
  it("accepts a complete listing", () => {
    expect(check({})).toEqual([]);
  });

  it("asks for three photos, unless the pack includes the photo shoot", () => {
    expect(photosRequired("base", defaultSellerOffer)).toBe(3);
    expect(photosRequired("boost", defaultSellerOffer)).toBe(0);
    expect(photosRequired("premium", defaultSellerOffer)).toBe(0);
    expect(check({ photoCount: 2 })).toEqual(["photos_required"]);
    expect(check({ photoCount: 0, pack: "premium" })).toEqual([]);
  });

  it("finds features through the packs a pack extends", () => {
    expect(packIncludes("premium", "professionalPhotos", defaultSellerOffer)).toBe(true);
    expect(packIncludes("premium", "listing", defaultSellerOffer)).toBe(true);
    expect(packIncludes("base", "droneVideo", defaultSellerOffer)).toBe(false);
  });

  it("needs a place on the map in a country the house serves", () => {
    expect(check({ location: null })).toEqual(["location_required"]);
    expect(check({ location: { berth: { latitude: 51.5, longitude: -0.1 }, countrySupported: false } })).toEqual(["country_unsupported"]);
  });

  it("checks the prices", () => {
    expect(check({ startCents: null })).toEqual(["start_required"]);
    expect(check({ startCents: 50_000, reserveCents: null })).toEqual(["start_too_low"]);
    expect(check({ reserveCents: 2_000_000 })).toEqual(["reserve_below_start"]);
    expect(check({ reserveCents: null })).toEqual([]);
  });

  it("checks the boat and the contact, and asks a broker for the agency", () => {
    expect(check({ yearBuilt: 2031, lengthMetres: 0.5, make: " " })).toEqual(["make_required", "year_invalid", "length_invalid"]);
    expect(check({ seller: { ...complete.seller, role: "broker", agency: "" }, consent: false })).toEqual(["agency_required", "consent_required"]);
  });

  it("files every issue under its step", () => {
    const issues = checkListing({ ...complete, make: "", location: null, photoCount: 0, startCents: null, consent: false }, defaultSellerOffer, 2026);
    expect(issues.map((issue) => issue.step)).toEqual(["boat", "location", "presentation", "price", "contact"]);
  });
});
