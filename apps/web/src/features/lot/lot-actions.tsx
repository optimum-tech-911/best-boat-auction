"use client";

import { Heart, Share2 } from "lucide-react";
import { plural, type Locale, type Messages } from "@bba/i18n";
import { Button, useToast } from "@bba/ui";
import { useLiveAuction, useWatchlist } from "@/features/live/live-auction";

interface LotActionsProps {
  lotId: string;
  title: string;
  /** People following the lot besides the viewer. */
  watchers: number;
  locale: Locale;
  labels: Pick<Messages["lot"], "watch" | "watching" | "share" | "linkCopied" | "watchers">;
}

/** The lot header's secondary actions: follow the lot, see how many people follow it, and share its link. */
export function LotActions({ lotId, title, watchers, locale, labels }: LotActionsProps) {
  const live = useLiveAuction();
  const toast = useToast();
  const watched = useWatchlist().includes(lotId);
  const followers = watchers + (watched ? 1 : 0);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unavailable: fall back to copying the link.
      }
    }
    await navigator.clipboard?.writeText(url);
    toast({ tone: "info", title: labels.linkCopied, body: url });
  };
  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={Heart} aria-pressed={watched} onClick={() => live.setWatched(lotId, !watched)}>
          {watched ? labels.watching : labels.watch}
        </Button>
        <Button variant="secondary" size="sm" icon={Share2} onClick={() => void share()}>{labels.share}</Button>
      </div>
      <p className="type-body-s numerals text-stone-600">{plural(locale, labels.watchers, followers, { count: followers })}</p>
    </div>
  );
}
