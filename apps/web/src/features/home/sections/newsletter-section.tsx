import { boatTypes } from "@bba/contracts";
import type { Locale, Messages } from "@bba/i18n";
import { NewsletterForm } from "@/features/engagement/newsletter-form";

/** H9: alerts for new lots, by the boat types the visitor follows. */
export function NewsletterSection({ locale, messages }: { locale: Locale; messages: Messages }) {
  const copy = messages.home.newsletter;
  return (
    <section aria-labelledby="newsletter-title" className="content-auto page-container pb-16 pt-16 lg:pb-24 lg:pt-24">
      <div className="grid gap-8 rounded-md border border-stone-300 bg-white p-6 sm:p-10 lg:grid-cols-12 lg:gap-8 lg:p-12">
        <div className="lg:col-span-5">
          <h2 id="newsletter-title" className="type-display-m text-balance text-navy-900">{copy.title}</h2>
          <p className="mt-4 type-body-l text-stone-600">{copy.intro}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <NewsletterForm
            locale={locale}
            variant="home"
            messages={copy}
            alerts={{ legend: copy.types, success: copy.successTypes, types: boatTypes.map((type) => ({ value: type, label: messages.categories.plural[type] })) }}
          />
        </div>
      </div>
    </section>
  );
}
