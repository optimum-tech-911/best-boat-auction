"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useOptimistic, useTransition, type ReactNode } from "react";
import type { CatalogueFilters } from "@bba/contracts";
import { cx } from "@bba/ui";
import { catalogueSearch, PAGE_SIZE, type CatalogueState } from "./catalogue-params";

interface CatalogueNavigation {
  state: CatalogueState;
  pending: boolean;
  /** Applies a change to the filters: the page of results starts again from the top. */
  setFilters(change: Partial<CatalogueFilters>): void;
  clearFilters(): void;
  setState(change: Partial<Omit<CatalogueState, "filters">>): void;
}

const NavigationContext = createContext<CatalogueNavigation | null>(null);

/**
 * Keeps the catalogue's state in the address; the server renders each new address. Controls show
 * the new state at once, while the results for it are rendered.
 */
export function CatalogueNavigationProvider({ state: rendered, children }: { state: CatalogueState; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [state, setOptimisticState] = useOptimistic(rendered);

  const go = useCallback((next: CatalogueState) => {
    startTransition(() => {
      setOptimisticState(next);
      router.replace(`${pathname}${catalogueSearch(next)}`, { scroll: false });
    });
  }, [pathname, router, setOptimisticState]);

  const value = useMemo<CatalogueNavigation>(() => ({
    state,
    pending,
    setFilters: (change) => go({ ...state, filters: { ...state.filters, ...change }, show: PAGE_SIZE }),
    clearFilters: () => go({ ...state, filters: {}, show: PAGE_SIZE }),
    setState: (change) => go({ ...state, ...change }),
  }), [state, pending, go]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useCatalogueNavigation(): CatalogueNavigation {
  const navigation = useContext(NavigationContext);
  if (!navigation) throw new Error("useCatalogueNavigation must be used inside a CatalogueNavigationProvider.");
  return navigation;
}

/** The results, dimmed and marked busy while a new address is being rendered. */
export function PendingResults({ children }: { children: ReactNode }) {
  const { pending } = useCatalogueNavigation();
  return <div aria-busy={pending || undefined} className={cx("transition-opacity duration-fast", pending && "opacity-60")}>{children}</div>;
}
