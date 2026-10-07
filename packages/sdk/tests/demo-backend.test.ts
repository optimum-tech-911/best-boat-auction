import { describe, expect, it } from "vitest";
import { createDemoBackend, scenarioOffset } from "../src";

const MINUTE = 60_000;
const OCTOBER_6_NOON = Date.UTC(2026, 9, 6, 10); // 12:00 in Paris
const FIRST_CLOSE = Date.UTC(2026, 9, 19, 18); // Monday 19 October, 20:00 in Paris

describe("demonstration catalogue", () => {
  it("is identical for the same time, so server and browser agree", async () => {
    const render = async () => {
      const backend = createDemoBackend({ now: OCTOBER_6_NOON });
      return JSON.stringify([await backend.catalogue.searchLots({}), await backend.catalogue.getRecentActivity(6), await backend.catalogue.getMarketStats()]);
    };
    expect(await render()).toBe(await render());
  });

  it("features the October sale with the twelve lots of the design system", async () => {
    const backend = createDemoBackend({ now: OCTOBER_6_NOON });
    const sale = await backend.catalogue.getFeaturedSale();
    expect(sale).toMatchObject({ id: "2026-10", phase: "live", lotCount: 12, closingStartsAt: FIRST_CLOSE });
    const page = await backend.catalogue.searchLots({ limit: 50 });
    expect(page.total).toBe(12);
    expect(page.lots[0]).toMatchObject({ number: 7701, title: "Solenne 38", slug: "7701-solenne-38" });
    expect(page.lots.find((lot) => lot.title === "Kerlys 31")).toMatchObject({ noReserve: true, startCents: 1_450_000 });
  });

  it("keeps the September results: seven sold, two not awarded, one unsold", async () => {
    const backend = createDemoBackend({ now: OCTOBER_6_NOON });
    const results = await backend.catalogue.searchResults({ limit: 50 });
    const outcomes = results.lots.map((lot) => lot.state.outcome);
    expect(results.total).toBe(10);
    expect(outcomes.filter((outcome) => outcome === "sold")).toHaveLength(7);
    expect(outcomes.filter((outcome) => outcome === "not_awarded")).toHaveLength(2);
    expect(outcomes.filter((outcome) => outcome === "unsold")).toHaveLength(1);
    const corvina = results.lots.find((lot) => lot.title === "Corvina 22");
    expect(corvina?.state.priceCents).toBe(1_275_000);
  });

  it("never lets simulated bidders pass the market value", async () => {
    const backend = createDemoBackend({ now: FIRST_CLOSE + 60 * MINUTE });
    for (const lot of backend.house.lots.values()) {
      if (!lot.isResult) expect(lot.engine.priceCents ?? 0).toBeLessThanOrEqual(lot.marketCents);
    }
  });
});

describe("closing", () => {
  it("closes every lot after the staggered closing, with extensions from late bids", async () => {
    const backend = createDemoBackend({ now: FIRST_CLOSE + 60 * MINUTE });
    const lots = [...backend.house.lots.values()].filter((lot) => !lot.isResult);
    expect(lots.every((lot) => lot.closedAt !== null)).toBe(true);
    expect(lots.some((lot) => lot.engine.extensions > 0)).toBe(true);
    expect((await backend.catalogue.getFeaturedSale()).phase).toBe("closed");
    expect(lots.find((lot) => lot.boat.title === "Kerlys 31")?.outcome).toBe("sold");
  });

  it("sends lots below their reserve to the seller, who answers within the day", () => {
    const atClose = createDemoBackend({ now: FIRST_CLOSE + 60 * MINUTE });
    const rivage = [...atClose.house.lots.values()].find((lot) => lot.boat.title === "Rivage 42 Fly");
    expect(rivage?.outcome).toBe("awaiting_seller");
    const nextDay = createDemoBackend({ now: FIRST_CLOSE + 22 * 60 * MINUTE });
    expect([...nextDay.house.lots.values()].find((lot) => lot.boat.title === "Rivage 42 Fly")?.outcome).toMatch(/sold|not_awarded/);
  });

  it("plays scheduled bids as the clock moves on", async () => {
    let now = FIRST_CLOSE - 20 * MINUTE;
    const backend = createDemoBackend({ now, clock: () => now });
    const before = (await backend.catalogue.getRecentActivity(200)).length;
    now = FIRST_CLOSE + 2 * MINUTE;
    backend.tick();
    expect((await backend.catalogue.getRecentActivity(200)).length).toBeGreaterThan(before);
  });
});

