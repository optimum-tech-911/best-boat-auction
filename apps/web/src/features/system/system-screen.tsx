"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { defaultLocale, href, isLocale, systemMessages } from "@bba/i18n";
import { Button, buttonClasses, ButtonContent, SectionHeader } from "@bba/ui";

/**
 * The not-found and error pages, inside the site layout. Neither file receives the route's
 * parameters, so the language comes from the address.
 */
export function SystemScreen({ kind, onRetry }: { kind: "notFound" | "error"; onRetry?: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const messages = systemMessages[locale];
  const home = (
    <Link href={href(locale, "home")} className={buttonClasses({ variant: kind === "error" ? "secondary" : "primary" })}>
      <ButtonContent>{kind === "error" ? messages.error.home : messages.notFound.home}</ButtonContent>
    </Link>
  );
  const copy = kind === "error" ? messages.error : messages.notFound;
  return (
    <div className="page-container py-16 lg:py-24">
      <SectionHeader as="h1" eyebrow={copy.eyebrow} title={copy.title} intro={copy.text} />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {kind === "error" ? (
          <>
            <Button variant="primary" onClick={onRetry}>{messages.error.retry}</Button>
            {home}
          </>
        ) : (
          <>
            {home}
            <Link href={href(locale, "auctions")} className={buttonClasses({ variant: "secondary" })}>
              <ButtonContent arrow>{messages.notFound.auctions}</ButtonContent>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
