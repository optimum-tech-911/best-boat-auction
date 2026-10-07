import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { auctionMessages } from "@/components/auction/messages";
import { MyBidsScreen } from "@/features/account/my-bids-screen";
import { getRequestContext } from "@/lib/backend";

/** Every lot of the open sale and of the results fits in one request. */
const LOT_LIMIT = 100;

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).nav.myBids } : {};
}

/** ACC "Mes enchères": the viewer's positions come from the live store in the browser. */
export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const { backend } = await getRequestContext();
  const [open, results] = await Promise.all([backend.catalogue.searchLots({ limit: LOT_LIMIT }), backend.catalogue.searchResults({ limit: LOT_LIMIT })]);
  return (
    <MyBidsScreen
      locale={locale}
      lots={[...open.lots, ...results.lots]}
      messages={{ account: messages.account, myBids: messages.nav.myBids, watchlist: messages.nav.watchlist, card: auctionMessages(messages) }}
    />
  );
}
