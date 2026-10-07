import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getMessages, href, isLocale, lotNumberFromSlug } from "@bba/i18n";
import { LotScreen } from "@/features/lot/lot-screen";
import { getRequestContext } from "@/lib/backend";

async function findLot(slug: string) {
  const number = lotNumberFromSlug(slug);
  if (number === null) return null;
  const { backend } = await getRequestContext();
  return backend.catalogue.getLot(number);
}

export async function generateMetadata({ params }: PageProps<"/[locale]/auctions/[lot]">): Promise<Metadata> {
  const { locale, lot: slug } = await params;
  const lot = isLocale(locale) ? await findLot(slug) : null;
  return lot && isLocale(locale) ? { title: lot.title, description: lot.description[locale] } : {};
}

/** A lot page, for open lots and the results archive alike. */
export default async function LotPage({ params }: PageProps<"/[locale]/auctions/[lot]">) {
  const { locale, lot: slug } = await params;
  if (!isLocale(locale)) notFound();
  const lot = await findLot(slug);
  if (!lot) notFound();
  // "/fr/ventes/7701" and older titles lead to the lot's canonical address.
  if (slug !== lot.slug) permanentRedirect(href(locale, "lot", { lot: lot.slug }));
  return <LotScreen locale={locale} messages={getMessages(locale)} lot={lot} />;
}
