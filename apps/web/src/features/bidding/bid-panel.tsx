"use client";

import { Gavel } from "lucide-react";
import { useId, useState } from "react";
import type { BidHistoryEntry, LotDetail } from "@bba/contracts";
import { buyerTotal, defaultAuctionRules, increment, type BidKind } from "@bba/domain";
import { formatDateShort, formatMoney, formatPercent, interpolate, plural, type Locale } from "@bba/i18n";
import { Button, Countdown, Divider, MoneyInput, PriceBlock, SegmentedControl, StatusLine } from "@bba/ui";
import { outcomeStatus } from "@/components/auction/messages";
import { useAuthDialog } from "@/features/account/auth-dialog";
import { useLiveAuction, useLotState, useViewer, useViewerPosition } from "@/features/live/live-auction";
import { BidHistory } from "./bid-history";
import type { BidMessages } from "./bid-messages";
import { ReviewDialog } from "./review-dialog";

interface BidPanelProps {
  lot: LotDetail;
  history: BidHistoryEntry[];
  locale: Locale;
  messages: BidMessages;
  statusMessages: Parameters<typeof outcomeStatus>[1];
  /** The mobile sheet shows items 1–11, without the bid history. */
  variant?: "panel" | "sheet";
  onPlaced?: () => void;
}

/**
 * The bid panel of blueprint BID: closing time, current bid, reserve and the viewer's own status,
 * then the bid form (single or maximum), quick amounts, the total if the bid wins, the bid button,
 * the binding notice and the history. Every rule comes from packages/domain.
 */
