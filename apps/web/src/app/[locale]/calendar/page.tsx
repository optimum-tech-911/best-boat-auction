import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { CalendarScreen } from "@/features/calendar/calendar-screen";
import { getRequestContext } from "@/lib/backend";

/** The coming sales listed, after the last closed one. */
const COMING_SALES = 12;

export async function generateMetadata({ params }: PageProps<"/[locale]/calendar">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).calendarPage.title } : {};
}

/** CAL: the sale calendar, from the backend's sale schedule. */
export default async function CalendarPage({ params }: PageProps<"/[locale]/calendar">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { backend, now } = await getRequestContext();
  const [previous, coming] = await Promise.all([backend.catalogue.getPreviousSale(), backend.catalogue.listSales(COMING_SALES)]);
  const sales = previous ? [previous, ...coming] : coming;
  return <CalendarScreen locale={locale} messages={getMessages(locale)} sales={sales} now={now} />;
}
