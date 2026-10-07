import type { NextConfig } from "next";
import { localizedRewrites } from "@bba/i18n";

const config: NextConfig = {
  transpilePackages: ["@bba/ui", "@bba/i18n", "@bba/contracts", "@bba/sdk", "@bba/domain"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    deviceSizes: [390, 640, 768, 1080, 1280, 1920, 2400],
  },
  devIndicators: false,
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
  // French pages live at French paths and render the English-named route folders.
  async rewrites() {
    return { beforeFiles: localizedRewrites(), afterFiles: [], fallback: [] };
  },
};

export default config;
