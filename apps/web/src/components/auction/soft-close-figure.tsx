import { defaultAuctionRules } from "@bba/domain";
import { formatClock, interpolate, type Locale, type Messages } from "@bba/i18n";
import { SoftCloseDiagram } from "@bba/ui";

const MINUTE = 60_000;

interface SoftCloseFigureProps {
  closesAt: number;
  locale: Locale;
  messages: Messages["diagrams"]["softClose"];
  /** A lot's own conditions; the house rules otherwise. */
  windowMinutes?: number;
  extensionMinutes?: number;
}

/** SC-02 for a lot closing at `closesAt`: a bid halfway through the soft-close window and the extension it causes. */
export function SoftCloseFigure({
  closesAt,
  locale,
  messages,
  windowMinutes = defaultAuctionRules.softCloseWindowMs / MINUTE,
  extensionMinutes = defaultAuctionRules.extensionMs / MINUTE,
}: SoftCloseFigureProps) {
  const bidAt = closesAt - (windowMinutes * MINUTE) / 2;
  return (
    <SoftCloseDiagram
      title={messages.title}
      times={{
        start: formatClock(closesAt - windowMinutes * MINUTE, locale),
        scheduled: formatClock(closesAt, locale),
        bid: formatClock(bidAt, locale, { seconds: true }),
        newEnd: formatClock(bidAt + extensionMinutes * MINUTE, locale, { seconds: true }),
        end: formatClock(closesAt + 3 * MINUTE, locale),
      }}
      labels={{ scheduled: messages.scheduled, bid: messages.bid, newEnd: messages.newEnd, window: interpolate(messages.window, { minutes: windowMinutes }) }}
      caption={interpolate(messages.caption, { window: windowMinutes, extension: extensionMinutes })}
    />
  );
}
