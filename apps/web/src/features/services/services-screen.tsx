import { Landmark, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { contactTopics, type ContactTopic } from "@bba/contracts";
import { href, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, Icon, Reveal, SectionHeader } from "@bba/ui";
import { ContactForm } from "@/features/engagement/contact-form";

/** The services around the boat, in the order they are presented. */
export const serviceTopics = ["finance", "insurance", "services"] as const satisfies readonly ContactTopic[];
type ServiceTopic = (typeof serviceTopics)[number];

const serviceIcons: Readonly<Record<ServiceTopic, LucideIcon>> = { finance: Landmark, insurance: ShieldCheck, services: Wrench };

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === "string" && (contactTopics as readonly string[]).includes(value);
}

interface ServicesScreenProps {
  locale: Locale;
  messages: Messages;
  initialTopic?: ContactTopic;
  /** The lot a buyer came from, to finance or insure that boat. */
  lot?: { id: string; label: string };
}

/** SERVICES: financing, insurance and services around the boat, and one request form. */
export function ServicesScreen({ locale, messages, initialTopic, lot }: ServicesScreenProps) {
  const copy = messages.services;
  return (
    <>
      <header className="page-container pb-12 pt-12 lg:pb-16 lg:pt-20">
        <SectionHeader as="h1" eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
      </header>

      <section aria-label={copy.eyebrow} className="page-container pb-16 lg:pb-24">
        <ul className="grid gap-6 md:grid-cols-3">
          {serviceTopics.map((topic, index) => (
            <Reveal as="li" key={topic} id={topic} delay={index * 60} className="flex scroll-mt-24 flex-col rounded-md border border-stone-300 bg-white p-6 lg:p-8">
              <span className="grid size-control-lg place-items-center rounded-sm bg-navy-900 text-ivory-100">
                <Icon icon={serviceIcons[topic]} size="m" />
              </span>
              <h2 className="mt-6 type-title-l text-navy-900">{copy.items[topic].title}</h2>
              <p className="mt-2 flex-1 type-body-m text-stone-600">{copy.items[topic].text}</p>
              <a href={`${href(locale, "services", {}, { topic })}#demande`} className={buttonClasses({ variant: "link", className: "mt-6 self-start" })}>
                <ButtonContent arrow>{copy.request}</ButtonContent>
              </a>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 type-caption text-stone-600">{copy.partners}</p>
      </section>

      <section aria-label={copy.band.join(" · ")} className="on-dark bg-navy-900 text-ivory-100">
        <ul className="page-container flex flex-col items-center gap-3 py-10 text-center md:flex-row md:justify-center md:gap-6">
          {copy.band.map((item, index) => (
            <li key={item} className="flex items-center gap-6 type-title-l">
              {index > 0 && <span aria-hidden="true" className="hidden size-dot rounded-full bg-orange-600 md:inline-block" />}
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="demande" aria-labelledby="request-title" className="scroll-mt-24 py-16 lg:py-24">
        <div className="page-container grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <SectionHeader reveal titleId="request-title" title={copy.formTitle} />
          </div>
          <div className="lg:col-span-8">
            <ContactForm topics={serviceTopics} initialTopic={initialTopic} lot={lot} messages={messages.contact} optional={messages.common.optional} />
          </div>
        </div>
      </section>
    </>
  );
}
