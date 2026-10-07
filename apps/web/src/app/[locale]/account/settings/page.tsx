import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, isLocale } from "@bba/i18n";
import { SettingsScreen } from "@/features/account/settings-screen";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/settings">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getMessages(locale).account.settings.title } : {};
}

/** ACC settings: profile, security, identity check, notifications and company details. */
export default async function AccountSettingsPage({ params }: PageProps<"/[locale]/account/settings">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { account, auth, countries, nav } = getMessages(locale);
  return (
    <SettingsScreen
      locale={locale}
      messages={{
        account,
        auth: { verifyBody: auth.verifyBody, verifyAction: auth.verifyAction, verifyDemo: auth.verifyDemo, verified: auth.verified, notVerified: auth.notVerified, email: auth.email },
        countries,
        signOut: nav.signOut,
        myBids: nav.myBids,
      }}
    />
  );
}
