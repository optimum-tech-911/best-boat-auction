import {
  brokerContributions,
  checkBidRequest,
  checkListing,
  defaultAuctionRules,
  defaultSellerOffer,
  estimateHoldingCost,
  upcomingSales,
  type BidderStanding,
} from "@bba/domain";
import {
  countryCodes,
  defaultNotificationPreferences,
  type AccountService,
  type Backend,
  type BiddingService,
  type BrokerService,
  type CatalogueService,
  type EngagementService,
  type LiveEvent,
  type LiveService,
  type PlaceBidResult,
  type SellerService,
  type Viewer,
  type ViewerLotStatus,
} from "@bba/contracts";
import { displayTimeZone } from "@bba/i18n";
import { bidderIdentity, VIEWER_ID } from "./bidders";
import { DemoAuctionHouse, type HouseEvent, type LotRecord, type ViewerCommand } from "./house";
import { toActivity, toBidEntry, toDetail, toLiveState, toSaleSummary, toSummary, viewerPosition } from "./projections";
import { runQuery } from "./queries";
import { hashSeed } from "./random";

export interface DemoBackendOptions {
  /** The demonstration time the state is built for. */
  now: number;
  /** The current demonstration time; on the server it stays at `now`. */
  clock?: () => number;
  viewer?: Viewer | null;
  watchlist?: readonly string[];
  viewerCommands?: readonly ViewerCommand[];
}

/** What the browser keeps between visits so the demonstration survives a reload. */
export interface DemoSnapshot {
  viewer: Viewer | null;
  watchlist: string[];
  viewerCommands: ViewerCommand[];
}

export interface DemoBackend extends Backend {
  readonly house: DemoAuctionHouse;
  /** Plays everything scheduled up to the clock's current time. */
  tick(): void;
  snapshot(): DemoSnapshot;
}

const DEFAULT_PAGE = 24;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The demonstration broker's lots in the broker space preview. */
const BROKER_PORTFOLIO_SIZE = 5;
/** Questions shorter than this are rejected as too vague to answer. */
const MIN_QUESTION_LENGTH = 10;
/** An EU VAT number: the country prefix, then 2 to 13 letters or digits. */
const vatNumberPattern = /^[A-Z]{2}[0-9A-Z]{2,13}$/;

function yearAt(instant: number): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: displayTimeZone, year: "numeric" }).format(new Date(instant)));
}

