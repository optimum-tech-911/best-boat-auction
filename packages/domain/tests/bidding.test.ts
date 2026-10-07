import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { applyBid, checkBidRequest, defaultAuctionRules, increment, type BidKind, type BidResult, type BidderStanding, type EngineLot } from "../src";

// The specification's vectors use 21 % VAT on the premium; the engine does not depend on it.
const rules = defaultAuctionRules;
const MINUTE = 60_000;
const CLOSE = Date.UTC(2026, 9, 19, 18, 0, 0); // 20:00:00 in Paris
const EARLY = CLOSE - 2 * 60 * MINUTE;

function liveLot(overrides: Partial<EngineLot> = {}): EngineLot {
  return {
    status: "live",
    startCents: 1_000_000,
    reserveCents: null,
    priceCents: null,
    leader: null,
    leaderCeilingCents: 0,
    leaderCeilingAt: 0,
    endsAt: CLOSE,
    extensions: 0,
    ...overrides,
  };
}

function place(lot: EngineLot, bidder: string, kind: BidKind, euros: number, now = EARLY): BidResult {
  return applyBid(lot, { bidder, kind, amountCents: euros * 100 }, now, rules);
}

function accepted(result: BidResult) {
  if (!result.ok) throw new Error(`Expected an accepted bid, got ${result.code}`);
  return result;
}

const emitted = (result: BidResult) => accepted(result).bids.map((bid) => [bid.bidder, bid.amountCents / 100]);

describe("applyBid: specification test vectors", () => {
  const vector1 = place(liveLot(), "A", "max", 14_000, EARLY);
  const vector2 = place(accepted(vector1).lot, "B", "single", 10_500, EARLY + 1);
  const vector3 = place(accepted(vector2).lot, "B", "max", 14_000, EARLY + 2);
  const vector4 = place(accepted(vector3).lot, "B", "max", 15_000, EARLY + 3);

  it("1 · a first max bid opens at the start price", () => {
    expect(emitted(vector1)).toEqual([["A", 10_000]]);
    expect(accepted(vector1).lot).toMatchObject({ priceCents: 1_000_000, leader: "A", leaderCeilingCents: 1_400_000 });
  });

  it("2 · a single bid below the leader's max is answered one step higher", () => {
    expect(emitted(vector2)).toEqual([["B", 10_500], ["A", 11_000]]);
    expect(accepted(vector2).lot).toMatchObject({ priceCents: 1_100_000, leader: "A" });
  });

  it("3 · equal maximums: the earlier ceiling leads", () => {
    expect(emitted(vector3)).toEqual([["B", 14_000], ["A", 14_000]]);
    expect(accepted(vector3).lot).toMatchObject({ priceCents: 1_400_000, leader: "A" });
  });

  it("4 · a higher max wins one step above the previous ceiling", () => {
    expect(emitted(vector4)).toEqual([["B", 14_500]]);
    expect(accepted(vector4).lot).toMatchObject({ priceCents: 1_450_000, leader: "B", leaderCeilingCents: 1_500_000 });
  });

  it("5 · a partial step is capped at the leader's max", () => {
    const opened = accepted(place(liveLot({ startCents: 15_000 }), "A", "max", 230)).lot;
    const result = place(opened, "B", "single", 220);
    expect(emitted(result)).toEqual([["B", 220], ["A", 230]]);
    expect(accepted(result).lot).toMatchObject({ priceCents: 23_000, leader: "A" });
  });

  const opened6 = accepted(place(liveLot({ startCents: 500_000 }), "A", "max", 6_000)).lot;
  const vector6 = place(opened6, "B", "single", 7_000);

  it("6 · a single bid above the leader's max uses up that max first", () => {
    expect(emitted(vector6)).toEqual([["A", 6_000], ["B", 7_000]]);
    expect(accepted(vector6).lot).toMatchObject({ priceCents: 700_000, leader: "B" });
  });

  it("7 · the leader cannot place a single bid against themselves", () => {
    const result = place(accepted(vector6).lot, "B", "single", 7_500);
    expect(result).toEqual({ ok: false, code: "ALREADY_LEADING" });
  });

  it("8 · the leader raises their max silently, without extending the lot", () => {
    const lot = accepted(vector6).lot;
    const result = place(lot, "B", "max", 9_000, CLOSE - 2 * MINUTE);
    expect(accepted(result).bids).toEqual([]);
    expect(accepted(result).lot).toMatchObject({ priceCents: 700_000, leader: "B", leaderCeilingCents: 900_000, endsAt: CLOSE, extensions: 0 });
  });

  it("9 · a max above the reserve jumps to the reserve", () => {
    const result = place(liveLot({ startCents: 2_000_000, reserveCents: 2_400_000 }), "A", "max", 30_000);
    expect(emitted(result)).toEqual([["A", 24_000]]);
    expect(accepted(result).lot).toMatchObject({ priceCents: 2_400_000, leader: "A" });
  });

  it("10 · a max below the reserve is bid in full; a challenger above it jumps to the reserve", () => {
    const opened = place(liveLot({ startCents: 2_000_000, reserveCents: 2_400_000 }), "A", "max", 22_000);
    expect(emitted(opened)).toEqual([["A", 22_000]]);
    const result = place(accepted(opened).lot, "B", "max", 26_000);
    expect(emitted(result)).toEqual([["B", 24_000]]);
    expect(accepted(result).lot).toMatchObject({ priceCents: 2_400_000, leader: "B" });
  });

  it("11 · equal maximums from different bidders: the earlier one leads", () => {
    const opened = accepted(place(liveLot({ startCents: 100_000 }), "A", "max", 2_000)).lot;
    const result = place(opened, "B", "max", 2_000);
    expect(emitted(result)).toEqual([["B", 2_000], ["A", 2_000]]);
    expect(accepted(result).lot).toMatchObject({ priceCents: 200_000, leader: "A" });
  });

  it("12 · a bid below the next minimum is rejected with that minimum", () => {
    const lot = liveLot({ startCents: 500_000, priceCents: 975_000, leader: "X", leaderCeilingCents: 975_000, leaderCeilingAt: EARLY });
    expect(place(lot, "C", "single", 9_900)).toEqual({ ok: false, code: "BID_TOO_LOW", minimumCents: 1_000_000 });
  });

  it("13 · a visible bid in the last five minutes extends the lot to five minutes after that bid", () => {
    const result = place(liveLot(), "A", "single", 10_000, CLOSE - 2.5 * MINUTE);
    expect(accepted(result).lot).toMatchObject({ endsAt: CLOSE + 2.5 * MINUTE, extensions: 1 });
  });

  it("14 · a bid before the last five minutes leaves the closing time unchanged", () => {
    const result = place(liveLot(), "A", "single", 10_000, CLOSE - 5 * MINUTE - 1_000);
    expect(accepted(result).lot).toMatchObject({ endsAt: CLOSE, extensions: 0 });
  });

  it("15 · a bid at the closing time is rejected", () => {
    expect(place(liveLot(), "A", "single", 10_000, CLOSE)).toEqual({ ok: false, code: "LOT_CLOSED" });
  });
});

