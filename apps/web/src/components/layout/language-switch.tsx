"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { interpolate, languageNames, locales, translatePath, type Locale } from "@bba/i18n";
import { LanguageMenu } from "@bba/ui";

interface LanguageSwitchProps {
  locale: Locale;
  /** "Langue : {language}" */
  labelTemplate: string;
  tone?: "default" | "inverse";
  placement?: "below" | "above";
}

/** C-24 for this page: each language links to the same page and query in that language. */
export function LanguageSwitch({ locale, labelTemplate, tone, placement }: LanguageSwitchProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const options = locales.map((code) => ({
    code,
    name: languageNames[code],
    href: `${translatePath(pathname, code)}${search ? `?${search}` : ""}`,
    current: code === locale,
  }));
  return <LanguageMenu label={interpolate(labelTemplate, { language: languageNames[locale] })} options={options} tone={tone} placement={placement} linkComponent={Link} />;
}
