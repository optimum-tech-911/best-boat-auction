import { defaultAuctionRules, upcomingSales, type SaleSchedule } from "@bba/domain";

/**
 * The demonstration clock. By default it is the real time, so the monthly sale opens,
 * closes and rolls over on its own. Preview scenarios move the clock to a moment of
 * the sale (DESIGN_V1_1.md DATA-1: "the demo clock shows closings").
 */
/** Preview scenarios. Bidding for a sale opens as the previous one closes, so there is no "before the sale" moment to preview. */
export const demoScenarios = ["live", "closing", "closed"] as const;
export type DemoScenario = (typeof demoScenarios)[number];

export function isDemoScenario(value: unknown): value is DemoScenario {
  return typeof value === "string" && (demoScenarios as readonly string[]).includes(value);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Lots close one minute apart; extensions can add a few minutes after the last one. */
export function closingWindow(lotCount: number): number {
  return lotCount * defaultAuctionRules.closingIntervalMs + 30 * MINUTE;
}

/**
 * The sale that holds the demonstration lots at an instant: the next sale, or the one
 * that closed less than a day ago so its results stay on the homepage.
 */
export function featuredSchedule(now: number, lotCount: number): SaleSchedule {
  const sale = upcomingSales(now - DAY, 1, closingWindow(lotCount))[0];
  if (!sale) throw new Error("The sale calendar returned no sale.");
  return sale;
}

/** The clock offset that moves the demonstration to a scenario, from the real time. */
export function scenarioOffset(scenario: DemoScenario, realNow: number, lotCount: number): number {
  const next = upcomingSales(realNow, 1, closingWindow(lotCount))[0];
  if (!next) return 0;
  const target = (() => {
    switch (scenario) {
      case "live":
        return realNow >= next.opensAt && realNow < next.closingStartsAt - HOUR ? realNow : next.closingStartsAt - 4 * DAY - 3 * HOUR;
      case "closing":
        return next.closingStartsAt - 3 * MINUTE;
      case "closed":
        return next.closingStartsAt + closingWindow(lotCount) + 10 * MINUTE;
    }
  })();
  return target - realNow;
}