describe("applyBid: guards", () => {
  it("rejects bids on a lot that is not live", () => {
    expect(place(liveLot({ status: "scheduled" }), "A", "single", 10_000)).toEqual({ ok: false, code: "LOT_NOT_LIVE" });
  });

  it("rejects amounts that are not whole euros", () => {
    expect(applyBid(liveLot(), { bidder: "A", kind: "single", amountCents: 1_000_050 }, EARLY, rules)).toEqual({ ok: false, code: "INVALID_AMOUNT" });
    expect(applyBid(liveLot(), { bidder: "A", kind: "single", amountCents: 0 }, EARLY, rules)).toEqual({ ok: false, code: "INVALID_AMOUNT" });
  });

  it("asks the leader for a max above their current ceiling", () => {
    const lot = accepted(place(liveLot(), "A", "max", 14_000)).lot;
    expect(place(lot, "A", "max", 14_000)).toEqual({ ok: false, code: "MAX_TOO_LOW", minimumCents: 1_400_100 });
  });
});

describe("increment table", () => {
  it.each([
    [1_500, 100], [10_500, 500], [32_000, 1_000], [68_000, 2_000], [999, 50], [250_000, 10_000], [1_000_000, 25_000],
  ])("from %i € the next step is %i €", (price, step) => {
    expect(increment(price * 100, rules)).toBe(step * 100);
  });
});

