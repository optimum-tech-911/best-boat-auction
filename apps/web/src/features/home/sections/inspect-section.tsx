import type { BidHistoryEntry, LotDetail } from "@bba/contracts";
import { interpolate, type Locale, type Messages } from "@bba/i18n";
import { SectionHeader } from "@bba/ui";
import { ruleParams } from "@/lib/rule-params";
import { LotSheetExplorer } from "./lot-sheet-explorer";

/**
 * H6 "Transparence": five guarantees, each lighting up its place on a real lot page of the current
 * sale (viewing, timestamped bids, extended closing, total price, escrow).
 */
export function InspectSection({ locale, messages, lot, history }: { locale: Locale; messages: Messages; lot: LotDetail | null; history: BidHistoryEntry[] }) {
  const copy = messages.home.inspect;
  const params = ruleParams(locale);
  if (!lot) return null;
  return (
    <section aria-labelledby="inspect-title" className="content-auto page-container py-16 lg:py-24">
      <SectionHeader reveal titleId="inspect-title" eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
      <LotSheetExplorer
        locale={locale}
        lot={lot}
        history={history}
        items={copy.items.map((item) => ({ title: item.title, text: interpolate(item.text, params) }))}
        sheet={Object.fromEntries(Object.entries(copy.sheet).map(([key, value]) => [key, interpolate(value, params)])) as typeof copy.sheet}
        messages={{ lotNumber: messages.lot.lotNumber, bidder: messages.home.market.bidder, you: messages.home.market.you, types: messages.categories.singular, countries: messages.countries, photoComing: messages.common.photoComing }}
      />
    </section>
  );
}
