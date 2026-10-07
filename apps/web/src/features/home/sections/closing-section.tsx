import Link from "next/link";
import type { LotSummary, SaleSummary } from "@bba/contracts";
import { formatDay, formatSaleName, formatTime, href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, Carousel, SectionHeader } from "@bba/ui";
import { LotCard } from "@/components/auction/lot-card";
import { auctionMessages } from "@/components/auction/messages";

/** H2: the next lots to close, as a carousel of C-10 cards in closing order. */
export function ClosingSection({ locale, messages, sale, lots }: { locale: Locale; messages: Messages; sale: SaleSummary; lots: readonly LotSummary[] }) {
  if (lots.length === 0) return null;
  const copy = messages.home.closing;
  const eyebrow = interpolate(copy.eyebrow, {
    sale: formatSaleName(sale.closingStartsAt, locale),
    date: formatDay(sale.closingStartsAt, locale, { month: "short" }),
    time: formatTime(sale.closingStartsAt, locale, { compact: true }),
  });
  const card = auctionMessages(messages);
  return (
    <section aria-labelledby="closing-title" className="page-container py-16 lg:py-24">
      <Carousel
        label={copy.region}
        previousLabel={copy.previous}
        nextLabel={copy.next}
        header={<SectionHeader reveal titleId="closing-title" eyebrow={eyebrow} title={copy.title} intro={copy.intro} />}
        action={(
          <Link href={href(locale, "auctions")} className={buttonClasses({ variant: "link" })}>
            <ButtonContent arrow>{interpolate(copy.allLots, { count: lots.length })}</ButtonContent>
          </Link>
        )}
        items={lots.map((lot) => ({
          key: lot.id,
          content: <LotCard lot={lot} locale={locale} messages={card} sizes="(max-width: 767px) 85vw, (max-width: 1023px) 42vw, 360px" />,
        }))}
        caption={messages.demo.caption}
      />
    </section>
  );
}
