import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, interpolate, isLocale } from "@bba/i18n";
import { isContactTopic, ServicesScreen } from "@/features/services/services-screen";
import { getRequestContext } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).services.eyebrow } : {};
}

/** Services around the boat. `?topic=finance&lot=7701` preselects the subject and names the lot. */
export default async function ServicesPage({ params, searchParams }: PageProps<"/[locale]/services">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const query = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const topic = first(query.topic);
  const lotNumber = Number.parseInt(first(query.lot) ?? "", 10);
  const { backend } = await getRequestContext();
  const lot = Number.isFinite(lotNumber) ? await backend.catalogue.getLot(lotNumber) : null;
  return (
    <ServicesScreen
      locale={locale}
      messages={messages}
      initialTopic={isContactTopic(topic) ? topic : undefined}
      lot={lot ? { id: lot.id, label: interpolate(messages.contact.about, { number: lot.number, title: lot.title }) } : undefined}
    />
  );
}
