import { displayTimeZone, intlLocales, type Locale } from "./locales";

/*
 * Every number, amount and date reaches the screen through these formatters
 * (DESIGN_SYSTEM.md section 9). Never format money or thin spaces by hand.
 */

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat | Intl.PluralRules>();

function memo<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat | Intl.PluralRules>(key: string, create: () => T): T {
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) {
    formatter = create();
    cache.set(key, formatter);
  }
  return formatter;
}

const numberFormat = (locale: Locale, options: Intl.NumberFormatOptions) =>
  memo(`n|${locale}|${JSON.stringify(options)}`, () => new Intl.NumberFormat(intlLocales[locale], options));

const dateFormat = (locale: Locale, options: Intl.DateTimeFormatOptions) =>
  memo(`d|${locale}|${JSON.stringify(options)}`, () => new Intl.DateTimeFormat(intlLocales[locale], { timeZone: displayTimeZone, ...options }));

/* ------------------------------------------------------------------ numbers */

/** fr "42 500 €" · en "€42,500". Amounts are integer cents. */
export function formatMoney(cents: number, locale: Locale, options: { withCents?: boolean } = {}): string {
  const digits = options.withCents ? 2 : 0;
  return numberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100);
}

/** The amount without its currency symbol, as typed in a money input: fr "42 500" · en "42,500". */
export function formatAmount(cents: number, locale: Locale): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(cents / 100));
}

/** Reads whole euros typed in any grouping style and returns cents. */
export function parseAmount(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits.slice(0, 12)) * 100 : 0;
}

