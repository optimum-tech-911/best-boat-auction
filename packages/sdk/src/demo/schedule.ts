import { increment, nextMinimum, type AuctionRules, type BidCommand, type Cents, type EngineLot } from "@bba/domain";
import { demoBidders } from "./bidders";
import { hashSeed, pick, seededRandom } from "./random";

const MINUTE = 60_000;

/** What a simulated bidder intends to do at a given moment, resolved against the lot's state then. */
export interface BidIntent {
  at: number;
  bidder: string;
  strategy: "minimum" | "jump" | "max";
  /** Extra steps above the minimum for a jump. */
  steps: number;
  /** A max bid's ceiling as a share of the market value. */
  ceilingShare: number;
  /** How far up the market value this bidder goes: steady bidders hold back for the closing. */
  capShare: number;
}

interface ScheduleInput {
  lotNumber: number;
  saleId: string;
  opensAt: number;
  scheduledCloseAt: number;
}

/**
 * A deterministic schedule of simulated bids for one lot: steady interest while the sale is
 * open, then a flurry around the scheduled close, some of it inside the soft-close window and
 * some just after it, which only counts when an extension kept the lot open.
 */
export function buildBidSchedule({ lotNumber, saleId, opensAt, scheduledCloseAt }: ScheduleInput): BidIntent[] {
  const random = seededRandom(hashSeed("schedule", saleId, lotNumber));
  const intents: BidIntent[] = [];
  let previous = "";
  const bidder = () => {
    let candidate = pick(random, demoBidders).id;
    while (candidate === previous) candidate = pick(random, demoBidders).id;
    previous = candidate;
    return candidate;
  };
  const strategy = (capShare: number): Omit<BidIntent, "at" | "bidder"> => {
    const roll = random();
    if (roll < 0.68) return { strategy: "minimum", steps: 0, ceilingShare: 1, capShare };
    if (roll < 0.84) return { strategy: "jump", steps: 1 + Math.floor(random() * 3), ceilingShare: 1, capShare };
    return { strategy: "max", steps: 0, ceilingShare: capShare * (0.9 + random() * 0.1), capShare };
  };
  const second = (instant: number) => Math.round(instant / 1000) * 1000;

  // Steady interest: a few opening bids in the first two days, then more as the closing nears.
  // Steady bidders stop at 80–88 % of the market value and leave the rest to the closing.
  const steadyEnd = scheduledCloseAt - 45 * MINUTE;
  const steadyCount = 5 + Math.floor(random() * 8);
  const steadyTimes = Array.from({ length: steadyCount }, () => {
    const position = random() < 0.3 ? random() * 0.14 : 1 - (1 - random()) ** 2;
    return second(opensAt + position * (steadyEnd - opensAt));
  }).sort((a, b) => a - b);
  for (const at of steadyTimes) intents.push({ at, bidder: bidder(), ...strategy(0.8 + ((at - opensAt) / (steadyEnd - opensAt)) * 0.08) });

  // The closing flurry, partly inside the soft-close window and partly just after the scheduled close.
  const flurryCount = 4 + Math.floor(random() * 4);
  const flurryTimes = Array.from({ length: flurryCount }, () => second(scheduledCloseAt - 12 * MINUTE + random() * 16 * MINUTE)).sort((a, b) => a - b);
  for (const at of flurryTimes) intents.push({ at, bidder: bidder(), ...strategy(1) });

  return intents;
}

/** Rounds down to the increment grid above a price, so simulated amounts look like real bids. */
function onGrid(amount: Cents, from: Cents, rules: AuctionRules): Cents {
  const step = increment(from, rules);
  return Math.max(from, from + Math.floor((amount - from) / step) * step);
}

/**
 * Turns an intent into a bid, or nothing when the bidder already leads or the lot has passed
 * what the simulated market is prepared to pay.
 */
export function resolveIntent(lot: EngineLot, intent: BidIntent, marketCents: Cents, rules: AuctionRules): BidCommand | null {
  if (lot.leader === intent.bidder) return null;
  const capCents = Math.floor((marketCents * intent.capShare) / 100) * 100;
  const minimum = nextMinimum(lot, rules);
  if (minimum > capCents) return null;
  if (intent.strategy === "minimum") return { bidder: intent.bidder, kind: "single", amountCents: minimum };
  if (intent.strategy === "jump") {
    const amount = Math.min(capCents, minimum + intent.steps * increment(minimum, rules));
    return { bidder: intent.bidder, kind: "single", amountCents: onGrid(amount, minimum, rules) };
  }
  const ceiling = onGrid(Math.floor((marketCents * intent.ceilingShare) / 100) * 100, minimum, rules);
  return { bidder: intent.bidder, kind: "max", amountCents: Math.max(minimum, ceiling) };
}
