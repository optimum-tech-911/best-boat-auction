import type { ActivityEntry, LotLiveState, Viewer, ViewerPosition } from "@bba/contracts";

/**
 * The browser's view of the live auction: the latest state of every lot it has heard about,
 * the viewer's positions, the recent bids, the viewer and their watchlist. Server-rendered
 * values are the starting point; live events replace them.
 */
export class LiveStore {
  private readonly lots = new Map<string, LotLiveState>();
  private readonly positions = new Map<string, ViewerPosition | null>();
  private recent: ActivityEntry[] | null = null;
  private listeners = new Set<() => void>();
  viewer: Viewer | null;
  watchlist: readonly string[] = [];
  /** Increases on every change, for views that read many lots at once. */
  version = 0;

  constructor(viewer: Viewer | null) {
    this.viewer = viewer;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }

  lot(id: string): LotLiveState | undefined {
    return this.lots.get(id);
  }

  position(id: string): ViewerPosition | null | undefined {
    return this.positions.get(id);
  }

  /** Every lot the viewer has a position on. */
  viewerPositions(): ViewerPosition[] {
    return [...this.positions.values()].filter((position): position is ViewerPosition => position !== null);
  }

  activity(): ActivityEntry[] | null {
    return this.recent;
  }

  setLots(states: readonly LotLiveState[]) {
    for (const state of states) this.lots.set(state.lotId, state);
    this.notify();
  }

  setPositions(positions: readonly ViewerPosition[], knownLots: readonly string[] = []) {
    for (const id of knownLots) this.positions.set(id, null);
    for (const position of positions) this.positions.set(position.lotId, position);
    this.notify();
  }

  setActivity(entries: ActivityEntry[]) {
    this.recent = entries;
    this.notify();
  }

  addActivity(entry: ActivityEntry, limit = 40) {
    this.recent = [entry, ...(this.recent ?? [])].slice(0, limit);
    this.notify();
  }

  setViewer(viewer: Viewer | null) {
    this.viewer = viewer;
    if (!viewer) this.positions.clear();
    this.notify();
  }

  setWatchlist(watchlist: readonly string[]) {
    this.watchlist = watchlist;
    this.notify();
  }
}
