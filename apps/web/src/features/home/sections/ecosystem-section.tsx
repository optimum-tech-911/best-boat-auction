import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, Icon, Reveal, SectionHeader } from "@bba/ui";
import { isContactTopic } from "@/features/services/services-screen";
import { ruleParams } from "@/lib/rule-params";

/**
 * Around the boat: the services in the order a buyer needs them, before bidding, at handover and
 * afterwards, each opening a request with its subject chosen; then the invitation to brokers.
 */
export function EcosystemSection({ locale, messages }: { locale: Locale; messages: Messages }) {
  const copy = messages.home.ecosystem;
  return (
    <section aria-labelledby="ecosystem-title" className="content-auto page-container py-16 lg:py-24">
      <SectionHeader
        reveal
        titleId="ecosystem-title"
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        action={(
          <Link href={href(locale, "services")} className={buttonClasses({ variant: "link" })}>
            <ButtonContent arrow>{copy.more}</ButtonContent>
          </Link>
        )}
      />
      <div className="mt-12">
        <ol className="relative grid gap-10 border-l border-stone-300 pl-6 md:grid-cols-3 md:gap-6 md:border-l-0 md:pl-0">
          <span aria-hidden="true" className="absolute inset-x-0 top-2 hidden h-hairline bg-stone-300 md:block" />
          {copy.phases.map((phase, index) => (
            <Reveal as="li" key={phase.title} delay={index * 60} className="relative md:pt-10">
              <span aria-hidden="true" className="absolute -left-8 top-1 size-icon-s rounded-full border-2 border-navy-900 bg-ivory-100 md:left-0 md:top-0" />
              <p className="type-eyebrow text-teal-700">{String(index + 1).padStart(2, "0")} · {phase.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {phase.items.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={`${href(locale, "services", {}, isContactTopic(item.topic) ? { topic: item.topic } : {})}#demande`}
                      className="group flex flex-col gap-1 rounded-md border border-stone-300 bg-white p-5 transition-colors duration-fast hover:border-navy-900"
                    >
                      <span className="flex items-start justify-between gap-3 type-title-m text-navy-900">
                        {item.title}
                        <Icon icon={ArrowUpRight} size="s" className="mt-1 shrink-0 text-stone-600 transition-colors duration-fast group-hover:text-navy-900" />
                      </span>
                      <span className="type-body-s text-stone-600">{item.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={180} className="mt-10">
          <div className="on-dark flex flex-col gap-6 rounded-md bg-navy-900 p-6 text-ivory-100 md:flex-row md:items-center md:justify-between lg:px-10">
            <div>
              <p className="type-title-l">{copy.brokers.title}</p>
              <p className="mt-1 max-w-measure type-body-m text-mist-300">{interpolate(copy.brokers.text, ruleParams(locale))}</p>
            </div>
            <Link href={href(locale, "brokers")} className={buttonClasses({ variant: "primary-inverse", className: "shrink-0 self-start md:self-auto" })}>
              <ButtonContent arrow>{copy.brokers.action}</ButtonContent>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