export function BidPanel({ lot, history, locale, messages, statusMessages, variant = "panel", onPlaced }: BidPanelProps) {
  const state = useLotState(lot.state);
  const position = useViewerPosition(lot.id);
  const viewer = useViewer();
  const auth = useAuthDialog();
  const live = useLiveAuction();
  const inputId = useId();
  const [mode, setMode] = useState<BidKind>("single");
  const [typed, setTyped] = useState<number | null>(null);
  const [review, setReview] = useState<{ kind: BidKind; amountCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = messages.bid;
  const rules = { ...defaultAuctionRules, vatOnPremium: lot.conditions.vatOnPremium };
  const closed = state.phase === "closed";
  const open = state.phase === "live";
  const price = state.priceCents ?? lot.startCents;
  const minimum = state.nextMinimumCents ?? lot.startCents;
  const leading = position?.status === "leading";
  // A leader raises their maximum above their current ceiling; everyone else bids from the next minimum.
  const ceiling = leading ? position.maxBidCents ?? price : null;
  const floor = ceiling === null ? minimum : ceiling + increment(ceiling, rules);
  const kind: BidKind = leading ? "max" : mode;
  const suggested = kind === "max" && !leading ? minimum + 2 * increment(minimum, rules) : floor;
  const amount = typed ?? suggested;
  const quick = [floor, floor + increment(floor, rules), floor + 3 * increment(floor, rules)];
  const cost = buyerTotal({ hammerCents: amount, startCents: lot.startCents, vatOnHammer: lot.conditions.vatOnHammer }, rules);
  const formatted = formatMoney(amount, locale);

  const submit = () => {
    if (amount < floor) {
      setError(interpolate(messages.errors[kind === "single" ? "BID_TOO_LOW" : "MAX_TOO_LOW"], { minimum: formatMoney(floor, locale) }));
      return;
    }
    setError(null);
    const next = { kind, amountCents: amount };
    if (viewer) setReview(next);
    else auth.open(() => setReview(next));
  };

  const priceLabel = state.priceCents === null ? copy.startingPrice : closed ? copy.finalBid : copy.currentBid;
  const reserve = state.reserve === "none" ? { tone: "met" as const, text: copy.noReserve }
    : state.reserve === "met" ? { tone: "met" as const, text: copy.reserveMet }
      : state.reserve === "not_met" ? { tone: "waiting" as const, text: copy.reserveNotMet } : null;
  const outcome = closed && state.outcome ? outcomeStatus(state.outcome, statusMessages) : null;
  const own = position ? {
    leading: { tone: "leading" as const, label: statusMessages.leading, text: position.maxBidCents ? interpolate(copy.leadingMax, { max: formatMoney(position.maxBidCents, locale) }) : copy.leading },
    outbid: { tone: "outbid" as const, label: statusMessages.outbid, text: copy.outbid },
    won: { tone: "leading" as const, label: statusMessages.won, text: copy.won },
    awaiting_seller: { tone: "waiting" as const, label: statusMessages.awaitingSeller, text: interpolate(copy.awaiting, { hours: lot.conditions.sellerDecisionHours }) },
    lost: { tone: "waiting" as const, label: statusMessages.lost, text: copy.lost },
  }[position.status] : null;

  return (
    <section aria-label={copy.panelLabel} className={variant === "panel" ? "rounded-md border border-stone-300 bg-white p-5 lg:p-6" : ""}>
      {/* 1. Closing */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="whitespace-nowrap type-eyebrow text-stone-600">{closed ? copy.closed : copy.closesIn}</p>
          {!closed && <Countdown endsAt={state.endsAt} locale={locale} size="l" className="mt-1 block" />}
        </div>
        <p className="text-right type-body-s numerals text-stone-600">{interpolate(copy.closesAt, { date: formatDateShort(state.endsAt, locale) })}</p>
      </div>
      {state.extensions > 0 && !closed && <StatusLine tone="urgent" className="mt-3">{interpolate(copy.extended, { minutes: lot.conditions.extensionMinutes })}</StatusLine>}

      {/* 2–4. Price and reserve */}
      <Divider className="my-5" />
      <PriceBlock
        label={priceLabel}
        valueCents={price}
        locale={locale}
        size="xl"
        note={<>{plural(locale, messages.lot.bidCount, state.bidCount)}{variant === "panel" && state.bidCount > 0 && <> · <a href="#historique" className="text-teal-700 underline-offset-3 hover:underline">{copy.history}</a></>}</>}
      />
      {outcome && <StatusLine tone={outcome.tone} className="mt-4">{outcome.text}</StatusLine>}
      {!outcome && reserve && <StatusLine tone={reserve.tone} className="mt-4">{reserve.text}</StatusLine>}

      {/* 5. The viewer's position */}
      {own && (
        <div className="mt-5 rounded-sm bg-stone-100 p-4">
          <StatusLine tone={own.tone}>{own.label}</StatusLine>
          <p className="mt-2 type-body-s text-navy-900">{own.text}</p>
          {position?.status === "outbid" && open && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setMode("single"); setTyped(minimum); }}>
              {interpolate(copy.outbidAction, { amount: formatMoney(minimum, locale) })}
            </Button>
          )}
          {leading && position.maxBidCents && open && (
            <button type="button" className="mt-3 block type-body-s text-teal-700 underline-offset-3 hover:underline" onClick={() => void live.cancelMaxBid(lot.id)}>{copy.cancelMax}</button>
          )}
        </div>
      )}

      {/* 6–11. The bid form */}
      {open && (
        <div className="mt-6 flex flex-col gap-4">
          <SegmentedControl label={copy.mode} value={kind} onChange={(value) => { setMode(value); setTyped(null); setError(null); }} options={[{ value: "single", label: copy.single }, { value: "max", label: copy.max }]} />
          <p className="type-body-s text-stone-600">{kind === "single" ? copy.singleHint : copy.maxHint}</p>
          <div>
            <label htmlFor={inputId} className="type-label text-navy-900">{kind === "single" ? copy.amount : copy.maxAmount}</label>
            <MoneyInput
              id={inputId}
              className="mt-2"
              size="bid"
              locale={locale}
              value={amount}
              invalid={error !== null}
              aria-describedby={`${inputId}-hint`}
              onValueChange={(value) => { setTyped(value); setError(null); }}
              onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
            />
            <p id={`${inputId}-hint`} className="mt-hint type-body-s text-stone-600">
              {interpolate(copy.minimum, { minimum: formatMoney(floor, locale), step: formatMoney(increment(price, rules), locale) })}
            </p>
            {error && <p role="alert" className="mt-hint type-body-s text-danger-700">{error}</p>}
          </div>
          <div role="group" aria-label={copy.quick} className="flex flex-wrap gap-2">
            {quick.map((value) => (
              <Button key={value} variant="secondary" size="sm" onClick={() => { setTyped(value); setError(null); }} aria-pressed={amount === value}>
                <span className="numerals">{formatMoney(value, locale)}</span>
              </Button>
            ))}
          </div>
          <details className="group rounded-sm">
            <summary className="bba-summary flex cursor-pointer items-baseline justify-between gap-4">
              <span className="type-body-s text-navy-900">{copy.total}</span>
              <span className="type-title-m numerals text-navy-900">{formatMoney(cost.totalCents, locale)}</span>
            </summary>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 border-t border-stone-200 pt-3 type-body-s text-stone-600">
              <dt>{messages.price.bid}</dt><dd className="text-right numerals">{formatMoney(cost.hammerCents + cost.vatOnHammerCents, locale)}</dd>
              <dt>{messages.price.premium} ({formatPercent(cost.premiumRate, locale)})</dt><dd className="text-right numerals">{formatMoney(cost.premiumCents, locale)}</dd>
              <dt>{messages.price.vat}</dt><dd className="text-right numerals">{formatMoney(cost.vatOnPremiumCents, locale)}</dd>
            </dl>
            <span className="mt-1 block type-body-s text-teal-700 group-open:hidden">{copy.feesDetail}</span>
          </details>
          <Button variant="bid" size="lg" fullWidth icon={Gavel} onClick={submit}>
            {interpolate(kind === "single" ? copy.placeSingle : copy.placeMax, { amount: formatted })}
          </Button>
          <p className="type-caption text-stone-600">
            {interpolate(copy.finePrint, { rate: formatPercent(lot.premiumRate, locale) })}
            {lot.conditions.mode === "brokerage" && ` ${interpolate(copy.finePrintBrokerage, { hours: lot.conditions.sellerDecisionHours })}`}
          </p>
        </div>
      )}

      {/* 12. History */}
      {variant === "panel" && (
        <>
          <Divider className="my-6" />
          <BidHistory lotId={lot.id} initial={history} locale={locale} messages={messages} />
        </>
      )}

      {review && (
        <ReviewDialog
          lot={lot}
          kind={review.kind}
          amountCents={review.amountCents}
          minimumCents={floor}
          endsAt={state.endsAt}
          locale={locale}
          messages={messages}
          onClose={() => setReview(null)}
          onPlaced={() => { setReview(null); setTyped(null); onPlaced?.(); }}
        />
      )}
    </section>
  );
}
