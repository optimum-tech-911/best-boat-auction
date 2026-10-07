import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessages, href, isLocale } from "@bba/i18n";
import { buttonClasses, ButtonContent } from "@bba/ui";
import { CtaBand } from "@/components/layout/cta-band";
import { FaqSection } from "@/components/layout/faq-section";
import { SectionNav } from "@/components/layout/section-nav";
import { BiddingExplainer, CalendarExplainer, faqItems, FeesExplainer, HowHeader, howSectionIds, PaymentExplainer } from "@/features/how-it-works/how-sections";
import { getRequestContext } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).nav.howItWorks } : {};
}

/** HOW: the sale calendar, bidding, fees, payment and handover, then the questions. */
export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const copy = messages.how;
  const { backend } = await getRequestContext();
  const sale = await backend.catalogue.getFeaturedSale();
  const sections = [
    { id: howSectionIds.calendar, label: copy.calendar.eyebrow },
    { id: howSectionIds.bidding, label: copy.bidding.eyebrow },
    { id: howSectionIds.fees, label: copy.fees.eyebrow },
    { id: howSectionIds.pay, label: copy.pay.eyebrow },
    { id: howSectionIds.questions, label: copy.faq.title },
  ];

  return (
    <>
      <HowHeader locale={locale} copy={copy} />
      <div className="page-container">
        <SectionNav label={copy.sections} sections={sections} />
      </div>
      <CalendarExplainer locale={locale} messages={messages} sale={sale} />
      <BiddingExplainer locale={locale} messages={messages} sale={sale} />
      <FeesExplainer locale={locale} messages={messages} />
      <PaymentExplainer messages={messages} />
      <FaqSection id={howSectionIds.questions} title={copy.faq.title} items={faqItems(locale, copy.faq.items)} />
      <CtaBand id="how-band-title" title={copy.band.title}>
        <Link href={href(locale, "auctions")} className={buttonClasses({ variant: "primary-inverse", size: "lg" })}>
          <ButtonContent arrow size="lg">{copy.band.auctions}</ButtonContent>
        </Link>
        <Link href={href(locale, "sell")} className={buttonClasses({ variant: "secondary-inverse", size: "lg" })}>
          <ButtonContent size="lg">{copy.band.sell}</ButtonContent>
        </Link>
      </CtaBand>
    </>
  );
}
