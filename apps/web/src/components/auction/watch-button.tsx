"use client";

import { Heart } from "lucide-react";
import { interpolate } from "@bba/i18n";
import { cx, Icon } from "@bba/ui";
import { useLiveAuction, useWatchlist } from "@/features/live/live-auction";

interface WatchButtonProps {
  lotId: string;
  title: string;
  labels: { watchAdd: string; watchRemove: string };
  className?: string;
}

/** C-10 watch control: a 36 px square, ivory at 92 %, navy heart filled when the lot is followed. */
export function WatchButton({ lotId, title, labels, className }: WatchButtonProps) {
  const live = useLiveAuction();
  const watched = useWatchlist().includes(lotId);
  return (
    <button
      type="button"
      aria-pressed={watched}
      aria-label={interpolate(watched ? labels.watchRemove : labels.watchAdd, { title })}
      onClick={() => live.setWatched(lotId, !watched)}
      className={cx("grid size-control-sm place-items-center rounded-sm bg-ivory-100/92 text-navy-900 transition-colors duration-fast hover:bg-ivory-100", className)}
    >
      <Icon icon={Heart} size="card" fill={watched ? "currentColor" : "none"} />
    </button>
  );
}
