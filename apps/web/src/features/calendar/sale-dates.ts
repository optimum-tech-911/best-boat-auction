import type { SaleSummary } from "@bba/contracts";
import { defaultAuctionRules } from "@bba/domain";
import { formatDay, formatMonth, formatTime, interpolate, type Locale, type Messages } from "@bba/i18n";
import type { JourneyStep } from "@bba/ui";

type JourneyMessages = Messages["diagrams"]["journey"];

/** The dates of a sale for SC-01: the full six-step journey and the three-step mini version. */
export function saleDates(sale: SaleSummary, locale: Locale, messages: JourneyMessages) {
  const short = { weekday: "short", month: "short" } as const;
  const dayMonth = (instant: number) => formatDay(instant, locale, { weekday: false, month: "short" });
  const [deposit, bidding, viewings, closing, payment, collection] = messages.steps;
  const depositStep: JourneyStep = { label: deposit ?? "", detail: interpolate(messages.before, { date: dayMonth(sale.submissionDeadlineAt) }) };
  const biddingStep: JourneyStep = { label: bidding ?? "", detail: interpolate(messages.from, { date: dayMonth(sale.opensAt) }) };
  const closingStep: JourneyStep = { label: closing ?? "", detail: interpolate(messages.closing, { date: formatDay(sale.closingStartsAt, locale, short), time: formatTime(sale.closingStartsAt, locale, { compact: true }) }) };
  return {
    month: formatMonth(sale.closingStartsAt, locale),
    mini: [depositStep, biddingStep, closingStep],
    full: [
      depositStep,
      biddingStep,
      { label: viewings ?? "", detail: interpolate(messages.until, { date: dayMonth(sale.viewingsUntil) }) },
      closingStep,
      { label: payment ?? "", detail: interpolate(messages.within, { days: defaultAuctionRules.paymentDays }) },
      { label: collection ?? "", detail: interpolate(messages.within, { days: defaultAuctionRules.collectionDays }) },
    ],
  };
}
