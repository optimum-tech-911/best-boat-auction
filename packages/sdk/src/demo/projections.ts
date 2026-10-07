import { isReserveMet, nextMinimum, premiumRate, publicArea, zonedTimeToInstant, type AuctionRules, type SaleMode, type SaleSchedule } from "@bba/domain";
import type {
  ActivityEntry,
  BidHistoryEntry,
  CountryCode,
  DocumentLink,
  LotDetail,
  LotLiveState,
  LotQuestion,
  LotSummary,
  LotViewing,
  SalePhase,
  SaleSummary,
  ViewerPosition,
} from "@bba/contracts";
import { displayTimeZone, lotSlug } from "@bba/i18n";
import { bidderIdentity, VIEWER_ID } from "./bidders";
import { galleryFor } from "./data/media";
import { demoQuestions } from "./data/questions";
import { text } from "./data/types";
import type { LotRecord, StoredBid } from "./house";
import { hashSeed } from "./random";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function toLiveState(lot: LotRecord, rules: AuctionRules, viewerCountry: CountryCode): LotLiveState {
  const { engine } = lot;
  const phase = engine.status === "scheduled" ? "scheduled" : engine.status === "live" ? "live" : "closed";
  const noReserve = lot.boat.reserveEuros === null;
  return {
    lotId: lot.id,
    seq: lot.seq,
    phase,
    outcome: lot.outcome,
    priceCents: engine.priceCents,
    nextMinimumCents: phase === "closed" ? null : nextMinimum(engine, rules),
    bidCount: lot.bids.length,
    leaderAlias: engine.leader ? bidderIdentity(engine.leader, viewerCountry).alias : null,
    endsAt: engine.endsAt,
    scheduledEndsAt: lot.scheduledEndsAt,
    extensions: engine.extensions,
    reserve: noReserve ? "none" : isReserveMet(engine) ? "met" : "not_met",
  };
}

export function toSummary(lot: LotRecord, rules: AuctionRules, viewerCountry: CountryCode): LotSummary {
  const { boat } = lot;
  return {
    id: lot.id,
    number: boat.number,
    slug: lotSlug(boat.number, boat.title),
    saleId: lot.sale.id,
    title: boat.title,
    type: boat.type,
    yearBuilt: boat.yearBuilt,
    lengthCm: boat.lengthCm,
    location: { city: boat.city, country: boat.country },
    cover: galleryFor(boat.number, boat.type, lot.isResult)[0] ?? null,
    noReserve: boat.reserveEuros === null,
    isNew: boat.isNew ?? false,
    startCents: boat.startEuros * 100,
    premiumRate: premiumRate(boat.startEuros * 100, rules),
    watchers: 4 + (hashSeed(lot.id, "watchers") % 38),
    state: toLiveState(lot, rules, viewerCountry),
  };
}

const demoDocuments: readonly DocumentLink[] = [
  { id: "inventory", title: text("Inventaire du bord", "Inventory"), visibility: "public", pages: 2 },
  { id: "specifications", title: text("Fiche technique", "Specification sheet"), visibility: "public", pages: 4 },
  { id: "registration", title: text("Titre de navigation", "Registration certificate"), visibility: "registered_bidders", pages: 1 },
  { id: "service", title: text("Factures d’entretien", "Service invoices"), visibility: "registered_bidders", pages: 9 },
];

export function toDetail(lot: LotRecord, rules: AuctionRules, mode: SaleMode, viewerCountry: CountryCode): LotDetail {
  const { boat } = lot;
  const summary = toSummary(lot, rules, viewerCountry);
  return {
    ...summary,
    gallery: galleryFor(boat.number, boat.type, lot.isResult),
    plannedPhotoCount: boat.gallery === "full" ? 8 : 3,
    description: boat.description,
    pointsOfAttention: boat.pointsOfAttention,
    beamCm: boat.beamCm,
    draftCm: boat.draftCm,
    hull: boat.hull,
    engines: boat.engines,
    berths: boat.berths,
    storage: boat.storage,
    trailerIncluded: boat.trailerIncluded,
    equipment: boat.equipment,
    viewing: lotViewing(lot),
    documents: [...demoDocuments],
    questions: lotQuestions(lot),
    conditions: {
      mode,
      premiumRate: summary.premiumRate,
      vatOnPremium: rules.vatOnPremium,
      vatOnHammer: 0,
      sellerDecisionHours: rules.sellerDecisionHours,
      paymentDays: rules.paymentDays,
      collectionDays: rules.collectionDays,
      softCloseWindowMinutes: rules.softCloseWindowMs / 60_000,
      extensionMinutes: rules.extensionMs / 60_000,
    },
    area: publicArea(boat.berth),
  };
}

