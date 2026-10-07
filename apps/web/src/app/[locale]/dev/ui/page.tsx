import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@bba/i18n";
import { ComponentGallery } from "@/features/design-system/component-gallery";

export const metadata: Metadata = { title: "Design system" };

/** /dev/ui: every design-system component and state, for review and screenshot baselines. */
export default async function DesignSystemPage({ params }: PageProps<"/[locale]/dev/ui">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ComponentGallery locale={locale} />;
}
