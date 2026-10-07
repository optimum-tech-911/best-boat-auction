import Link from "next/link";
import type { SaleSummary } from "@bba/contracts";
import { formatDay, formatSaleName, formatTime, formatYear, href, interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, Reveal, SaleJourneyDiagram, SectionHeader, StatusLine, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type StatusTone } from "@bba/ui";
import { saleDates } from "./sale-dates";
import { ruleParams } from "@/lib/rule-params";

interface CalendarScreenProps {
  locale: Locale;
  messages: Messages;
  /** The last closed sale, then the coming ones in order. */
  sales: readonly SaleSummary[];
  now: number;
}

interface SaleRow {
  sale: SaleSummary;
  name: string;
  year: string;
  deadline: string;
  opens: string;
  closing: string;
  status: { tone: StatusTone; label: string };
  action: { label: string; href: string } | null;
}

/** CAL: the next sales as C-17 rows (cards under 768 px), with the coming one and its SC-01 mini first. */
export function CalendarScreen({ locale, messages, sales, now }: CalendarScreenProps) {
  const copy = messages.calendarPage;
  const short = { weekday: "short", month: "short" } as const;
  const rows: SaleRow[] = sales.map((sale) => ({
    sale,
    name: formatSaleName(sale.closingStartsAt, locale),
    year: formatYear(sale.closingStartsAt, locale),
    closing: interpolate(copy.closing, { date: formatDay(sale.closingStartsAt, locale, short), time: formatTime(sale.closingStartsAt, locale, { compact: true }) }),
    deadline: formatDay(sale.submissionDeadlineAt, locale, { weekday: false, month: "short" }),
    opens: interpolate(copy.closing, { date: formatDay(sale.opensAt, locale, short), time: formatTime(sale.opensAt, locale, { compact: true }) }),
    status: sale.phase === "closed"
      ? { tone: "sold", label: messages.status.saleFinished }
      : sale.phase === "upcoming"
        ? { tone: "waiting", label: messages.status.saleUpcoming }
        : { tone: "live", label: messages.status.saleLive },
    action: sale.phase === "closed"
      ? { label: copy.actions.results, href: href(locale, "results") }
      : sale.phase !== "upcoming"
        ? { label: copy.actions.lots, href: href(locale, "auctions") }
        : sale.submissionDeadlineAt > now
          ? { label: copy.actions.sell, href: href(locale, "sell") }
          : null,
  }));
  const next = rows.find((row) => row.sale.phase !== "closed");

  return (
    <>
      <header className="page-container pb-10 pt-12 lg:pb-12 lg:pt-20">
        <SectionHeader as="h1" eyebrow={copy.eyebrow} title={copy.title} intro={next && interpolate(copy.intro, { ...ruleParams(locale), time: formatTime(next.sale.closingStartsAt, locale, { compact: true }) })} />
      </header>

      {next && <NextSale locale={locale} messages={messages} row={next} />}

      <section aria-label={copy.title} className="page-container pb-16 lg:pb-24">
        <ul className="flex flex-col gap-4 md:hidden">
          {rows.map((row) => (
            <li key={row.sale.id} className="rounded-md border border-stone-300 bg-white p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="type-title-m text-navy-900">{row.name} <span className="type-body-s text-stone-600">{row.year}</span></h2>
                <StatusLine tone={row.status.tone}>{row.status.label}</StatusLine>
              </div>
              <dl className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
                <Fact term={copy.columns.deadline} value={row.deadline} />
                <Fact term={copy.columns.opens} value={row.opens} />
                <Fact term={copy.columns.closing} value={row.closing} />
              </dl>
              {row.action && (
                <Link href={row.action.href} className={buttonClasses({ variant: "link", className: "mt-2" })}>
                  <ButtonContent arrow>{row.action.label}</ButtonContent>
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{copy.columns.sale}</TableHeader>
                <TableHeader>{copy.columns.deadline}</TableHeader>
                <TableHeader>{copy.columns.opens}</TableHeader>
                <TableHeader>{copy.columns.closing}</TableHeader>
                <TableHeader>{copy.columns.state}</TableHeader>
                <TableHeader><span className="sr-only">{copy.columns.action}</span></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.sale.id}>
                  <th scope="row" className="px-4 py-3 text-left">
                    <span className="type-title-m text-navy-900">{row.name}</span>
                    <span className="ml-2 type-body-s text-stone-600">{row.year}</span>
                  </th>
                  <TableCell className="numerals">{row.deadline}</TableCell>
                  <TableCell className="numerals">{row.opens}</TableCell>
                  <TableCell className="numerals">{row.closing}</TableCell>
                  <TableCell><StatusLine tone={row.status.tone}>{row.status.label}</StatusLine></TableCell>
                  <TableCell className="text-right">
                    {row.action && (
                      <Link href={row.action.href} className={buttonClasses({ variant: "link" })}>
                        <ButtonContent arrow>{row.action.label}</ButtonContent>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}

/** One date of a sale on a phone: the label and the date on a single line. */
function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="type-body-s text-stone-600">{term}</dt>
      <dd className="whitespace-nowrap text-right type-body-m numerals text-navy-900">{value}</dd>
    </div>
  );
}

/** The coming sale: its name, state and lot count, SC-01 mini and its link, above a 2 px navy rule. */
function NextSale({ locale, messages, row }: { locale: Locale; messages: Messages; row: SaleRow }) {
  const copy = messages.calendarPage;
  const dates = saleDates(row.sale, locale, messages.diagrams.journey);
  return (
    <section aria-labelledby="next-sale-title" className="page-container pb-12 lg:pb-16">
      <div className="grid gap-8 border-t-2 border-navy-900 pt-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <p className="type-eyebrow text-stone-600">{row.sale.phase === "upcoming" ? copy.next : copy.current}</p>
          <h2 id="next-sale-title" className="mt-2 type-display-s text-navy-900">{row.name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <StatusLine tone={row.status.tone}>{row.status.label}</StatusLine>
            {row.sale.lotCount > 0 && <span className="type-body-s numerals text-stone-600">{plural(locale, copy.lots, row.sale.lotCount, { count: row.sale.lotCount })}</span>}
          </div>
          {row.action && (
            <Link href={row.action.href} className={buttonClasses({ variant: "primary", className: "mt-6" })}>
              <ButtonContent arrow>{row.action.label}</ButtonContent>
            </Link>
          )}
        </div>
        <Reveal kind="diagram" className="lg:col-span-8 lg:pt-8">
          <SaleJourneyDiagram mini title={messages.diagrams.journey.title} steps={dates.mini} />
        </Reveal>
      </div>
    </section>
  );
}