/** The Paris calendar date of an instant. */
function parisDate(instant: number): { year: number; month: number; day: number } {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: displayTimeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(instant).split("-").map(Number);
  return { year: year ?? 1970, month: month ?? 1, day: day ?? 1 };
}

/**
 * The demonstration's viewing for a lot: one of the last three Saturdays of the bidding period,
 * morning or afternoon, fixed with the seller or with the broker who brought the boat.
 */
function lotViewing(lot: LotRecord): LotViewing {
  const seed = hashSeed(lot.id, "viewing");
  const lastSaturday = parisDate(lot.sale.viewingsUntil);
  const saturday = parisDate(Date.UTC(lastSaturday.year, lastSaturday.month - 1, lastSaturday.day) - (seed % 3) * 7 * DAY);
  const startsAt = zonedTimeToInstant(saturday, { hour: seed % 2 === 0 ? 10 : 14, minute: 0 }, displayTimeZone);
  return { startsAt, endsAt: startsAt + 2 * HOUR, arrangedWith: seed % 4 === 0 ? "broker" : "seller" };
}

/** Two or three answered questions per lot, asked during the first days of bidding. */
function lotQuestions(lot: LotRecord): LotQuestion[] {
  const seed = hashSeed(lot.id, "questions");
  const count = 2 + (seed % 2);
  return Array.from({ length: count }, (_, index) => {
    const entry = demoQuestions[(seed + index * 2) % demoQuestions.length]!;
    // Bidding opens at 20:00; questions arrive between 10:00 and 20:00 on the following days.
    const askedAt = lot.sale.opensAt + (2 + index * 3) * DAY - 10 * HOUR + (seed % 600) * 60_000;
    return {
      id: `${lot.id}-q${index + 1}`,
      askedBy: String(1_000 + ((seed >>> (index * 4)) % 9_000)),
      askedAt,
      question: entry.question,
      answer: entry.answer,
      answeredAt: askedAt + (2 + (seed % 5)) * HOUR,
    };
  });
}

export function toBidEntry(lot: LotRecord, bid: StoredBid, viewerCountry: CountryCode): BidHistoryEntry {
  const isViewer = bid.bidder === VIEWER_ID;
  const identity = bidderIdentity(bid.bidder, viewerCountry);
  return {
    lotId: lot.id,
    seq: bid.seq,
    alias: identity.alias,
    country: identity.country,
    amountCents: bid.amountCents,
    at: bid.at,
    isViewer,
    ...(isViewer ? { automatic: bid.kind === "auto" } : {}),
  };
}

export function toActivity(lot: LotRecord, bid: StoredBid, viewerCountry: CountryCode): ActivityEntry {
  return { ...toBidEntry(lot, bid, viewerCountry), lotNumber: lot.boat.number, lotTitle: lot.boat.title };
}

export function salePhase(schedule: SaleSchedule, lots: readonly LotRecord[], now: number): SalePhase {
  if (now < schedule.opensAt) return "upcoming";
  if (lots.length > 0 && lots.every((lot) => lot.closedAt !== null)) return "closed";
  if (now >= schedule.closingStartsAt - HOUR) return "closing";
  return "live";
}

export function toSaleSummary(schedule: SaleSchedule, lots: readonly LotRecord[], now: number, mode: SaleMode, rules: AuctionRules, lotCount = lots.length): SaleSummary {
  return {
    id: schedule.id,
    mode,
    phase: salePhase(schedule, lots, now),
    submissionDeadlineAt: schedule.submissionDeadlineAt,
    opensAt: schedule.opensAt,
    viewingsFrom: schedule.viewingsFrom,
    viewingsUntil: schedule.viewingsUntil,
    closingStartsAt: schedule.closingStartsAt,
    closingEndsAt: schedule.closingStartsAt + Math.max(0, lotCount - 1) * rules.closingIntervalMs,
    lotCount,
  };
}

/** The viewer's position on a lot, or null when they never bid on it. */
export function viewerPosition(lot: LotRecord): ViewerPosition | null {
  const own = lot.bids.filter((bid) => bid.bidder === VIEWER_ID);
  const last = own[own.length - 1];
  if (!last) return null;
  const leading = lot.engine.leader === VIEWER_ID;
  const status = lot.closedAt === null
    ? leading ? "leading" : "outbid"
    : !leading ? "lost" : lot.outcome === "sold" ? "won" : lot.outcome === "awaiting_seller" ? "awaiting_seller" : "lost";
  const ceiling = lot.engine.leaderCeilingCents;
  return {
    lotId: lot.id,
    status,
    maxBidCents: leading && lot.closedAt === null && ceiling > (lot.engine.priceCents ?? 0) ? ceiling : null,
    lastBidCents: last.amountCents,
  };
}
