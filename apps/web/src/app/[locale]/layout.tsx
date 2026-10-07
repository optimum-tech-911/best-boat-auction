import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { getMessages, isLocale, locales, openGraphLocales, translatePath, type Locale } from "@bba/i18n";
import { ClockProvider, ToastProvider } from "@bba/ui";
import { colors } from "@bba/ui/tokens";
import { DemoBar } from "@/components/layout/demo-bar";
import { MobileSellBar } from "@/components/layout/mobile-sell-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthDialogProvider } from "@/features/account/auth-dialog";
import { LiveAuctionProvider } from "@/features/live/live-auction";
import { LiveNotifications } from "@/features/live/live-notifications";
import { getRequestContext } from "@/lib/backend";
import "../globals.css";
import "@bba/ui/motion.css";
import "@bba/ui/components.css";

const display = localFont({
  src: "../../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", weight: "400" },
    { path: "../../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2", weight: "500" },
    { path: "../../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-ui",
  display: "swap",
});

export const viewport: Viewport = { themeColor: colors.navy[900] };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { meta } = getMessages(locale);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    applicationName: meta.siteName,
    title: { default: meta.title, template: meta.titleTemplate.replace("{page}", "%s") },
    description: meta.description,
    // The maquette stays out of search engines until launch.
    robots: { index: false, follow: false },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: meta.siteName, statusBarStyle: "default" },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    },
    openGraph: { siteName: meta.siteName, title: meta.title, description: meta.description, locale: openGraphLocales[locale], type: "website" },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
    alternates: { languages: { fr: translatePath(`/${locale}`, "fr"), en: translatePath(`/${locale}`, "en"), "x-default": "/fr" } },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: requested } = await params;
  if (!isLocale(requested)) notFound();
  const locale: Locale = requested;
  const messages = getMessages(locale);
  const { now, scenario, viewer } = await getRequestContext();

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="sr-only z-toast rounded-sm bg-navy-900 px-4 py-3 type-button-sm text-ivory-100 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          {messages.a11y.skipToContent}
        </a>
        <ClockProvider serverNow={now}>
          <LiveAuctionProvider serverNow={now} viewer={viewer}>
            <ToastProvider dismissLabel={messages.notifications.dismiss}>
              <AuthDialogProvider messages={{ auth: messages.auth, common: messages.common }}>
                <DemoBar messages={{ demo: messages.demo, common: messages.common }} scenario={scenario} />
                <SiteHeader locale={locale} messages={{ nav: messages.nav, a11y: messages.a11y, common: messages.common }} />
                <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
                <SiteFooter locale={locale} messages={messages} year={new Date(now).getUTCFullYear()} />
                <div className="h-bar-mobile lg:hidden" aria-hidden="true" />
                <MobileSellBar locale={locale} label={messages.nav.sell} />
                <LiveNotifications locale={locale} messages={messages.notifications} />
              </AuthDialogProvider>
            </ToastProvider>
          </LiveAuctionProvider>
        </ClockProvider>
      </body>
    </html>
  );
}
