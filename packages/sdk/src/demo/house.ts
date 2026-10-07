import {
  applyBid,
  closingEvent,
  defaultAuctionRules,
  increment,
  lotClosingTime,
  nextLotStatus,
  nextMinimum,
  previousSale,
  type AuctionRules,
  type BidKind,
  type BidResult,
  type Cents,
  type EmittedBidKind,
  type EngineLot,
  type SaleMode,
  type SaleSchedule,
} from "@bba/domain";
import type { LotOutcome } from "@bba/contracts";
import { featuredSchedule } from "./clock";
import { octoberBoats } from "./data/october";
import { septemberResults } from "./data/september";
import type { DemoBoat, DemoResult } from "./data/types";
import { demoBidders, VIEWER_ID } from "./bidders";
import { hashSeed, pick, seededRandom } from "./random";
import { buildBidSchedule, resolveIntent, type BidIntent } from "./schedule";

const HOUR = 3_600_000;

/** A bid the viewer placed, kept on the device so the demonstration survives a reload. */
export interface ViewerCommand {
  lotId: string;
  kind: BidKind;
  amountCents: Cents;
  at: number;
}

export interface StoredBid {
  seq: number;
  bidder: string;
  amountCents: Cents;
  kind: EmittedBidKind;
  at: number;
}

type QueuedCommand = { at: number; intent: BidIntent } | { at: number; viewer: ViewerCommand };

export interface LotRecord {
  id: string;
  boat: DemoBoat;
  sale: SaleSchedule;
  /** A lot of the previous sale, shown in the results archive. */
  isResult: boolean;
  position: number;
  engine: EngineLot;
  scheduledEndsAt: number;
  marketCents: Cents;
  bids: StoredBid[];
  seq: number;
  outcome: LotOutcome | null;
  closedAt: number | null;
  decisionAt: number | null;
  queue: QueuedCommand[];
  cursor: number;
}

export type HouseEvent = { type: "lot"; lot: LotRecord } | { type: "bid"; lot: LotRecord; bid: StoredBid };

export const lotId = (number: number) => `lot-${number}`;

/**
 * The demonstration auction house: the featured monthly sale with its twelve lots and the
 * previous sale's results. Every bid, simulated or placed by the viewer, goes through the
 * domain engine; the house only decides when simulated bidders act.
 */
export class DemoAuctionHouse {
  readonly rules: AuctionRules = defaultAuctionRules;
  readonly mode: SaleMode = "regulated";
  readonly sale: SaleSchedule;
  readonly previous: SaleSchedule;
  readonly lots = new Map<string, LotRecord>();
  readonly viewerCommands: ViewerCommand[] = [];
  private clock: number;
  private readonly listeners = new Set<(event: HouseEvent) => void>();

  constructor(now: number, viewerCommands: readonly ViewerCommand[] = []) {
    this.clock = now;
    this.sale = featuredSchedule(now, octoberBoats.length);
    this.previous = previousSale(this.sale);
    octoberBoats.forEach((boat, position) => this.lots.set(lotId(boat.number), this.createLiveLot(boat, position)));
    septemberResults.forEach((result, position) => this.lots.set(lotId(result.number), this.createResult(result, position)));
    for (const command of viewerCommands) {
      const lot = this.lots.get(command.lotId);
      if (!lot || command.at > now) continue;
      lot.queue.push({ at: command.at, viewer: command });
      this.viewerCommands.push(command);
    }
    for (const lot of this.lots.values()) lot.queue.sort((a, b) => a.at - b.at || ("viewer" in a ? 1 : 0) - ("viewer" in b ? 1 : 0));
    this.advance(now, false);
  }

  get now(): number {
    return this.clock;
  }

