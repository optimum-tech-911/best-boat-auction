"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { CatalogueFacets, CatalogueSort } from "@bba/contracts";
import { formatLength, formatMoney, interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { Button, FilterChip, Icon, SegmentedControl, Select } from "@bba/ui";
import { activeFilterCount, type CatalogueView } from "./catalogue-params";
import { useCatalogueNavigation } from "./catalogue-navigation";
import { FilterPanel, type FilterMessages } from "./filter-panel";

export interface ToolbarMessages extends FilterMessages {
  sort: Messages["catalogue"]["sort"];
  views: Messages["catalogue"]["views"];
  count: Messages["catalogue"]["count"];
  close: string;
}

const liveSorts: readonly CatalogueSort[] = ["closing", "price_asc", "price_desc", "newest_build", "length"];

/**
 * Above the results: the result count, the mobile "Filtres (3)" button that opens a full-height
 * sheet, the sort select and the view switch (grid or closing order).
 */
export function CatalogueToolbar({ locale, total, facets, archive, defaultView, messages }: {
  locale: Locale;
  total: number;
  facets: CatalogueFacets;
  archive: boolean;
  defaultView: CatalogueView;
  messages: ToolbarMessages;
}) {
  const { state, setState } = useCatalogueNavigation();
  const [sheet, setSheet] = useState(false);
  const sortId = useId();
  const active = activeFilterCount(state.filters);
  const view = state.view ?? defaultView;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={() => setSheet(true)} className="lg:hidden">
        {active ? interpolate(messages.filters.openCount, { count: active }) : messages.filters.open}
      </Button>
      <p className="type-body-s text-stone-600" aria-live="polite">{plural(locale, messages.count, total)}</p>
      <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <label htmlFor={sortId} className="whitespace-nowrap type-label text-navy-900">{messages.sort.label}</label>
          <Select id={sortId} compact value={state.sort ?? "closing"} onChange={(event) => setState({ sort: event.target.value === "closing" ? null : event.target.value as CatalogueSort })}>
            {liveSorts.map((sort) => <option key={sort} value={sort}>{sort === "closing" && archive ? messages.sort.recent : messages.sort[sort]}</option>)}
          </Select>
        </div>
        {!archive && (
          <SegmentedControl
            label={messages.views.label}
            value={view}
            onChange={(next) => setState({ view: next === defaultView ? null : next })}
            options={[{ value: "grid", label: messages.views.grid }, { value: "order", label: messages.views.order }]}
            className="border-b-0"
          />
        )}
      </div>
      {sheet && <FilterSheet locale={locale} total={total} facets={facets} archive={archive} messages={messages} onClose={() => setSheet(false)} />}
    </div>
  );
}

/** Under 1024 px the filters open in a full-height sheet with a sticky "Afficher 8 résultats" button. */
function FilterSheet({ locale, total, facets, archive, messages, onClose }: { locale: Locale; total: number; facets: CatalogueFacets; archive: boolean; messages: ToolbarMessages; onClose: () => void }) {
  const { clearFilters, state } = useCatalogueNavigation();
  const titleId = useId();
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="motion-sheet-in fixed inset-0 z-dialog flex flex-col bg-ivory-100 lg:hidden">
      <div className="flex h-header-mobile shrink-0 items-center justify-between border-b border-stone-300 px-5">
        <h2 id={titleId} className="type-title-l text-navy-900">{messages.filters.title}</h2>
        <button type="button" onClick={onClose} aria-label={messages.close} autoFocus className="grid size-control-md place-items-center rounded-sm text-navy-900">
          <Icon icon={X} size="l" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <FilterPanel locale={locale} facets={facets} archive={archive} messages={messages} />
      </div>
      <div className="flex shrink-0 gap-3 border-t border-stone-300 bg-ivory-100 px-5 py-3">
        {activeFilterCount(state.filters) > 0 && <Button variant="secondary" onClick={clearFilters}>{messages.filters.clearAll}</Button>}
        <Button variant="primary" fullWidth onClick={onClose}>{plural(locale, messages.filters.show, total)}</Button>
      </div>
    </div>
  );
}

/** The applied filters as removable chips, with "Tout effacer". */
export function ActiveFilters({ locale, messages }: { locale: Locale; messages: FilterMessages }) {
  const { state, setFilters, clearFilters } = useCatalogueNavigation();
  const { filters } = state;
  const copy = messages.filters;
  const range = (min: string | undefined, max: string | undefined) => (min && max ? `${min} – ${max}` : min ? `≥ ${min}` : `≤ ${max}`);
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.query ? [{ key: "q", label: interpolate(copy.search, { query: filters.query }), remove: () => setFilters({ query: undefined }) }] : []),
    ...(filters.types ?? []).map((type) => ({ key: `type-${type}`, label: messages.types[type], remove: () => setFilters({ types: filters.types?.filter((item) => item !== type) }) })),
    ...(filters.countries ?? []).map((code) => ({ key: `country-${code}`, label: messages.countries[code], remove: () => setFilters({ countries: filters.countries?.filter((item) => item !== code) }) })),
    ...(filters.fuels ?? []).map((fuel) => ({ key: `fuel-${fuel}`, label: messages.fuels[fuel], remove: () => setFilters({ fuels: filters.fuels?.filter((item) => item !== fuel) }) })),
    ...(filters.priceMinCents !== undefined || filters.priceMaxCents !== undefined ? [{
      key: "price",
      label: `${copy.price} ${range(filters.priceMinCents === undefined ? undefined : formatMoney(filters.priceMinCents, locale), filters.priceMaxCents === undefined ? undefined : formatMoney(filters.priceMaxCents, locale))}`,
      remove: () => setFilters({ priceMinCents: undefined, priceMaxCents: undefined }),
    }] : []),
    ...(filters.lengthMinCm !== undefined || filters.lengthMaxCm !== undefined ? [{
      key: "length",
      label: range(filters.lengthMinCm === undefined ? undefined : formatLength(filters.lengthMinCm, locale), filters.lengthMaxCm === undefined ? undefined : formatLength(filters.lengthMaxCm, locale)),
      remove: () => setFilters({ lengthMinCm: undefined, lengthMaxCm: undefined }),
    }] : []),
    ...(filters.yearMin !== undefined || filters.yearMax !== undefined ? [{
      key: "year",
      label: range(filters.yearMin?.toString(), filters.yearMax?.toString()),
      remove: () => setFilters({ yearMin: undefined, yearMax: undefined }),
    }] : []),
    ...(filters.maxEngineHours !== undefined ? [{ key: "hours", label: `≤ ${filters.maxEngineHours} h`, remove: () => setFilters({ maxEngineHours: undefined }) }] : []),
    ...(filters.noReserveOnly ? [{ key: "reserve", label: copy.noReserve, remove: () => setFilters({ noReserveOnly: undefined }) }] : []),
    ...(filters.closingWithin24h ? [{ key: "soon", label: copy.soon, remove: () => setFilters({ closingWithin24h: undefined }) }] : []),
  ];
  if (!chips.length) return null;
  return (
    <div role="group" aria-label={copy.active} className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => <FilterChip key={chip.key} removable removeLabel={interpolate(copy.remove, { label: chip.label })} onClick={chip.remove}>{chip.label}</FilterChip>)}
      <button type="button" onClick={clearFilters} className="ml-2 type-body-s text-teal-700 underline-offset-3 hover:underline">{copy.clearAll}</button>
    </div>
  );
}
