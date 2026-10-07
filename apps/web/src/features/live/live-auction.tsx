"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type {
  ActivityEntry,
  Backend,
  LiveEvent,
  LotLiveState,
  LotSummary,
  PlaceBidRequest,
  PlaceBidResult,
  ProfileResult,
  ProfileUpdate,
  SignInRequest,
  SignInResult,
  Viewer,
  ViewerPosition,
} from "@bba/contracts";
import { createDemoBackend, type DemoBackend, type ViewerCommand } from "@bba/sdk";
import { DEMO_STORAGE_KEY, DEMO_VIEWER_COOKIE, encodeCookie } from "@/lib/demo-session";
import { LiveStore } from "./live-store";

export interface LiveAuction {
  store: LiveStore;
  /** The backend contract, for forms: seller leads, viewing registrations, the newsletter. */
  services(): Backend;
  placeBid(request: Omit<PlaceBidRequest, "idempotencyKey">): Promise<PlaceBidResult>;
  cancelMaxBid(lotId: string): Promise<void>;
  signIn(request: SignInRequest): Promise<SignInResult>;
  signOut(): Promise<void>;
  verifyIdentity(): Promise<void>;
  updateProfile(update: ProfileUpdate): Promise<ProfileResult>;
  setWatched(lotId: string, watched: boolean): void;
  loadPosition(lotId: string): void;
  /** Reloads every position of the viewer, for the account pages. */
  loadPositions(): void;
  onEvent(listener: (event: LiveEvent) => void): () => void;
}

const LiveContext = createContext<LiveAuction | null>(null);

interface StoredState {
  saleId: string;
  viewerCommands: ViewerCommand[];
  watchlist: string[];
}

function readStoredState(): StoredState | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "null") as unknown;
    if (!value || typeof value !== "object") return null;
    const { saleId, viewerCommands, watchlist } = value as Partial<StoredState>;
    if (typeof saleId !== "string" || !Array.isArray(viewerCommands) || !Array.isArray(watchlist)) return null;
    return { saleId, viewerCommands, watchlist: watchlist.filter((id): id is string => typeof id === "string") };
  } catch {
    return null;
  }
}

function writeStoredState(state: StoredState) {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full storage: the demonstration simply forgets on reload.
  }
}

function writeViewerCookie(viewer: Viewer | null) {
  document.cookie = viewer
    ? `${DEMO_VIEWER_COOKIE}=${encodeCookie(viewer)}; path=/; samesite=lax; max-age=${60 * 60 * 24 * 30}`
    : `${DEMO_VIEWER_COOKIE}=; path=/; samesite=lax; max-age=0`;
}

interface LiveAuctionProviderProps {
  /** The demonstration time the server rendered at: the browser starts from the same state. */
  serverNow: number;
  viewer: Viewer | null;
  children: ReactNode;
}

/**
 * Runs the demonstration auction in the browser. With a real backend this provider would
 * subscribe to the live channel instead; components only use the hooks below.
 */
