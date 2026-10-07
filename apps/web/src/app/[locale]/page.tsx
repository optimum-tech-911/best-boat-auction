import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { HomeHero } from "@/features/home/hero/home-hero";
import { CalendarSection } from "@/features/home/sections/calendar-section";
import { CategoriesSection } from "@/features/home/sections/categories-section";
import { ClosingSection } from "@/features/home/sections/closing-section";
import { EcosystemSection } from "@/features/home/sections/ecosystem-section";
import { InspectSection } from "@/features/home/sections/inspect-section";
import { MarketSection } from "@/features/home/sections/market-section";
import { NewsletterSection } from "@/features/home/sections/newsletter-section";
import { SellerSection } from "@/features/home/sections/seller-section";
import { StorySection } from "@/features/home/sections/story-section";
import { getRequestContext } from "@/lib/backend";
import "@/features/home/home.css";

/** Bids shown on the example lot page of the transparency section. */
const EXAMPLE_HISTORY = 3;

/** The homepage of DESIGN_V1_1.md section 5 with the services section, all from the backend contract. */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const { backend, now } = await getRequestContext();
  const [sale, open, results, stats, activity, sales, previousSale] = await Promise.all([
    backend.catalogue.getFeaturedSale(),
    backend.catalogue.searchLots({ limit: 50 }),
    backend.catalogue.searchResults({ limit: 50 }),
    backend.catalogue.getMarketStats(),
    backend.catalogue.getRecentActivity(6),
    backend.catalogue.listSales(3),
    backend.catalogue.getPreviousSale(),
  ]);
  // The first lot of the sale illustrates the viewing step and the example lot page.
  const example = open.lots[0] ? await backend.catalogue.getLot(open.lots[0].number) : null;
  const history = example ? await backend.catalogue.getBidHistory(example.id, EXAMPLE_HISTORY) : [];

  return (
    <>
      <HomeHero locale={locale} messages={messages.home.hero} sale={sale} lots={open.lots} />
      <ClosingSection locale={locale} messages={messages} sale={sale} lots={open.lots} />
      <StorySection locale={locale} messages={messages} sale={sale} lot={example} />
      <CategoriesSection locale={locale} messages={messages} counts={open.facets.types} />
      <SellerSection locale={locale} messages={messages} currentYear={new Date(now).getUTCFullYear()} />
      <InspectSection locale={locale} messages={messages} lot={example} history={history} />
      <EcosystemSection locale={locale} messages={messages} />
      <MarketSection locale={locale} messages={messages} sale={sale} lots={open.lots} stats={stats} activity={activity} previousSale={previousSale} results={results.lots} />
      <CalendarSection locale={locale} messages={messages} sales={sales} />
      <NewsletterSection locale={locale} messages={messages} />
    </>
  );
}
