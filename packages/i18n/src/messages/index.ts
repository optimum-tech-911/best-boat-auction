import type { Locale } from "../locales";
import { en } from "./en";
import { fr, type Messages } from "./fr";

const dictionaries: Readonly<Record<Locale, Messages>> = { fr, en };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export type { Messages };
