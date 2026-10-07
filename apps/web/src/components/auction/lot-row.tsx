"use client";

import Link from "next/link";
import type { LotSummary } from "@bba/contracts";
import { formatLength, formatMoney, href, interpolate, plural, type Locale } from "@bba/i18n";
import { Countdown, StatusLine } from "@bba/ui";
import { useLotState, useViewerPosition } from "@/features/live/live-auction";
import { LotPhoto } from "./lot-photo";
import { outcomeStatus, priceLabel, viewerStatus, type AuctionMessages } from "./messages";
import { WatchButton } from "./watch-button";
import { ExpertiseActions } from "@/features/expertise/boat-assistance";

interface LotRowProps {
  lot: LotSummary;
  locale: Locale;
  messages: AuctionMessages;
}

/**
 * C-11 lot row for the closing-order view: a 96 × 72 thumbnail, the title and meta, the price, the
 * number of bids, the countdown (orange under an hour) or the outcome, the viewer's status and the
 * watch button. Under 768 px it stacks into two lines.
 */
export function LotRow({ lot, locale, messages }: LotRowProps) {
  const state = useLotState(lot.state);
  const position = useViewerPosition(lot.id);
  const price = priceLabel(state, lot.startCents, messages.lot);
  const own = position ? viewerStatus(position.status, messages.status) : null;
  const outcome = state.outcome ? outcomeStatus(state.outcome, messages.status) : null;

  return (
    <article className="relative grid grid-cols-row items-center gap-x-4 gap-y-2 border-b border-stone-200 py-3 transition-colors duration-fast hover:bg-stone-100 md:flex md:min-h-row md:gap-6">
      <div className="relative row-span-2 h-thumb-h w-thumb-w shrink-0 overflow-hidden rounded-sm bg-stone-100 md:row-span-1">
        <LotPhoto image={lot.cover} locale={locale} sizes="96px" placeholder="" decorative />
      </div>
      <div className="min-w-0 md:flex-1">
        <h3 className="truncate type-title-m text-navy-900">
          <Link href={href(locale, "lot", { lot: lot.slug })} className="after:absolute after:inset-0 hover:underline underline-offset-4">{lot.title}</Link>
        </h3>
        <p className="truncate type-body-s text-stone-600">
          {interpolate(messages.lot.lotNumber, { number: lot.number })} · {lot.yearBuilt} · {formatLength(lot.lengthCm, locale)} · {lot.location.city}
        </p>
        <div className="mt-3"><ExpertiseActions lotId={lot.id} title={lot.title} compact /></div>
      </div>
      <WatchButton lotId={lot.id} title={lot.title} labels={messages.lot} className="relative z-raised col-start-3 row-start-1 border border-stone-300 md:order-last" />
      <div className="col-span-2 col-start-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 md:contents">
        <p className="md:w-32 md:text-right">
          <span className="sr-only">{price.label} : </span>
          <span className="type-num-m text-navy-900">{formatMoney(price.cents, locale)}</span>
        </p>
        <p className="type-num-s text-stone-600 md:w-24 md:text-right">{plural(locale, messages.lot.bidCount, state.bidCount)}</p>
        <div className="flex flex-col gap-1 md:w-32 md:items-end">
          {state.phase === "closed" && outcome
            ? <StatusLine tone={outcome.tone}>{outcome.text}</StatusLine>
            : <span><span className="sr-only">{messages.closesIn} </span><Countdown endsAt={state.endsAt} locale={locale} size="m" /></span>}
          {own && <StatusLine tone={own.tone}>{own.text}</StatusLine>}
        </div>
      </div>
    </article>
  );
}
