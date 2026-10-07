import type { Config } from "tailwindcss";
import preset from "@bba/ui/tailwind-preset";

/** The design system's preset is the whole theme: no Tailwind defaults for colours, sizes or type. */
export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
} satisfies Config;