/** The in-memory demonstration adapter of every backend service. */
export function createDemoBackend(options: DemoBackendOptions): DemoBackend {
  const rules = defaultAuctionRules;
  const house = new DemoAuctionHouse(options.now, options.viewerCommands);
  const clock = options.clock ?? (() => house.now);
  let viewer: Viewer | null = options.viewer ?? null;
  let watchlist = [...(options.watchlist ?? [])];
  const idempotency = new Map<string, PlaceBidResult>();

  const country = () => viewer?.country ?? "FR";
  const tick = () => house.advance(clock());
  const all = () => [...house.lots.values()];
  const featuredLots = () => all().filter((lot) => !lot.isResult);
  const lot = (id: string) => house.lots.get(id);

  const catalogue: CatalogueService = {
    async getFeaturedSale() {
      tick();
      return toSaleSummary(house.sale, featuredLots(), house.now, house.mode, rules);
    },
    async listSales(count) {
      tick();
      const following = upcomingSales(house.sale.closingStartsAt + 86_400_000 * 2, Math.max(0, count - 1), 0);
      return [
        toSaleSummary(house.sale, featuredLots(), house.now, house.mode, rules),
        ...following.map((schedule) => toSaleSummary(schedule, [], house.now, house.mode, rules, 0)),
      ].slice(0, count);
    },
    async getPreviousSale() {
      return toSaleSummary(house.previous, all().filter((record) => record.isResult), house.now, house.mode, rules);
    },
    async searchLots(query) {
      tick();
      const open = featuredLots().filter((record) => record.closedAt === null);
      const { matched, facets } = runQuery(open, query, house.now, false);
      const offset = query.offset ?? 0;
      return { lots: matched.slice(offset, offset + (query.limit ?? DEFAULT_PAGE)).map((record) => toSummary(record, rules, country())), total: matched.length, facets };
    },
    async searchResults(query) {
      tick();
      const closed = all().filter((record) => record.closedAt !== null);
      const { matched, facets } = runQuery(closed, query, house.now, true);
      const offset = query.offset ?? 0;
      return { lots: matched.slice(offset, offset + (query.limit ?? DEFAULT_PAGE)).map((record) => toSummary(record, rules, country())), total: matched.length, facets };
    },
    async getLot(number) {
      tick();
      const record = all().find((candidate) => candidate.boat.number === number);
      return record ? toDetail(record, rules, house.mode, country()) : null;
    },
    async getSimilarLots(id, limit) {
      tick();
      const reference = lot(id);
      if (!reference) return [];
      const price = (record: LotRecord) => record.engine.priceCents ?? record.engine.startCents;
      return featuredLots()
        .filter((record) => record.id !== id && record.closedAt === null)
        .sort((a, b) => Number(b.boat.type === reference.boat.type) - Number(a.boat.type === reference.boat.type) || Math.abs(price(a) - price(reference)) - Math.abs(price(b) - price(reference)))
        .slice(0, limit)
        .map((record) => toSummary(record, rules, country()));
    },
    async getMarketStats() {
      tick();
      const live = featuredLots().filter((record) => record.engine.status === "live");
      const bids = featuredLots().flatMap((record) => record.bids);
      return {
        liveLotCount: live.length,
        bidCount: bids.length,
        bidderCountries: [...new Set(bids.map((bid) => bidderIdentity(bid.bidder, country()).country))].sort(),
        nextClosingAt: live.length ? Math.min(...live.map((record) => record.engine.endsAt)) : null,
      };
    },
    async getRecentActivity(limit) {
      tick();
      return featuredLots()
        .flatMap((record) => record.bids.map((bid) => ({ record, bid })))
        .sort((a, b) => b.bid.at - a.bid.at || b.bid.seq - a.bid.seq)
        .slice(0, limit)
        .map(({ record, bid }) => toActivity(record, bid, country()));
    },
    async getBidHistory(id, limit) {
      tick();
      const record = lot(id);
      if (!record) return [];
      const history = [...record.bids].reverse().map((bid) => toBidEntry(record, bid, country()));
      return limit === undefined ? history : history.slice(0, limit);
    },
  };

  const lastStatus = new Map<string, ViewerLotStatus>();
  const live: LiveService = {
    async serverTime() {
      return clock();
    },
    async getLotStates(ids) {
      tick();
      return ids.flatMap((id) => {
        const record = lot(id);
        return record ? [toLiveState(record, rules, country())] : [];
      });
    },
    subscribe(listener) {
      const forward = (event: HouseEvent) => {
        if (event.type === "bid") {
          listener({ type: "lot.bid", bid: toActivity(event.lot, event.bid, country()) });
          return;
        }
        const state = toLiveState(event.lot, rules, country());
        listener({ type: "lot.updated", state });
        const position = viewerPosition(event.lot);
        if (!position) return;
        const previous = lastStatus.get(event.lot.id);
        lastStatus.set(event.lot.id, position.status);
        if (previous === position.status) return;
        const lotTitle = event.lot.boat.title;
        listener({ type: "viewer.position", position, lotTitle });
        const outbid: LiveEvent = { type: "viewer.outbid", lotId: event.lot.id, lotTitle, priceCents: state.priceCents ?? 0, nextMinimumCents: state.nextMinimumCents ?? 0 };
        if (previous === "leading" && position.status === "outbid") listener(outbid);
        if (previous === "outbid" && position.status === "leading") listener({ type: "viewer.leading", lotId: event.lot.id, lotTitle, priceCents: state.priceCents ?? 0 });
      };
      return house.subscribe(forward);
    },
  };

  const standing = (lotId: string): BidderStanding => ({
    signedIn: viewer !== null,
    contactVerified: viewer?.contactVerified ?? false,
    termsAccepted: viewer?.termsAccepted ?? false,
    suspended: false,
    hasOverdueInvoice: false,
    identityVerified: viewer?.identityVerified ?? false,
    cardHoldRequired: false,
    cardHoldActive: false,
    isLinkedToSeller: false,
    leadingTotalCents: featuredLots()
      .filter((record) => record.id !== lotId && record.closedAt === null && record.engine.leader === VIEWER_ID)
      .reduce((total, record) => total + (record.engine.priceCents ?? 0), 0),
    creditLimitCents: rules.defaultCreditLimitCents,
  });

  const bidding: BiddingService = {
    async placeBid(request) {
      const known = idempotency.get(request.idempotencyKey);
      if (known) return known;
      tick();
      const record = lot(request.lotId);
      if (!record) return { ok: false, code: "LOT_NOT_LIVE" };
      const command = { bidder: VIEWER_ID, kind: request.kind, amountCents: request.amountCents };
      const rejected = checkBidRequest(record.engine, command, standing(record.id), rules);
      const outcome = rejected ?? house.placeViewerBid(record.id, request.kind, request.amountCents, clock());
      const result: PlaceBidResult = outcome.ok
        ? {
          ok: true,
          state: toLiveState(record, rules, country()),
          position: viewerPosition(record) ?? { lotId: record.id, status: "outbid", maxBidCents: null, lastBidCents: request.amountCents },
          bids: outcome.bids.map((_, index) => toBidEntry(record, record.bids[record.bids.length - outcome.bids.length + index]!, country())),
        }
        : { ok: false, code: outcome.code, ...(outcome.minimumCents === undefined ? {} : { minimumCents: outcome.minimumCents }) };
      idempotency.set(request.idempotencyKey, result);
      return result;
    },
    async cancelMaxBid(lotId) {
      house.cancelViewerMax(lotId);
    },
    async getPosition(lotId) {
      tick();
      const record = lot(lotId);
      return record ? viewerPosition(record) : null;
    },
  };

  const account: AccountService = {
    async getViewer() {
      return viewer;
    },
    async signIn(request) {
      if (!emailPattern.test(request.email.trim())) return { ok: false, reason: "invalid_email" };
      if (request.displayName !== undefined && !request.displayName.trim()) return { ok: false, reason: "name_required" };
      if (request.displayName !== undefined && !request.acceptTerms) return { ok: false, reason: "terms_required" };
      const email = request.email.trim().toLowerCase();
      const name = request.displayName?.trim() || email.split("@")[0]!.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      viewer = {
        id: VIEWER_ID,
        displayName: name,
        email,
        country: "FR",
        contactVerified: true,
        identityVerified: false,
        termsAccepted: true,
        notifications: defaultNotificationPreferences,
        company: null,
      };
      return { ok: true, viewer };
    },
    async signOut() {
      viewer = null;
    },
    async verifyIdentity() {
      if (!viewer) throw new Error("Sign in before verifying an identity.");
      viewer = { ...viewer, identityVerified: true };
      return viewer;
    },
    async updateProfile(update) {
      if (!viewer) return { ok: false, reason: "sign_in_required" };
      if (update.displayName !== undefined && !update.displayName.trim()) return { ok: false, reason: "name_required" };
      const company = update.company === undefined ? viewer.company : update.company && { name: update.company.name.trim(), vatNumber: update.company.vatNumber.replace(/\s+/g, "").toUpperCase() };
      if (company && !company.name) return { ok: false, reason: "company_name_required" };
      if (company && !vatNumberPattern.test(company.vatNumber)) return { ok: false, reason: "invalid_vat_number" };
      viewer = {
        ...viewer,
        displayName: update.displayName?.trim() ?? viewer.displayName,
        country: update.country ?? viewer.country,
        notifications: update.notifications ?? viewer.notifications,
        company,
      };
      return { ok: true, viewer };
    },
    async getMyBids() {
      tick();
      return {
        positions: all().flatMap((record) => {
          const position = viewerPosition(record);
          return position ? [position] : [];
        }),
        watchlist: [...watchlist],
      };
    },
    async setWatched(lotId, watched) {
      watchlist = watched ? [...new Set([...watchlist, lotId])] : watchlist.filter((id) => id !== lotId);
      return [...watchlist];
    },
  };

  const seller: SellerService = {
    async estimate(request) {
      const result = estimateHoldingCost({ ...request, currentYear: yearAt(clock()) });
      return { id: `estimate-${hashSeed(JSON.stringify(request)).toString(36)}`, input: request, result };
    },
    async submitLead(request) {
      if (!request.name.trim()) return { ok: false, reason: "name_required" };
      if (!emailPattern.test(request.email.trim())) return { ok: false, reason: "invalid_email" };
      if (request.intent === "callback" && !request.phone?.trim()) return { ok: false, reason: "phone_required" };
      if (!request.consent) return { ok: false, reason: "consent_required" };
      return { ok: true, reference: `BBA-${hashSeed(request.email, clock()).toString(36).slice(0, 6).toUpperCase()}` };
    },
    async submitListing(request) {
      const now = clock();
      const issues = checkListing({
        ...request,
        photoCount: request.photos.length,
        location: { berth: request.location.berth, countrySupported: (countryCodes as readonly string[]).includes(request.location.country) },
      }, defaultSellerOffer, yearAt(now));
      if (issues.length) return { ok: false, issues };
      // The listing joins the first sale whose submission deadline has not passed.
      const sale = upcomingSales(now, 3, 0).find((candidate) => candidate.submissionDeadlineAt > now);
      if (!sale) throw new Error("The sale calendar returned no sale open to submissions.");
      return {
        ok: true,
        reference: `BBA-L${hashSeed(request.seller.email, request.make, request.model, now).toString(36).slice(0, 5).toUpperCase()}`,
        saleId: sale.id,
        submissionDeadlineAt: sale.submissionDeadlineAt,
        closingAt: sale.closingStartsAt,
      };
    },
  };

  const engagement: EngagementService = {
    async registerViewing(request) {
      if (!emailPattern.test(request.email.trim())) return { ok: false, reason: "invalid_email" };
      if (!request.name.trim() || request.visitors < 1) return { ok: false, reason: "invalid_request" };
      return { ok: true };
    },
    async askQuestion(request) {
      if (!viewer) return { ok: false, reason: "sign_in_required" };
      if (request.text.trim().length < MIN_QUESTION_LENGTH) return { ok: false, reason: "too_short" };
      const lot = house.lots.get(request.lotId);
      if (!lot || lot.closedAt !== null) return { ok: false, reason: "lot_closed" };
      return { ok: true };
    },
    async requestContact(request) {
      if (!request.name.trim()) return { ok: false, reason: "name_required" };
      if (!emailPattern.test(request.email.trim())) return { ok: false, reason: "invalid_email" };
      if (request.topic === "broker" && !request.company?.trim()) return { ok: false, reason: "company_required" };
      if (!request.consent) return { ok: false, reason: "consent_required" };
      return { ok: true, reference: `BBA-${hashSeed(request.topic, request.email, clock()).toString(36).slice(0, 6).toUpperCase()}` };
    },
    async subscribeNewsletter(request) {
      if (!emailPattern.test(request.email.trim())) return { ok: false, reason: "invalid_email" };
      if (!request.consent) return { ok: false, reason: "consent_required" };
      return { ok: true };
    },
  };

  const brokers: BrokerService = {
    async getPortfolio() {
      tick();
      return featuredLots().filter((record) => record.closedAt === null).slice(0, BROKER_PORTFOLIO_SIZE).map((record, index) => ({
        lot: toSummary(record, rules, country()),
        contribution: brokerContributions[index % brokerContributions.length]!,
      }));
    },
  };

  return {
    house,
    catalogue,
    live,
    bidding,
    account,
    seller,
    engagement,
    brokers,
    tick,
    snapshot: () => ({ viewer, watchlist: [...watchlist], viewerCommands: [...house.viewerCommands] }),
  };
}
