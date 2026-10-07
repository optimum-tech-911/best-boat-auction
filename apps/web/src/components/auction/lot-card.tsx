"use client";

import Link from "next/link";
import type { LotSummary } from "@bba/contracts";
import { href, interpolate, type Locale } from "@bba/i18n";
import { Badge, Countdown, PriceBlock, StatusLine } from "@bba/ui";
import { useLotState, useViewerPosition } from "@/features/live/live-auction";
import { LotPhoto } from "./lot-photo";
import { lotSpecs, outcomeStatus, priceLabel, viewerStatus, type AuctionMessages } from "./messages";
import { WatchButton } from "./watch-button";

interface LotCardProps {
  lot: LotSummary;
  locale: Locale;
  messages: AuctionMessages;
  /** The image's rendered width, for responsive image sizes. */
  sizes: string;
  priority?: boolean;
  /** Heading level inside the page outline. */
  headingLevel?: "h2" | "h3";
}

/**
 * C-10 lot card: an editorial card with no surrounding box. The title link covers the image and
 * text; the watch button sits above it, so no interactive element is nested in another.
 */
export function LotCard({ lot, locale, messages, sizes, priority = false, headingLevel: Heading = "h3" }: LotCardProps) {
  const state = useLotState(lot.state);
  const position = useViewerPosition(lot.id);
  const closed = state.phase === "closed";
  const price = priceLabel(state, lot.startCents, messages.lot);
  // Badges help choose a lot to bid on; once it has closed, its outcome says what matters.
  const badge = closed ? null : lot.noReserve ? messages.lot.noReserve : lot.isNew ? messages.lot.new : null;
  const own = position ? viewerStatus(position.status, messages.status) : null;
  const outcome = state.outcome ? outcomeStatus(state.outcome, messages.status) : null;

  return (
    <article className="motion-card relative flex h-full flex-col">
      <div className="relative aspect-4/3 overflow-hidden rounded-md bg-stone-100">
        <div className="motion-card-image absolute inset-0">
          <LotPhoto image={lot.cover} locale={locale} sizes={sizes} placeholder={messages.photoComing} priority={priority} decorative />
        </div>
        {badge && <Badge className="absolute left-3 top-3">{badge}</Badge>}
        <WatchButton lotId={lot.id} title={lot.title} labels={messages.lot} className="absolute right-3 top-3 z-raised" />
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="type-eyebrow text-stone-600">{interpolate(messages.lot.eyebrow, { number: lot.number, place: `${lot.location.city}, ${lot.location.country}` })}</p>
        <Heading className="mt-1 truncate type-display-xs text-navy-900">
          <Link href={href(locale, "lot", { lot: lot.slug })} className="decoration-1 underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-teal-700">
            {lot.title}
          </Link>
        </Heading>
        <p className="mt-1 type-body-s text-stone-600">{lotSpecs(lot, locale, messages)}</p>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-stone-200 pt-3">
          <PriceBlock label={price.label} valueCents={price.cents} locale={locale} size="m" />
          {closed && outcome
            ? <StatusLine tone={outcome.tone} className="mb-1">{outcome.text}</StatusLine>
            : (
              <div className="text-right">
                <p className="type-eyebrow text-stone-600">{messages.closesIn}</p>
                <Countdown endsAt={state.endsAt} locale={locale} size="m" className="mt-1 block" />
              </div>
            )}
        </div>
        {own && <StatusLine tone={own.tone} className="mt-3">{own.text}</StatusLine>}
      </div>
    </article>
  );
}
