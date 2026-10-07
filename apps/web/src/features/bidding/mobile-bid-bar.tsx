"use client";

import { useState } from "react";
import type { BidHistoryEntry, LotDetail } from "@bba/contracts";
import { formatMoney, interpolate, type Locale } from "@bba/i18n";
import { Button, Countdown, Dialog, StatusLine } from "@bba/ui";
import { outcomeStatus } from "@/components/auction/messages";
import { useLotState } from "@/features/live/live-auction";
import type { BidMessages } from "./bid-messages";
import { BidPanel } from "./bid-panel";

interface MobileBidBarProps {
  lot: LotDetail;
  history: BidHistoryEntry[];
  locale: Locale;
  messages: BidMessages;
  statusMessages: Parameters<typeof outcomeStatus>[1];
}

/**
 * BID mobile bar: 64 px, fixed at the bottom under 1024 px, with the price, the countdown and an
 * "Enchérir" button that opens the bid panel (items 1–11) as a bottom sheet.
 */
export function MobileBidBar({ lot, history, locale, messages, statusMessages }: MobileBidBarProps) {
  const state = useLotState(lot.state);
  const [open, setOpen] = useState(false);
  const closed = state.phase === "closed";
  const outcome = closed && state.outcome ? outcomeStatus(state.outcome, statusMessages) : null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-sticky flex h-bar-mobile items-center border-t border-stone-300 bg-ivory-100 lg:hidden">
        <div className="page-container flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="type-num-m text-navy-900">{formatMoney(state.priceCents ?? lot.startCents, locale)}</p>
            {closed ? outcome && <StatusLine tone={outcome.tone}>{outcome.text}</StatusLine> : <Countdown endsAt={state.endsAt} locale={locale} size="s" />}
          </div>
          {state.phase === "live" && <Button variant="bid" onClick={() => setOpen(true)}>{messages.bid.mobileBid}</Button>}
        </div>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={interpolate(messages.bid.sheetTitle, { title: lot.title })} closeLabel={messages.close}>
        <BidPanel lot={lot} history={history} locale={locale} messages={messages} statusMessages={statusMessages} variant="sheet" onPlaced={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
