"use client";

import { Check } from "lucide-react";
import { boatTypes, countryCodes, type BoatStorage, type Fuel } from "@bba/contracts";
import { boatConditions, defaultListingRules, defaultSellerOffer, listingSteps, type ListingPackId, type ListingStep } from "@bba/domain";
import { formatLength, formatMoney, interpolate, plural } from "@bba/i18n";
import { Button, Checkbox, cx, Field, Icon, MoneyInput, Select, TextArea, TextInput } from "@bba/ui";
import { LocationPicker } from "@/components/map/location-picker";
import { ruleParams } from "@/lib/rule-params";
import { ChoiceTiles } from "./choice-tiles";
import { parseDecimal, type DraftPhoto } from "./listing-draft";
import { ListingPhotos } from "./listing-photos";
import type { ListingSale, StepProps } from "./listing-types";

const storages: readonly BoatStorage[] = ["afloat", "ashore", "indoors"];
const fuels: readonly Fuel[] = ["diesel", "petrol", "electric"];

/** Step 1: what the boat is. */
export function BoatStep({ messages, draft, update, errorFor }: StepProps) {
  const copy = messages.listing.boat;
  const rules = defaultListingRules;
  const typed = draft.description.trim().length;
  return (
    <div className="flex flex-col gap-6">
      <ChoiceTiles
        legend={copy.type}
        columns="grid-cols-2 sm:grid-cols-3"
        options={boatTypes.map((type) => ({ value: type, label: messages.types[type] }))}
        value={draft.boatType}
        onChange={(boatType) => update({ boatType })}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={copy.make} error={errorFor("make")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} value={draft.make} onChange={(event) => update({ make: event.target.value })} />}
        </Field>
        <Field label={copy.model} error={errorFor("model")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} value={draft.model} onChange={(event) => update({ model: event.target.value })} />}
        </Field>
        <Field label={copy.year} error={errorFor("yearBuilt")}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              inputMode="numeric"
              maxLength={4}
              className="numerals"
              value={draft.yearBuilt === null ? "" : String(draft.yearBuilt)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                update({ yearBuilt: digits ? Number.parseInt(digits, 10) : null });
              }}
            />
          )}
        </Field>
        <Field label={copy.length} error={errorFor("lengthMetres")}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} aria-describedby={describedBy} invalid={invalid} inputMode="decimal" className="numerals" value={draft.length} onChange={(event) => update({ length: event.target.value.replace(/[^\d.,]/g, "") })} />
          )}
        </Field>
      </div>
      <ChoiceTiles
        legend={copy.condition}
        columns="grid-cols-2 sm:grid-cols-4"
        options={boatConditions.map((condition) => ({ value: condition, label: messages.conditions[condition] }))}
        value={draft.condition}
        onChange={(condition) => update({ condition })}
      />
      <fieldset className="grid gap-6 sm:grid-cols-3">
        <legend className="mb-2 type-title-m text-navy-900">{copy.engine}</legend>
        <Field label={copy.fuel}>
          {({ id }) => (
            <Select id={id} value={draft.fuel} onChange={(event) => update({ fuel: event.target.value as Fuel | "none" })}>
              {fuels.map((fuel) => <option key={fuel} value={fuel}>{messages.fuels[fuel]}</option>)}
              <option value="none">{copy.noEngine}</option>
            </Select>
          )}
        </Field>
        {draft.fuel !== "none" && (
          <>
            <Field label={copy.power} optional={messages.common.optional}>
              {({ id }) => <TextInput id={id} inputMode="numeric" className="numerals" value={draft.powerHp} onChange={(event) => update({ powerHp: event.target.value.replace(/\D/g, "") })} />}
            </Field>
            <Field label={copy.hours} optional={messages.common.optional}>
              {({ id }) => <TextInput id={id} inputMode="numeric" className="numerals" value={draft.hours} onChange={(event) => update({ hours: event.target.value.replace(/\D/g, "") })} />}
            </Field>
          </>
        )}
      </fieldset>
      <Field
        label={copy.description}
        value={interpolate(copy.characters, { count: typed, min: rules.descriptionMinLength })}
        hint={interpolate(copy.descriptionHint, { min: rules.descriptionMinLength })}
        error={errorFor("description")}
      >
        {({ id, describedBy, invalid }) => <TextArea id={id} aria-describedby={describedBy} invalid={invalid} rows={6} value={draft.description} onChange={(event) => update({ description: event.target.value })} />}
      </Field>
    </div>
  );
}

