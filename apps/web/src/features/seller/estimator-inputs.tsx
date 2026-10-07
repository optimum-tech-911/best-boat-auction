"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { boatTypes } from "@bba/contracts";
import { boatConditions, coastAreas, estimateHoldingCost, storageModes } from "@bba/domain";
import { formatLength, formatMoney, formatNumber, interpolate, plural } from "@bba/i18n";
import { Accordion, Checkbox, Field, FilterChip, MoneyInput, Select, Slider } from "@bba/ui";
import { useSellFunnel } from "./sell-funnel";

const LENGTH = { min: 3, max: 40, step: 0.5 } as const;
const WINTER_MONTHS = { min: 1, max: 8 } as const;
const DAYS = { min: 0, max: 120, step: 5 } as const;
const OLDEST_YEAR = 1960;

/** The estimator's inputs (SELL, from 1024 px a 7-column white panel): the boat, where it is kept, and the owner's own figures. */
export function EstimatorInputs() {
  const { locale, messages, currentYear, input, update } = useSellFunnel();
  const copy = messages.sell;
  // Money fields may be emptied while typing; the estimate reads an empty field as zero.
  const [value, setValue] = useState<number | null>(input.valueCents);
  const [tax, setTax] = useState<number | null>(input.taxCents);
  const model = useMemo(
    () => estimateHoldingCost({ ...input, ownerBerthCents: null, ownerInsuranceCents: null, currentYear }),
    [input, currentYear],
  );
  const modelLine = (key: "berth" | "insurance") => formatMoney(model.lines.find((line) => line.key === key)?.yearlyCents ?? 0, locale);
  const years = Array.from({ length: currentYear - OLDEST_YEAR + 1 }, (_, index) => currentYear - index);
  const length = formatLength(Math.round(input.lengthMetres * 100), locale);
  const winterMonths = plural(locale, messages.waiting.months, input.winterMonths, { count: input.winterMonths });

  return (
    <div className="flex flex-col gap-10 rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <InputGroup title={copy.groups.boat}>
        <ChoiceChips label={copy.fields.type} options={boatTypes.map((type) => ({ value: type, label: messages.types[type] }))} value={input.boatType} onChange={(boatType) => update({ boatType })} />
        <Field label={copy.fields.length} value={length}>
          {({ id }) => <Slider id={id} {...LENGTH} value={input.lengthMetres} aria-valuetext={length} onValueChange={(lengthMetres) => update({ lengthMetres })} />}
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={copy.fields.year}>
            {({ id }) => (
              <Select id={id} value={input.yearBuilt} onChange={(event) => update({ yearBuilt: Number(event.target.value) })}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </Select>
            )}
          </Field>
          <Field label={copy.fields.value} hint={copy.fields.valueHint}>
            {({ id, describedBy }) => <MoneyInput id={id} aria-describedby={describedBy} locale={locale} value={value} onValueChange={(cents) => { setValue(cents); update({ valueCents: cents ?? 0 }); }} />}
          </Field>
        </div>
        <ChoiceChips label={copy.fields.condition} options={boatConditions.map((condition) => ({ value: condition, label: copy.conditions[condition] }))} value={input.condition} onChange={(condition) => update({ condition })} />
      </InputGroup>

      <InputGroup title={copy.groups.place}>
        <ChoiceChips label={copy.fields.coast} options={coastAreas.map((coast) => ({ value: coast, label: copy.coasts[coast] }))} value={input.coast} onChange={(coast) => update({ coast })} />
        <ChoiceChips label={copy.fields.storage} options={storageModes.map((storage) => ({ value: storage, label: copy.storages[storage] }))} value={input.storage} onChange={(storage) => update({ storage })} />
        {input.storage !== "trailer" && (
          <div className="flex flex-col gap-4">
            <Checkbox checked={input.wintersAshore} onChange={(event) => update({ wintersAshore: event.target.checked })}>{copy.fields.winter}</Checkbox>
            {input.wintersAshore && (
              <Field label={copy.fields.winterMonths} value={winterMonths}>
                {({ id }) => <Slider id={id} {...WINTER_MONTHS} value={input.winterMonths} aria-valuetext={winterMonths} onValueChange={(months) => update({ winterMonths: months })} />}
              </Field>
            )}
          </div>
        )}
        <Field label={copy.fields.days} value={formatNumber(input.daysUsedPerYear ?? 0, locale)}>
          {({ id }) => <Slider id={id} {...DAYS} value={input.daysUsedPerYear ?? 0} onValueChange={(days) => update({ daysUsedPerYear: days || null })} />}
        </Field>
        <Field label={input.coast === "benelux_germany" ? copy.fields.taxOther : copy.fields.tax} className="sm:max-w-form">
          {({ id }) => <MoneyInput id={id} locale={locale} value={tax} onValueChange={(cents) => { setTax(cents); update({ taxCents: cents ?? 0 }); }} />}
        </Field>
      </InputGroup>

      <Accordion
        items={[{
          id: "real-costs",
          title: <span>{copy.groups.real} <span className="type-body-s text-stone-600">({messages.common.optional})</span></span>,
          content: (
            <div className="grid gap-6 pt-2 sm:grid-cols-2">
              <Field label={copy.fields.berth} hint={interpolate(copy.fields.auto, { value: modelLine("berth") })}>
                {({ id, describedBy }) => <MoneyInput id={id} aria-describedby={describedBy} locale={locale} value={input.ownerBerthCents ?? null} onValueChange={(cents) => update({ ownerBerthCents: cents })} />}
              </Field>
              <Field label={copy.fields.insurance} hint={interpolate(copy.fields.auto, { value: modelLine("insurance") })}>
                {({ id, describedBy }) => <MoneyInput id={id} aria-describedby={describedBy} locale={locale} value={input.ownerInsuranceCents ?? null} onValueChange={(cents) => update({ ownerInsuranceCents: cents })} />}
              </Field>
            </div>
          ),
        }]}
      />
    </div>
  );
}

function InputGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <fieldset aria-labelledby={id} className="flex flex-col gap-6">
      <h3 id={id} className="type-eyebrow text-stone-600">{title}</h3>
      {children}
    </fieldset>
  );
}

interface ChoiceChipsProps<Value extends string> {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}

/** A single choice among C-05 chips; the selected chip is pressed. */
function ChoiceChips<Value extends string>({ label, options, value, onChange }: ChoiceChipsProps<Value>) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="type-label text-navy-900">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip key={option.value} selected={option.value === value} onClick={() => onChange(option.value)}>{option.label}</FilterChip>
        ))}
      </div>
    </div>
  );
}