describe("the viewer's bids", () => {
  async function signedIn(now = OCTOBER_6_NOON) {
    const backend = createDemoBackend({ now });
    await backend.account.signIn({ email: "camille.martin@example.fr", displayName: "Camille Martin", acceptTerms: true });
    return backend;
  }

  it("asks for sign-in before bidding", async () => {
    const backend = createDemoBackend({ now: OCTOBER_6_NOON });
    const result = await backend.bidding.placeBid({ lotId: "lot-7702", kind: "single", amountCents: 1_450_000, idempotencyKey: "a" });
    expect(result).toEqual({ ok: false, code: "SIGN_IN_REQUIRED" });
  });

  it("places a bid at the next minimum and leads", async () => {
    const backend = await signedIn();
    const [state] = await backend.live.getLotStates(["lot-7702"]);
    const result = await backend.bidding.placeBid({ lotId: "lot-7702", kind: "single", amountCents: state!.nextMinimumCents!, idempotencyKey: "b" });
    expect(result.ok && result.position.status).toBe("leading");
  });

  it("rejects an amount below the minimum and asks for an identity check from 25,000 €", async () => {
    const backend = await signedIn();
    expect(await backend.bidding.placeBid({ lotId: "lot-7702", kind: "single", amountCents: 100, idempotencyKey: "c" })).toMatchObject({ ok: false, code: "BID_TOO_LOW" });
    expect(await backend.bidding.placeBid({ lotId: "lot-7701", kind: "max", amountCents: 7_000_000, idempotencyKey: "d" })).toMatchObject({ ok: false, code: "ID_CHECK_REQUIRED" });
    await backend.account.verifyIdentity();
    expect((await backend.bidding.placeBid({ lotId: "lot-7701", kind: "max", amountCents: 7_000_000, idempotencyKey: "e" })).ok).toBe(true);
  });

  it("returns the first result for a repeated idempotency key", async () => {
    const backend = await signedIn();
    const [state] = await backend.live.getLotStates(["lot-7710"]);
    const request = { lotId: "lot-7710", kind: "single" as const, amountCents: state!.nextMinimumCents!, idempotencyKey: "same" };
    const first = await backend.bidding.placeBid(request);
    expect(await backend.bidding.placeBid(request)).toBe(first);
    expect(backend.snapshot().viewerCommands).toHaveLength(1);
  });

  it("replays the viewer's bids after a reload", async () => {
    const backend = await signedIn();
    const [state] = await backend.live.getLotStates(["lot-7702"]);
    await backend.bidding.placeBid({ lotId: "lot-7702", kind: "max", amountCents: state!.nextMinimumCents! + 200_000, idempotencyKey: "f" });
    const { viewer, viewerCommands } = backend.snapshot();
    const reloaded = createDemoBackend({ now: OCTOBER_6_NOON, viewer, viewerCommands });
    expect(await reloaded.bidding.getPosition("lot-7702")).toEqual(await backend.bidding.getPosition("lot-7702"));
  });
});

describe("catalogue queries", () => {
  const backend = createDemoBackend({ now: OCTOBER_6_NOON });

  it("searches in French and English, by place and by lot number", async () => {
    expect((await backend.catalogue.searchLots({ query: "voilier" })).total).toBe(3);
    expect((await backend.catalogue.searchLots({ query: "Sailboat" })).total).toBe(3);
    expect((await backend.catalogue.searchLots({ query: "lelystad" })).lots.map((lot) => lot.title)).toEqual(["Solenne 38"]);
    expect((await backend.catalogue.searchLots({ query: "7712" })).lots.map((lot) => lot.title)).toEqual(["Alizé 40"]);
  });

  it("counts facets with the other filters applied", async () => {
    const page = await backend.catalogue.searchLots({ types: ["rib"], countries: ["NL"] });
    expect(page.lots.map((lot) => lot.title)).toEqual(["Tern 670"]);
    expect(page.facets.types).toMatchObject({ rib: 1, sailboat: 1, motorboat: 2, sloep: 1 });
    expect(page.facets.countries).toMatchObject({ NL: 1, FR: 1 });
  });

  it("filters no-reserve lots and sorts by price", async () => {
    expect((await backend.catalogue.searchLots({ noReserveOnly: true })).lots.map((lot) => lot.title)).toEqual(["Kerlys 31"]);
    const sorted = (await backend.catalogue.searchLots({ sort: "price_desc" })).lots;
    expect(sorted[0]?.title).toBe("Alizé 40");
  });
});

