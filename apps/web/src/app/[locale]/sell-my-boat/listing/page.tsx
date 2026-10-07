import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDay, formatSaleName, getMessages, isLocale } from "@bba/i18n";
import { isPackId } from "@/features/listing/listing-draft";
import type { ListingSale } from "@/features/listing/listing-types";
import { ListingWizard } from "@/features/listing/listing-wizard";
import { readSellPrefill } from "@/features/seller/estimate-input";
import { getRequestContext } from "@/lib/backend";

export async function generateMetadata({ params }: PageProps<"/[locale]/sell-my-boat/listing">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).listing.eyebrow, robots: { index: false } } : {};
}

/** SEL: the listing form. Answers from the estimator and the pack chosen on the sell page arrive in the address. */
export default async function ListingPage({ params, searchParams }: PageProps<"/[locale]/sell-my-boat/listing">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const { backend, now } = await getRequestContext();
  const sales = await backend.catalogue.listSales(3);
  const next = sales.find((candidate) => candidate.submissionDeadlineAt > now);
  const sale: ListingSale | null = next
    ? {
        name: formatSaleName(next.closingStartsAt, locale, { inSentence: true }),
        closing: formatDay(next.closingStartsAt, locale, { weekday: false }),
        deadline: formatDay(next.submissionDeadlineAt, locale, { weekday: false }),
      }
    : null;
  const query = await searchParams;
  const pack = Array.isArray(query.pack) ? query.pack[0] : query.pack;

  return (
    <div className="bg-stone-100">
      <div className="page-container py-12 lg:py-16">
        <div className="mx-auto max-w-wizard">
          <ListingWizard
            locale={locale}
            sale={sale}
            currentYear={new Date(now).getUTCFullYear()}
            prefill={{ ...readSellPrefill(query), ...(isPackId(pack) ? { pack } : {}) }}
            messages={{
              listing: messages.listing,
              map: messages.map,
              types: messages.categories.singular,
              fuels: messages.catalogue.fuels,
              storages: messages.lotPage.storages,
              conditions: messages.sell.conditions,
              packs: messages.sell.packs,
              countries: messages.countries,
              common: { optional: messages.common.optional },
            }}
          />
        </div>
      </div>
    </div>
  );
}
