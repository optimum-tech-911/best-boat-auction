"use client";

import Link from "next/link";
import { createContext, useContext, useId, useState, type ComponentProps, type ReactNode } from "react";
import { Users } from "lucide-react";
import { formatLength, formatMoney, formatNumber, plural, type Locale, type Messages } from "@bba/i18n";
import { sellerInterestExamples } from "@bba/sdk";
import { Button, buttonClasses, ButtonContent, Dialog, Field, Icon, TextInput } from "@bba/ui";
import { sellPrefillQuery } from "./estimate-input";

const DiscoveryContext = createContext<((destination: string) => void) | null>(null);

/** Shared seller entry: normal links remain useful without JS and for modified/new-tab clicks. */
export function SellDiscoveryLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const open = useContext(DiscoveryContext);
  if (!open) throw new Error("SellDiscoveryLink needs SellerDiscoveryProvider.");
  return <Link href={href} {...props} aria-haspopup="dialog" onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || props.target === "_blank") return;
    event.preventDefault();
    open(typeof href === "string" ? href : href.pathname ?? "/fr/vendre-mon-bateau");
  }} />;
}

/** Counts and price bands are demonstrative SDK fixtures, never live analytics or valuations. */
export function SellerDiscoveryProvider({ locale, messages, children }: { locale: Locale; messages: Pick<Messages, "assistance" | "categories" | "common">; children: ReactNode }) {
  const [destination, setDestination] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const listId = useId();
  const copy = messages.assistance.discovery;
  const example = sellerInterestExamples.find((item) => item.model.toLocaleLowerCase(locale) === model.trim().toLocaleLowerCase(locale));
  let continueHref = destination ?? "/fr/vendre-mon-bateau";
  if (example) {
    const target = new URL(continueHref, "https://local.invalid");
    Object.entries(sellPrefillQuery({ type: example.boatType, lengthMetres: example.lengthCm / 100, valueCents: example.referenceCents })).forEach(([key, value]) => target.searchParams.set(key, value));
    continueHref = `${target.pathname}${target.search}${target.hash}`;
  }

  return (
    <DiscoveryContext.Provider value={setDestination}>
      {children}
      <Dialog open={destination !== null} onClose={() => setDestination(null)} title={copy.title} closeLabel={messages.common.close} size="lg">
        <p className="max-w-measure type-body-m text-stone-600">{copy.intro}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <Field label={copy.model} hint={copy.hint}>
              {({ id, describedBy }) => <TextInput id={id} aria-describedby={describedBy} list={listId} placeholder={copy.placeholder} value={model} onChange={(event) => setModel(event.target.value)} autoFocus autoComplete="off" />}
            </Field>
            <datalist id={listId}>{sellerInterestExamples.map((item) => <option key={item.model} value={item.model} />)}</datalist>
            {example && <p className="mt-4 type-body-s text-stone-600">{messages.categories.singular[example.boatType]} · {example.yearBuilt} · {formatLength(example.lengthCm, locale)}</p>}
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" className="rounded-md border border-stone-200 bg-ivory-100 p-5">
            {example ? (
              <>
                <p className="flex items-center gap-2 type-eyebrow text-stone-600"><Icon icon={Users} size="s" />{copy.interested}</p>
                <p className="mt-3 type-num-xl text-navy-900">{formatNumber(example.buyerCount, locale)}</p>
                <p className="mt-1 type-body-s text-navy-900">{plural(locale, copy.buyers, example.buyerCount)}</p>
                <div className="mt-5 border-t border-stone-300 pt-5">
                  <p className="type-eyebrow text-stone-600">{copy.range}</p>
                  <p className="mt-2 type-num-m text-navy-900">{formatMoney(example.priceLowCents, locale)} – {formatMoney(example.priceHighCents, locale)}</p>
                  <p className="mt-2 type-body-s text-stone-600">{copy.rangeNote}</p>
                </div>
              </>
            ) : (
              <>
                <Icon icon={Users} size="l" className="text-navy-900" />
                <p className="mt-4 type-display-s text-navy-900">{copy.emptyTitle}</p>
                <p className="mt-3 type-body-s text-stone-600">{model.trim() ? copy.unmatched : copy.emptyText}</p>
              </>
            )}
          </div>
        </div>
        <p className="mt-6 border-t border-stone-200 pt-4 type-caption text-stone-600">{copy.demo}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {example ? <Link href={destination ?? continueHref} onClick={() => setDestination(null)} className={buttonClasses({ variant: "secondary" })}>{copy.skip}</Link> : <Button variant="secondary" onClick={() => setDestination(null)}>{messages.common.close}</Button>}
          <Link href={continueHref} onClick={() => setDestination(null)} className={buttonClasses({ variant: "primary" })}><ButtonContent arrow>{example ? copy.continue : copy.skip}</ButtonContent></Link>
        </div>
      </Dialog>
    </DiscoveryContext.Provider>
  );
}
