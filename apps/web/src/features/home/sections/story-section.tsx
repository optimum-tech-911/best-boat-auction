import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import type { LotDetail, SaleSummary } from "@bba/contracts";
import { buyerTotal, defaultAuctionRules } from "@bba/domain";
import { formatDay, formatMoney, formatTimeRange, href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { editorialImages } from "@bba/sdk";
import { buttonClasses, ButtonContent, EscrowDiagram, Icon, PriceBreakdownDiagram, Reveal, SectionHeader } from "@bba/ui";
import { demoHandoverCode, HandoverCode } from "@/components/auction/handover-code";
import { LotPhoto } from "@/components/auction/lot-photo";
import { SoftCloseFigure } from "@/components/auction/soft-close-figure";
import { EXAMPLE_HAMMER_CENTS, ruleParams } from "@/lib/rule-params";
import { StoryProgress, type StoryFact } from "./story-progress";

interface StorySectionProps {
  locale: Locale;
  messages: Messages;
  sale: SaleSummary;
  /** A lot of the sale, whose viewing illustrates the first step. */
  lot: LotDetail | null;
}

/**
 * H3 "Comment ça marche": four steps. From 1024 px a navy card stays beside the panels and shows
 * the active step's key figure; every figure comes from the house rules or the current sale.
 */
export function StorySection({ locale, messages, sale, lot }: StorySectionProps) {
  const copy = messages.home.story;
  const { escrow, price } = messages.diagrams;
  const params = { ...ruleParams(locale), date: formatDay(sale.viewingsUntil, locale, { weekday: false }) };
  const facts: StoryFact[] = copy.facts.map((fact) => ({ value: interpolate(fact.value, params), label: interpolate(fact.label, params) }));
  const panelIds = copy.labels.map((_, index) => `story-step-${index + 1}`);
  const example = buyerTotal({ hammerCents: EXAMPLE_HAMMER_CENTS, startCents: EXAMPLE_HAMMER_CENTS }, defaultAuctionRules);
  const money = (cents: number) => formatMoney(cents, locale);

  const visuals = [
    <div key="viewing" className="relative mt-8">
      <Reveal kind="image" className="relative aspect-3/2 overflow-hidden rounded-md">
        <LotPhoto image={editorialImages.viewing} locale={locale} sizes="(max-width: 1023px) 100vw, 720px" placeholder={messages.common.photoComing} />
      </Reveal>
      {lot?.viewing && (
        <Link
          href={`${href(locale, "lot", { lot: lot.slug })}#viewing`}
          className="relative -mt-12 ml-4 flex max-w-form flex-col gap-1 rounded-md border border-stone-300 bg-white p-5 shadow-pop transition-colors duration-fast hover:border-navy-900 sm:ml-6 sm:w-fit"
        >
          <span className="flex items-center gap-2 type-eyebrow text-teal-700"><Icon icon={CalendarCheck} size="s" />{copy.viewingCard}</span>
          <span className="type-title-m text-navy-900">{lot.title} · {lot.location.city}</span>
          <span className="type-body-m numerals text-navy-900">{formatDay(lot.viewing.startsAt, locale)} · {formatTimeRange(lot.viewing.startsAt, lot.viewing.endsAt, locale)}</span>
          <span className="type-body-s text-stone-600">{copy.viewingWith[lot.viewing.arrangedWith]}</span>
        </Link>
      )}
    </div>,
    <Reveal key="soft-close" kind="diagram" className="mt-8 rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <SoftCloseFigure closesAt={sale.closingStartsAt} locale={locale} messages={messages.diagrams.softClose} />
    </Reveal>,
    <Reveal key="escrow" kind="diagram" className="mt-8 flex flex-col gap-8 rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      <EscrowDiagram title={escrow.title} labels={escrow} caption={escrow.demo} />
      <div className="border-t border-stone-200 pt-6">
        <p className="mb-4 type-label text-navy-900">{interpolate(copy.example, { hammer: money(example.hammerCents) })}</p>
        <PriceBreakdownDiagram
          title={price.title}
          segments={[
            { label: price.bid, value: example.hammerCents, display: money(example.hammerCents) },
            { label: price.premium, value: example.premiumCents, display: money(example.premiumCents) },
            { label: price.vat, value: example.vatOnPremiumCents, display: money(example.vatOnPremiumCents) },
          ]}
          total={{ label: price.total, display: money(example.totalCents) }}
        />
      </div>
    </Reveal>,
    <div key="handover" className="mt-8">
      <HandoverCode code={demoHandoverCode} caption={copy.codeCaption} demoLabel={copy.codeDemo} />
    </div>,
  ];

  return (
    <section aria-labelledby="story-title" className="story bg-stone-100">
      <div className="page-container py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="story__aside">
              <SectionHeader reveal titleId="story-title" eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
              <StoryProgress label={copy.progress} stepLabel={copy.step} steps={copy.labels} facts={facts} panelIds={panelIds} />
            </div>
          </div>
          <ol className="lg:col-span-7">
            {copy.titles.map((title, index) => {
              const fact = facts[index];
              return (
                <li key={title} id={panelIds[index]} className="story__step border-t border-stone-300 py-12 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-12">
                  <Reveal className="w-full">
                    <p className="flex items-center gap-3 type-eyebrow text-teal-700" aria-hidden="true">
                      <span className="type-num-s">{String(index + 1).padStart(2, "0")}</span>
                      {copy.labels[index]}
                    </p>
                    <h3 tabIndex={-1} className="mt-4 type-display-m text-navy-900 focus:outline-none">
                      <span className="sr-only">{copy.labels[index]} · </span>{title}
                    </h3>
                    <p className="mt-4 max-w-measure type-body-l text-stone-600">{interpolate(copy.texts[index] ?? "", params)}</p>
                    {fact && (
                      <p className="mt-6 border-l-2 border-navy-900 pl-4 lg:hidden">
                        <span className="block whitespace-nowrap type-num-l text-navy-900">{fact.value}</span>
                        <span className="mt-1 block type-body-s text-stone-600">{fact.label}</span>
                      </p>
                    )}
                    {visuals[index]}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mt-10 grid lg:grid-cols-12 lg:gap-8">
          <Link href={href(locale, "howItWorks")} className={buttonClasses({ variant: "secondary", className: "justify-self-start lg:col-span-7 lg:col-start-6" })}>
            <ButtonContent arrow>{copy.link}</ButtonContent>
          </Link>
        </div>
      </div>
    </section>
  );
}
