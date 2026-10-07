import { SellDiscoveryLink } from "@/features/seller/seller-discovery";
import type { SaleSummary } from "@bba/contracts";
import { href, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, cx, Reveal, SaleJourneyDiagram, SectionHeader } from "@bba/ui";
import { saleDates } from "@/features/calendar/sale-dates";

/** H8: the next three sales, the coming one marked by a 2 px navy rule, each with SC-01 mini. */
export function CalendarSection({ locale, messages, sales }: { locale: Locale; messages: Messages; sales: readonly SaleSummary[] }) {
  const copy = messages.home.calendar;
  const nextIndex = Math.max(0, sales.findIndex((sale) => sale.phase !== "closed"));
  return (
    <section aria-labelledby="calendar-title" className="content-auto page-container py-16 lg:py-24">
      <SectionHeader reveal titleId="calendar-title" eyebrow={copy.eyebrow} title={copy.title} />
      <ul className="mt-6 grid gap-8 md:grid-cols-3 lg:mt-10">
        {sales.map((sale, index) => {
          const dates = saleDates(sale, locale, messages.diagrams.journey);
          return (
            <li key={sale.id} className={cx("pt-6", index === nextIndex ? "border-t-2 border-navy-900" : "border-t border-stone-300")}>
              <p className={cx("type-eyebrow text-stone-600", index !== nextIndex && "invisible")} aria-hidden={index !== nextIndex || undefined}>{copy.next}</p>
              <h3 className="mt-2 type-display-s capitalize text-navy-900">{dates.month}</h3>
              <Reveal kind="diagram" className="mt-6">
                <SaleJourneyDiagram mini title={messages.diagrams.journey.title} steps={dates.mini} />
              </Reveal>
            </li>
          );
        })}
      </ul>
      <SellDiscoveryLink href={href(locale, "sell")} className={buttonClasses({ variant: "link", className: "mt-8" })}>
        <ButtonContent arrow>{copy.sell}</ButtonContent>
      </SellDiscoveryLink>
    </section>
  );
}