describe("demonstration photographs", () => {
  it("gives every lot, open or closed, at least one photograph", async () => {
    const backend = createDemoBackend({ now: OCTOBER_6_NOON });
    const [open, results] = await Promise.all([backend.catalogue.searchLots({ limit: 50 }), backend.catalogue.searchResults({ limit: 50 })]);
    const missing = [...open.lots, ...results.lots].filter((lot) => lot.cover === null).map((lot) => lot.title);
    expect(missing).toEqual([]);
  });
});

describe("demonstration clock", () => {
  it("moves to three minutes before the first closing", () => {
    const offset = scenarioOffset("closing", OCTOBER_6_NOON, 12);
    expect(OCTOBER_6_NOON + offset).toBe(FIRST_CLOSE - 3 * MINUTE);
  });

  it("shows the sale after it closes", async () => {
    const closed = createDemoBackend({ now: OCTOBER_6_NOON + scenarioOffset("closed", OCTOBER_6_NOON, 12) });
    expect(await closed.catalogue.getFeaturedSale()).toMatchObject({ id: "2026-10", phase: "closed" });
  });
});

describe("seller funnel", () => {
  it("estimates the worked example at 1,108 € a month", async () => {
    const backend = createDemoBackend({ now: OCTOBER_6_NOON });
    const run = await backend.seller.estimate({
      boatType: "motorboat", lengthMetres: 10, yearBuilt: 2008, valueCents: 6_000_000, condition: "good", coast: "mediterranean",
      storage: "marina", wintersAshore: false, winterMonths: 5, taxCents: 50_000, daysUsedPerYear: 15,
    });
    expect(Math.round(run.result.monthlyCents / 100)).toBe(1_108);
  });
});

describe("seller leads", () => {
  it("asks for a name, an e-mail, a phone for call-backs and an explicit consent", async () => {
    const { seller } = createDemoBackend({ now: OCTOBER_6_NOON });
    const lead = { intent: "callback" as const, name: "Camille Martin", email: "camille@example.com", phone: "0601020304", consent: true };
    expect(await seller.submitLead({ ...lead, name: " " })).toEqual({ ok: false, reason: "name_required" });
    expect(await seller.submitLead({ ...lead, email: "camille" })).toEqual({ ok: false, reason: "invalid_email" });
    expect(await seller.submitLead({ ...lead, phone: "" })).toEqual({ ok: false, reason: "phone_required" });
    expect(await seller.submitLead({ ...lead, consent: false })).toEqual({ ok: false, reason: "consent_required" });
    expect(await seller.submitLead(lead)).toMatchObject({ ok: true, reference: expect.stringMatching(/^BBA-/) });
  });
});

describe("account settings", () => {
  it("requires a signed-in viewer", async () => {
    const { account } = createDemoBackend({ now: OCTOBER_6_NOON });
    expect(await account.updateProfile({ displayName: "Camille" })).toEqual({ ok: false, reason: "sign_in_required" });
  });

  it("starts with bidding alerts on and marketing off, then saves changes", async () => {
    const { account } = createDemoBackend({ now: OCTOBER_6_NOON });
    const signedIn = await account.signIn({ email: "camille@example.com", displayName: "Camille", acceptTerms: true });
    expect(signedIn.ok && signedIn.viewer.notifications).toEqual({ outbid: true, closingSoon: true, results: false, newLots: false });
    const result = await account.updateProfile({ country: "NL", notifications: { outbid: true, closingSoon: false, results: true, newLots: false } });
    expect(result.ok && result.viewer).toMatchObject({ country: "NL", notifications: { closingSoon: false, results: true } });
  });

  it("validates and normalises company details", async () => {
    const { account } = createDemoBackend({ now: OCTOBER_6_NOON });
    await account.signIn({ email: "camille@example.com" });
    expect(await account.updateProfile({ company: { name: "", vatNumber: "FR12345678901" } })).toEqual({ ok: false, reason: "company_name_required" });
    expect(await account.updateProfile({ company: { name: "Voiles SARL", vatNumber: "12" } })).toEqual({ ok: false, reason: "invalid_vat_number" });
    const result = await account.updateProfile({ company: { name: " Voiles SARL ", vatNumber: "fr 12 345678901" } });
    expect(result.ok && result.viewer.company).toEqual({ name: "Voiles SARL", vatNumber: "FR12345678901" });
    const removed = await account.updateProfile({ company: null });
    expect(removed.ok && removed.viewer.company).toBeNull();
  });
});

