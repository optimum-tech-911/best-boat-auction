import { describe, expect, it } from "vitest";
import { canTransition, closingEvent, lotClosingTime, nextLotStatus, previousSale, saleForMonth, upcomingSales } from "../src";

const iso = (instant: number) => new Date(instant).toISOString();

describe("sale calendar", () => {
  it("closes the October 2026 sale on Monday 19 October at 20:00 in Paris, after four weeks of bidding", () => {
    const sale = saleForMonth(2026, 10);
    expect(iso(sale.closingStartsAt)).toBe("2026-10-19T18:00:00.000Z");
    expect(iso(sale.submissionDeadlineAt)).toBe("2026-09-14T21:59:00.000Z");
    expect(iso(sale.opensAt)).toBe("2026-09-21T18:00:00.000Z");
    expect(sale.viewingsFrom).toBe(sale.opensAt);
    expect(iso(sale.viewingsUntil)).toBe("2026-10-17T16:00:00.000Z");
  });

  it("follows the change to winter time for the November sale", () => {
    const sale = saleForMonth(2026, 11);
    expect(iso(sale.closingStartsAt)).toBe("2026-11-16T19:00:00.000Z");
    expect(iso(sale.submissionDeadlineAt)).toBe("2026-10-12T21:59:00.000Z");
    expect(iso(sale.viewingsUntil)).toBe("2026-11-14T17:00:00.000Z");
  });

  it("opens the next sale's bidding when the previous one closes", () => {
    expect(saleForMonth(2026, 11).opensAt).toBe(saleForMonth(2026, 10).closingStartsAt);
  });

  it("lists the next sales from a given instant", () => {
    const ids = upcomingSales(Date.UTC(2026, 9, 6, 10), 3, 12 * 60_000).map((sale) => sale.id);
    expect(ids).toEqual(["2026-10", "2026-11", "2026-12"]);
  });

  it("moves to the next month once the staggered closing has finished", () => {
    expect(upcomingSales(Date.UTC(2026, 9, 19, 18, 5), 1, 12 * 60_000)[0]?.id).toBe("2026-10");
    expect(upcomingSales(Date.UTC(2026, 9, 19, 18, 30), 1, 12 * 60_000)[0]?.id).toBe("2026-11");
  });

  it("finds the previous month's sale across a year boundary", () => {
    expect(previousSale(saleForMonth(2027, 1)).id).toBe("2026-12");
  });

  it("closes lots one minute apart", () => {
    const sale = saleForMonth(2026, 10);
    expect(iso(lotClosingTime(sale, 5, 60_000))).toBe("2026-10-19T18:05:00.000Z");
  });
});

describe("lot lifecycle", () => {
  it("follows the normal path from draft to settled", () => {
    const path = [
      ["draft", "seller_submits", "in_review"],
      ["in_review", "staff_approve", "scheduled"],
      ["scheduled", "auction_opens", "live"],
      ["live", "closes_for_review", "seller_review"],
      ["seller_review", "sale_accepted", "awarded"],
      ["awarded", "buyer_pays", "in_escrow"],
      ["in_escrow", "both_sign", "papers_signed"],
      ["papers_signed", "handover_code_entered", "handed_over"],
      ["handed_over", "release_period_ends", "settled"],
    ] as const;
    for (const [from, event, to] of path) expect(nextLotStatus(from, event)).toBe(to);
  });

  it("refuses transitions that the table does not define", () => {
    expect(canTransition("live", "buyer_pays")).toBe(false);
    expect(nextLotStatus("settled", "problem_raised")).toBeNull();
  });

  it("decides the outcome at closing by sale mode", () => {
    expect(closingEvent({ priceCents: null, reserveCents: null, noReserve: true }, "regulated")).toBe("closes_without_bids");
    expect(closingEvent({ priceCents: 1_450_000, reserveCents: null, noReserve: true }, "regulated")).toBe("closes_awarded");
    expect(closingEvent({ priceCents: 2_400_000, reserveCents: 2_400_000, noReserve: false }, "regulated")).toBe("closes_awarded");
    expect(closingEvent({ priceCents: 2_300_000, reserveCents: 2_400_000, noReserve: false }, "regulated")).toBe("closes_for_review");
    expect(closingEvent({ priceCents: 2_400_000, reserveCents: 2_400_000, noReserve: false }, "brokerage")).toBe("closes_for_review");
  });
});
