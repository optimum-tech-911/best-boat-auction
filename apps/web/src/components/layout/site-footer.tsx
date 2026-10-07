import Link from "next/link";
import { Suspense } from "react";
import { href, interpolate, type Locale, type Messages, type RouteName } from "@bba/i18n";
import { BrandLogo } from "@bba/ui";
import { NewsletterForm } from "@/features/engagement/newsletter-form";
import { SellDiscoveryLink } from "@/features/seller/seller-discovery";
import { ruleParams } from "@/lib/rule-params";
import { LanguageSwitch } from "./language-switch";

type FooterLink = { label: keyof Messages["footer"]["links"]; route: RouteName; hash?: string };

const columns: readonly { title: keyof Messages["footer"]["columns"]; links: readonly FooterLink[] }[] = [
  { title: "buy", links: [{ label: "auctions", route: "auctions" }, { label: "results", route: "results" }, { label: "calendar", route: "calendar" }] },
  { title: "sell", links: [{ label: "sell", route: "sell" }, { label: "estimate", route: "sell", hash: "estimation" }, { label: "sellerFees", route: "sell", hash: "packs" }, { label: "brokers", route: "brokers" }] },
  { title: "company", links: [{ label: "howItWorks", route: "howItWorks" }, { label: "fees", route: "howItWorks", hash: "frais" }, { label: "services", route: "services" }] },
  { title: "help", links: [{ label: "faq", route: "howItWorks", hash: "questions" }, { label: "account", route: "account" }] },
];

const legalLinks: readonly { label: keyof Messages["footer"]["legal"]; route: RouteName }[] = [
  { label: "legalNotice", route: "legalNotice" },
  { label: "terms", route: "terms" },
  { label: "privacy", route: "privacy" },
  { label: "cookies", route: "cookies" },
];

/** G2 footer: navy-950; identity and newsletter, four link columns, then the legal line and language. */
export function SiteFooter({ locale, messages, year }: { locale: Locale; messages: Messages; year: number }) {
  const { footer } = messages;
  return (
    <footer className="on-dark bg-navy-950 pb-10 pt-20 text-ivory-100">
      <div className="page-container">
        <div className="grid gap-10 border-b border-ivory-100/16 pb-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href={href(locale, "home")} aria-label={messages.a11y.homeLink} className="inline-block">
              <BrandLogo inverse className="w-logo-lg" />
            </Link>
            <p className="mt-6 type-title-m text-ivory-100">{footer.tagline}</p>
            <p className="mt-2 max-w-intro type-body-m text-mist-300">{interpolate(footer.description, ruleParams(locale))}</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <NewsletterForm
              locale={locale}
              variant="footer"
              messages={{ label: footer.newsletterLabel, placeholder: footer.newsletterPlaceholder, action: footer.newsletterAction, consent: messages.home.newsletter.consent, success: messages.home.newsletter.success, demo: messages.home.newsletter.demo, errors: messages.home.newsletter.errors }}
            />
          </div>
        </div>

        <nav aria-label={messages.a11y.footerNavigation} className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="type-eyebrow text-mist-300">{footer.columns[column.title]}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => {
                  const Control = link.label === "sell" ? SellDiscoveryLink : Link;
                  return (
                  <li key={link.label}>
                    <Control href={`${href(locale, link.route)}${link.hash ? `#${link.hash}` : ""}`} className="type-body-m text-ivory-100 hover:underline underline-offset-4">
                      {footer.links[link.label]}
                    </Control>
                  </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <p className="max-w-measure type-body-s text-mist-300">{footer.trust}</p>

        <div className="mt-8 flex flex-col gap-4 border-t border-ivory-100/16 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 type-caption text-mist-300 sm:flex-row sm:gap-4">
            <p>{interpolate(footer.copyright, { year })}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {legalLinks.map((link) => (
                <li key={link.route}>
                  <Link href={href(locale, link.route)} className="hover:text-ivory-100 hover:underline underline-offset-3">{footer.legal[link.label]}</Link>
                </li>
              ))}
            </ul>
          </div>
          <Suspense><LanguageSwitch locale={locale} labelTemplate={messages.a11y.currentLanguage} tone="inverse" placement="above" /></Suspense>
        </div>
      </div>
    </footer>
  );
}
