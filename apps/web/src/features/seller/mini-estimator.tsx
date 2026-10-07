"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { boatTypes, type BoatType } from "@bba/contracts";
import { estimateHoldingCost } from "@bba/domain";
import { formatMoney, href, type Locale } from "@bba/i18n";
import { buttonClasses, ButtonContent, Field, MoneyInput, Select, TextInput } from "@bba/ui";
import { defaultEstimateInput, sellPrefillQuery } from "./estimate-input";

/** A typed length in metres, kept between 3 and 40 m; the worked example's 10 m when unreadable. */
function parseLength(text: string): number {
  const metres = Number.parseFloat(text.replace(",", "."));
  return Number.isFinite(metres) ? Math.min(40, Math.max(3, metres)) : defaultEstimateInput.lengthMetres;
}

export interface MiniEstimatorMessages {
  type: string;
  length: string;
  value: string;
  estimate: string;
  perMonth: string;
  caption: string;
  fullCost: string;
  sell: string;
  types: Readonly<Record<BoatType, string>>;
}

/**
 * C-25 mini estimator: three inverse inputs give the monthly cost of keeping the boat, before any
 * contact details. Values come from estimateHoldingCost with the default parameters; the result
 * updates 150 ms after typing stops and animates like a price change.
 */
export function MiniEstimator({ locale, messages, currentYear }: { locale: Locale; messages: MiniEstimatorMessages; currentYear: number }) {
  const [type, setType] = useState<BoatType>("motorboat");
  const [length, setLength] = useState("10");
  const [value, setValue] = useState<number | null>(6_000_000);
  const [settled, setSettled] = useState({ length: 10, value: 6_000_000 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSettled({ length: parseLength(length), value: value ?? 0 });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [length, value]);

  const result = estimateHoldingCost({ ...defaultEstimateInput, lengthMetres: settled.length, valueCents: settled.value, currentYear });
  const monthly = Math.round(result.monthlyCents / 100) * 100;
  // The link carries what is typed now; only the displayed result waits for typing to settle.
  const prefill = sellPrefillQuery({ type, lengthMetres: parseLength(length), valueCents: value ?? 0 });

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={messages.type} tone="inverse">
          {({ id }) => (
            <Select id={id} tone="inverse" value={type} onChange={(event) => setType(event.target.value as BoatType)}>
              {boatTypes.map((option) => <option key={option} value={option}>{messages.types[option]}</option>)}
            </Select>
          )}
        </Field>
        <Field label={`${messages.length} (m)`} tone="inverse">
          {({ id }) => <TextInput id={id} tone="inverse" inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} />}
        </Field>
        <Field label={messages.value} tone="inverse">
          {({ id }) => <MoneyInput id={id} tone="inverse" locale={locale} value={value} onValueChange={setValue} />}
        </Field>
      </div>

      <div className="mt-8" aria-live="off">
        <p className="type-eyebrow text-mist-300">{messages.estimate}</p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
          <span key={monthly} className="motion-price-in type-num-xl text-ivory-100">≈ {formatMoney(monthly, locale)}</span>
          <span className="type-body-m text-mist-300">{messages.perMonth}</span>
        </p>
        <p className="mt-2 type-caption text-mist-300">{messages.caption}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`${href(locale, "sell", {}, prefill)}#estimation`} className={buttonClasses({ variant: "primary-inverse" })}>
          <ButtonContent arrow>{messages.fullCost}</ButtonContent>
        </Link>
        <Link href={href(locale, "sell")} className={buttonClasses({ variant: "secondary-inverse" })}>
          <ButtonContent>{messages.sell}</ButtonContent>
        </Link>
      </div>
    </div>
  );
}
