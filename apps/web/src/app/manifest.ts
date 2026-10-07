import type { MetadataRoute } from "next";
import { defaultLocale, getMessages } from "@bba/i18n";
import { colors } from "@bba/ui/tokens";

export default function manifest(): MetadataRoute.Manifest {
  const { meta } = getMessages(defaultLocale);
  return {
    id: "/",
    name: meta.siteName,
    short_name: meta.siteName,
    description: meta.tagline,
    lang: defaultLocale,
    start_url: `/${defaultLocale}`,
    scope: "/",
    display: "standalone",
    background_color: colors.ivory[100],
    theme_color: colors.navy[900],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
