import { describe, expect, it } from "vitest";
import { estimateHoldingCost, waitingCost, type HoldingCostInput } from "../src";

const workedExample: HoldingCostInput = {
  lengthMetres: 10,
  yearBuilt: 2008,
  valueCents: 6_000_000,
  condition: "good",
  coast: "mediterranean",
  storage: "marina",
  wintersAshore: false,
  winterMonths: 5,
  taxCents: 50_000,
  daysUsedPerYear: 15,
  currentYear: 2026,
};

describe("estimateHoldingCost", () => {
  const estimate = estimateHoldingCost(workedExample);

  it("matches the specification's worked example: 13,299 € a year (± 1 €)", () => {
    expect(Math.abs(estimate.yearlyCents - 1_329_900)).toBeLessThanOrEqual(100);
  });

  it("gives about 1,108 € a month and 887 € per day on the water", () => {
    expect(Math.round(estimate.monthlyCents / 100)).toBe(1_108);
    expect(Math.round((estimate.perDayUsedCents ?? 0) / 100)).toBe(887);
  });

  it("shows that selling now instead of in six months avoids about 6,650 €", () => {
    expect(Math.round(waitingCost(estimate, 6) / 100)).toBe(6_650);
  });

  it("lists the largest cost first and omits empty lines", () => {
    expect(estimate.lines[0]?.key).toBe("berth");
    expect(estimate.lines.some((line) => line.key === "winter")).toBe(false);
  });

  it("uses the owner's own figures when they are given", () => {
    const own = estimateHoldingCost({ ...workedExample, ownerBerthCents: 300_000 });
    expect(own.lines.find((line) => line.key === "berth")).toEqual({ key: "berth", yearlyCents: 300_000, source: "owner" });
  });

  it("charges a flat amount for a boat kept on a trailer, with no winter storage", () => {
    const trailer = estimateHoldingCost({ ...workedExample, storage: "trailer", wintersAshore: true });
    expect(trailer.lines.find((line) => line.key === "berth")?.yearlyCents).toBe(15_000);
    expect(trailer.lines.some((line) => line.key === "winter")).toBe(false);
  });

  it("applies the depreciation band of the boat's age and condition", () => {
    expect(estimateHoldingCost({ ...workedExample, yearBuilt: 2026 }).depreciationRate).toBe(1_500);
    expect(estimateHoldingCost({ ...workedExample, yearBuilt: 2003 }).depreciationRate).toBe(300);
    const poor = estimateHoldingCost({ ...workedExample, condition: "needs_work" });
    expect(poor.lines.find((line) => line.key === "depreciation")?.yearlyCents).toBe(360_000);
  });

  it("compares with a broker commission of 8 %", () => {
    expect(estimate.brokerCommissionCents).toBe(480_000);
  });
});