  subscribe(listener: (event: HouseEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Moves the clock forward: opens lots, plays scheduled bids, closes lots and records decisions. */
  advance(now: number, notify = true): void {
    if (now < this.clock && notify) return;
    this.clock = Math.max(this.clock, now);
    const emit = notify ? (event: HouseEvent) => this.listeners.forEach((listener) => listener(event)) : () => undefined;
    for (const lot of this.lots.values()) this.settle(lot, this.clock, emit);
  }

  /** The viewer's bid, applied at the current time after everything scheduled before it. */
  placeViewerBid(id: string, kind: BidKind, amountCents: Cents, now: number): BidResult {
    this.advance(now);
    const lot = this.lots.get(id);
    if (!lot) return { ok: false, code: "LOT_NOT_LIVE" };
    const result = applyBid(lot.engine, { bidder: VIEWER_ID, kind, amountCents }, this.clock, this.rules);
    if (result.ok) {
      this.viewerCommands.push({ lotId: id, kind, amountCents, at: this.clock });
      this.commit(lot, result.bids, result.lot, this.clock, (event) => this.listeners.forEach((listener) => listener(event)));
    }
    return result;
  }

  /** Stops the viewer's automatic bidding: their ceiling drops to their latest bid. */
  cancelViewerMax(id: string): void {
    const lot = this.lots.get(id);
    if (!lot || lot.engine.leader !== VIEWER_ID || lot.engine.priceCents === null) return;
    lot.engine = { ...lot.engine, leaderCeilingCents: lot.engine.priceCents };
    lot.seq += 1;
    this.listeners.forEach((listener) => listener({ type: "lot", lot }));
  }

  private createLiveLot(boat: DemoBoat, position: number): LotRecord {
    const scheduledEndsAt = lotClosingTime(this.sale, position, this.rules.closingIntervalMs);
    const intents = buildBidSchedule({ lotNumber: boat.number, saleId: this.sale.id, opensAt: this.sale.opensAt, scheduledCloseAt: scheduledEndsAt });
    return {
      ...this.baseRecord(boat, this.sale, position, scheduledEndsAt, false),
      queue: intents.map((intent) => ({ at: intent.at, intent })),
    };
  }

  private baseRecord(boat: DemoBoat, sale: SaleSchedule, position: number, scheduledEndsAt: number, isResult: boolean): LotRecord {
    return {
      id: lotId(boat.number),
      boat,
      sale,
      isResult,
      position,
      scheduledEndsAt,
      marketCents: boat.marketEuros * 100,
      engine: {
        status: "scheduled",
        startCents: boat.startEuros * 100,
        reserveCents: boat.reserveEuros === null ? null : boat.reserveEuros * 100,
        priceCents: null,
        leader: null,
        leaderCeilingCents: 0,
        leaderCeilingAt: 0,
        endsAt: scheduledEndsAt,
        extensions: 0,
      },
      bids: [],
      seq: 0,
      outcome: null,
      closedAt: null,
      decisionAt: null,
      queue: [],
      cursor: 0,
    };
  }

  /** A closed lot of the previous sale: its bid history replayed through the engine to the recorded result. */
  private createResult(result: DemoResult, position: number): LotRecord {
    const scheduledEndsAt = lotClosingTime(this.previous, position, this.rules.closingIntervalMs);
    const lot = this.baseRecord(result, this.previous, position, scheduledEndsAt, true);
    lot.engine = { ...lot.engine, status: "live" };
    const random = seededRandom(hashSeed("result", this.previous.id, result.number));
    if (result.finalEuros !== null && result.bids > 0) {
      const finalCents = result.finalEuros * 100;
      const count = result.bids;
      const span = scheduledEndsAt - 10 * 60_000 - this.previous.opensAt;
      // The last two bids land in the soft-close window, as they usually do.
      const times = Array.from({ length: count }, (_, index) => index >= count - 2
        ? scheduledEndsAt - (count - 1 - index) * 3 * 60_000 - Math.round(random() * 60_000) - 20_000
        : this.previous.opensAt + Math.round(((count === 1 ? 1 : index / (count - 1)) * 0.9 + random() * 0.04) * span)).sort((a, b) => a - b);
      let previous = "";
      times.forEach((at, index) => {
        const last = index === count - 1;
        const minimum = nextMinimum(lot.engine, this.rules);
        const share = count === 1 ? 1 : index / (count - 1);
        const target = lot.engine.startCents + Math.round(((finalCents - lot.engine.startCents) * share ** 1.25) / 5_000) * 5_000;
        const amount = last ? finalCents : Math.min(Math.max(minimum, target), finalCents - increment(finalCents, this.rules));
        if (amount < minimum) return;
        let bidder = pick(random, demoBidders).id;
        while (bidder === previous) bidder = pick(random, demoBidders).id;
        previous = bidder;
        const applied = applyBid(lot.engine, { bidder, kind: "single", amountCents: amount }, at, this.rules);
        if (applied.ok) this.commit(lot, applied.bids, applied.lot, at, () => undefined);
      });
    }
    const status = result.outcome === "sold" ? "awarded" : result.outcome === "not_awarded" ? "not_awarded" : "unsold";
    lot.engine = { ...lot.engine, status };
    lot.outcome = result.outcome;
    lot.closedAt = lot.engine.endsAt;
    lot.seq += 1;
    return lot;
  }

  private settle(lot: LotRecord, now: number, emit: (event: HouseEvent) => void): void {
    if (lot.engine.status === "scheduled" && now >= lot.sale.opensAt) {
      lot.engine = { ...lot.engine, status: nextLotStatus("scheduled", "auction_opens") ?? "live" };
      lot.seq += 1;
      emit({ type: "lot", lot });
    }
    while (lot.cursor < lot.queue.length) {
      const item = lot.queue[lot.cursor];
      if (!item || item.at > now) break;
      if (lot.engine.status === "live" && item.at >= lot.engine.endsAt) this.close(lot, emit);
      lot.cursor += 1;
      if (lot.engine.status !== "live") continue;
      const command = "intent" in item
        ? resolveIntent(lot.engine, item.intent, lot.marketCents, this.rules)
        : { bidder: VIEWER_ID, kind: item.viewer.kind, amountCents: item.viewer.amountCents };
      if (!command) continue;
      const result = applyBid(lot.engine, command, item.at, this.rules);
      if (result.ok) this.commit(lot, result.bids, result.lot, item.at, emit);
    }
    if (lot.engine.status === "live" && now >= lot.engine.endsAt) this.close(lot, emit);
    if (lot.outcome === "awaiting_seller" && lot.decisionAt !== null && now >= lot.decisionAt) this.decide(lot, emit);
  }

  private commit(lot: LotRecord, bids: readonly { bidder: string; amountCents: Cents; kind: EmittedBidKind }[], engine: EngineLot, at: number, emit: (event: HouseEvent) => void): void {
    for (const bid of bids) {
      const stored: StoredBid = { seq: lot.bids.length + 1, bidder: bid.bidder, amountCents: bid.amountCents, kind: bid.kind, at };
      lot.bids.push(stored);
      emit({ type: "bid", lot, bid: stored });
    }
    lot.engine = engine;
    lot.seq += 1;
    emit({ type: "lot", lot });
  }

  private close(lot: LotRecord, emit: (event: HouseEvent) => void): void {
    const event = closingEvent({ priceCents: lot.engine.priceCents, reserveCents: lot.engine.reserveCents, noReserve: lot.boat.reserveEuros === null }, this.mode);
    const status = nextLotStatus("live", event) ?? "unsold";
    lot.engine = { ...lot.engine, status };
    lot.closedAt = lot.engine.endsAt;
    lot.outcome = status === "unsold" ? "unsold" : status === "awarded" ? "sold" : "awaiting_seller";
    if (lot.outcome === "awaiting_seller") {
      // The seller has 72 hours; in the demonstration each seller answers within the day.
      const delay = (2 + seededRandom(hashSeed("decision", lot.sale.id, lot.boat.number))() * 18) * HOUR;
      lot.decisionAt = lot.engine.endsAt + Math.round(delay);
    }
    lot.seq += 1;
    emit({ type: "lot", lot });
  }

  private decide(lot: LotRecord, emit: (event: HouseEvent) => void): void {
    const reserve = lot.engine.reserveCents ?? 0;
    const accepted = (lot.engine.priceCents ?? 0) >= reserve * 0.95;
    lot.engine = { ...lot.engine, status: nextLotStatus("seller_review", accepted ? "sale_accepted" : "sale_refused") ?? "not_awarded" };
    lot.outcome = accepted ? "sold" : "not_awarded";
    lot.decisionAt = null;
    lot.seq += 1;
    emit({ type: "lot", lot });
  }
}
