import type { BrokerContribution, Cents } from "@bba/domain";
import type { ActivityEntry, BidHistoryEntry, PlaceBidRequest, PlaceBidResult, ViewerPosition } from "./bidding";
import type {
  CataloguePage,
  CatalogueQuery,
  Instant,
  LotDetail,
  LotLiveState,
  LotSummary,
  MarketStats,
  SaleSummary,
} from "./catalogue";
import type {
  ContactRequest,
  ContactResult,
  EstimateRequest,
  EstimateRun,
  FormResult,
  LeadRequest,
  LeadResult,
  ListingRequest,
  ListingResult,
  MyBids,
  NewsletterRequest,
  ProfileResult,
  ProfileUpdate,
  QuestionRequest,
  QuestionResult,
  SignInRequest,
  SignInResult,
  Viewer,
  ViewingRegistrationRequest,
} from "./account";

/*
 * The ports of the platform. Pages and components depend only on these interfaces.
 * Version 1 ships an in-memory demonstration adapter (packages/sdk); the Supabase and
 * Stripe adapters implement the same interfaces later, without changing the interface.
 * Every write that touches price, leader or money is decided on the server.
 */

/** Read-only catalogue: sales, lots, results and their statistics. Rendered on the server. */
export interface CatalogueService {
  /** The sale on the homepage: the one closing next, or the one that just closed. */
  getFeaturedSale(): Promise<SaleSummary>;
  /** The coming sales for the calendar, starting with the featured one. */
  listSales(count: number): Promise<SaleSummary[]>;
  getPreviousSale(): Promise<SaleSummary | null>;
  searchLots(query: CatalogueQuery): Promise<CataloguePage>;
  searchResults(query: CatalogueQuery): Promise<CataloguePage>;
  getLot(number: number): Promise<LotDetail | null>;
  getSimilarLots(lotId: string, limit: number): Promise<LotSummary[]>;
  getMarketStats(): Promise<MarketStats>;
  getRecentActivity(limit: number): Promise<ActivityEntry[]>;
  getBidHistory(lotId: string, limit?: number): Promise<BidHistoryEntry[]>;
}

export type LiveEvent =
  | { type: "lot.updated"; state: LotLiveState }
  | { type: "lot.bid"; bid: ActivityEntry }
  | { type: "viewer.position"; position: ViewerPosition; lotTitle: string }
  | { type: "viewer.outbid"; lotId: string; lotTitle: string; priceCents: Cents; nextMinimumCents: Cents }
  | { type: "viewer.leading"; lotId: string; lotTitle: string; priceCents: Cents };

export type Unsubscribe = () => void;

/** Live updates: the platform's real-time channel (Socket.IO or Supabase Realtime). */
export interface LiveService {
  /** The server clock, so countdowns use a clock offset rather than the device's time. */
  serverTime(): Promise<Instant>;
  getLotStates(lotIds: readonly string[]): Promise<LotLiveState[]>;
  subscribe(listener: (event: LiveEvent) => void): Unsubscribe;
}

/** Bids go through this service only. It runs the bidder checks, then the domain engine. */
export interface BiddingService {
  placeBid(request: PlaceBidRequest): Promise<PlaceBidResult>;
  /** Stops automatic bidding; the latest bid stays binding. */
  cancelMaxBid(lotId: string): Promise<void>;
  getPosition(lotId: string): Promise<ViewerPosition | null>;
}

/** Identity and the buyer's own space. Supabase Auth later; never trusted from the client. */
export interface AccountService {
  getViewer(): Promise<Viewer | null>;
  signIn(request: SignInRequest): Promise<SignInResult>;
  signOut(): Promise<void>;
  /** Starts the identity check with the provider; simulated in the demonstration. */
  verifyIdentity(): Promise<Viewer>;
  updateProfile(update: ProfileUpdate): Promise<ProfileResult>;
  getMyBids(): Promise<MyBids>;
  setWatched(lotId: string, watched: boolean): Promise<string[]>;
}

/** The "Vendre mon bateau" funnel. */
export interface SellerService {
  estimate(request: EstimateRequest): Promise<EstimateRun>;
  submitLead(request: LeadRequest): Promise<LeadResult>;
  /** Checks the listing with the house rules, then files it for the next sale still open to submissions. */
  submitListing(request: ListingRequest): Promise<ListingResult>;
}

/** Viewings, questions to sellers, contact requests and the newsletter. */
export interface EngagementService {
  registerViewing(request: ViewingRegistrationRequest): Promise<FormResult>;
  askQuestion(request: QuestionRequest): Promise<QuestionResult>;
  requestContact(request: ContactRequest): Promise<ContactResult>;
  subscribeNewsletter(request: NewsletterRequest): Promise<FormResult>;
}

/** One of a partner broker's lots, with what the broker brought to it. */
export interface BrokerPortfolioEntry {
  lot: LotSummary;
  contribution: BrokerContribution;
}

/** The partner broker space. */
export interface BrokerService {
  getPortfolio(): Promise<BrokerPortfolioEntry[]>;
}

/** Everything the frontend needs from the backend. */
export interface Backend {
  catalogue: CatalogueService;
  live: LiveService;
  bidding: BiddingService;
  account: AccountService;
  seller: SellerService;
  engagement: EngagementService;
  brokers: BrokerService;
}
