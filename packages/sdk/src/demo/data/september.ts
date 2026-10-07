import { text, type DemoResult } from "./types";

/**
 * The previous sale of DESIGN_V1_1.md DATA-1: ten closed lots, seven sold, two not awarded
 * and one unsold. Lots with supplied photographs use them; the others use their category image.
 * Names and values are invented.
 */
export const septemberResults: readonly DemoResult[] = [
  {
    number: 7601, title: "Brisane 21", type: "sailboat", yearBuilt: 2003, lengthCm: 635, beamCm: 249, draftCm: 105, hull: "polyester",
    engines: { count: 1, make: "Mercury", powerHp: 5, hours: 140, fuel: "petrol", drive: "outboard" },
    berths: 4, storage: "ashore", trailerIncluded: true, city: "Sneek", country: "NL", berth: { latitude: 53.0271, longitude: 5.6641 },
    startEuros: 4_500, reserveEuros: 4_800, marketEuros: 5_600, gallery: "short", outcome: "sold", finalEuros: 5_600, bids: 8,
    description: text("Un petit croiseur côtier insubmersible à coque double peau, livré avec sa remorque routière.", "A small unsinkable coastal cruiser with a double-skin hull, sold with its road trailer."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7602, title: "Kadestein 34", type: "motorboat", yearBuilt: 1999, lengthCm: 1040, beamCm: 360, draftCm: 110, hull: "steel",
    engines: { count: 1, make: "Vetus", powerHp: 120, hours: 3900, fuel: "diesel", drive: "inboard" },
    berths: 4, storage: "afloat", trailerIncluded: false, city: "Kampen", country: "NL", berth: { latitude: 52.5694, longitude: 5.9093 },
    startEuros: 52_000, reserveEuros: 56_000, marketEuros: 61_000, gallery: "short", outcome: "sold", finalEuros: 61_000, bids: 11,
    description: text("Un croiseur fluvial en acier avec timonerie et cabine arrière.", "A steel river cruiser with a wheelhouse and an aft cabin."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7603, title: "Belvaro 9", type: "speedboat", yearBuilt: 2014, lengthCm: 900, beamCm: 280, draftCm: 85, hull: "polyester",
    engines: { count: 1, make: "Volvo Penta", powerHp: 350, hours: 410, fuel: "petrol", drive: "sterndrive" },
    berths: 2, storage: "indoors", trailerIncluded: false, city: "Aix-les-Bains", country: "FR", berth: { latitude: 45.7051, longitude: 5.8858 },
    startEuros: 38_000, reserveEuros: 41_000, marketEuros: 36_000, gallery: "short", outcome: "unsold", finalEuros: null, bids: 0,
    description: text("Un day-cruiser de lac, hiverné à l’abri chaque saison.", "A lake day cruiser, stored indoors every winter."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7604, title: "Faraona 640", type: "rib", yearBuilt: 2020, lengthCm: 640, beamCm: 250, draftCm: 45, hull: "hypalon",
    engines: { count: 1, make: "Yamaha", powerHp: 115, hours: 180, fuel: "petrol", drive: "outboard" },
    berths: 0, storage: "ashore", trailerIncluded: true, city: "Palma", country: "ES", berth: { latitude: 39.5552, longitude: 2.6258 },
    startEuros: 21_000, reserveEuros: 23_000, marketEuros: 26_750, gallery: "short", outcome: "sold", finalEuros: 26_750, bids: 12,
    description: text("Un semi-rigide à console centrale, livré avec sa remorque.", "A centre-console RIB, sold with its trailer."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7605, title: "Noordmeer 6.7", type: "sloep", yearBuilt: 2006, lengthCm: 670, beamCm: 250, draftCm: 60, hull: "polyester",
    engines: { count: 1, make: "Vetus", powerHp: 33, hours: 380, fuel: "diesel", drive: "inboard" },
    berths: 0, storage: "ashore", trailerIncluded: false, city: "Loosdrecht", country: "NL", berth: { latitude: 52.2014, longitude: 5.0646 },
    startEuros: 18_500, reserveEuros: 20_000, marketEuros: 22_500, gallery: "short", outcome: "sold", finalEuros: 22_500, bids: 10,
    description: text("Une sloep classique à coque crème, banquettes bleu marine et liston en cordage, moteur diesel silencieux.", "A classic cream-hulled sloep with navy seating, a rope fender and a quiet diesel engine."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7606, title: "Tramonte 12", type: "catamaran", yearBuilt: 2009, lengthCm: 1200, beamCm: 670, draftCm: 120, hull: "polyester",
    engines: { count: 2, make: "Volvo Penta", powerHp: 40, hours: 3100, fuel: "diesel", drive: "saildrive" },
    berths: 8, storage: "afloat", trailerIncluded: false, city: "Pula", country: "HR", berth: { latitude: 44.873, longitude: 13.8449 },
    startEuros: 165_000, reserveEuros: 175_000, marketEuros: 182_000, gallery: "short", outcome: "sold", finalEuros: 182_000, bids: 8,
    description: text("Un catamaran de croisière à quatre cabines, basé en Istrie.", "A four-cabin cruising catamaran based in Istria."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7607, title: "Corvina 22", type: "sailboat", yearBuilt: 2006, lengthCm: 680, beamCm: 250, draftCm: 120, hull: "polyester",
    engines: { count: 1, make: "Tohatsu", powerHp: 6, hours: 260, fuel: "petrol", drive: "outboard" },
    berths: 4, storage: "afloat", trailerIncluded: false, city: "Medemblik", country: "NL", berth: { latitude: 52.7707, longitude: 5.1056 },
    startEuros: 9_000, reserveEuros: 11_000, marketEuros: 12_750, gallery: "short", outcome: "sold", finalEuros: 12_750, bids: 9,
    description: text("Un petit croiseur côtier à liseré rouge, quatre couchettes, idéal sur l’IJsselmeer.", "A small coastal cruiser with a red stripe and four berths, ideal on the IJsselmeer."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7608, title: "Ostrea 44", type: "motorboat", yearBuilt: 2005, lengthCm: 1350, beamCm: 420, draftCm: 110, hull: "polyester",
    engines: { count: 2, make: "Cummins", powerHp: 480, hours: 1700, fuel: "diesel", drive: "inboard" },
    berths: 6, storage: "afloat", trailerIncluded: false, city: "Imperia", country: "IT", berth: { latitude: 43.8762, longitude: 8.0157 },
    startEuros: 140_000, reserveEuros: 165_000, marketEuros: 151_000, gallery: "short", outcome: "not_awarded", finalEuros: 151_000, bids: 6,
    description: text("Un yacht à moteur de 13,50 m avec flybridge, basé en Ligurie.", "A 13.50 m flybridge motor yacht based in Liguria."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7609, title: "Velaro 30", type: "sailboat", yearBuilt: 2011, lengthCm: 920, beamCm: 310, draftCm: 180, hull: "polyester",
    engines: { count: 1, make: "Yanmar", powerHp: 21, hours: 900, fuel: "diesel", drive: "saildrive" },
    berths: 4, storage: "afloat", trailerIncluded: false, city: "Kiel", country: "DE", berth: { latitude: 54.3388, longitude: 10.1579 },
    startEuros: 46_000, reserveEuros: 54_000, marketEuros: 49_500, gallery: "short", outcome: "not_awarded", finalEuros: 49_500, bids: 5,
    description: text("Un croiseur rapide de la Baltique, voiles de 2022.", "A quick Baltic cruiser with sails from 2022."),
    pointsOfAttention: [], equipment: {},
  },
  {
    number: 7610, title: "Rumbelo 450", type: "motorboat", yearBuilt: 2010, lengthCm: 450, beamCm: 185, draftCm: 30, hull: "polyester",
    engines: { count: 1, make: "Yamaha", powerHp: 20, hours: 210, fuel: "petrol", drive: "outboard" },
    berths: 0, storage: "ashore", trailerIncluded: true, city: "Giethoorn", country: "NL", berth: { latitude: 52.723, longitude: 6.0765 },
    startEuros: 1_950, reserveEuros: null, marketEuros: 2_900, gallery: "short", outcome: "sold", finalEuros: 2_900, bids: 9,
    description: text("Un petit bateau ouvert, simple et stable, pour les canaux et les petits lacs. Vendu sans prix de réserve, avec sa remorque.", "A simple, stable open boat for canals and small lakes. Sold without reserve, with its trailer."),
    pointsOfAttention: [], equipment: {},
  },
];