describe("broker space", () => {
  it("lists the broker's open lots with what the broker brought to each", async () => {
    const { brokers } = createDemoBackend({ now: OCTOBER_6_NOON });
    const portfolio = await brokers.getPortfolio();
    expect(portfolio).toHaveLength(5);
    expect(portfolio.map((entry) => entry.contribution)).toEqual(["boat", "client", "boatAndClient", "boat", "client"]);
    expect(portfolio.every((entry) => entry.lot.state.phase === "live")).toBe(true);
  });
});

describe("lot questions and contact requests", () => {
  it("shows answered questions and a viewing fixed during the bidding period", async () => {
    const { catalogue } = createDemoBackend({ now: OCTOBER_6_NOON });
    const lot = await catalogue.getLot(7701);
    expect(lot?.questions.length).toBeGreaterThanOrEqual(2);
    const sale = await catalogue.getFeaturedSale();
    expect(lot?.viewing?.startsAt).toBeGreaterThanOrEqual(sale.viewingsFrom);
    expect(lot?.viewing?.endsAt).toBeLessThanOrEqual(sale.viewingsUntil);
  });

  it("asks the viewer to sign in before asking a question", async () => {
    const { account, engagement } = createDemoBackend({ now: OCTOBER_6_NOON });
    const lotId = "lot-7701";
    expect(await engagement.askQuestion({ lotId, text: "Le mât a-t-il été changé ?" })).toEqual({ ok: false, reason: "sign_in_required" });
    await account.signIn({ email: "camille@example.com" });
    expect(await engagement.askQuestion({ lotId, text: "Mât ?" })).toEqual({ ok: false, reason: "too_short" });
  });

  it("requires an agency for broker partnerships and consent for every request", async () => {
    const { engagement } = createDemoBackend({ now: OCTOBER_6_NOON });
    const request = { topic: "broker" as const, name: "Marc Leroy", email: "marc@agence.fr", company: "Agence du Port", consent: true };
    expect(await engagement.requestContact({ ...request, company: "" })).toEqual({ ok: false, reason: "company_required" });
    expect(await engagement.requestContact({ ...request, consent: false })).toEqual({ ok: false, reason: "consent_required" });
    expect(await engagement.requestContact(request)).toMatchObject({ ok: true });
    expect(await engagement.requestContact({ ...request, topic: "finance", company: "" })).toMatchObject({ ok: true });
  });
});

describe("listing a boat", () => {
  const listing = {
    boatType: "motorboat" as const,
    make: "Jeanneau",
    model: "Merry Fisher 695",
    yearBuilt: 2019,
    lengthMetres: 6.9,
    condition: "good" as const,
    engine: { powerHp: 150, hours: 310, fuel: "petrol" as const },
    description: "Bateau de pêche-promenade avec timonerie, entretenu chaque saison au chantier.",
    location: { berth: { latitude: 46.1468, longitude: -1.1668 }, label: "Port des Minimes, La Rochelle", city: "La Rochelle", country: "FR" as const },
    storage: "afloat" as const,
    trailerIncluded: false,
    pack: "base" as const,
    photos: [1, 2, 3].map((index) => ({ name: `photo-${index}.jpg`, bytes: 1_000_000 })),
    startCents: 2_950_000,
    reserveCents: null,
    seller: { name: "Camille Martin", email: "camille@example.fr", phone: "0612345678", role: "owner" as const, agency: "" },
    consent: true,
  };

  it("files a complete listing for the next sale still open to submissions", async () => {
    const { seller } = createDemoBackend({ now: OCTOBER_6_NOON });
    const result = await seller.submitListing(listing);
    expect(result).toMatchObject({ ok: true, saleId: "2026-11", reference: expect.stringMatching(/^BBA-L/) });
  });

  it("returns every issue with its step when something is missing", async () => {
    const { seller } = createDemoBackend({ now: OCTOBER_6_NOON });
    const result = await seller.submitListing({ ...listing, photos: [], consent: false });
    expect(result).toEqual({ ok: false, issues: [
      { step: "presentation", field: "photos", code: "photos_required" },
      { step: "contact", field: "consent", code: "consent_required" },
    ] });
  });
});
