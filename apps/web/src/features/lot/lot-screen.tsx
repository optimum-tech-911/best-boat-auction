import Link from "next/link";
import { ChevronRight, FileText, Landmark, Lock, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import type { LotDetail, SpecGroup } from "@bba/contracts";
import {
  formatDateShort,
  formatDay,
  formatLength,
  formatNumber,
  formatPercent,
  formatSaleName,
  formatTimeRange,
  href,
  interpolate,
  plural,
  type Locale,
  type Messages,
} from "@bba/i18n";
import { buttonClasses, ButtonContent, cx, Icon } from "@bba/ui";
import { LotCard } from "@/components/auction/lot-card";
import { LotGallery } from "@/components/auction/lot-gallery";
import { auctionMessages } from "@/components/auction/messages";
import { SoftCloseFigure } from "@/components/auction/soft-close-figure";
import { AreaMap } from "@/components/map/area-map";
import { SpecList, type SpecRow } from "@/components/auction/spec-list";
import { BidPanel } from "@/features/bidding/bid-panel";
import { bidMessages } from "@/features/bidding/bid-messages";
import { MobileBidBar } from "@/features/bidding/mobile-bid-bar";
import { getRequestContext } from "@/lib/backend";
import { LotActions } from "./lot-actions";
import { ExpertiseActions } from "@/features/expertise/boat-assistance";
import { SectionNav } from "@/components/layout/section-nav";
import { serviceTopics } from "@/features/services/services-screen";
import { AskQuestion } from "./ask-question";
import { ViewingForm } from "./viewing-form";

const serviceIcons: Readonly<Record<(typeof serviceTopics)[number], LucideIcon>> = { finance: Landmark, insurance: ShieldCheck, services: Wrench };

/** LOT: the lot page, with the bid panel sticky beside the content from 1024 px (blueprints LOT and BID). */
export async function LotScreen({ locale, messages, lot }: { locale: Locale; messages: Messages; lot: LotDetail }) {
  const { backend, now } = await getRequestContext();
  const [history, similar] = await Promise.all([
    backend.catalogue.getBidHistory(lot.id),
    backend.catalogue.getSimilarLots(lot.id, 4),
  ]);
  const copy = messages.lotPage;
  const country = messages.countries[lot.location.country];
  const closed = lot.state.phase === "closed";
  const bids = bidMessages(messages);
  const card = auctionMessages(messages);
  const engine = lot.engines;
  const engineText = !engine ? copy.facts.none : interpolate(engine.count > 1 ? copy.facts.enginePower : copy.facts.engineSingle, { count: engine.count, power: engine.powerHp });
  const sections = (["presentation", "specifications", "viewing", "questions", "location", "documents", "conditions"] as const).map((id) => ({ id, label: copy.sections[id] }));

  const facts: [string, string][] = [
    [copy.facts.year, String(lot.yearBuilt)],
    [copy.facts.length, formatLength(lot.lengthCm, locale)],
    [copy.facts.beam, formatLength(lot.beamCm, locale)],
    [copy.facts.draft, formatLength(lot.draftCm, locale)],
    [copy.facts.engine, engineText],
    [copy.facts.berths, lot.berths ? String(lot.berths) : "—"],
  ];

  const general: SpecRow[] = [
    { label: copy.specs.type, value: messages.categories.singular[lot.type] },
    { label: copy.specs.year, value: lot.yearBuilt },
    { label: copy.specs.length, value: formatLength(lot.lengthCm, locale) },
    { label: copy.specs.beam, value: formatLength(lot.beamCm, locale) },
    { label: copy.specs.draft, value: formatLength(lot.draftCm, locale) },
    { label: copy.specs.hull, value: copy.hulls[lot.hull] },
    { label: copy.specs.berths, value: lot.berths || "—" },
    { label: copy.specs.storage, value: copy.storages[lot.storage] },
    { label: copy.specs.trailer, value: lot.trailerIncluded ? messages.common.yes : messages.common.no },
  ];
  const engineRows: SpecRow[] = engine ? [
    { label: copy.specs.engines, value: engine.count },
    { label: copy.specs.make, value: engine.make },
    { label: copy.specs.power, value: `${engine.powerHp} ${locale === "fr" ? "ch" : "hp"}` },
    { label: copy.specs.hours, value: <span className="numerals">{formatNumber(engine.hours, locale)} h</span> },
    { label: copy.specs.fuel, value: messages.catalogue.fuels[engine.fuel] },
    { label: copy.specs.drive, value: copy.drives[engine.drive] },
  ] : [];
  const items = (group: SpecGroup) => (lot.equipment[group] ?? []).map((item) => item[locale]);
  const groups: { group: SpecGroup; rows?: SpecRow[] }[] = [
    { group: "general", rows: general },
    { group: "engine", rows: engineRows },
    { group: "navigation" },
    ...(lot.type === "sailboat" || lot.type === "catamaran" ? [{ group: "rigging" as const }] : []),
    { group: "comfort" },
    { group: "deck" },
  ];

  return (
    <>
      <div className="page-container pb-24 pt-8 lg:pt-12">
        <nav aria-label={messages.a11y.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-2 type-body-s text-stone-600">
            <li><Link href={href(locale, "home")} className="hover:text-navy-900 hover:underline underline-offset-3">{messages.catalogue.home}</Link></li>
            <li aria-hidden="true"><Icon icon={ChevronRight} size="s" /></li>
            <li><Link href={href(locale, closed ? "results" : "auctions")} className="hover:text-navy-900 hover:underline underline-offset-3">{closed ? messages.catalogue.resultsTitle : messages.nav.auctions}</Link></li>
            <li aria-hidden="true"><Icon icon={ChevronRight} size="s" /></li>
            <li><Link href={href(locale, closed ? "results" : "auctions", {}, { type: lot.type })} className="hover:text-navy-900 hover:underline underline-offset-3">{messages.categories.plural[lot.type]}</Link></li>
            <li aria-hidden="true"><Icon icon={ChevronRight} size="s" /></li>
            <li aria-current="page" className="text-navy-900">{interpolate(messages.lot.lotNumber, { number: lot.number })}</li>
          </ol>
        </nav>

        <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="type-eyebrow text-stone-600">{interpolate(copy.eyebrow, { number: lot.number, sale: formatSaleName(lot.state.scheduledEndsAt, locale) })}</p>
            <h1 className="mt-3 type-display-m text-navy-900">{lot.title}</h1>
            <p className="mt-3 type-body-l text-stone-600">
              {interpolate(copy.summary, { type: messages.categories.singular[lot.type], year: lot.yearBuilt, length: formatLength(lot.lengthCm, locale), city: lot.location.city, country })}
            </p>
          </div>
          <LotActions lotId={lot.id} title={lot.title} watchers={lot.watchers} locale={locale} labels={messages.lot} />
        </header>

        <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-8">
            <p className="mb-3 type-caption text-stone-600">{messages.demo.caption}</p>
            <div className="mb-4"><ExpertiseActions lotId={lot.id} title={lot.title} /></div>
            <LotGallery images={lot.gallery} title={lot.title} locale={locale} messages={copy.gallery} placeholder={messages.common.photoComing} />

            <div className="mt-8 lg:hidden">
              <BidPanel lot={lot} history={history} locale={locale} messages={bids} statusMessages={messages.status} />
            </div>

            <dl aria-label={copy.facts.label} className="mt-8 grid grid-cols-3 border-y border-stone-200 lg:grid-cols-6">
              {facts.map(([label, value], index) => (
                <div key={label} className={cx("flex flex-col justify-between gap-1 border-stone-200 px-3 py-4 sm:px-4", index % 3 !== 0 && "border-l", index === 3 && "lg:border-l", index >= 3 && "border-t lg:border-t-0")}>
                  <dt className="type-eyebrow text-stone-600">{label}</dt>
                  <dd className="type-title-m text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10"><SectionNav label={copy.sections.label} sections={sections} /></div>

            <div className="mt-10 flex flex-col gap-16">
              <section id="presentation" aria-labelledby="presentation-title" className="scroll-mt-32">
                <h2 id="presentation-title" className="type-display-s text-navy-900">{copy.sections.presentation}</h2>
                <p className="mt-4 max-w-measure type-body-l text-navy-900">{lot.description[locale]}</p>
                {lot.pointsOfAttention.length > 0 && (
                  <div className="mt-6 max-w-measure border-l-2 border-stone-300 pl-4">
                    <h3 className="type-title-m text-navy-900">{copy.attention}</h3>
                    <ul className="mt-2 list-disc pl-5 type-body-m text-stone-600">{lot.pointsOfAttention.map((point) => <li key={point.fr}>{point[locale]}</li>)}</ul>
                  </div>
                )}
              </section>

              <section id="specifications" aria-labelledby="specifications-title" className="scroll-mt-32">
                <h2 id="specifications-title" className="type-display-s text-navy-900">{copy.sections.specifications}</h2>
                <div className="mt-6 grid gap-x-8 gap-y-10 md:grid-cols-2">
                  {groups.map(({ group, rows }) => <SpecList key={group} title={copy.specGroups[group]} rows={rows} items={items(group)} />)}
                </div>
              </section>

              <section id="viewing" aria-labelledby="viewing-title" className="scroll-mt-32">
                <h2 id="viewing-title" className="type-display-s text-navy-900">{copy.sections.viewing}</h2>
                {lot.viewing && (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="on-dark rounded-md bg-navy-900 p-6 text-ivory-100">
                      <p className="type-eyebrow text-mist-300">{copy.viewing.title}</p>
                      <p className="mt-3 type-display-s">{formatDay(lot.viewing.startsAt, locale)}</p>
                      <p className="mt-1 type-title-m">{formatTimeRange(lot.viewing.startsAt, lot.viewing.endsAt, locale)}</p>
                      <p className="mt-1 type-body-m text-mist-300">{interpolate(copy.viewing.where, { city: lot.location.city, country })}</p>
                      <p className="mt-4 type-label text-ivory-100">{copy.viewing.arranged[lot.viewing.arrangedWith]}</p>
                      <p className="mt-1 type-body-s text-mist-300">{copy.viewing.text}</p>
                      {!closed && <a href="#questions" className="mt-4 inline-block type-body-s text-ivory-100 underline underline-offset-4">{copy.viewing.other}</a>}
                    </div>
                    {now < lot.viewing.endsAt
                      ? <ViewingForm lotId={lot.id} messages={copy.viewing} optional={messages.common.optional} />
                      : <p className="self-center type-body-m text-stone-600">{interpolate(copy.viewing.past, { date: formatDay(lot.viewing.startsAt, locale) })}</p>}
                  </div>
                )}
              </section>

              <section id="questions" aria-labelledby="questions-title" className="scroll-mt-32">
                <h2 id="questions-title" className="type-display-s text-navy-900">{copy.sections.questions}</h2>
                <p className="mt-2 type-body-m text-stone-600">{copy.questions.intro}</p>
                {lot.questions.length > 0 && (
                  <ul className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                    {lot.questions.map((entry) => (
                      <li key={entry.id} className="py-5">
                        <p className="type-caption numerals text-stone-600">{interpolate(copy.questions.asked, { alias: entry.askedBy, date: formatDateShort(entry.askedAt, locale) })}</p>
                        <p className="mt-1 type-title-m text-navy-900">{entry.question[locale]}</p>
                        <div className="mt-3 border-l-2 border-teal-700 pl-4">
                          <p className="type-caption numerals text-stone-600">{interpolate(copy.questions.answered, { date: formatDateShort(entry.answeredAt, locale) })}</p>
                          <p className="mt-1 type-body-m text-navy-900">{entry.answer[locale]}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 max-w-form">
                  {closed ? <p className="type-body-m text-stone-600">{copy.questions.closed}</p> : <AskQuestion lotId={lot.id} messages={copy.questions} />}
                </div>
              </section>

              <section id="location" aria-labelledby="location-title" className="scroll-mt-32">
                <h2 id="location-title" className="type-display-s text-navy-900">{copy.sections.location}</h2>
                <p className="mt-4 type-title-m text-navy-900">{interpolate(copy.viewing.where, { city: lot.location.city, country })}</p>
                <div className="mt-4"><AreaMap center={lot.area} place={`${lot.location.city}, ${country}`} locale={locale} copy={messages.map} /></div>
                <p className="mt-3 max-w-measure type-body-s text-stone-600">{copy.location.note}</p>
              </section>

              <section id="documents" aria-labelledby="documents-title" className="scroll-mt-32">
                <h2 id="documents-title" className="type-display-s text-navy-900">{copy.sections.documents}</h2>
                <ul className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                  {lot.documents.map((document) => (
                    <li key={document.id} className="flex min-h-row-table items-center gap-4 py-3">
                      <Icon icon={document.visibility === "public" ? FileText : Lock} size="m" className="shrink-0 text-navy-900" />
                      <div className="min-w-0 flex-1">
                        <p className="type-body-m text-navy-900">{document.title[locale]}</p>
                        <p className="type-body-s text-stone-600">
                          {plural(locale, copy.documents.pages, document.pages)}
                          {document.visibility === "registered_bidders" && ` · ${copy.documents.restricted}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 type-caption text-stone-600">{copy.documents.demo}</p>
              </section>

              <section id="conditions" aria-labelledby="conditions-title" className="scroll-mt-32">
                <h2 id="conditions-title" className="type-display-s text-navy-900">{copy.sections.conditions}</h2>
                <dl className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                  {([
                    [copy.conditions.premium, interpolate(copy.conditions.premiumValue, { rate: formatPercent(lot.conditions.premiumRate, locale), vat: formatPercent(lot.conditions.vatOnPremium, locale) })],
                    [copy.conditions.vat, lot.conditions.vatOnHammer ? formatPercent(lot.conditions.vatOnHammer, locale) : copy.conditions.vatNone],
                    [copy.conditions.mode, lot.conditions.mode === "regulated" ? copy.conditions.regulated : interpolate(copy.conditions.brokerage, { hours: lot.conditions.sellerDecisionHours })],
                    [copy.conditions.payment, interpolate(copy.conditions.paymentValue, { days: lot.conditions.paymentDays })],
                    [copy.conditions.collection, interpolate(copy.conditions.collectionValue, { days: lot.conditions.collectionDays })],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-4 md:grid-cols-5 md:gap-4">
                      <dt className="type-body-s text-stone-600 md:col-span-2">{label}</dt>
                      <dd className="type-body-m text-navy-900 md:col-span-3">{value}</dd>
                    </div>
                  ))}
                </dl>
                <h3 className="mt-8 type-title-m text-navy-900">{copy.conditions.softClose}</h3>
                <div className="mt-4 max-w-dialog-md">
                  <SoftCloseFigure
                    closesAt={lot.state.scheduledEndsAt}
                    locale={locale}
                    messages={messages.diagrams.softClose}
                    windowMinutes={lot.conditions.softCloseWindowMinutes}
                    extensionMinutes={lot.conditions.extensionMinutes}
                  />
                </div>
              </section>

              <section aria-labelledby="around-title" className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
                <h2 id="around-title" className="type-title-l text-navy-900">{copy.services.title}</h2>
                <p className="mt-1 type-body-m text-stone-600">{copy.services.intro}</p>
                <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                  {serviceTopics.map((topic) => (
                    <li key={topic}>
                      <a href={`${href(locale, "services", {}, { topic, lot: String(lot.number) })}#demande`} className="group flex h-full flex-col gap-2 rounded-sm border border-stone-200 p-4 hover:border-navy-900">
                        <Icon icon={serviceIcons[topic]} size="m" className="text-navy-900" />
                        <span className="type-title-m text-navy-900">{messages.services.items[topic].title}</span>
                        <span className={buttonClasses({ variant: "link", className: "mt-auto self-start" })}><ButtonContent arrow>{copy.services.action}</ButtonContent></span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24">
              <BidPanel lot={lot} history={history} locale={locale} messages={bids} statusMessages={messages.status} />
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar-title" className="mt-24">
            <h2 id="similar-title" className="type-display-s text-navy-900">{copy.similar}</h2>
            <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
              {similar.map((item) => (
                <li key={item.id}><LotCard lot={item} locale={locale} messages={card} sizes="(max-width: 639px) 100vw, (max-width: 1279px) 45vw, 280px" /></li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <MobileBidBar lot={lot} history={history} locale={locale} messages={bids} statusMessages={messages.status} />
    </>
  );
}
