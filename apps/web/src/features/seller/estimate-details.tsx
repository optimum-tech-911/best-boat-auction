"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { defaultHoldingCostParameters, defaultSellerOffer, waitingCost } from "@bba/domain";
import { formatMoney, formatPercent, interpolate, plural } from "@bba/i18n";
import { buttonClasses, ButtonContent, Divider, Reveal, SaleJourneyDiagram, SegmentedControl, Table, TableBody, TableCell, TableRow, WaitingCostDiagram } from "@bba/ui";
import { useSellFunnel } from "./sell-funnel";

const waitingPeriods = [3, 6, 12] as const;
type WaitingPeriod = (typeof waitingPeriods)[number];

/**
 * The waiting panel (navy-900): 3, 6 or 12 months of keeping the boat, the cumulative cost with
 * SC-06, and its value today against in 12 months.
 */
export function WaitingPanel() {
  const { locale, messages, estimate, estimated } = useSellFunnel();
  const copy = messages.sell.result;
  const titleId = useId();
  const [months, setMonths] = useState<WaitingPeriod>(6);
  const label = (count: number) => plural(locale, messages.waiting.months, count, { count });
  const cost = waitingCost(estimate, months);

  return (
    <section aria-labelledby={titleId} className="on-dark rounded-md bg-navy-900 p-6 text-ivory-100 lg:p-8">
      <h3 id={titleId} className="type-title-l">{copy.waitTitle}</h3>
      <SegmentedControl
        tone="inverse"
        label={copy.waitLabel}
        className="mt-4"
        options={waitingPeriods.map((period) => ({ value: String(period), label: label(period) }))}
        value={String(months)}
        onChange={(value) => setMonths(Number(value) as WaitingPeriod)}
      />
      <p className="mt-6 type-body-s text-mist-300">{copy.waitCost}</p>
      <p key={`${months}-${cost}`} className="motion-price-in mt-1 type-num-xl">{formatMoney(cost, locale)}</p>
      <Reveal kind="diagram" className="mt-6">
        <WaitingCostDiagram
          title={messages.waiting.title}
          selectedMonths={months}
          points={waitingPeriods.map((period) => ({ months: period, label: label(period), display: formatMoney(waitingCost(estimate, period), locale) }))}
        />
      </Reveal>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { term: copy.valueNow, value: estimated.valueCents },
          { term: copy.valueLater, value: estimate.valueIn12MonthsCents },
        ].map((block) => (
          <div key={block.term} className="rounded-sm border border-ivory-100/16 p-4">
            <dt className="type-body-s text-mist-300">{block.term}</dt>
            <dd className="mt-1 type-num-l">{formatMoney(block.value, locale)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** What selling costs (C-17: a broker's commission against the free listing), then the next sale with SC-01 mini. */
export function SellingCosts() {
  const { locale, messages, nextSale, estimate, listingHref } = useSellFunnel();
  const copy = messages.sell.result;
  const titleId = useId();
  const listing = defaultSellerOffer.packs.find((pack) => pack.id === "base")?.priceCents ?? 0;
  const lowestPaidPack = Math.min(...defaultSellerOffer.packs.filter((pack) => pack.priceCents > 0).map((pack) => pack.priceCents));
  const saving = estimate.brokerCommissionCents - listing;

  return (
    <section aria-labelledby={titleId} className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <h3 id={titleId} className="type-title-l text-navy-900">{copy.feesTitle}</h3>
      <Table className="mt-4">
        <caption className="sr-only">{copy.feesTitle}</caption>
        <TableBody>
          <TableRow>
            <TableCell>{interpolate(copy.broker, { rate: formatPercent(defaultHoldingCostParameters.brokerCommission, locale) })}</TableCell>
            <TableCell numeric>{formatMoney(estimate.brokerCommissionCents, locale)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{copy.ourFee}</TableCell>
            <TableCell numeric>{listing === 0 ? messages.sell.packs.free : formatMoney(listing, locale)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {saving > 0 && <p className="mt-4 type-title-m text-success-700">{interpolate(copy.keep, { value: formatMoney(saving, locale) })}</p>}
      <p className="mt-2 type-body-s text-stone-600">
        {interpolate(copy.packsNote, { price: formatMoney(lowestPaidPack, locale) })}{" "}
        <a href="#packs" className="text-teal-700 underline underline-offset-3">{copy.packsLink}</a>
      </p>
      <p className="mt-1 type-caption text-stone-600">{copy.feesNote}</p>

      {nextSale && (
        <>
          <Divider className="my-8" />
          <h3 className="type-eyebrow text-stone-600">{interpolate(copy.nextSale, { date: nextSale.date })}</h3>
          <Reveal kind="diagram" className="mt-6">
            <SaleJourneyDiagram mini title={messages.journeyTitle} steps={nextSale.steps} />
          </Reveal>
          <Link href={listingHref} className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true, className: "mt-8 sm:w-auto sm:px-button-lg" })}>
            <ButtonContent arrow size="lg">{interpolate(copy.sellAt, { date: nextSale.date })}</ButtonContent>
          </Link>
        </>
      )}
    </section>
  );
}