export function LiveAuctionProvider({ serverNow, viewer, children }: LiveAuctionProviderProps) {
  const [store] = useState(() => new LiveStore(viewer));
  const backend = useRef<DemoBackend | null>(null);
  const listeners = useRef(new Set<(event: LiveEvent) => void>());
  const idempotency = useRef(0);

  const persist = useCallback(() => {
    const current = backend.current;
    if (!current) return;
    const { viewerCommands, watchlist } = current.snapshot();
    writeStoredState({ saleId: current.house.sale.id, viewerCommands, watchlist });
  }, []);

  useEffect(() => {
    const clockOffset = serverNow - Date.now();
    const clock = () => Date.now() + clockOffset;
    const stored = readStoredState();
    const created = createDemoBackend({ now: serverNow, clock, viewer: store.viewer, watchlist: stored?.watchlist ?? [] });
    const restore = stored && stored.saleId === created.house.sale.id && stored.viewerCommands.length > 0;
    const instance = restore ? createDemoBackend({ now: serverNow, clock, viewer: store.viewer, watchlist: stored.watchlist, viewerCommands: stored.viewerCommands }) : created;
    backend.current = instance;
    store.setWatchlist(instance.snapshot().watchlist);

    const unsubscribe = instance.live.subscribe((event) => {
      if (event.type === "lot.updated") store.setLots([event.state]);
      else if (event.type === "lot.bid") store.addActivity(event.bid);
      else if (event.type === "viewer.position") store.setPositions([event.position]);
      listeners.current.forEach((listener) => listener(event));
    });

    if (restore) {
      void (async () => {
        const [live, results, mine, activity] = await Promise.all([
          instance.catalogue.searchLots({ limit: 100 }),
          instance.catalogue.searchResults({ limit: 100 }),
          instance.account.getMyBids(),
          instance.catalogue.getRecentActivity(40),
        ]);
        store.setLots([...live.lots, ...results.lots].map((lot) => lot.state));
        store.setPositions(mine.positions);
        store.setActivity(activity);
      })();
    }

    const timer = window.setInterval(() => instance.tick(), 1_000);
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [serverNow, store]);

  const value = useMemo<LiveAuction>(() => {
    const ready = () => {
      if (!backend.current) throw new Error("The live auction is not ready yet.");
      return backend.current;
    };
    return {
      store,
      services: ready,
      async placeBid(request) {
        idempotency.current += 1;
        const result = await ready().bidding.placeBid({ ...request, idempotencyKey: `${request.lotId}-${Date.now()}-${idempotency.current}` });
        if (result.ok) {
          store.setLots([result.state]);
          store.setPositions([result.position]);
          persist();
        }
        return result;
      },
      async cancelMaxBid(lotId) {
        await ready().bidding.cancelMaxBid(lotId);
        const position = await ready().bidding.getPosition(lotId);
        if (position) store.setPositions([position]);
      },
      async signIn(request) {
        const result = await ready().account.signIn(request);
        if (result.ok) {
          store.setViewer(result.viewer);
          writeViewerCookie(result.viewer);
        }
        return result;
      },
      async signOut() {
        await ready().account.signOut();
        store.setViewer(null);
        writeViewerCookie(null);
      },
      async verifyIdentity() {
        const viewer = await ready().account.verifyIdentity();
        store.setViewer(viewer);
        writeViewerCookie(viewer);
      },
      async updateProfile(update) {
        const result = await ready().account.updateProfile(update);
        if (result.ok) {
          store.setViewer(result.viewer);
          writeViewerCookie(result.viewer);
        }
        return result;
      },
      setWatched(lotId, watched) {
        void ready().account.setWatched(lotId, watched).then((watchlist) => {
          store.setWatchlist(watchlist);
          persist();
        });
      },
      loadPosition(lotId) {
        void backend.current?.bidding.getPosition(lotId).then((position) => store.setPositions(position ? [position] : [], [lotId]));
      },
      loadPositions() {
        void backend.current?.account.getMyBids().then((mine) => store.setPositions(mine.positions));
      },
      onEvent(listener) {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
    };
  }, [store, persist]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLiveAuction(): LiveAuction {
  const live = useContext(LiveContext);
  if (!live) throw new Error("useLiveAuction must be used inside a LiveAuctionProvider.");
  return live;
}

/** A lot's live state: the server-rendered value until the first live update. */
export function useLotState(initial: LotLiveState): LotLiveState {
  const { store } = useLiveAuction();
  return useSyncExternalStore(store.subscribe, () => store.lot(initial.lotId) ?? initial, () => initial);
}

/** Many lots with their live states, for views that compare lots: the hero rail, the market. */
export function useLiveLots<T extends LotSummary>(lots: readonly T[]): T[] {
  const { store } = useLiveAuction();
  const version = useSyncExternalStore(store.subscribe, () => store.version, () => 0);
  return useMemo(() => {
    void version;
    return lots.map((lot) => {
      const state = store.lot(lot.id);
      return state ? { ...lot, state } : lot;
    });
  }, [lots, store, version]);
}

/** The viewer's own position on a lot, or null when they have not bid on it. */
export function useViewerPosition(lotId: string): ViewerPosition | null {
  const live = useLiveAuction();
  const position = useSyncExternalStore(live.store.subscribe, () => live.store.position(lotId), () => undefined);
  const viewer = useViewer();
  useEffect(() => {
    if (viewer && position === undefined) live.loadPosition(lotId);
  }, [viewer, position, lotId, live]);
  return position ?? null;
}

/** Every position of the signed-in viewer, loaded when first read. */
export function useViewerPositions(): readonly ViewerPosition[] {
  const live = useLiveAuction();
  const version = useSyncExternalStore(live.store.subscribe, () => live.store.version, () => 0);
  const viewer = useViewer();
  useEffect(() => {
    if (viewer) live.loadPositions();
  }, [viewer, live]);
  return useMemo(() => {
    void version;
    return viewer ? live.store.viewerPositions() : [];
  }, [live, version, viewer]);
}

export function useActivity(initial: ActivityEntry[]): ActivityEntry[] {
  const { store } = useLiveAuction();
  return useSyncExternalStore(store.subscribe, () => store.activity() ?? initial, () => initial);
}

export function useViewer(): Viewer | null {
  const { store } = useLiveAuction();
  return useSyncExternalStore(store.subscribe, () => store.viewer, () => store.viewer);
}

const noWatchlist: readonly string[] = [];

export function useWatchlist(): readonly string[] {
  const { store } = useLiveAuction();
  return useSyncExternalStore(store.subscribe, () => store.watchlist, () => noWatchlist);
}
