/** French is the default; English is the only secondary public language. */
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export const intlLocales: Readonly<Record<Locale, string>> = { fr: "fr-FR", en: "en-GB" };

/** Each language named in its own language, for the language menu. */
export const languageNames: Readonly<Record<Locale, string>> = { fr: "Français", en: "English" };

export const openGraphLocales: Readonly<Record<Locale, string>> = { fr: "fr_FR", en: "en_GB" };

/** Times are stored in UTC and displayed in the platform's time zone. */
export const displayTimeZone = "Europe/Paris";
