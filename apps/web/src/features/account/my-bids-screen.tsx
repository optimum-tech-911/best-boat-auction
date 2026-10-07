"use client";

import Link from "next/link";
import { LogIn, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import type { LotSummary, ViewerLotStatus } from "@bba/contracts";
import { href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { Button, buttonClasses, ButtonContent, cx, EmptyState, SectionHeader, Tabs } from "@bba/ui";
import { LotCard } from "@/components/auction/lot-card";
import { LotRow } from "@/components/auction/lot-row";
import type { AuctionMessages } from "@/components/auction/messages";
import { useAuthDialog } from "@/features/account/auth-dialog";
import { useViewer, useViewerPositions, useWatchlist } from "@/features/live/live-auction";

const statusTabs: readonly ViewerLotStatus[] = ["leading", "outbid", "won", "lost", "awaiting_seller"];

export interface MyBidsMessages {
  account: Messages["account"];
  myBids: string;
  watchlist: string;
  card: AuctionMessages;
}

interface MyBidsScreenProps {
  locale: Locale;
  /** Every lot the viewer may have bid on or watched: the open sale and the results. */
  lots: readonly LotSummary[];
  messages: MyBidsMessages;
}

/** ACC "Mes enchères": C-16 tabs by status listing C-11 rows, then the watchlist as C-10 cards. */
export function MyBidsScreen({ locale, lots, messages }: MyBidsScreenProps) {
  const copy = messages.account;
  const viewer = useViewer();
  const positions = useViewerPositions();
  const watchlist = useWatchlist();
  const auth = useAuthDialog();
  const [tab, setTab] = useState<ViewerLotStatus>("leading");
  const byId = useMemo(() => new Map(lots.map((lot) => [lot.id, lot])), [lots]);

  if (!viewer) {
    return (
      <div className="page-container py-12 lg:py-20">
        <SectionHeader as="h1" title={messages.myBids} />
        <EmptyState icon={LogIn} title={copy.signedOut.title} action={<Button variant="primary" onClick={() => auth.open()}>{copy.signedOut.action}</Button>}>
          {copy.signedOut.text}
        </EmptyState>
      </div>
    );
  }

  const lotsWith = (status: ViewerLotStatus) => positions.flatMap((position) => {
    const lot = position.status === status ? byId.get(position.lotId) : undefined;
    return lot ? [lot] : [];
  });
  const watched = watchlist.flatMap((id) => {
    const lot = byId.get(id);
    return lot ? [lot] : [];
  });

  return (
    <div className="page-container py-12 lg:py-20">
      <SectionHeader
        as="h1"
        title={messages.myBids}
        intro={interpolate(copy.greeting, { name: viewer.displayName })}
        action={(
          <Link href={href(locale, "accountSettings")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            <ButtonContent icon={Settings} size="sm">{copy.settingsLink}</ButtonContent>
          </Link>
        )}
      />

      <Tabs
        className="mt-10"
        label={copy.tabs.label}
        value={tab}
        onChange={(id) => setTab(id as ViewerLotStatus)}
        tabs={statusTabs.map((status) => {
          const items = lotsWith(status);
          return {
            id: status,
            label: <>{copy.tabs[status]} <span className="type-num-s">({items.length})</span></>,
            content: items.length > 0
              ? <div>{items.map((lot) => <LotRow key={lot.id} lot={lot} locale={locale} messages={messages.card} />)}</div>
              : <EmptyTab text={copy.empty[status]} link={{ label: copy.browse, href: href(locale, "auctions") }} />,
          };
        })}
      />

      <section aria-labelledby="watchlist-title" className="mt-16 lg:mt-24">
        <h2 id="watchlist-title" className="type-display-s text-navy-900">
          {messages.watchlist} <span className="type-num-m text-stone-600">({watched.length})</span>
        </h2>
        {watched.length > 0 ? (
          <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {watched.map((lot) => (
              <li key={lot.id}>
                <LotCard lot={lot} locale={locale} messages={messages.card} headingLevel="h3" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 300px" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyTab className="mt-6" text={copy.watchlistEmpty} link={{ label: copy.browse, href: href(locale, "auctions") }} />
        )}
      </section>
    </div>
  );
}

function EmptyTab({ text, link, className }: { text: string; link: { label: string; href: string }; className?: string }) {
  return (
    <div className={cx("flex flex-col items-start gap-2 rounded-md border border-dashed border-stone-300 p-6", className)}>
      <p className="type-body-m text-stone-600">{text}</p>
      <Link href={link.href} className={buttonClasses({ variant: "link" })}>
        <ButtonContent arrow>{link.label}</ButtonContent>
      </Link>
    </div>
  );
}
