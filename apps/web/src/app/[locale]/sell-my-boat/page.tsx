import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { EstimateRequest } from "@bba/contracts";
import { defaultAuctionRules, defaultSellerOffer, premiumRate } from "@bba/domain";
import { formatDay, formatMoney, formatPercent, getMessages, href, interpolate, isLocale } from "@bba/i18n";
import { buttonClasses, ButtonContent } from "@bba/ui";
import { saleDates } from "@/features/calendar/sale-dates";
import { defaultEstimateInput, readSellPrefill } from "@/features/seller/estimate-input";
import { CtaBand } from "@/components/layout/cta-band";
import { FaqSection } from "@/components/layout/faq-section";
import { SellFunnelProvider } from "@/features/seller/sell-funnel";
import { SaleComparison, SellBrokers, SellerSteps, SellEstimator, SellHero, SellPacks, SellServices } from "@/features/seller/sell-sections";
import type { NextSubmissionSale } from "@/features/seller/sell-types";
import { getRequestContext } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/[locale]/sell-my-boat">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).sell.eyebrow } : {};
}

/** SELL: what keeping the boat costs, what selling costs, and the next sale it can join. */
export default async function SellPage({ params, searchParams }: PageProps<"/[locale]/sell-my-boat">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const { backend, now } = await getRequestContext();
  const sales = await backend.catalogue.listSales(3);
  const sale = sales.find((candidate) => candidate.submissionDeadlineAt > now) ?? null;
  const nextSale: NextSubmissionSale | null = sale && {
    date: formatDay(sale.closingStartsAt, locale, { weekday: false }),
    deadline: formatDay(sale.submissionDeadlineAt, locale, { weekday: false }),
    steps: saleDates(sale, locale, messages.diagrams.journey).mini,
  };

  // Answers carried from the homepage estimator (type, length, value) replace the worked example.
  const prefill = readSellPrefill(await searchParams);
  const initialInput: EstimateRequest = {
    ...defaultEstimateInput,
    boatType: prefill.type ?? "motorboat",
    lengthMetres: prefill.lengthMetres ?? defaultEstimateInput.lengthMetres,
    valueCents: prefill.valueCents ?? defaultEstimateInput.valueCents,
    ownerBerthCents: null,
    ownerInsuranceCents: null,
  };

  // The answers quote the house's prices and commission, so they follow any change to them.
  const packPrice = (id: string) => formatMoney(defaultSellerOffer.packs.find((pack) => pack.id === id)?.priceCents ?? 0, locale);
  const faqParams = {
    boost: packPrice("boost"),
    premium: packPrice("premium"),
    rate: formatPercent(premiumRate(0, defaultAuctionRules), locale),
  };
  const faq = messages.sell.faq.items.map((item) => ({ question: item.question, answer: interpolate(item.answer, faqParams) }));

  return (
    <SellFunnelProvider
      locale={locale}
      currentYear={new Date(now).getUTCFullYear()}
      nextSale={nextSale}
      initialInput={initialInput}
      messages={{
        sell: messages.sell,
        types: messages.categories.singular,
        cost: messages.diagrams.cost,
        waiting: messages.diagrams.waiting,
        journeyTitle: messages.diagrams.journey.title,
        common: { close: messages.common.close, optional: messages.common.optional },
      }}
    >
      <SellHero locale={locale} copy={messages.sell} photoComing={messages.common.photoComing} />
      <SellEstimator copy={messages.sell} />
      <SellerSteps locale={locale} copy={messages.sell} />
      <SellPacks locale={locale} copy={messages.sell} />
      <SellServices locale={locale} copy={messages.sell} />
      <SaleComparison locale={locale} copy={messages.sell} />
      <SellBrokers locale={locale} copy={messages.sell} />
      <FaqSection id="questions" title={messages.sell.faq.title} items={faq} />
      <CtaBand id="sell-band-title" title={messages.sell.band.title}>
        <Link href={href(locale, "sellListing")} className={buttonClasses({ variant: "primary-inverse", size: "lg" })}>
          <ButtonContent arrow size="lg">{messages.sell.band.action}</ButtonContent>
        </Link>
      </CtaBand>
    </SellFunnelProvider>
  );
}
