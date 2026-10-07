"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultHoldingCostParameters as parameters, type HoldingCostLine } from "@bba/domain";
import { formatMoney, formatNumber, formatPercent, interpolate, type Locale } from "@bba/i18n";
import { Button, buttonClasses, ButtonContent, CostAnatomyDiagram, Dialog, Reveal, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@bba/ui";
import { useSellFunnel } from "./sell-funnel";

/** Shares in the SC-05 legend, rounded to whole percents. */
const formatShare = (locale: Locale) => (share: number) => formatPercent(Math.round(share * 100) * 100, locale);

/**
 * The results panel (SELL, sticky at 96 px from 1024 px): the monthly cost headline, its yearly and
 * per-day sub-line, SC-05 built from the estimator lines, and the two next steps.
 */
export function EstimateResults() {
  const { locale, messages, nextSale, estimate, openLead, listingHref } = useSellFunnel();
  const copy = messages.sell.result;
  const [explaining, setExplaining] = useState(false);
  const subline = [
    interpolate(copy.yearly, { value: formatMoney(estimate.yearlyCents, locale) }),
    estimate.perDayUsedCents === null ? null : interpolate(copy.perDay, { value: formatMoney(estimate.perDayUsedCents, locale) }),
  ].filter(Boolean).join(" · ");

  return (
    <div className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <h3 className="type-eyebrow text-stone-600">{copy.title}</h3>
      <p className="mt-3">
        <span key={estimate.monthlyCents} className="motion-price-in inline-block type-num-xl text-navy-900">
          {interpolate(copy.monthly, { value: formatMoney(estimate.monthlyCents, locale) })}
        </span>
      </p>
      <p className="mt-2 type-body-s numerals text-stone-600">{subline}</p>
      <Reveal kind="diagram" className="mt-8">
        <CostAnatomyDiagram
          title={messages.cost.title}
          formatShare={formatShare(locale)}
          legendColumns={1}
          segments={estimate.lines.map((line) => ({ label: messages.sell.lines[line.key], value: line.yearlyCents, display: formatMoney(Math.round(line.yearlyCents / 12), locale) }))}
        />
      </Reveal>
      <div className="mt-8 flex flex-col gap-3">
        {nextSale && (
          <Link href={listingHref} className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}>
            <ButtonContent arrow size="lg">{interpolate(copy.sellAt, { date: nextSale.date })}</ButtonContent>
          </Link>
        )}
        <Button variant="secondary" size="lg" fullWidth onClick={() => openLead("report")}>{copy.report}</Button>
      </div>
      <Button variant="link" className="mt-4" onClick={() => setExplaining(true)}>{copy.how}</Button>
      <p className="mt-2 type-caption text-stone-600">{copy.disclaimer}</p>
      {explaining && <CalculationDialog onClose={() => setExplaining(false)} />}
    </div>
  );
}

/** "Comment est-ce calculé ?": each line with its rule and yearly amount, from the same parameters as the estimate. */
function CalculationDialog({ onClose }: { onClose: () => void }) {
  const { locale, messages, estimate, estimated } = useSellFunnel();
  const copy = messages.sell;
  const money = (euros: number) => formatMoney(euros * 100, locale);
  const factor = (value: number) => formatNumber(value, locale, 2);

  const rule = (line: HoldingCostLine): string => {
    if (line.source === "owner" && line.key !== "tax") return copy.explain.owner;
    switch (line.key) {
      case "berth":
        return estimated.storage === "trailer"
          ? copy.explain.berthTrailer
          : interpolate(copy.explain.berthModel, {
            factor: formatNumber(parameters.berthFactor, locale),
            exponent: factor(parameters.berthExponent),
            coast: factor(parameters.coastFactors[estimated.coast]),
            storage: factor(parameters.storageFactors[estimated.storage]),
          });
      case "insurance":
        return interpolate(copy.explain.insurance, { rate: formatPercent(parameters.insuranceRate, locale), minimum: money(parameters.insuranceMinimumEuros) });
      case "maintenance":
        return interpolate(copy.explain.maintenance, { rate: formatPercent(parameters.maintenanceRate, locale), perMetre: money(parameters.maintenancePerMetreEuros) });
      case "winter":
        return interpolate(copy.explain.winter, { perMetre: money(parameters.winterPerMetrePerMonthEuros) });
      case "tax":
        return copy.explain.tax;
      case "depreciation":
        return interpolate(copy.explain.depreciation, { rate: formatPercent(estimate.depreciationRate, locale), age: estimate.ageYears });
      case "opportunity":
        return interpolate(copy.explain.opportunity, { rate: formatPercent(parameters.savingsRate, locale) });
    }
  };

  return (
    <Dialog open onClose={onClose} title={copy.result.how} closeLabel={messages.common.close} size="lg">
      <p className="type-body-m text-stone-600">{copy.result.howIntro}</p>
      <Table className="mt-6">
        <TableHead>
          <TableRow>
            <TableHeader>{copy.result.lineColumn}</TableHeader>
            <TableHeader numeric>{copy.result.yearColumn}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {estimate.lines.map((line) => (
            <TableRow key={line.key}>
              <TableCell>
                <span className="block">{copy.lines[line.key]}</span>
                <span className="block type-body-s text-stone-600">{rule(line)}</span>
              </TableCell>
              <TableCell numeric>{formatMoney(line.yearlyCents, locale)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell emphasis>{copy.result.total}</TableCell>
            <TableCell numeric emphasis>{formatMoney(estimate.yearlyCents, locale)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-6 type-caption text-stone-600">
        {interpolate(copy.result.parameters, { version: estimate.parametersVersion })} · {copy.result.disclaimer}
      </p>
    </Dialog>
  );
}
