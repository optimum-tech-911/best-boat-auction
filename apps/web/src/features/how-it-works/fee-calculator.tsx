"use client";

import { useState } from "react";
import { buyerTotal, defaultAuctionRules } from "@bba/domain";
import { formatMoney, formatPercent, interpolate, type Locale, type Messages } from "@bba/i18n";
import { Field, MoneyInput, PriceBreakdownDiagram, Table, TableBody, TableCell, TableRow } from "@bba/ui";

/** A 21 000 € winning bid, the amount of the specification's invoice example. */
const exampleBidCents = 2_100_000;

interface FeeCalculatorProps {
  locale: Locale;
  copy: Messages["how"]["fees"];
  diagram: Messages["diagrams"]["price"];
}

/**
 * The cost calculator: a bid gives SC-07 and the breakdown table, both from buyerTotal. The house's
 * commission is the same for every lot, so the start price is not asked.
 */
export function FeeCalculator({ locale, copy, diagram }: FeeCalculatorProps) {
  const [bid, setBid] = useState<number | null>(exampleBidCents);
  const hammerCents = bid ?? 0;
  const cost = buyerTotal({ hammerCents, startCents: hammerCents }, defaultAuctionRules);
  const money = (cents: number) => formatMoney(cents, locale, { withCents: cents % 100 !== 0 });
  const lines = [
    { label: copy.bid, cents: cost.hammerCents },
    { label: interpolate(copy.premium, { rate: formatPercent(cost.premiumRate, locale) }), cents: cost.premiumCents },
    { label: interpolate(copy.vat, { rate: formatPercent(cost.vatOnPremium, locale) }), cents: cost.vatOnPremiumCents },
  ] as const;

  return (
    <div className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <h3 className="type-title-l text-navy-900">{copy.calculatorTitle}</h3>
      <Field label={copy.bid} className="mt-6 sm:max-w-form">
        {({ id }) => <MoneyInput id={id} locale={locale} value={bid} onValueChange={setBid} />}
      </Field>
      <div className="mt-8">
        <PriceBreakdownDiagram
          title={diagram.title}
          segments={[
            { label: diagram.bid, value: cost.hammerCents, display: money(cost.hammerCents) },
            { label: diagram.premium, value: cost.premiumCents, display: money(cost.premiumCents) },
            { label: diagram.vat, value: cost.vatOnPremiumCents, display: money(cost.vatOnPremiumCents) },
          ]}
          total={{ label: copy.total, display: money(cost.totalCents) }}
        />
      </div>
      <Table className="mt-6">
        <caption className="sr-only">{copy.calculatorTitle}</caption>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.label}>
              <TableCell>{line.label}</TableCell>
              <TableCell numeric>{money(line.cents)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell emphasis>{copy.total}</TableCell>
            <TableCell numeric emphasis>{money(cost.totalCents)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
