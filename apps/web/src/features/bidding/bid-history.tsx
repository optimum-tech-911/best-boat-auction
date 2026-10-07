"use client";

import { useEffect, useState } from "react";
import type { BidHistoryEntry } from "@bba/contracts";
import { formatMoney, formatRelativeTime, interpolate, type Locale } from "@bba/i18n";
import { cx, Flag, LiveRows, useNow } from "@bba/ui";
import { useLiveAuction } from "@/features/live/live-auction";
import type { BidMessages } from "./bid-messages";

/**
 * The public bid history: pseudonym with a flag, amount and time ago. The viewer's own bids read
 * "Vous", and only they show which of them were automatic. New bids enter at the top (M15).
 */
export function BidHistory({ lotId, initial, locale, messages }: { lotId: string; initial: BidHistoryEntry[]; locale: Locale; messages: BidMessages }) {
  const live = useLiveAuction();
  const now = useNow();
  const [entries, setEntries] = useState(initial);
  const [all, setAll] = useState(false);

  useEffect(() => live.onEvent((event) => {
    if (event.type !== "lot.bid" || event.bid.lotId !== lotId) return;
    setEntries((current) => (current.some((entry) => entry.seq === event.bid.seq) ? current : [event.bid, ...current]));
  }), [live, lotId]);

  const copy = messages.bid;
  return (
    <section id="historique" aria-labelledby={`${lotId}-history`} className="scroll-mt-32">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={`${lotId}-history`} className="type-title-m text-navy-900">{copy.historyTitle}</h3>
        {entries.length > 6 && (
          <button type="button" onClick={() => setAll(!all)} className="type-body-s text-teal-700 underline-offset-3 hover:underline">{all ? copy.showLess : copy.showAll}</button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 type-body-s text-stone-600">{copy.historyEmpty}</p>
      ) : (
        <LiveRows
          className="mt-2"
          limit={all ? entries.length : 6}
          items={entries.map((entry) => ({
            key: String(entry.seq),
            content: (
              <div className="flex min-h-control-md items-center gap-3 border-b border-stone-200 py-2">
                <Flag country={entry.country} />
                <span className={cx("min-w-0 flex-1 truncate type-body-s", entry.isViewer ? "font-semibold text-navy-900" : "text-navy-900")}>
                  {entry.isViewer ? copy.you : interpolate(copy.bidder, { alias: entry.alias })}
                  {entry.isViewer && entry.automatic && <span className="ml-2 type-caption text-stone-600">{copy.automatic}</span>}
                </span>
                <span className="shrink-0 type-num-s text-navy-900">{formatMoney(entry.amountCents, locale)}</span>
                <span className="w-16 shrink-0 whitespace-nowrap text-right type-caption text-stone-600">{formatRelativeTime(now - entry.at, locale)}</span>
              </div>
            ),
          }))}
        />
      )}
    </section>
  );
}
