import { type Locale, type Messages } from "@bba/i18n";
import { editorialImages } from "@bba/sdk";
import { Reveal, SectionHeader } from "@bba/ui";
import { LotPhoto } from "@/components/auction/lot-photo";
import { MiniEstimator } from "@/features/seller/mini-estimator";

/** H5: the navy seller panel with the C-25 mini estimator, beside the seller photograph (M10). */
export function SellerSection({ locale, messages, currentYear }: { locale: Locale; messages: Messages; currentYear: number }) {
  const copy = messages.home.seller;
  return (
    <section aria-labelledby="seller-title" className="content-auto page-container py-16 lg:py-24">
      <div className="grid overflow-hidden rounded-md lg:grid-cols-12">
        <div className="on-dark bg-navy-900 px-6 py-12 text-ivory-100 sm:px-10 lg:col-span-7 lg:px-12 lg:py-16">
          <SectionHeader reveal titleId="seller-title" eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} tone="inverse" />
          <MiniEstimator
            locale={locale}
            currentYear={currentYear}
            messages={{ ...copy, types: messages.categories.singular }}
          />
        </div>
        <Reveal kind="image" className="relative aspect-3/2 lg:col-span-5 lg:aspect-auto">
          <LotPhoto image={editorialImages.seller} locale={locale} sizes="(max-width: 1023px) 100vw, 520px" placeholder={messages.common.photoComing} />
        </Reveal>
      </div>
    </section>
  );
}
