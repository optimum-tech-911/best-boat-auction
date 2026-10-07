"use client";

import { useState } from "react";
import { defaultAuctionRules } from "@bba/domain";
import { formatMoney, interpolate, type Locale, type Messages } from "@bba/i18n";
import { Field, MaximumBidDiagram, MoneyInput } from "@bba/ui";
import { compareMaxBids } from "./max-bid-demo";

/** The worked example of the specification's test vectors: a 10 000 € start, maximums of 15 000 € and 14 000 €. */
const example = { startCents: 1_000_000, yoursCents: 1_500_000, rivalCents: 1_400_000 } as const;
/** Keeps the example inside the engine's largest accepted bid. */
const maximumCents = example.startCents * 10;

interface MaxBidExplorerProps {
  locale: Locale;
  copy: Messages["how"]["bidding"];
  diagram: Messages["diagrams"]["maxBid"];
}

/** SC-04 interactive: two maximums, and the price and leader the bidding engine gives them. */
export function MaxBidExplorer({ locale, copy, diagram }: MaxBidExplorerProps) {
  const [yours, setYours] = useState<number | null>(example.yoursCents);
  const [rival, setRival] = useState<number | null>(example.rivalCents);
  const outcome = compareMaxBids({ startCents: example.startCents, yoursCents: yours ?? 0, rivalCents: rival ?? 0 }, defaultAuctionRules);
  const error = (field: "yours" | "rival") =>
    !outcome.ok && outcome.field === field ? interpolate(copy.tooLow, { value: formatMoney(outcome.minimumCents, locale) }) : undefined;

  const top = Math.max(yours ?? 0, rival ?? 0, example.startCents) * 1.12;
  const position = (cents: number) => (cents - example.startCents) / (top - example.startCents);

  return (
    <div className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <h3 className="type-title-l text-navy-900">{copy.tryTitle}</h3>
      <p className="mt-1 type-body-s numerals text-stone-600">{interpolate(copy.start, { value: formatMoney(example.startCents, locale) })}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={copy.yours} error={error("yours")}>
          {({ id, describedBy, invalid }) => <MoneyInput id={id} aria-describedby={describedBy} invalid={invalid} locale={locale} maximumCents={maximumCents} value={yours} onValueChange={setYours} />}
        </Field>
        <Field label={copy.rival} error={error("rival")}>
          {({ id, describedBy, invalid }) => <MoneyInput id={id} aria-describedby={describedBy} invalid={invalid} locale={locale} maximumCents={maximumCents} value={rival} onValueChange={setRival} />}
        </Field>
      </div>
      {outcome.ok && (
        <div className="mt-8">
          <MaximumBidDiagram
            title={diagram.title}
            labels={{ yours: diagram.yours, rival: diagram.rival, price: diagram.price }}
            values={{ yours: formatMoney(yours ?? 0, locale), rival: formatMoney(rival ?? 0, locale), price: formatMoney(outcome.priceCents, locale) }}
            positions={{ yours: position(yours ?? 0), rival: position(rival ?? 0), price: position(outcome.priceCents) }}
            leader={outcome.leader === "yours" ? diagram.youLead : diagram.rivalLeads}
            caption={diagram.caption}
          />
        </div>
      )}
    </div>
  );
}
