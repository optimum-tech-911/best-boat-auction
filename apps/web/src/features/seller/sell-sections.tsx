import Link from "next/link";
import { Camera, Check, Rotate3d, ScanSearch, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { defaultSellerOffer, type OptionalServiceId } from "@bba/domain";
import { formatMoney, href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { editorialImages } from "@bba/sdk";
import { buttonClasses, ButtonContent, cx, Icon, Reveal, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@bba/ui";
import { LotPhoto } from "@/components/auction/lot-photo";
import { EstimateResults } from "./estimate-results";
import { EstimatorInputs } from "./estimator-inputs";
import { SellingCosts, WaitingPanel } from "./estimate-details";
import { MobileEstimateBar } from "./mobile-estimate-bar";
import { LeadButton } from "./sell-funnel";
import { estimatorIds } from "./sell-types";
import { ruleParams } from "@/lib/rule-params";

type SellMessages = Messages["sell"];

/** SELL hero: split on ivory, the promise and two actions on the left, the seller photograph at 4:5 on the right. */
export function SellHero({ locale, copy, photoComing }: { locale: Locale; copy: SellMessages; photoComing: string }) {
  return (
    <section aria-labelledby="sell-title" className="page-container grid gap-10 py-12 lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-16">
      <div className="lg:col-span-6">
        <p className="type-eyebrow text-stone-600">{copy.eyebrow}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-sm bg-success-50 px-3 py-1 type-label text-success-700">
          <Icon icon={Check} size="s" />
          {copy.free}
        </p>
        <h1 id="sell-title" className="mt-4 type-display-l text-balance text-navy-900">{copy.title}</h1>
        <p className="mt-6 max-w-intro type-body-l text-stone-600">{interpolate(copy.intro, ruleParams(locale))}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#estimation" className={buttonClasses({ variant: "primary", size: "lg" })}>
            <ButtonContent arrow size="lg">{copy.estimate}</ButtonContent>
          </a>
          <LeadButton intent="callback" variant="secondary" size="lg">{copy.callback}</LeadButton>
        </div>
      </div>
      <div className="relative aspect-3/2 overflow-hidden rounded-md lg:col-span-5 lg:col-start-8 lg:aspect-4/5">
        <LotPhoto image={editorialImages.seller} locale={locale} priority sizes="(max-width: 1023px) 100vw, 540px" placeholder={photoComing} />
      </div>
    </section>
  );
}

/**
 * The estimator (#estimation). From 1024 px the results panel spans both rows and stays 96 px from
 * the top while the inputs, then the waiting and selling-cost panels, scroll beside it; below
 * 1024 px the results follow the inputs.
 */
export function SellEstimator({ copy }: { copy: SellMessages }) {
  return (
    <section id="estimation" aria-labelledby="estimation-title" className="scroll-mt-24 bg-stone-100 py-16 lg:py-24">
      <div className="page-container">
        <SectionHeader reveal titleId="estimation-title" eyebrow={copy.estimator.eyebrow} title={copy.estimator.title} intro={copy.estimator.intro} />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div id={estimatorIds.inputs} className="lg:col-span-7 lg:row-start-1">
            <EstimatorInputs />
          </div>
          <div id={estimatorIds.results} className="scroll-mt-24 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <EstimateResults />
            </div>
          </div>
          <div className="flex flex-col gap-8 lg:col-span-7 lg:row-start-2">
            <WaitingPanel />
            <SellingCosts />
          </div>
        </div>
        <MobileEstimateBar />
      </div>
    </section>
  );
}

/** The seller's five steps, from the free listing to the completed sale. */
export function SellerSteps({ locale, copy }: { locale: Locale; copy: SellMessages }) {
  return (
    <section aria-labelledby="seller-steps-title" className="content-auto page-container py-16 lg:py-24">
      <SectionHeader reveal titleId="seller-steps-title" title={copy.steps.title} />
      <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        {copy.steps.items.map((step, index) => (
          <Reveal as="li" key={step.title} delay={index * 60} className="border-t border-stone-300 pt-6">
            <span className="type-num-l text-teal-700" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mt-4 type-title-l text-navy-900">{step.title}</h3>
            <p className="mt-2 type-body-m text-stone-600">{interpolate(step.text, ruleParams(locale))}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/**
 * C-17 comparison: auction, broker and classified ad, with the auction column first. Below 768 px
 * each option becomes a card, as three text columns do not fit side by side.
 */
export function SaleComparison({ locale, copy }: { locale: Locale; copy: SellMessages }) {
  const { columns, rows } = copy.compare;
  return (
    <section aria-labelledby="compare-title" className="content-auto page-container py-16 lg:py-24">
      <SectionHeader reveal titleId="compare-title" title={copy.compare.title} />
      <ul className="mt-8 flex flex-col gap-4 md:hidden">
        {columns.map((column, columnIndex) => (
          <li key={column} className={cx("rounded-md border p-6", columnIndex === 0 ? "border-navy-900 bg-white" : "border-stone-300")}>
            <h3 className="type-title-m text-navy-900">{column}</h3>
            <dl className="mt-4 flex flex-col gap-3">
              {rows.map((row) => (
                <div key={row.label}>
                  <dt className="type-body-s text-stone-600">{row.label}</dt>
                  <dd className="type-body-m text-navy-900">{interpolate(row.values[columnIndex] ?? "", ruleParams(locale))}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="mt-10 hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader><span className="sr-only">{copy.compare.title}</span></TableHeader>
              {columns.map((column, index) => <TableHeader key={column} className={cx(index === 0 && "text-navy-900")}>{column}</TableHeader>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <th scope="row" className="px-4 py-3 type-label text-navy-900">{row.label}</th>
                {row.values.map((value, index) => (
                  <TableCell key={columns[index]} className={cx(index === 0 ? "bg-stone-100" : "text-stone-600")}>{interpolate(value, ruleParams(locale))}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

const serviceIcons: Readonly<Record<OptionalServiceId, LucideIcon>> = { survey: ScanSearch, virtualTour: Rotate3d, cleaning: Sparkles, drone: Camera, transport: Truck };

/** The three listing packs (#packs): free Base, then Boost and Premium, each building on the previous one. */
export function SellPacks({ locale, copy }: { locale: Locale; copy: SellMessages }) {
  const packs = copy.packs;
  return (
    <section id="packs" aria-labelledby="packs-title" className="content-auto scroll-mt-24 page-container py-16 lg:py-24">
      <SectionHeader reveal titleId="packs-title" eyebrow={packs.eyebrow} title={packs.title} intro={packs.intro} />
      <ul className="mt-10 grid gap-6 lg:grid-cols-3">
        {defaultSellerOffer.packs.map((pack, index) => (
          <Reveal as="li" key={pack.id} delay={index * 60} className={cx("flex flex-col rounded-md border bg-white p-6 lg:p-8", pack.id === "boost" ? "border-navy-900" : "border-stone-300")}>
            <h3 className="type-title-l text-navy-900">{packs.names[pack.id]}</h3>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="type-num-xl text-navy-900">{pack.priceCents === 0 ? packs.free : formatMoney(pack.priceCents, locale)}</span>
              {pack.priceCents > 0 && <span className="type-body-s text-stone-600">{packs.ttc}</span>}
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-stone-200 pt-6">
              {pack.extends && (
                <li className="flex gap-3 type-body-m text-navy-900">
                  <Icon icon={Check} size="m" className="shrink-0 text-teal-700" />
                  <span className="type-title-m">{interpolate(packs.includes, { pack: packs.names[pack.extends] })}</span>
                </li>
              )}
              {pack.adds.map((feature) => (
                <li key={feature} className="flex gap-3 type-body-m text-navy-900">
                  <Icon icon={Check} size="m" className="shrink-0 text-teal-700" />
                  {packs.features[feature]}
                </li>
              ))}
            </ul>
            <Link href={href(locale, "sellListing", {}, { pack: pack.id })} className={buttonClasses({ variant: pack.id === "boost" ? "primary" : "secondary", fullWidth: true, className: "mt-8" })}>
              <ButtonContent>{interpolate(packs.choose, { pack: packs.names[pack.id] })}</ButtonContent>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/** Optional services, available with every pack: a starting price or "on quotation". */
export function SellServices({ locale, copy }: { locale: Locale; copy: SellMessages }) {
  const services = copy.services;
  return (
    <section aria-labelledby="optional-services-title" className="content-auto page-container pb-16 lg:pb-24">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <h2 id="optional-services-title" className="type-display-s text-navy-900">{services.title}</h2>
        <p className="type-body-m text-stone-600">{services.intro}</p>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {defaultSellerOffer.services.map((service) => (
          <li key={service.id} className="flex flex-col gap-3 rounded-md border border-stone-300 bg-white p-6">
            <Icon icon={serviceIcons[service.id]} size="l" className="text-navy-900" />
            <p className="type-title-m text-navy-900">{services.names[service.id]}</p>
            <p className="type-body-s numerals text-stone-600">{service.fromCents === null ? services.quote : interpolate(services.from, { price: formatMoney(service.fromCents, locale) })}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The broker teaser: partner brokers list their clients' boats and share the commission. */
export function SellBrokers({ locale, copy }: { locale: Locale; copy: SellMessages }) {
  return (
    <section aria-labelledby="sell-brokers-title" className="content-auto page-container pb-16 lg:pb-24">
      <div className="flex flex-col items-start gap-6 rounded-md border border-stone-300 bg-white p-6 md:flex-row md:items-center md:justify-between lg:p-8">
        <div>
          <h2 id="sell-brokers-title" className="type-title-l text-navy-900">{copy.brokers.title}</h2>
          <p className="mt-2 type-body-m text-stone-600">{copy.brokers.text}</p>
        </div>
        <Link href={href(locale, "brokers")} className={buttonClasses({ variant: "secondary", className: "shrink-0" })}>
          <ButtonContent arrow>{copy.brokers.action}</ButtonContent>
        </Link>
      </div>
    </section>
  );
}
