import Link from "next/link";
import { BarChart3, Gauge, Gavel, type LucideIcon } from "lucide-react";
import type { BrokerPortfolioEntry } from "@bba/contracts";
import { brokerCommission, brokerContributions, buyerTotal, defaultAuctionRules } from "@bba/domain";
import { formatDateShort, formatMoney, formatPercent, href, interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, cx, Icon, Reveal, SectionHeader, StatusLine, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@bba/ui";
import { ContactForm } from "@/features/engagement/contact-form";
import { EXAMPLE_HAMMER_CENTS } from "@/lib/rule-params";

const featureIcons: readonly LucideIcon[] = [Gauge, Gavel, BarChart3];
const rules = defaultAuctionRules;

interface BrokersScreenProps {
  locale: Locale;
  messages: Messages;
  portfolio: readonly BrokerPortfolioEntry[];
}

/** Partner brokers: their remuneration, the broker space and the partnership request. */
export function BrokersScreen({ locale, messages, portfolio }: BrokersScreenProps) {
  const copy = messages.brokers;
  const money = (cents: number) => formatMoney(cents, locale);
  const { premiumCents } = buyerTotal({ hammerCents: EXAMPLE_HAMMER_CENTS, startCents: EXAMPLE_HAMMER_CENTS }, rules);
  const rate = formatPercent(rules.brokerTerms.buyerIntroductionShare, locale);

  return (
    <>
      <header className="page-container pb-12 pt-12 lg:pb-16 lg:pt-20">
        <SectionHeader as="h1" eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#partenaire" className={buttonClasses({ variant: "primary", size: "lg" })}><ButtonContent arrow size="lg">{copy.apply}</ButtonContent></a>
          <a href="#espace" className={buttonClasses({ variant: "secondary", size: "lg" })}><ButtonContent size="lg">{copy.space}</ButtonContent></a>
        </div>
      </header>

      <section aria-labelledby="shares-title" className="page-container pb-16 lg:pb-24">
        <h2 id="shares-title" className="type-display-s text-navy-900">{copy.sharesTitle}</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {brokerContributions.map((contribution, index) => {
            const share = copy.shares[contribution];
            return (
              <Reveal as="li" key={contribution} delay={index * 60} className="flex flex-col rounded-md border border-stone-300 bg-white p-6 lg:p-8">
                <p className="type-title-m text-navy-900">{share.title}</p>
                <p className="mt-6 type-display-s text-navy-900">{interpolate(share.value, { rate })}</p>
                <p className="mt-1 type-body-m text-stone-600">{interpolate(share.detail, { rate })}</p>
              </Reveal>
            );
          })}
        </ul>
        <p className="mt-6 max-w-measure type-body-m numerals text-stone-600">
          {interpolate(copy.shareExample, {
            hammer: money(EXAMPLE_HAMMER_CENTS),
            premium: money(premiumCents),
            share: money(brokerCommission(premiumCents, "client", rules)),
          })}
        </p>
      </section>

      <section id="espace" aria-labelledby="space-title" className="on-dark scroll-mt-24 bg-navy-900 py-16 text-ivory-100 lg:py-24">
        <div className="page-container">
          <SectionHeader reveal tone="inverse" titleId="space-title" title={copy.spaceTitle} intro={copy.spaceIntro} />
          <ul className="mt-10 grid gap-px overflow-hidden rounded-md bg-ivory-100/16 md:grid-cols-3">
            {copy.features.map((feature, index) => (
              <li key={feature.title} className="flex flex-col gap-3 bg-navy-900 p-6">
                <Icon icon={featureIcons[index] ?? Gauge} size="l" className="text-ivory-100" />
                <p className="type-title-m">{feature.title}</p>
                <p className="type-body-s text-mist-300">{feature.text}</p>
              </li>
            ))}
          </ul>

          {portfolio.length > 0 && (
            <figure className="mt-12 rounded-md bg-white p-4 text-navy-900 sm:p-6">
              <p className="type-title-m">{copy.previewTitle}</p>
              <ul className="mt-4 divide-y divide-stone-200 border-y border-stone-200 md:hidden">
                {portfolio.map(({ lot, contribution }) => (
                  <li key={lot.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <Link href={href(locale, "lot", { lot: lot.slug })} className="type-title-m hover:underline underline-offset-4">{lot.title}</Link>
                      <p className="type-body-s numerals text-stone-600">{copy.contributions[contribution]} · {plural(locale, messages.lot.bidCount, lot.state.bidCount, { count: lot.state.bidCount })}</p>
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block type-caption text-stone-600">{copy.columns.price}</span>
                      <span className="type-num-m">{money(lot.state.priceCents ?? lot.startCents)}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 hidden md:block">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>{copy.columns.lot}</TableHeader>
                      <TableHeader>{copy.columns.contribution}</TableHeader>
                      <TableHeader numeric>{copy.columns.price}</TableHeader>
                      <TableHeader numeric>{copy.columns.bids}</TableHeader>
                      <TableHeader>{copy.columns.closing}</TableHeader>
                      <TableHeader>{copy.columns.status}</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio.map(({ lot, contribution }) => (
                      <TableRow key={lot.id}>
                        <TableCell>
                          <Link href={href(locale, "lot", { lot: lot.slug })} className="hover:underline underline-offset-4">
                            <span className="block type-title-m">{lot.title}</span>
                            <span className="block type-body-s text-stone-600">{interpolate(messages.lot.lotNumber, { number: lot.number })}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-stone-600">{copy.contributions[contribution]}</TableCell>
                        <TableCell numeric>{money(lot.state.priceCents ?? lot.startCents)}</TableCell>
                        <TableCell numeric>{lot.state.bidCount}</TableCell>
                        <TableCell className="numerals">{formatDateShort(lot.state.endsAt, locale)}</TableCell>
                        <TableCell>
                          <StatusLine tone={lot.state.phase === "closed" ? "sold" : "live"}>{lot.state.phase === "closed" ? copy.statuses.closed : copy.statuses.live}</StatusLine>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <figcaption className="mt-4 type-caption text-stone-600">{copy.previewCaption}</figcaption>
            </figure>
          )}
        </div>
      </section>

      <section aria-labelledby="broker-steps-title" className="content-auto page-container py-16 lg:py-24">
        <SectionHeader reveal titleId="broker-steps-title" title={copy.steps.title} />
        <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {copy.steps.items.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 60} className="border-t border-stone-300 pt-6">
              <span className="type-num-l text-teal-700" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 type-title-l text-navy-900">{step.title}</h3>
              <p className="mt-2 type-body-m text-stone-600">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="partenaire" aria-labelledby="partner-title" className={cx("scroll-mt-24 border-t border-stone-200 py-16 lg:py-24")}>
        <div className="page-container grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <SectionHeader reveal titleId="partner-title" title={copy.formTitle} intro={copy.formIntro} />
          </div>
          <div className="lg:col-span-8">
            <ContactForm topics={["broker"]} messages={messages.contact} optional={messages.common.optional} />
          </div>
        </div>
      </section>
    </>
  );
}
