import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { BrokersScreen } from "@/features/brokers/brokers-screen";
import { getRequestContext } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/[locale]/brokers">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).brokers.eyebrow } : {};
}

/** Partner brokers: commission shares, the broker space preview and the partnership request. */
export default async function BrokersPage({ params }: PageProps<"/[locale]/brokers">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { backend } = await getRequestContext();
  const portfolio = await backend.brokers.getPortfolio();
  return <BrokersScreen locale={locale} messages={getMessages(locale)} portfolio={portfolio} />;
}