describe("checkBidRequest", () => {
  const standing: BidderStanding = {
    signedIn: true, contactVerified: true, termsAccepted: true, suspended: false, hasOverdueInvoice: false,
    identityVerified: false, cardHoldRequired: false, cardHoldActive: false, isLinkedToSeller: false,
    leadingTotalCents: 0, creditLimitCents: rules.defaultCreditLimitCents,
  };
  const lot = liveLot();
  const command = (euros: number) => ({ bidder: "A", kind: "single" as const, amountCents: euros * 100 });

  it("requires an identity check from 25,000 €", () => {
    expect(checkBidRequest(lot, command(24_000), standing, rules)).toBeNull();
    expect(checkBidRequest(lot, command(25_000), standing, rules)?.code).toBe("ID_CHECK_REQUIRED");
    expect(checkBidRequest(lot, command(25_000), { ...standing, identityVerified: true }, rules)).toBeNull();
  });

  it("rejects amounts above twenty times the next minimum", () => {
    expect(checkBidRequest(lot, command(200_000), { ...standing, identityVerified: true }, rules)).toBeNull();
    expect(checkBidRequest(lot, command(200_100), { ...standing, identityVerified: true }, rules)?.code).toBe("AMOUNT_TOO_HIGH");
  });

  it("keeps leading bids within the credit limit", () => {
    expect(checkBidRequest(lot, command(20_000), { ...standing, leadingTotalCents: 23_500_000 }, rules)?.code).toBe("LIMIT_EXCEEDED");
  });

  it("checks the bidder before the amount", () => {
    expect(checkBidRequest(lot, command(10_000), { ...standing, signedIn: false }, rules)?.code).toBe("SIGN_IN_REQUIRED");
    expect(checkBidRequest(lot, command(10_000), { ...standing, isLinkedToSeller: true }, rules)?.code).toBe("SELLER_CANNOT_BID");
  });
});

describe("applyBid: invariants", () => {
  const bidders = ["A", "B", "C", "D"] as const;
  const commandArbitrary = fc.record({
    bidder: fc.constantFrom(...bidders),
    kind: fc.constantFrom<BidKind>("single", "max"),
    stepsAbove: fc.integer({ min: -1, max: 12 }),
    advanceMs: fc.integer({ min: 0, max: 20 * MINUTE }),
  });
  const lotArbitrary = fc.record({
    startEuros: fc.integer({ min: 1, max: 2_000 }).map((value) => value * 100),
    reserveAbove: fc.option(fc.integer({ min: 0, max: 40 }), { nil: null }),
  });

  it("keep prices, ceilings and closing times consistent over random command sequences", () => {
    fc.assert(fc.property(lotArbitrary, fc.array(commandArbitrary, { maxLength: 40 }), ({ startEuros, reserveAbove }, commands) => {
      const startCents = startEuros * 100;
      let lot = liveLot({ startCents, reserveCents: reserveAbove === null ? null : startCents + reserveAbove * 10_000, endsAt: EARLY + 60 * MINUTE });
      const highestCeiling = new Map<string, number>();
      let now = EARLY;
      for (const command of commands) {
        now += command.advanceMs;
        const base = lot.priceCents ?? lot.startCents;
        const amountCents = Math.max(100, base + command.stepsAbove * increment(base, rules));
        const before = lot;
        const result = applyBid(lot, { bidder: command.bidder, kind: command.kind, amountCents }, now, rules);
        if (!result.ok) continue;
        lot = result.lot;
        highestCeiling.set(command.bidder, Math.max(highestCeiling.get(command.bidder) ?? 0, amountCents));

        expect(lot.priceCents).not.toBeNull();
        expect(lot.priceCents!).toBeGreaterThanOrEqual(before.priceCents ?? lot.startCents);
        expect(lot.priceCents!).toBeGreaterThanOrEqual(lot.startCents);
        expect(lot.leaderCeilingCents).toBeGreaterThanOrEqual(lot.priceCents!);
        expect(lot.endsAt).toBeGreaterThanOrEqual(before.endsAt);
        for (const [bidder, ceiling] of highestCeiling) {
          if (bidder !== lot.leader) expect(ceiling).toBeLessThanOrEqual(lot.priceCents!);
        }
      }
    }), { numRuns: 2_000 });
  });

  it("replays the same commands with the same timestamps to the same state", () => {
    fc.assert(fc.property(fc.array(commandArbitrary, { maxLength: 30 }), (commands) => {
      const replay = () => {
        let lot = liveLot();
        let now = EARLY;
        const log: unknown[] = [];
        for (const command of commands) {
          now += command.advanceMs;
          const base = lot.priceCents ?? lot.startCents;
          const result = applyBid(lot, { bidder: command.bidder, kind: command.kind, amountCents: base + command.stepsAbove * increment(base, rules) }, now, rules);
          log.push(result);
          if (result.ok) lot = result.lot;
        }
        return JSON.stringify(log);
      };
      expect(replay()).toBe(replay());
    }), { numRuns: 300 });
  });
});
