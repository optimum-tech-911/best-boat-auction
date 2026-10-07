"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

interface ClockValue {
  /** The time the server rendered at: used during hydration so both renders agree. */
  serverNow: number;
  /** Server time minus device time, measured once in the browser. */
  offsetMs: number;
}

const ClockContext = createContext<ClockValue>({ serverNow: 0, offsetMs: 0 });

/**
 * Countdowns follow the server clock, not the device's: the browser measures the offset
 * between the server time it received and its own clock, then keeps it.
 */
export function ClockProvider({ serverNow, children }: { serverNow: number; children: ReactNode }) {
  const [offsetMs] = useState(() => serverNow - Date.now());
  return <ClockContext.Provider value={{ serverNow, offsetMs }}>{children}</ClockContext.Provider>;
}

/* One shared ticker for the whole page, aligned to whole seconds. */
const listeners = new Set<() => void>();
let current = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function schedule() {
  timer = setTimeout(() => {
    current = Date.now();
    listeners.forEach((listener) => listener());
    schedule();
  }, 1000 - (Date.now() % 1000) + 5);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    current = Date.now();
    schedule();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) clearTimeout(timer);
  };
}

const getSnapshot = () => current || Date.now();

/** The current server time, refreshed every second. */
export function useNow(): number {
  const { serverNow, offsetMs } = useContext(ClockContext);
  const deviceNow = useSyncExternalStore(subscribe, getSnapshot, () => serverNow - offsetMs);
  return deviceNow + offsetMs;
}
