import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { CatalogueScreen } from "@/features/catalogue/catalogue-screen";

export async function generateMetadata({ params }: PageProps<"/[locale]/auctions">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).nav.auctions } : {};
}

/** The current sale: every lot open for bidding, filtered and sorted from the address. */
export default async function AuctionsPage({ params, searchParams }: PageProps<"/[locale]/auctions">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CatalogueScreen locale={locale} messages={getMessages(locale)} archive={false} searchParams={await searchParams} />;
}
