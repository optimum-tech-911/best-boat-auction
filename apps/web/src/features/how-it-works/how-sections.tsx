import Link from "next/link";
import type { ReactNode } from "react";
import type { SaleSummary } from "@bba/contracts";
import { buyerTotal, defaultAuctionRules, defaultSaleCalendarRules, defaultSellerOffer } from "@bba/domain";
import { formatMoney, formatPercent, formatTime, href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { Accordion, buttonClasses, ButtonContent, EscrowDiagram, Reveal, SaleJourneyDiagram, SectionHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@bba/ui";
import { demoHandoverCode, HandoverCode } from "@/components/auction/handover-code";
import { SoftCloseFigure } from "@/components/auction/soft-close-figure";
import { saleDates } from "@/features/calendar/sale-dates";
import { FeeCalculator } from "./fee-calculator";
import { MaxBidExplorer } from "./max-bid-explorer";
import { EXAMPLE_HAMMER_CENTS, ruleParams } from "@/lib/rule-params";

/** The page's anchors, shared with the footer links (#frais, #questions). */
export const howSectionIds = { calendar: "calendrier", bidding: "encherir", fees: "frais", pay: "payer", questions: "questions" } as const;

const MINUTE = 60_000;
const rules = defaultAuctionRules;

export function HowHeader({ locale, copy }: { locale: Locale; copy: Messages["how"] }) {
  return (
    <header className="page-container pb-10 pt-12 lg:pb-12 lg:pt-20">
      <SectionHeader as="h1" eyebrow={copy.eyebrow} title={copy.title} intro={interpolate(copy.intro, ruleParams(locale))} />
    </header>
  );
}

/** A numbered section: heading and text on the left from 1024 px, the explanation on the right. */
function HowSection({ id, eyebrow, title, texts, aside, children }: { id: string; eyebrow: string; title: string; texts: readonly string[]; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 page-container border-t border-stone-200 py-16 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <SectionHeader reveal titleId={`${id}-title`} eyebrow={eyebrow} title={title} />
          {texts.map((text) => <p key={text} className="mt-4 max-w-intro type-body-l text-stone-600">{text}</p>)}
          {aside}
        </div>
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">{children}</div>
      </div>
    </section>
  );
}

/** "Le calendrier": the sale rhythm with SC-01 in full for the featured sale. */
export function CalendarExplainer({ locale, messages, sale }: { locale: Locale; messages: Messages; sale: SaleSummary }) {
  const copy = messages.how.calendar;
  const dates = saleDates(sale, locale, messages.diagrams.journey);
  const text = interpolate(copy.text, {
    submissionDays: defaultSaleCalendarRules.submissionDaysBeforeClosing,
    openDays: defaultSaleCalendarRules.biddingOpensDaysBeforeClosing,
    time: formatTime(sale.closingStartsAt, locale, { compact: true }),
  });
  return (
    <section id={howSectionIds.calendar} aria-labelledby={`${howSectionIds.calendar}-title`} className="scroll-mt-32 page-container py-16 lg:py-24">
      <SectionHeader reveal titleId={`${howSectionIds.calendar}-title`} eyebrow={copy.eyebrow} title={copy.title} intro={text} />
      <p className="mt-10 type-eyebrow text-stone-600">{interpolate(copy.sale, { month: dates.month })}</p>
      <Reveal kind="diagram" className="mt-6">
        <SaleJourneyDiagram title={messages.diagrams.journey.title} steps={dates.full} />
      </Reveal>
    </section>
  );
}

/** "Enchérir": the maximum bid, tried with SC-04, then the soft close (SC-02); the increments sit in a disclosure. */
export function BiddingExplainer({ locale, messages, sale }: { locale: Locale; messages: Messages; sale: SaleSummary }) {
  const copy = messages.how.bidding;
  const texts = copy.texts.map((text) => interpolate(text, { window: rules.softCloseWindowMs / MINUTE, extension: rules.extensionMs / MINUTE }));
  const increments = (
    <Accordion
      className="mt-8"
      items={[{
        id: "increments",
        title: copy.incrementsTitle,
        content: (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{copy.from}</TableHeader>
                <TableHeader numeric>{copy.step}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.increments.map((band) => (
                <TableRow key={band.fromCents}>
                  <TableCell className="numerals">{formatMoney(band.fromCents, locale)}</TableCell>
                  <TableCell numeric>{formatMoney(band.stepCents, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ),
      }]}
    />
  );
  return (
    <HowSection id={howSectionIds.bidding} eyebrow={copy.eyebrow} title={copy.title} texts={texts} aside={increments}>
      <MaxBidExplorer locale={locale} copy={copy} diagram={messages.diagrams.maxBid} />
      <Reveal kind="diagram" className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
        <h3 className="mb-6 type-title-l text-navy-900">{messages.diagrams.softClose.title}</h3>
        <SoftCloseFigure closesAt={sale.closingStartsAt} locale={locale} messages={messages.diagrams.softClose} />
      </Reveal>
    </HowSection>
  );
}

/** "Les frais": the buyer's commission with a worked example, the listing packs (C-17), then the calculator with SC-07. */
export function FeesExplainer({ locale, messages }: { locale: Locale; messages: Messages }) {
  const copy = messages.how.fees;
  const money = (cents: number) => formatMoney(cents, locale);
  const example = buyerTotal({ hammerCents: EXAMPLE_HAMMER_CENTS, startCents: EXAMPLE_HAMMER_CENTS }, rules);
  const packs = messages.sell.packs;

  const aside = (
    <div className="mt-8 flex flex-col gap-8">
      <div className="rounded-md border border-stone-300 bg-white p-6">
        <h3 className="type-title-m text-navy-900">{copy.premiumTitle}</h3>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
          <span className="type-num-xl text-navy-900">{formatPercent(example.premiumRate, locale)}</span>
          <span className="type-body-m text-stone-600">{copy.premiumValue}</span>
        </p>
        <p className="mt-3 type-body-s text-stone-600">{interpolate(copy.premiumVat, { vat: formatPercent(rules.vatOnPremium, locale) })}</p>
        <p className="mt-4 border-t border-stone-200 pt-4 type-body-m numerals text-navy-900">
          {interpolate(copy.example, { hammer: money(example.hammerCents), premium: money(example.premiumCents), vat: money(example.vatOnPremiumCents) })}
        </p>
      </div>
      <div>
        <h3 className="type-title-m text-navy-900">{copy.sellerTitle}</h3>
        <Table className="mt-2">
          <TableHead>
            <TableRow>
              <TableHeader>{copy.packColumn}</TableHeader>
              <TableHeader numeric>{copy.priceColumn}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {defaultSellerOffer.packs.map((pack) => (
              <TableRow key={pack.id}>
                <TableCell>{packs.names[pack.id]}</TableCell>
                <TableCell numeric>{pack.priceCents === 0 ? packs.free : money(pack.priceCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2 type-caption text-stone-600">{copy.sellerNote}</p>
        <Link href={`${href(locale, "sell")}#packs`} className={buttonClasses({ variant: "link", className: "mt-2" })}>
          <ButtonContent arrow>{copy.packsLink}</ButtonContent>
        </Link>
      </div>
    </div>
  );
  return (
    <HowSection id={howSectionIds.fees} eyebrow={copy.eyebrow} title={copy.title} texts={[copy.text]} aside={aside}>
      <FeeCalculator locale={locale} copy={copy} diagram={messages.diagrams.price} />
    </HowSection>
  );
}

/** "Payer et récupérer": escrow (SC-03) and the handover code. */
export function PaymentExplainer({ messages }: { messages: Messages }) {
  const copy = messages.how.pay;
  const { escrow } = messages.diagrams;
  const texts = copy.texts.map((text) => interpolate(text, { paymentDays: rules.paymentDays, collectionDays: rules.collectionDays }));
  return (
    <HowSection id={howSectionIds.pay} eyebrow={copy.eyebrow} title={copy.title} texts={texts}>
      <Reveal kind="diagram" className="rounded-md border border-stone-300 bg-white p-6 lg:p-8">
        <h3 className="mb-6 type-title-l text-navy-900">{escrow.title}</h3>
        <EscrowDiagram title={escrow.title} labels={escrow} caption={escrow.demo} />
      </Reveal>
      <HandoverCode code={demoHandoverCode} caption={messages.home.story.codeCaption} demoLabel={messages.home.story.codeDemo} />
    </HowSection>
  );
}

/** The FAQ answers quote the rules, so they follow any change to them. */
export function faqItems(locale: Locale, items: Messages["how"]["faq"]["items"]) {
  const params = {
    hours: rules.sellerDecisionHours,
    window: rules.softCloseWindowMs / MINUTE,
    extension: rules.extensionMs / MINUTE,
    paymentDays: rules.paymentDays,
    idCheck: formatMoney(rules.idCheckFromCents, locale),
  };
  return items.map((item) => ({ question: item.question, answer: interpolate(item.answer, params) }));
}
