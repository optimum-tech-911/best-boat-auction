"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from "react";
import { boatTypes, countryCodes, type CatalogueFacets, type CatalogueFilters, type CountryCode, type Fuel } from "@bba/contracts";
import { formatNumber, type Locale, type Messages } from "@bba/i18n";
import { Checkbox, Flag, Icon, MoneyInput, TextInput } from "@bba/ui";
import { useCatalogueNavigation } from "./catalogue-navigation";

export interface FilterMessages {
  filters: Messages["catalogue"]["filters"];
  fuels: Messages["catalogue"]["fuels"];
  types: Messages["categories"]["plural"];
  countries: Messages["countries"];
}

const fuels: readonly Fuel[] = ["diesel", "petrol", "electric"];

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-stone-200 py-4">
      <summary className="bba-summary flex min-h-control-md cursor-pointer items-center justify-between type-title-m text-navy-900">
        {title}
        <Icon icon={ChevronDown} size="m" className="transition-transform duration-base group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}

/** Applies a typed value after a pause, so the address does not change on every keystroke. */
function useDebouncedCommit<T>(value: T, commit: (value: T) => void, delay = 600) {
  const first = useRef(true);
  const onCommit = useEffectEvent(commit);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(() => onCommit(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
}

function NumberRange({ label, min, max, scale, onChange, messages, decimal = false, maxOnly = false }: {
  label: string;
  /** A single maximum, for engine hours. */
  maxOnly?: boolean;
  min: number | undefined;
  max: number | undefined;
  scale: number;
  decimal?: boolean;
  onChange: (min: number | undefined, max: number | undefined) => void;
  messages: FilterMessages["filters"];
}) {
  const id = useId();
  const show = (value: number | undefined) => (value === undefined ? "" : String(value / scale));
  const [range, setRange] = useState({ min: show(min), max: show(max) });
  const parse = (text: string) => {
    const value = Number.parseFloat(text.replace(",", "."));
    return text.trim() && Number.isFinite(value) ? Math.round(value * scale) : undefined;
  };
  useDebouncedCommit(range, (value) => onChange(parse(value.min), parse(value.max)));
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className={maxOnly ? "grid" : "grid grid-cols-2 gap-3"}>
        {!maxOnly && <TextInput id={`${id}-min`} aria-label={`${label} · ${messages.min}`} inputMode={decimal ? "decimal" : "numeric"} placeholder={messages.min} value={range.min} onChange={(event) => setRange({ ...range, min: event.target.value })} />}
        <TextInput id={`${id}-max`} aria-label={`${label} · ${messages.max}`} inputMode={decimal ? "decimal" : "numeric"} placeholder={messages.max} value={range.max} onChange={(event) => setRange({ ...range, max: event.target.value })} />
      </div>
    </fieldset>
  );
}

function PriceRange({ locale, filters, label, onChange, messages }: {
  locale: Locale;
  filters: CatalogueFilters;
  /** "Prix actuel" for open lots, "Enchère finale" in the results. */
  label: string;
  onChange: (min: number | undefined, max: number | undefined) => void;
  messages: FilterMessages["filters"];
}) {
  const [range, setRange] = useState<{ min: number | null; max: number | null }>({ min: filters.priceMinCents ?? null, max: filters.priceMaxCents ?? null });
  useDebouncedCommit(range, (value) => onChange(value.min ?? undefined, value.max ?? undefined));
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="grid grid-cols-2 gap-3">
        <MoneyInput locale={locale} aria-label={`${label} · ${messages.min}`} placeholder={messages.min} value={range.min} onValueChange={(min) => setRange({ ...range, min })} />
        <MoneyInput locale={locale} aria-label={`${label} · ${messages.max}`} placeholder={messages.max} value={range.max} onValueChange={(max) => setRange({ ...range, max })} />
      </div>
    </fieldset>
  );
}

function toggle<T>(values: readonly T[] | undefined, value: T): T[] | undefined {
  const current = values ?? [];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return next.length ? next : undefined;
}

