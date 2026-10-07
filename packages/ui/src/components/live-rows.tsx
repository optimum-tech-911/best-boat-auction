"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

interface LiveRowsProps {
  items: readonly { key: string; content: ReactNode }[];
  /** At most six rows (M15). */
  limit?: number;
  /** On a dark background a new row flashes navy-700 instead of teal-50. */
  tone?: "default" | "inverse";
  className?: string;
}

/**
 * M15 live row insertion: a new row grows in from the top with FLIP (240 ms) and flashes
 * teal-50 (1200 ms); the rows below slide down; the oldest one leaves.
 */
export function LiveRows({ items, limit = 6, tone = "default", className }: LiveRowsProps) {
  const flash = tone === "inverse" ? "var(--color-navy-700)" : "var(--color-teal-50)";
  const list = useRef<HTMLUListElement>(null);
  const tops = useRef(new Map<string, number>());
  const mounted = useRef(false);
  const shown = items.slice(0, limit);
  const signature = shown.map((item) => item.key).join("|");

  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = Array.from(element.children) as HTMLElement[];
    const next = new Map<string, number>();
    const animations: Animation[] = [];
    for (const row of rows) {
      const key = row.dataset.key ?? "";
      const top = row.offsetTop;
      next.set(key, top);
      if (!mounted.current || reduced || !row.animate) continue;
      const before = tops.current.get(key);
      if (before === undefined) {
        animations.push(row.animate([{ opacity: 0, transform: `translateY(-${row.offsetHeight}px)` }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(0.2, 0, 0, 1)" }));
        animations.push(row.animate([{ backgroundColor: flash }, { backgroundColor: "transparent" }], { duration: 1_200, easing: "cubic-bezier(0.2, 0, 0, 1)" }));
      } else if (before !== top) {
        animations.push(row.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], { duration: 240, easing: "cubic-bezier(0.2, 0, 0, 1)" }));
      }
    }
    tops.current = next;
    mounted.current = true;
    return () => animations.forEach((animation) => animation.finish());
  }, [signature, flash]);

  return (
    <ul ref={list} className={className}>
      {shown.map((item) => <li key={item.key} data-key={item.key}>{item.content}</li>)}
    </ul>
  );
}
