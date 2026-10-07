import { intlLocales, type Locale } from "./locales";

export type TextParams = Readonly<Record<string, string | number>>;

/** Replaces `{name}` placeholders. Messages stay plain data, so they can cross to client components. */
export function interpolate(template: string, params: TextParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in params ? String(params[name]) : placeholder));
}

/** A message that depends on a count, keyed by the plural category of the language; `zero` reads better than "0 …" where given. */
export interface PluralText {
  zero?: string;
  one: string;
  other: string;
}

const pluralRules = new Map<Locale, Intl.PluralRules>();

export function plural(locale: Locale, text: PluralText, count: number, params: TextParams = {}): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(intlLocales[locale]);
    pluralRules.set(locale, rules);
  }
  const template = count === 0 && text.zero !== undefined ? text.zero : rules.select(count) === "one" ? text.one : text.other;
  return interpolate(template, { count, ...params });
}
