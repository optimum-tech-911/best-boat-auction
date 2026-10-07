"use client";

import Link from "next/link";
import Image from "next/image";
import type { ActivityEntry, CountryCode, LotSummary, ReserveStatus } from "@bba/contracts";
import { formatDay, formatMoney, formatRelativeTime, formatTime, href, interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, Countdown, cx, Flag, LiveDot, LiveRows, useNow } from "@bba/ui";
import { useActivity, useLiveLots } from "@/features/live/live-auction";

type MarketMessages = Messages["home"]["market"];

interface MarketRoomProps {
  locale: Locale;
  lots: readonly LotSummary[];
  initialActivity: ActivityEntry[];
  countries: readonly CountryCode[];
  messages: MarketMessages;
  countryNames: Messages["countries"];
  lotNumber: string;
}

/** Rows of the closing board: the last lot that closed, then the next ones to close. */
const BOARD_ROWS = 6;

const reserveDot: Readonly<Record<ReserveStatus, string>> = {
  met: "bg-success-50",
  not_met: "bg-mist-300",
  none: "bg-ivory-100",
  undisclosed: "bg-navy-700",
};

/** The live part of H7: figures, closing board and bid feed, all following the live store. */
export function MarketRoom({ locale, lots, initialActivity, countries, messages, countryNames, lotNumber }: MarketRoomProps) {
  const live = useLiveLots(lots);
  const now = useNow();
  const entries = useActivity(initialActivity);
  const open = live.filter((lot) => lot.state.phase !== "closed");
  const bidCount = live.reduce((total, lot) => total + lot.state.bidCount, 0);
  const committed = open.reduce((total, lot) => total + (lot.state.priceCents ?? 0), 0);
  const firstClosing = open.length ? Math.min(...open.map((lot) => lot.state.endsAt)) : null;
  const countryCount = new Set([...countries, ...entries.map((entry) => entry.country)]).size;

  const ordered = [...live].sort((a, b) => a.state.scheduledEndsAt - b.state.scheduledEndsAt);
  const nextIndex = ordered.findIndex((lot) => lot.state.phase !== "closed");
  const start = nextIndex <= 0 ? 0 : nextIndex - 1;
  const board = ordered.slice(start, start + BOARD_ROWS);
  const nextId = nextIndex >= 0 ? ordered[nextIndex]?.id : undefined;
  const byId = new Map(live.map((lot) => [lot.id, lot]));
  const money = (cents: number) => formatMoney(cents, locale);

  const figures = [
    { key: "lots", value: String(open.length), label: plural(locale, messages.stats.lots, open.length) },
    { key: "bids", value: String(bidCount), label: plural(locale, messages.stats.bids, bidCount) },
    { key: "committed", value: money(committed), label: messages.stats.committed },
    { key: "countries", value: String(countryCount), label: plural(locale, messages.stats.countries, countryCount) },
  ];

  return (
    <>
      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
        <dl className="grid grid-cols-2 border-y border-ivory-100/16 md:grid-cols-4 lg:col-span-9">
          {figures.map((figure, index) => (
            <div key={figure.key} className={cx("flex flex-col-reverse gap-1 py-5", index % 2 === 1 && "border-l border-ivory-100/16 pl-5", index >= 2 && "border-t border-ivory-100/16 md:border-t-0", index === 2 && "md:border-l md:pl-5")}>
              <dt className="type-body-s text-mist-300">{figure.label}</dt>
              <dd key={figure.value} className="motion-price-in type-num-l text-ivory-100">{figure.value}</dd>
            </div>
          ))}
        </dl>
        {firstClosing !== null && (
          <div className="lg:col-span-3 lg:text-right">
            <p className="type-eyebrow text-mist-300">{messages.firstClosing}</p>
            <Countdown endsAt={firstClosing} locale={locale} size="xl" className="mt-2 block text-ivory-100" />
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="type-display-s">{messages.boardTitle}</h3>
            {ordered[0] && <p className="type-body-s text-mist-300">{interpolate(messages.boardDate, { date: formatDay(ordered[0].state.scheduledEndsAt, locale, { weekday: "long" }) })}</p>}
          </div>
          <table className="mt-4 w-full border-collapse text-left">
            <caption className="sr-only">{messages.boardTitle}</caption>
            <thead className="hidden border-b border-ivory-100/16 md:table-header-group">
              <tr className="type-eyebrow text-mist-300">
                <th scope="col" className="py-3 pr-4">{messages.columns.time}</th>
                <th scope="col" className="py-3 pr-4">{messages.columns.lot}</th>
                <th scope="col" className="py-3 pr-4 text-right">{messages.columns.price}</th>
                <th scope="col" className="py-3 pr-4 text-right">{messages.columns.bids}</th>
                <th scope="col" className="py-3">{messages.columns.reserve}</th>
              </tr>
            </thead>
            <tbody>
              {board.map((lot) => {
                const closed = lot.state.phase === "closed";
                const next = lot.id === nextId;
                const extended = lot.state.extensions > 0;
                return (
                  <tr key={lot.id} className={cx("border-b border-ivory-100/16", next && "bg-navy-900", closed && "text-mist-300")}>
                    <td className="py-3 pl-2 pr-4 align-middle">
                      <span className={cx("block type-num-m", closed ? "text-mist-300" : "text-ivory-100")}>{formatTime(lot.state.endsAt, locale)}</span>
                      {extended && !closed && <span className="block type-caption text-orange-600">{messages.extended}</span>}
                      {closed && <span className="block type-caption">{messages.closed}</span>}
                    </td>
                    <td className="py-3 pr-4 align-middle">
                      <Link href={href(locale, "lot", { lot: lot.slug })} className="group flex items-center gap-3">
                        <span className="relative hidden h-thumb-xs-h w-thumb-xs-w shrink-0 overflow-hidden rounded-xs bg-navy-900 sm:block">
                          {lot.cover && <Image src={lot.cover.src} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: lot.cover.focalPoint }} />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 type-title-m text-ivory-100 group-hover:underline underline-offset-4">
                            {next && <LiveDot />}{lot.title}
                          </span>
                          <span className="block type-caption text-mist-300">{interpolate(lotNumber, { number: lot.number })}</span>
                          <span className="mt-1 block type-num-s text-ivory-100 md:hidden">{money(lot.state.priceCents ?? lot.startCents)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden py-3 pr-4 text-right align-middle md:table-cell">
                      <span key={lot.state.priceCents} className="motion-price-in type-num-m text-ivory-100">{money(lot.state.priceCents ?? lot.startCents)}</span>
                    </td>
                    <td className="hidden py-3 pr-4 text-right align-middle type-num-s md:table-cell">{lot.state.bidCount}</td>
                    <td className="py-3 pr-2 align-middle">
                      <span className="flex items-center gap-2 type-body-s text-mist-300">
                        <span aria-hidden="true" className={cx("size-dot shrink-0 rounded-full", reserveDot[lot.state.reserve])} />
                        {messages.reserve[lot.state.reserve]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Link href={href(locale, "auctions", {}, { view: "order" })} className={buttonClasses({ variant: "secondary-inverse", className: "mt-6" })}>
            <ButtonContent arrow>{plural(locale, messages.allLots, live.length, { count: live.length })}</ButtonContent>
          </Link>
        </div>

        <div className="lg:col-span-5">
          <h3 className="type-display-s">{messages.feedTitle}</h3>
          {entries.length === 0 ? (
            <p className="mt-6 type-body-m text-mist-300">{messages.noActivity}</p>
          ) : (
            <LiveRows
              tone="inverse"
              className="mt-4 border-t border-ivory-100/16"
              items={entries.slice(0, 6).map((entry) => {
                const lot = byId.get(entry.lotId);
                return {
                  key: `${entry.lotId}-${entry.seq}`,
                  content: (
                    <Link href={lot ? href(locale, "lot", { lot: lot.slug }) : href(locale, "auctions")} className="flex h-row-feed items-center gap-3 border-b border-ivory-100/16 px-2 hover:bg-navy-900">
                      <Flag country={entry.country} title={countryNames[entry.country as CountryCode]} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate type-title-m text-ivory-100">{entry.isViewer ? messages.you : interpolate(messages.bidder, { alias: entry.alias })}</span>
                        <span className="block truncate type-body-s text-mist-300">{interpolate(messages.bidOn, { title: entry.lotTitle })} · {formatRelativeTime(now - entry.at, locale)}</span>
                      </span>
                      <span className="shrink-0 type-num-m text-ivory-100">{money(entry.amountCents)}</span>
                    </Link>
                  ),
                };
              })}
            />
          )}
        </div>
      </div>
    </>
  );
}
