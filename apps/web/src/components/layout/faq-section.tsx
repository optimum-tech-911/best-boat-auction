import { Accordion, SectionHeader } from "@bba/ui";

interface FaqSectionProps {
  id: string;
  title: string;
  items: readonly { question: string; answer: string }[];
}

/** The questions of an editorial page: the title on the left from 1024 px, the accordion on the right. */
export function FaqSection({ id, title, items }: FaqSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="content-auto scroll-mt-32 page-container py-16 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <SectionHeader reveal titleId={`${id}-title`} title={title} className="lg:col-span-4" />
        <Accordion className="lg:col-span-8" items={items.map((item, index) => ({ id: `${id}-${index}`, title: item.question, content: item.answer }))} />
      </div>
    </section>
  );
}