/** Step 2: where the boat is, on the map, and how it is kept. */
export function LocationStep({ locale, messages, draft, update, errorFor }: StepProps) {
  const copy = messages.listing.location;
  return (
    <div className="flex flex-col gap-6">
      <p className="type-body-m text-stone-600">{copy.intro}</p>
      <LocationPicker value={draft.place} onChange={(place) => update({ place })} locale={locale} copy={copy} mapCopy={messages.map} error={errorFor("location")} />
      <ChoiceTiles
        legend={copy.storage}
        columns="grid-cols-3"
        options={storages.map((storage) => ({ value: storage, label: messages.storages[storage] }))}
        value={draft.storage}
        onChange={(storage) => update({ storage })}
      />
      <Checkbox checked={draft.trailerIncluded} onChange={(event) => update({ trailerIncluded: event.target.checked })}>{copy.trailer}</Checkbox>
      <p className="type-caption text-stone-600">{interpolate(copy.countries, { countries: countryCodes.map((code) => messages.countries[code]).join(", ") })}</p>
    </div>
  );
}

interface PresentationStepProps extends StepProps {
  photos: readonly DraftPhoto[];
  required: number;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onCoverPhoto: (id: string) => void;
}

/** Step 3: the pack, then the seller's photos (optional when the pack includes the photo shoot). */
export function PresentationStep({ locale, messages, draft, update, errorFor, photos, required, onAddPhotos, onRemovePhoto, onCoverPhoto }: PresentationStepProps) {
  const copy = messages.listing.presentation;
  const packs = messages.packs;
  return (
    <div className="flex flex-col gap-10">
      <fieldset>
        <legend className="type-title-m text-navy-900">{copy.pack}</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {defaultSellerOffer.packs.map((pack) => {
            const selected = draft.pack === pack.id;
            return (
              <label
                key={pack.id}
                className={cx(
                  "relative flex cursor-pointer flex-col rounded-md border p-4 transition-colors duration-fast",
                  selected ? "border-navy-900 bg-navy-900 text-ivory-100" : "border-stone-300 bg-white text-navy-900 hover:border-navy-900",
                )}
              >
                <input type="radio" name="listing-pack" value={pack.id} checked={selected} onChange={() => update({ pack: pack.id as ListingPackId })} className="peer sr-only" />
                <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-md peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-teal-700" />
                <span className="flex items-center justify-between gap-2 type-title-m">
                  {packs.names[pack.id]}
                  {selected && <Icon icon={Check} size="s" />}
                </span>
                <span className="mt-1 flex items-baseline gap-1">
                  <span className="type-num-m">{pack.priceCents === 0 ? packs.free : formatMoney(pack.priceCents, locale)}</span>
                  {pack.priceCents > 0 && <span className={cx("type-caption", selected ? "text-mist-300" : "text-stone-600")}>{packs.ttc}</span>}
                </span>
                <span className={cx("mt-3 border-t pt-3 type-caption", selected ? "border-navy-700 text-mist-300" : "border-stone-200 text-stone-600")}>
                  {[pack.extends ? interpolate(packs.includes, { pack: packs.names[pack.extends] }) : null, ...pack.adds.slice(0, pack.extends ? 2 : 3).map((feature) => packs.features[feature])].filter(Boolean).join(" · ")}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <ListingPhotos
        locale={locale}
        copy={copy}
        photos={photos}
        required={required}
        packName={packs.names[draft.pack]}
        onAdd={onAddPhotos}
        onRemove={onRemovePhoto}
        onCover={onCoverPhoto}
        error={errorFor("photos")}
      />
    </div>
  );
}

/** Step 4: starting and reserve prices, and what the sale means for the seller. */
export function PriceStep({ locale, messages, draft, update, errorFor, sale }: StepProps & { sale: ListingSale | null }) {
  const copy = messages.listing.price;
  const params = ruleParams(locale);
  return (
    <div className="flex flex-col gap-6">
      {draft.estimateCents !== null && draft.estimateCents > 0 && (
        <p className="rounded-sm bg-stone-100 px-4 py-3 type-body-s text-navy-900">{interpolate(copy.estimate, { value: formatMoney(draft.estimateCents, locale) })}</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={copy.start} hint={interpolate(copy.startHint, { min: formatMoney(defaultListingRules.minimumStartCents, locale) })} error={errorFor("startCents")}>
          {({ id, describedBy, invalid }) => <MoneyInput id={id} aria-describedby={describedBy} invalid={invalid} locale={locale} value={draft.startCents} onValueChange={(startCents) => update({ startCents })} />}
        </Field>
        <Field label={copy.reserve} optional={messages.common.optional} hint={interpolate(copy.reserveHint, params)} error={errorFor("reserveCents")}>
          {({ id, describedBy, invalid }) => <MoneyInput id={id} aria-describedby={describedBy} invalid={invalid} locale={locale} value={draft.reserveCents} onValueChange={(reserveCents) => update({ reserveCents })} />}
        </Field>
      </div>
      <ul className="on-dark flex flex-col gap-3 rounded-md bg-navy-900 p-6 text-ivory-100">
        {[copy.youReceive, interpolate(copy.buyerPays, params), sale ? interpolate(copy.sale, { ...sale }) : null].filter(Boolean).map((line) => (
          <li key={line} className="flex gap-3 type-body-m">
            <Icon icon={Check} size="m" className="mt-1 shrink-0 text-mist-300" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ContactStepProps extends StepProps {
  photoCount: number;
  onEdit: (step: ListingStep) => void;
}

/** Step 5: who sends the listing, a recap of every step, and consent. */
export function ContactStep({ locale, messages, draft, update, errorFor, photoCount, onEdit }: ContactStepProps) {
  const copy = messages.listing.contact;
  const steps = messages.listing.steps;
  const length = parseDecimal(draft.length);
  const recap: Record<ListingStep, string> = {
    boat: [messages.types[draft.boatType], [draft.make, draft.model].filter(Boolean).join(" "), draft.yearBuilt, length === null ? null : formatLength(Math.round(length * 100), locale)].filter(Boolean).join(" · "),
    location: [draft.place ? [draft.place.label, draft.place.countryName].filter(Boolean).join(", ") : null, messages.storages[draft.storage]].filter(Boolean).join(" · "),
    presentation: `${messages.packs.names[draft.pack]} · ${plural(locale, messages.listing.presentation.count, photoCount)}`,
    price: [
      draft.startCents === null ? null : `${messages.listing.price.start} ${formatMoney(draft.startCents, locale)}`,
      draft.reserveCents === null ? copy.noReserve : `${messages.listing.price.reserve} ${formatMoney(draft.reserveCents, locale)}`,
    ].filter(Boolean).join(" · "),
    contact: "",
  };

  return (
    <div className="flex flex-col gap-6">
      <ChoiceTiles
        legend={copy.role}
        columns="grid-cols-2"
        options={[{ value: "owner", label: copy.owner }, { value: "broker", label: copy.broker }]}
        value={draft.role}
        onChange={(role) => update({ role })}
      />
      {draft.role === "broker" && (
        <Field label={copy.agency} error={errorFor("agency")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="organization" value={draft.agency} onChange={(event) => update({ agency: event.target.value })} />}
        </Field>
      )}
      <Field label={copy.name} error={errorFor("name")}>
        {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" value={draft.name} onChange={(event) => update({ name: event.target.value })} />}
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={copy.email} error={errorFor("email")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="email" value={draft.email} onChange={(event) => update({ email: event.target.value })} />}
        </Field>
        <Field label={copy.phone} hint={copy.phoneHint} error={errorFor("phone")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => update({ phone: event.target.value })} />}
        </Field>
      </div>

      <section aria-labelledby="listing-recap-title" className="rounded-md border border-stone-300 bg-stone-100 p-5">
        <h3 id="listing-recap-title" className="type-eyebrow text-stone-600">{copy.recap}</h3>
        <dl className="mt-3 divide-y divide-stone-200">
          {listingSteps.filter((step) => step !== "contact").map((step) => (
            <div key={step} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <dt className="type-label text-navy-900">{steps[step]}</dt>
                <dd className="mt-1 type-body-s numerals text-stone-600">{recap[step] || "—"}</dd>
              </div>
              <Button variant="link" onClick={() => onEdit(step)}>{copy.edit}<span className="sr-only"> · {steps[step]}</span></Button>
            </div>
          ))}
        </dl>
      </section>

      <div>
        <Checkbox checked={draft.consent} onChange={(event) => update({ consent: event.target.checked })} aria-invalid={Boolean(errorFor("consent")) || undefined}>{copy.consent}</Checkbox>
        {errorFor("consent") && <p className="mt-hint type-body-s text-danger-700">{errorFor("consent")}</p>}
      </div>
    </div>
  );
}
