import Link from "next/link";
import Image from "next/image";
import type { ActivityEntry, LotSummary, MarketStats, SaleSummary } from "@bba/contracts";
import { formatMoney, formatSaleName, href, interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, LiveDot, SectionHeader } from "@bba/ui";
import { MarketRoom } from "./market-room";

interface MarketSectionProps {
  locale: Locale;
  messages: Messages;
  sale: SaleSummary;
  lots: readonly LotSummary[];
  stats: MarketStats;
  activity: ActivityEntry[];
  previousSale: SaleSummary | null;
  results: readonly LotSummary[];
}

/**
 * H7 "La salle des ventes": the live sale on a dark floor. Four live figures, the closing board in
 * closing order and the bid feed, then the previous sale's result in one line.
 */
export function MarketSection({ locale, messages, sale, lots, stats, activity, previousSale, results }: MarketSectionProps) {
  const copy = messages.home.market;
  const sold = results.filter((lot) => lot.state.outcome === "sold");
  const volume = sold.reduce((total, lot) => total + (lot.state.priceCents ?? 0), 0);
  return (
    <section aria-labelledby="market-title" className="content-auto on-dark bg-navy-950 text-ivory-100">
      <div className="page-container py-16 lg:py-24">
        <SectionHeader
          reveal
          tone="inverse"
          titleId="market-title"
          eyebrow={<span className="inline-flex items-center gap-2 text-ivory-100"><LiveDot />{copy.eyebrow}</span>}
          title={copy.title}
          intro={interpolate(copy.intro, { sale: formatSaleName(sale.closingStartsAt, locale, { inSentence: true }) })}
        />
        <MarketRoom
          locale={locale}
          lots={lots}
          initialActivity={activity}
          countries={stats.bidderCountries}
          messages={copy}
          countryNames={messages.countries}
          lotNumber={messages.lot.lotNumber}
        />

        {previousSale && results.length > 0 && (
          <div className="mt-12 flex flex-col gap-4 border-t border-ivory-100/16 pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex shrink-0" aria-hidden="true">
                {sold.slice(0, 4).map((lot, index) => (
                  <span key={lot.id} className={`relative h-thumb-xs-h w-thumb-xs-w overflow-hidden rounded-xs border-2 border-navy-950 bg-navy-900 ${index > 0 ? "-ml-4" : ""}`}>
                    {lot.cover && <Image src={lot.cover.src} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: lot.cover.focalPoint }} />}
                  </span>
                ))}
              </span>
              <p className="type-body-m numerals text-ivory-100">
                {plural(locale, copy.results, sold.length, { sale: formatSaleName(previousSale.closingStartsAt, locale), sold: sold.length, total: results.length, volume: formatMoney(volume, locale) })}
              </p>
            </div>
            <Link href={href(locale, "results")} className={buttonClasses({ variant: "secondary-inverse", className: "shrink-0 self-start md:self-auto" })}>
              <ButtonContent arrow>{copy.allResults}</ButtonContent>
            </Link>
          </div>
        )}
        <p className="mt-6 type-caption text-mist-300">{messages.demo.caption}</p>
      </div>
    </section>
  );
}
