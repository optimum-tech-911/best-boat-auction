import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { getMessages, isLocale, type Messages } from "@bba/i18n";
import { Icon, SectionHeader } from "@bba/ui";

type LegalPageName = keyof Messages["legal"]["pages"];
type LegalProps = { params: Promise<{ locale: string }> };

/**
 * The legal pages before their texts are written: the title, a clear "in preparation" notice and
 * the outline. Each route file exports the pair this factory returns.
 */
export function legalPage(name: LegalPageName) {
  async function generateMetadata({ params }: LegalProps): Promise<Metadata> {
    const { locale } = await params;
    return isLocale(locale) ? { title: getMessages(locale).legal.pages[name].title } : {};
  }

  async function LegalPage({ params }: LegalProps) {
    const { locale } = await params;
    if (!isLocale(locale)) notFound();
    const copy = getMessages(locale).legal;
    const page = copy.pages[name];
    return (
      <div className="page-container py-12 lg:py-20">
        <div className="max-w-form">
          <SectionHeader as="h1" title={page.title} />
          <div role="note" className="mt-8 flex gap-3 rounded-md border border-stone-300 bg-white p-6">
            <Icon icon={FileText} size="m" className="mt-1 shrink-0 text-stone-600" />
            <div>
              <p className="type-title-m text-navy-900">{copy.draft}</p>
              <p className="mt-1 type-body-m text-stone-600">{copy.draftText}</p>
            </div>
          </div>
          <h2 className="mt-10 type-eyebrow text-stone-600">{copy.outline}</h2>
          <ol className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
            {page.sections.map((section, index) => (
              <li key={section} className="flex items-baseline gap-4 py-4 type-body-l text-navy-900">
                <span className="w-6 shrink-0 type-num-s text-stone-600">{index + 1}</span>
                {section}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return { generateMetadata, LegalPage };
}
