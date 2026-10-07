"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AT, BE, DE, ES, FR, HR, IT, NL } from "country-flag-icons/react/3x2";
import { formatCountdown, formatMoney, type Locale } from "@bba/i18n";
import { useNow } from "./clock";
import { cx } from "./primitives";

/** C-06 badge on images: ivory-100, navy-900 text, radius-xs. At most one per image. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex rounded-xs bg-ivory-100 px-2 py-1 type-badge text-navy-900", className)}>{children}</span>;
}

/** The static 8 px orange live dot (G0-3). Never pulsing. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("inline-block size-dot shrink-0 rounded-full bg-orange-600", className)} />;
}

export type StatusTone = "leading" | "outbid" | "urgent" | "waiting" | "sold" | "live" | "met";

const statusTones: Record<StatusTone, { dot: string; text: string }> = {
  leading: { dot: "bg-success-700", text: "text-success-700" },
  met: { dot: "bg-success-700", text: "text-success-700" },
  outbid: { dot: "bg-danger-700", text: "text-danger-700" },
  urgent: { dot: "bg-orange-600", text: "text-orange-800" },
  waiting: { dot: "bg-stone-600", text: "text-stone-600" },
  sold: { dot: "bg-navy-900", text: "text-navy-900" },
  live: { dot: "bg-orange-600", text: "text-current" },
};

/** Remembers whether a value changed since the first render, to animate changes only. */
function useChanged(value: unknown): boolean {
  const first = useRef(value);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (!changed && value !== first.current) setChanged(true);
  }, [value, changed]);
  return changed;
}

/** C-07 status line: an 8 px static dot followed by eyebrow text. Never a pill. */
export function StatusLine({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  const changed = useChanged(`${tone}|${String(children)}`);
  const colours = statusTones[tone];
  return (
    <span key={changed ? `${tone}|${String(children)}` : "initial"} className={cx("inline-flex items-center gap-2 type-eyebrow", colours.text, changed && "motion-status-in", className)}>
      <span aria-hidden="true" className={cx("size-dot shrink-0 rounded-full", colours.dot)} />
      <span>{children}</span>
    </span>
  );
}

const flags = { AT, BE, DE, ES, FR, HR, IT, NL } as const;

/** A 16 × 12 SVG flag, always next to the country code or name. */
export function Flag({ country, title }: { country: string; title?: string }) {
  const Component = flags[country as keyof typeof flags];
  if (!Component) return null;
  return <Component title={title} aria-hidden={title ? undefined : true} className="inline-block h-flag-h w-icon-s shrink-0 rounded-xs" />;
}

export type CountdownSize = "s" | "m" | "l" | "xl";

const countdownSizes: Record<CountdownSize, string> = { s: "type-num-s", m: "type-num-m", l: "type-num-l", xl: "type-num-xl" };

interface CountdownProps {
  endsAt: number;
  locale: Locale;
  size?: CountdownSize;
  /** Below this remaining time the numerals turn orange (default one hour). */
  urgencyFromMs?: number;
  className?: string;
}

/**
 * C-08 countdown, on the shared server clock. Formats of DESIGN_SYSTEM.md section 9; under the
 * urgency threshold numerals of 24 px and up turn orange-600 and smaller ones orange-800.
 * Its accessible label changes once a minute.
 */
export function Countdown({ endsAt, locale, size = "m", urgencyFromMs = 3_600_000, className }: CountdownProps) {
  const now = useNow();
  const remaining = endsAt - now;
  const { text, ended } = formatCountdown(remaining, locale);
  // The accessible name changes once a minute, not every second.
  const { label } = formatCountdown(Math.ceil(Math.max(0, remaining) / 60_000) * 60_000, locale);
  const urgent = !ended && remaining < urgencyFromMs;
  const urgentColour = size === "l" || size === "xl" ? "text-orange-600" : "text-orange-800";
  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={label}
      className={cx(countdownSizes[size], "whitespace-nowrap", urgent && urgentColour, className)}
    >
      {text}
    </span>
  );
}

export type PriceSize = "s" | "m" | "l" | "xl";

interface PriceBlockProps {
  label: ReactNode;
  valueCents: number;
  locale: Locale;
  size?: PriceSize;
  note?: ReactNode;
  tone?: "default" | "inverse";
  className?: string;
}

/**
 * C-09 price block: an eyebrow label, the amount in a num token and a body-s sub-line.
 * When the amount changes it fades in from 4 px and the block flashes teal-50 (animation 5).
 */
export function PriceBlock({ label, valueCents, locale, size = "m", note, tone = "default", className }: PriceBlockProps) {
  const changed = useChanged(valueCents);
  const muted = tone === "inverse" ? "text-mist-300" : "text-stone-600";
  return (
    <div key={changed ? valueCents : "initial"} className={cx("rounded-xs", changed && tone === "default" && "motion-price-flash", className)}>
      <p className={cx("type-eyebrow", muted)}>{label}</p>
      <p className={cx(countdownSizes[size], "mt-1", tone === "inverse" ? "text-ivory-100" : "text-navy-900")}>
        <span className={cx(changed && "motion-price-in")}>{formatMoney(valueCents, locale)}</span>
      </p>
      {note && <p className={cx("mt-1 type-body-s", muted)}>{note}</p>}
    </div>
  );
}