/**
 * The catalogue filters: collapsible groups with title-m headers and dividers, counts beside each
 * choice computed with every other filter applied. Every change updates the address.
 */
export function FilterPanel({ locale, facets, archive, messages }: { locale: Locale; facets: CatalogueFacets; archive: boolean; messages: FilterMessages }) {
  const { state, setFilters } = useCatalogueNavigation();
  const { filters } = state;
  const copy = messages.filters;
  const count = (value: number | undefined) => <span className="ml-auto type-num-s text-stone-600">{formatNumber(value ?? 0, locale)}</span>;
  const countries = countryCodes.filter((code) => (facets.countries[code] ?? 0) > 0 || filters.countries?.includes(code));

  return (
    <div className="border-t border-stone-200">
      <Group title={copy.type}>
        {boatTypes.map((type) => (
          <Checkbox key={type} checked={filters.types?.includes(type) ?? false} disabled={!facets.types[type] && !filters.types?.includes(type)} onChange={() => setFilters({ types: toggle(filters.types, type) })} className="w-full">
            <span className="flex w-full gap-3">{messages.types[type]}{count(facets.types[type])}</span>
          </Checkbox>
        ))}
      </Group>
      <Group title={archive ? copy.priceFinal : copy.price}>
        <PriceRange key={`${filters.priceMinCents}-${filters.priceMaxCents}`} locale={locale} filters={filters} label={archive ? copy.priceFinal : copy.price} messages={copy} onChange={(priceMinCents, priceMaxCents) => setFilters({ priceMinCents, priceMaxCents })} />
      </Group>
      <Group title={copy.length}>
        <NumberRange key={`${filters.lengthMinCm}-${filters.lengthMaxCm}`} label={copy.length} min={filters.lengthMinCm} max={filters.lengthMaxCm} scale={100} decimal messages={copy} onChange={(lengthMinCm, lengthMaxCm) => setFilters({ lengthMinCm, lengthMaxCm })} />
      </Group>
      <Group title={copy.year} defaultOpen={false}>
        <NumberRange key={`${filters.yearMin}-${filters.yearMax}`} label={copy.year} min={filters.yearMin} max={filters.yearMax} scale={1} messages={copy} onChange={(yearMin, yearMax) => setFilters({ yearMin, yearMax })} />
      </Group>
      <Group title={copy.country}>
        {countries.map((code: CountryCode) => (
          <Checkbox key={code} checked={filters.countries?.includes(code) ?? false} onChange={() => setFilters({ countries: toggle(filters.countries, code) })} className="w-full">
            <span className="flex w-full items-center gap-3"><Flag country={code} />{messages.countries[code]}{count(facets.countries[code])}</span>
          </Checkbox>
        ))}
      </Group>
      <Group title={copy.fuel} defaultOpen={false}>
        {fuels.map((fuel) => (
          <Checkbox key={fuel} checked={filters.fuels?.includes(fuel) ?? false} disabled={!facets.fuels[fuel] && !filters.fuels?.includes(fuel)} onChange={() => setFilters({ fuels: toggle(filters.fuels, fuel) })} className="w-full">
            <span className="flex w-full gap-3">{messages.fuels[fuel]}{count(facets.fuels[fuel])}</span>
          </Checkbox>
        ))}
      </Group>
      <Group title={copy.hours} defaultOpen={false}>
        <NumberRange key={String(filters.maxEngineHours)} label={copy.hours} min={undefined} max={filters.maxEngineHours} scale={1} maxOnly messages={copy} onChange={(_, maxEngineHours) => setFilters({ maxEngineHours })} />
      </Group>
      {!archive && (
        <Group title={copy.options}>
          <Checkbox checked={filters.noReserveOnly ?? false} onChange={(event) => setFilters({ noReserveOnly: event.target.checked || undefined })}>{copy.noReserve}</Checkbox>
          <Checkbox checked={filters.closingWithin24h ?? false} onChange={(event) => setFilters({ closingWithin24h: event.target.checked || undefined })}>{copy.soon}</Checkbox>
        </Group>
      )}
    </div>
  );
}