export function formatNumber(value: number, locale: Locale, fractionDigits = 0): string {
  return numberFormat(locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
}

/** Basis points as a percentage: 1800 → fr "18 %" · en "18%". */
export function formatPercent(basisPoints: number, locale: Locale): string {
  return numberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(basisPoints / 10_000);
}

/** Centimetres as metres: fr "11,40 m" · en "11.40 m". */
export function formatLength(centimetres: number, locale: Locale): string {
  return `${formatNumber(centimetres / 100, locale, 2)}\u00a0m`;
}

/* -------------------------------------------------------------------- dates */

type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;

function dateParts(instant: number, locale: Locale, options: Intl.DateTimeFormatOptions): Parts {
  const parts: Parts = {};
  for (const part of dateFormat(locale, options).formatToParts(new Date(instant))) parts[part.type] = part.value;
  return parts;
}

/** 24-hour clock. fr "20 h 00" (compact: "20 h") · en "20:00". */
export function formatTime(instant: number, locale: Locale, options: { compact?: boolean } = {}): string {
  const { hour = "00", minute = "00" } = dateParts(instant, locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  if (locale === "fr") {
    const hours = String(Number(hour));
    return options.compact && minute === "00" ? `${hours}\u00a0h` : `${hours}\u00a0h\u00a0${minute}`;
  }
  return `${hour}:${minute}`;
}

/** A clock reading for timelines and bid histories: "19:57" or "19:57:30" in both languages. */
export function formatClock(instant: number, locale: Locale, options: { seconds?: boolean } = {}): string {
  const { hour = "00", minute = "00", second = "00" } = dateParts(instant, locale, {
    hour: "2-digit", minute: "2-digit", ...(options.seconds ? { second: "2-digit" } : {}), hourCycle: "h23",
  });
  return options.seconds ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;
}

export interface DayOptions {
  weekday?: "long" | "short" | false;
  month?: "long" | "short";
  year?: boolean;
}

/** fr "lundi 19 octobre" · "sam. 14 nov." · en "Monday 19 October" · "Sat 14 Nov". */
export function formatDay(instant: number, locale: Locale, { weekday = "long", month = "long", year = false }: DayOptions = {}): string {
  const parts = dateParts(instant, locale, {
    ...(weekday ? { weekday } : {}),
    day: "numeric",
    month,
    ...(year ? { year: "numeric" } : {}),
  });
  return [parts.weekday, parts.day, parts.month, parts.year].filter(Boolean).join(" ");
}

/** fr "lundi 19 octobre 2026 à 20 h 00" · en "Monday 19 October 2026 at 20:00". */
export function formatDateLong(instant: number, locale: Locale): string {
  const at = locale === "fr" ? "à" : "at";
  return `${formatDay(instant, locale, { year: true })} ${at} ${formatTime(instant, locale)}`;
}

/** fr "19 oct. · 20 h 00" · en "19 Oct · 20:00". */
export function formatDateShort(instant: number, locale: Locale): string {
  return `${formatDay(instant, locale, { weekday: false, month: "short" })} · ${formatTime(instant, locale)}`;
}

/** fr "lundi 19 octobre · 20 h 00" · en "Monday 19 October · 20:00". */
export function formatDateTime(instant: number, locale: Locale): string {
  return `${formatDay(instant, locale)} · ${formatTime(instant, locale)}`;
}

/** fr "10 h – 12 h" · en "10:00 – 12:00". */
export function formatTimeRange(from: number, to: number, locale: Locale): string {
  return `${formatTime(from, locale, { compact: true })} – ${formatTime(to, locale, { compact: true })}`;
}

/** fr "octobre" · en "October". */
export function formatMonth(instant: number, locale: Locale, options: { year?: boolean } = {}): string {
  return dateFormat(locale, { month: "long", ...(options.year ? { year: "numeric" } : {}) }).format(new Date(instant));
}

export function formatYear(instant: number, locale: Locale): string {
  return dateFormat(locale, { year: "numeric" }).format(new Date(instant));
}

const frenchVowel = /^[aeiouyàâäéèêëîïôöûü]/i;

/** fr "Vente d’octobre" · "Vente de novembre" (or "vente d’octobre" inside a sentence) · en "October auction". */
export function formatSaleName(instant: number, locale: Locale, options: { inSentence?: boolean } = {}): string {
  const month = formatMonth(instant, locale);
  if (locale === "fr") return `${options.inSentence ? "vente" : "Vente"} ${frenchVowel.test(month) ? "d’" : "de "}${month}`;
  return `${month} auction`;
}

/* ---------------------------------------------------------------- durations */

const units = {
  fr: { day: "j", hour: "h", minute: "min", ended: "Clôturé", closesIn: "Clôture dans" },
  en: { day: "d", hour: "h", minute: "min", ended: "Closed", closesIn: "Closes in" },
} as const;

const durationWords = {
  fr: { day: ["jour", "jours"], hour: ["heure", "heures"], minute: ["minute", "minutes"], and: "et", lessThanMinute: "moins d’une minute" },
  en: { day: ["day", "days"], hour: ["hour", "hours"], minute: ["minute", "minutes"], and: "and", lessThanMinute: "less than a minute" },
} as const;

export interface CountdownText {
  /** What the clock shows: "12 j 04 h", "4 h 12 min", "04:28" or "Clôturé". */
  text: string;
  /** The same duration in words for assistive technology, refreshed once per minute. */
  spoken: string;
  /** The timer's accessible name: "Clôture dans 4 minutes", or "Clôturé". */
  label: string;
  ended: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");

function words(locale: Locale, unit: "day" | "hour" | "minute", count: number): string {
  const rules = memo(`p|${locale}`, () => new Intl.PluralRules(intlLocales[locale]));
  const [one, other] = durationWords[locale][unit];
  return `${count} ${rules.select(count) === "one" ? one : other}`;
}

/** DESIGN_SYSTEM.md section 9: ≥ 24 h "12 j 04 h"; ≥ 1 h "4 h 12 min"; under 1 h "04:28"; ended "Clôturé". */
export function formatCountdown(remainingMs: number, locale: Locale): CountdownText {
  const unit = units[locale];
  if (remainingMs <= 0) return { text: unit.ended, spoken: unit.ended, label: unit.ended, ended: true };
  const { text, spoken } = countdownParts(remainingMs, locale);
  return { text, spoken, label: `${unit.closesIn} ${spoken}`, ended: false };
}

function countdownParts(remainingMs: number, locale: Locale): { text: string; spoken: string } {
  const unit = units[locale];
  const seconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const and = durationWords[locale].and;
  if (days > 0) {
    return { text: `${days}\u00a0${unit.day} ${pad(hours)}\u00a0${unit.hour}`, spoken: `${words(locale, "day", days)} ${and} ${words(locale, "hour", hours)}` };
  }
  if (hours > 0) {
    return { text: `${hours}\u00a0${unit.hour} ${pad(minutes)}\u00a0${unit.minute}`, spoken: `${words(locale, "hour", hours)} ${and} ${words(locale, "minute", minutes)}` };
  }
  return {
    text: `${pad(minutes)}:${pad(seconds % 60)}`,
    spoken: minutes > 0 ? words(locale, "minute", minutes) : durationWords[locale].lessThanMinute,
  };
}

/** fr "il y a 1 min" · en "1 min ago". */
export function formatRelativeTime(elapsedMs: number, locale: Locale): string {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const format = memo(`r|${locale}`, () => new Intl.RelativeTimeFormat(intlLocales[locale], { numeric: "auto", style: "short" }));
  if (seconds < 60) return format.format(-seconds, "second");
  if (seconds < 3_600) return format.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86_400) return format.format(-Math.floor(seconds / 3_600), "hour");
  return format.format(-Math.floor(seconds / 86_400), "day");
}
