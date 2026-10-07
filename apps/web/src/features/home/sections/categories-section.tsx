import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { boatTypes, type BoatType } from "@bba/contracts";
import { href, plural, type Locale, type Messages } from "@bba/i18n";
import { categoryImages } from "@bba/sdk";
import { Icon, Reveal, SectionHeader } from "@bba/ui";
import { LotPhoto } from "@/components/auction/lot-photo";

/** The order of DESIGN_SYSTEM.md 14.2. */
const order: readonly BoatType[] = ["motorboat", "sailboat", "speedboat", "sloep", "rib", "catamaran"];

/**
 * H4: the bordered editorial grid of boat types, each with its image (M10, 60 ms stagger),
 * a numeral, its serif name and the number of lots for sale. The whole tile is the link.
 */
export function CategoriesSection({ locale, messages, counts }: { locale: Locale; messages: Messages; counts: Partial<Record<BoatType, number>> }) {
  const copy = messages.home.categories;
  const types = order.filter((type) => boatTypes.includes(type));
  return (
    <section aria-labelledby="categories-title" className="content-auto page-container py-16 lg:py-24">
      <SectionHeader reveal titleId="categories-title" eyebrow={copy.eyebrow} title={copy.title} />
      <ul className="mt-6 grid grid-cols-2 border-l border-t border-stone-300 md:grid-cols-3 lg:mt-10 xl:grid-cols-6">
        {types.map((type, index) => (
          <li key={type} className="border-b border-r border-stone-300">
            <Link href={href(locale, "auctions", {}, { type })} className="motion-card group flex h-full flex-col transition-colors duration-base hover:bg-stone-100">
              <Reveal kind="image" delay={index * 60} className="relative aspect-4/5 overflow-hidden">
                <div className="motion-card-image absolute inset-0">
                  <LotPhoto image={categoryImages[type]} locale={locale} sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 220px" placeholder={messages.common.photoComing} decorative />
                </div>
              </Reveal>
              <div className="relative flex flex-1 flex-col p-4 lg:p-5">
                <span className="type-num-s text-stone-600" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="mt-4 type-display-xs text-navy-900">{messages.categories.plural[type]}</span>
                <span className="mt-2 type-body-s text-stone-600">{plural(locale, messages.categories.lotsForSale, counts[type] ?? 0)}</span>
                <Icon icon={ArrowRight} size="m" className="motion-arrow absolute right-4 top-4 text-navy-900 lg:right-5 lg:top-5" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
