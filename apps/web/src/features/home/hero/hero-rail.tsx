"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LotSummary, SaleSummary } from "@bba/contracts";
import { formatDateTime, formatDay, formatMoney, formatSaleName, href, plural, type Locale, type Messages } from "@bba/i18n";
import { ButtonContent, Countdown, cx, LiveDot, useNow } from "@bba/ui";
import { useLiveLots } from "@/features/live/live-auction";

const HOUR = 3_600_000;

export type HeroRailMessages = Messages["home"]["hero"]["rail"];

function Block({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("min-w-0", className)}>
      <p className="type-caption text-mist-300">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/**
 * The flat auction rail at the foot of the hero: the sale's state, its next lot or its dates,
 * and one action. It follows the live auction: lots close one by one and the rail moves on.
 */
export function HeroRail({ locale, sale, lots, messages }: { locale: Locale; sale: SaleSummary; lots: readonly LotSummary[]; messages: HeroRailMessages }) {
  const now = useNow();
  const live = useLiveLots(lots);
  const open = live.filter((lot) => lot.state.phase !== "closed").sort((a, b) => a.state.endsAt - b.state.endsAt);
  const next = open[0];
  const phase = now < sale.opensAt ? "upcoming" : !next ? "closed" : now >= sale.closingStartsAt - HOUR ? "closing" : "open";
  const saleName = formatSaleName(sale.closingStartsAt, locale);
  const count = plural(locale, messages.lots, sale.lotCount);
  const status = { open: messages.open, closing: messages.live, upcoming: messages.upcoming, closed: messages.closed }[phase];
  const action = phase === "closed"
    ? { href: href(locale, "results"), label: messages.viewResults }
    : { href: href(locale, "auctions"), label: messages.viewSale };
  const deadlinePassed = now >= sale.submissionDeadlineAt;

  return (
    <div className="hero-enter hero-enter--rail on-dark border-t border-ivory-100/16 bg-navy-950/80 backdrop-blur" data-phase={phase}>
      <div className="page-container grid grid-cols-2 items-end gap-x-6 gap-y-4 py-5 md:flex md:min-h-row md:items-center md:gap-8">
        <div className="col-span-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 md:col-span-1 md:block md:shrink-0 md:border-r md:border-ivory-100/16 md:pr-8">
          <p className="flex items-center gap-2 type-eyebrow text-ivory-100">
            {phase === "closing" && <LiveDot />}
            {status}
          </p>
          <p className="type-body-s text-mist-300 md:mt-1">{saleName} · {count}</p>
        </div>

        {phase === "closing" && next && (
          <>
            <Block label={messages.nextLot} className="col-span-2 md:col-span-1 md:flex-1">
              <p className="truncate type-title-m text-ivory-100">{next.title}</p>
              {next.state.extensions > 0 && <p className="type-caption text-mist-300">{messages.extended}</p>}
            </Block>
            <Block label={messages.closingIn} className="md:shrink-0">
              <Countdown endsAt={next.state.endsAt} locale={locale} size="l" />
            </Block>
            <Block label={next.state.priceCents === null ? messages.startingPrice : messages.currentBid} className="md:shrink-0">
              <p className="type-num-l text-ivory-100">{formatMoney(next.state.priceCents ?? next.startCents, locale)}</p>
            </Block>
          </>
        )}

        {phase === "open" && next && (
          <>
            <Block label={messages.saleDate} className="col-span-2 md:col-span-1 md:flex-1">
              <p className="type-title-m text-ivory-100">{formatDateTime(sale.closingStartsAt, locale)}</p>
            </Block>
            <Block label={messages.closingIn} className="md:shrink-0">
              <Countdown endsAt={next.state.endsAt} locale={locale} size="l" />
            </Block>
          </>
        )}

        {phase === "upcoming" && (
          <>
            <Block label={messages.saleDate} className="col-span-2 md:col-span-1 md:flex-1">
              <p className="type-title-m text-ivory-100">{formatDateTime(sale.closingStartsAt, locale)}</p>
            </Block>
            <Block label={deadlinePassed ? messages.opensOn : messages.submissionDeadline} className="md:shrink-0">
              <p className="type-title-m text-ivory-100">{deadlinePassed ? formatDateTime(sale.opensAt, locale) : formatDay(sale.submissionDeadlineAt, locale, { weekday: false })}</p>
            </Block>
          </>
        )}

        <Link href={action.href} className="flex min-h-control-md items-center justify-self-end gap-2 type-button-sm text-ivory-100 underline-offset-4 hover:underline md:ml-auto md:shrink-0">
          <ButtonContent arrow size="sm">{action.label}</ButtonContent>
        </Link>
      </div>
    </div>
  );
}
