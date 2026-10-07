"use client";

import Link from "next/link";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { BidHistoryEntry, LotDetail } from "@bba/contracts";
import { buyerTotal, defaultAuctionRules } from "@bba/domain";
import { formatDay, formatLength, formatMoney, formatRelativeTime, formatTimeRange, href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, Countdown, cx, Flag, Icon, useNow } from "@bba/ui";
import { LotPhoto } from "@/components/auction/lot-photo";
import { useLotState } from "@/features/live/live-auction";

type SheetCopy = Messages["home"]["inspect"]["sheet"];

interface ExplorerMessages {
  lotNumber: string;
  bidder: string;
  you: string;
  types: Messages["categories"]["singular"];
  countries: Messages["countries"];
  photoComing: string;
}

interface LotSheetExplorerProps {
  locale: Locale;
  lot: LotDetail;
  history: BidHistoryEntry[];
  /** In order: viewing, history, closing, total price, payment. */
  items: readonly { title: string; text: string }[];
  sheet: SheetCopy;
  messages: ExplorerMessages;
}

/**
 * The guarantees and a compact lot page side by side. Choosing a guarantee (click, hover or focus)
 * outlines the part of the page that proves it and dims the rest; the page itself stays live.
 */
export function LotSheetExplorer({ locale, lot, history, items, sheet, messages }: LotSheetExplorerProps) {
  const [selected, setSelected] = useState(0);
  const state = useLotState(lot.state);
  const now = useNow();
  const money = (cents: number) => formatMoney(cents, locale);
  const nextBid = state.nextMinimumCents ?? lot.startCents;
  const total = buyerTotal({ hammerCents: nextBid, startCents: lot.startCents }, defaultAuctionRules);

  const zone = (index: number, children: ReactNode, className?: string) => (
    <div
      onMouseEnter={() => setSelected(index)}
      className={cx("relative rounded-sm p-4 transition-colors duration-base", selected === index && "bg-teal-50 outline outline-2 outline-teal-700", className)}
    >
      <span aria-hidden="true" className={cx("absolute -left-2 -top-2 grid size-icon-l place-items-center rounded-xs type-num-s transition-colors duration-base", selected === index ? "bg-teal-700 text-white" : "bg-navy-900 text-ivory-100")}>
        {index + 1}
      </span>
      <div className={cx("transition-opacity duration-base", selected !== index && "lg:opacity-60")}>{children}</div>
    </div>
  );

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8">
      <ol className="lg:col-span-5">
        {items.map((item, index) => (
          <li key={item.title}>
            <button
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              onMouseEnter={() => setSelected(index)}
              onFocus={() => setSelected(index)}
              className="flex w-full gap-4 border-t border-stone-300 py-5 text-left"
            >
              <span className={cx("grid size-control-sm shrink-0 place-items-center rounded-sm type-num-s transition-colors duration-fast", selected === index ? "bg-navy-900 text-ivory-100" : "border border-stone-300 text-navy-900")}>
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className={cx("block type-title-l transition-colors duration-fast", selected === index ? "text-navy-900" : "text-stone-600")}>{item.title}</span>
                <span className={cx("mt-1 block type-body-m", selected === index ? "text-navy-900" : "text-stone-600")}>{item.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <figure aria-label={interpolate(sheet.label, { title: lot.title })} className="flex flex-col gap-3 rounded-md border border-stone-300 bg-white p-4 shadow-pop sm:p-6 lg:col-span-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-4/3 overflow-hidden rounded-sm bg-stone-100">
            <LotPhoto image={lot.cover} locale={locale} sizes="(max-width: 639px) 100vw, 320px" placeholder={messages.photoComing} decorative />
          </div>
          <div className="flex flex-col justify-between gap-3">
            <div>
              <p className="type-eyebrow text-stone-600">{interpolate(messages.lotNumber, { number: lot.number })} · {lot.location.city}</p>
              <p className="mt-1 type-display-s text-navy-900">{lot.title}</p>
              <p className="type-body-s text-stone-600">{lot.yearBuilt} · {formatLength(lot.lengthCm, locale)} · {messages.types[lot.type]}</p>
            </div>
            {lot.viewing && zone(0, (
              <>
                <p className="flex items-center gap-2 type-eyebrow text-stone-600"><Icon icon={CalendarCheck} size="s" />{sheet.viewing}</p>
                <p className="mt-1 type-body-m numerals text-navy-900">{formatDay(lot.viewing.startsAt, locale, { month: "short" })} · {formatTimeRange(lot.viewing.startsAt, lot.viewing.endsAt, locale)}</p>
              </>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {zone(2, (
            <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="type-eyebrow text-stone-600">{state.priceCents === null ? sheet.start : sheet.current}</p>
                <p key={state.priceCents} className="motion-price-in mt-1 type-num-l text-navy-900">{money(state.priceCents ?? lot.startCents)}</p>
              </div>
              <div className="text-right">
                <p className="type-eyebrow text-stone-600">{sheet.closes}</p>
                <Countdown endsAt={state.endsAt} locale={locale} size="m" className="mt-1 block" />
              </div>
            </div>
            <p className="mt-2 type-caption text-stone-600">{sheet.extension}</p>
            </>
          ))}
          {zone(3, (
            <>
              <p className="type-eyebrow text-stone-600">{interpolate(sheet.total, { amount: money(nextBid) })}</p>
              <p className="mt-1 type-num-l text-navy-900">{money(total.totalCents)}</p>
              <p className="type-caption text-stone-600">{sheet.totalNote}</p>
            </>
          ))}
        </div>

        {zone(1, (
          <>
            <p className="type-eyebrow text-stone-600">{sheet.history}</p>
            {history.length === 0 ? (
              <p className="mt-2 type-body-s text-stone-600">{sheet.noBids}</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-200">
                {history.slice(0, 3).map((entry) => (
                  <li key={entry.seq} className="flex items-center gap-3 py-2 type-body-s">
                    <Flag country={entry.country} title={messages.countries[entry.country as keyof typeof messages.countries]} />
                    <span className="min-w-0 flex-1 truncate text-navy-900">{entry.isViewer ? messages.you : interpolate(messages.bidder, { alias: entry.alias })}</span>
                    <span className="type-num-s text-navy-900">{money(entry.amountCents)}</span>
                    <span className="w-20 shrink-0 text-right type-caption text-stone-600">{formatRelativeTime(now - entry.at, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ))}

        {zone(4, (
          <p className="flex items-center gap-3 type-body-m text-navy-900">
            <Icon icon={ShieldCheck} size="m" className="shrink-0 text-teal-700" />
            {sheet.escrow}
          </p>
        ))}

        <Link href={href(locale, "lot", { lot: lot.slug })} className={buttonClasses({ variant: "link", className: "self-start" })}>
          <ButtonContent arrow>{sheet.open}</ButtonContent>
        </Link>
      </figure>
    </div>
  );
}
