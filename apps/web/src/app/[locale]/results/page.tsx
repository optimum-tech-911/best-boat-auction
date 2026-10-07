import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { CatalogueScreen } from "@/features/catalogue/catalogue-screen";

export async function generateMetadata({ params }: PageProps<"/[locale]/results">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).catalogue.resultsTitle } : {};
}

/** The results archive: every closed lot with its outcome. */
export default async function ResultsPage({ params, searchParams }: PageProps<"/[locale]/results">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CatalogueScreen locale={locale} messages={getMessages(locale)} archive searchParams={await searchParams} />;
}
