/**
 * Design tokens of DESIGN_SYSTEM.md sections 2–6 and DESIGN_V1_1.md G0-11.
 * This directory is the only place where raw colour values and pixel sizes are written;
 * everything else uses these tokens through Tailwind or CSS custom properties.
 */

export const colors = {
  navy: { 950: "#061420", 900: "#0B1F33", 700: "#1E3A52", 500: "#3E5F7D" },
  ivory: { 100: "#F6F4EF" },
  white: "#FFFFFF",
  stone: { 100: "#EFEBE4", 200: "#E6E1D8", 300: "#D8D2C6", 600: "#6B6559" },
  mist: { 300: "#A9B4BF" },
  teal: { 50: "#E8F1F0", 700: "#2E7477", 800: "#235B5E" },
  orange: { 600: "#C86B32", 800: "#9A4E22" },
  success: { 50: "#E7F0EA", 700: "#2F6B4F" },
  danger: { 50: "#F7E8E6", 700: "#A63A32" },
} as const;

/** Diagrams and charts only. Each segment also shows its value in text. */
export const chartColors = {
  1: colors.navy[900],
  2: colors.navy[700],
  3: colors.navy[500],
  4: colors.mist[300],
  5: colors.stone[600],
  6: colors.stone[300],
  7: colors.stone[200],
} as const;

/** The basemap, restyled to the brand: ivory land, a quiet sea, navy labels. Maps only. */
export const mapColors = {
  land: colors.ivory[100],
  green: colors.stone[100],
  urban: colors.stone[100],
  building: colors.stone[200],
  water: "#C9D6DE",
  waterLabel: colors.navy[500],
  label: colors.navy[900],
  labelSoft: colors.stone[600],
  halo: colors.ivory[100],
  boundary: colors.mist[300],
  area: colors.navy[900],
  areaFill: "rgba(11,31,51,0.10)",
  marker: colors.navy[900],
  markerRing: colors.white,
} as const;

export const fontFamilies = {
  display: ["var(--font-display)", "Georgia", "serif"],
  sans: ["var(--font-ui)", "Arial", "sans-serif"],
} as const;

interface TypeSize {
  size: number;
  lineHeight: number;
}

export interface TypeToken {
  family: "display" | "sans";
  weight: 400 | 500 | 600;
  desktop: TypeSize;
  mobile: TypeSize;
  tracking: string;
  numeric?: boolean;
  uppercase?: boolean;
}

/** Desktop sizes apply from the lg breakpoint (1024 px). */
export const typography = {
  "display-xl": { family: "display", weight: 400, desktop: { size: 80, lineHeight: 76 }, mobile: { size: 48, lineHeight: 48 }, tracking: "-0.02em" },
  "display-l": { family: "display", weight: 400, desktop: { size: 56, lineHeight: 58 }, mobile: { size: 40, lineHeight: 42 }, tracking: "-0.015em" },
  "display-m": { family: "display", weight: 400, desktop: { size: 40, lineHeight: 44 }, mobile: { size: 32, lineHeight: 36 }, tracking: "-0.01em" },
  "display-s": { family: "display", weight: 400, desktop: { size: 28, lineHeight: 32 }, mobile: { size: 24, lineHeight: 28 }, tracking: "-0.005em" },
  "display-xs": { family: "display", weight: 400, desktop: { size: 24, lineHeight: 28 }, mobile: { size: 22, lineHeight: 26 }, tracking: "0" },
  "title-l": { family: "sans", weight: 600, desktop: { size: 20, lineHeight: 28 }, mobile: { size: 18, lineHeight: 26 }, tracking: "-0.01em" },
  "title-m": { family: "sans", weight: 600, desktop: { size: 16, lineHeight: 24 }, mobile: { size: 16, lineHeight: 24 }, tracking: "0" },
  "body-l": { family: "sans", weight: 400, desktop: { size: 18, lineHeight: 30 }, mobile: { size: 17, lineHeight: 28 }, tracking: "0" },
  "body-m": { family: "sans", weight: 400, desktop: { size: 16, lineHeight: 26 }, mobile: { size: 16, lineHeight: 26 }, tracking: "0" },
  "body-s": { family: "sans", weight: 400, desktop: { size: 14, lineHeight: 22 }, mobile: { size: 14, lineHeight: 22 }, tracking: "0" },
  caption: { family: "sans", weight: 500, desktop: { size: 12, lineHeight: 16 }, mobile: { size: 12, lineHeight: 16 }, tracking: "0.01em" },
  eyebrow: { family: "sans", weight: 600, desktop: { size: 12, lineHeight: 16 }, mobile: { size: 11, lineHeight: 16 }, tracking: "0.12em", uppercase: true },
  "num-xl": { family: "sans", weight: 600, desktop: { size: 44, lineHeight: 48 }, mobile: { size: 36, lineHeight: 40 }, tracking: "-0.02em", numeric: true },
  "num-l": { family: "sans", weight: 600, desktop: { size: 28, lineHeight: 32 }, mobile: { size: 24, lineHeight: 28 }, tracking: "-0.01em", numeric: true },
  "num-m": { family: "sans", weight: 600, desktop: { size: 20, lineHeight: 28 }, mobile: { size: 18, lineHeight: 24 }, tracking: "-0.01em", numeric: true },
  "num-s": { family: "sans", weight: 500, desktop: { size: 14, lineHeight: 20 }, mobile: { size: 14, lineHeight: 20 }, tracking: "0", numeric: true },
  // C-01 button labels.
  "button-lg": { family: "sans", weight: 600, desktop: { size: 16, lineHeight: 20 }, mobile: { size: 16, lineHeight: 20 }, tracking: "0" },
  "button-md": { family: "sans", weight: 600, desktop: { size: 15, lineHeight: 20 }, mobile: { size: 15, lineHeight: 20 }, tracking: "0" },
  "button-sm": { family: "sans", weight: 600, desktop: { size: 14, lineHeight: 20 }, mobile: { size: 14, lineHeight: 20 }, tracking: "0" },
  // C-06 badges: the eyebrow style at 11 px.
  badge: { family: "sans", weight: 600, desktop: { size: 11, lineHeight: 16 }, mobile: { size: 11, lineHeight: 16 }, tracking: "0.12em", uppercase: true },
  // C-02 field labels: Inter 500 14 / 20.
  label: { family: "sans", weight: 500, desktop: { size: 14, lineHeight: 20 }, mobile: { size: 14, lineHeight: 20 }, tracking: "0" },
} as const satisfies Record<string, TypeToken>;

export type TypeTokenName = keyof typeof typography;

export const screens = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;

/** The only spacing values (px). */
export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128] as const;

/** Component dimensions named by the design system (px). */
export const sizes = {
  "hairline": 1,
  "underline": 2,
  "track": 4,
  "bar": 6,
  "dot": 8,
  "swatch": 10,
  "flag-h": 12,
  "icon-s": 16,
  "icon-m": 20,
  "icon-l": 24,
  "control-sm": 36,
  "control-md": 44,
  "control-lg": 52,
  "input": 48,
  "input-bid": 56,
  "header": 72,
  "header-mobile": 60,
  "bar-mobile": 64,
  "row": 72,
  "row-feed": 64,
  "row-table": 56,
  "row-admin": 44,
  "thumb-w": 96,
  "thumb-h": 72,
  "thumb-sm-w": 64,
  "thumb-sm-h": 48,
  "thumb-xs-w": 56,
  "thumb-xs-h": 42,
  "gallery-thumb": 88,
  "qr": 160,
  "qr-sm": 120,
  "close": 40,
  "lightbox-arrow": 48,
  "avatar": 32,
  "digit": 56,
  "sidebar": 280,
  "admin-sidebar": 248,
  "admin-label": 200,
  "toast": 360,
  "empty": 420,
  "dialog-md": 560,
  "dialog-lg": 720,
  "form": 640,
  "wizard": 720,
  "container": 1312,
  "story-rail": 240,
  "logo-sm": 160,
  "logo": 200,
  "logo-lg": 240,
  "monogram": 40,
} as const;

/** Component spacing that the component specifications name outside the general scale (px). */
export const componentSpacing = {
  "button-lg": 28,
  "button-sm": 14,
  chip: 14,
  hint: 6,
  /** Aligns a 20 px checkbox with the first 22 px line of its label. */
  hairline: 1,
} as const;

/** Sticky elements below the header start this far from the top (px). */
export const stickyTop = 96;

/** Content container: max width and side padding per breakpoint. */
export const container = {
  maxWidth: sizes.container,
  padding: { base: 20, sm: 32, lg: 48, wide: 64 },
  wideFrom: 1440,
} as const;

export const radii = { none: 0, xs: 2, sm: 4, md: 6, lg: 8 } as const;

export const shadows = {
  dialog: "0 24px 48px -12px rgba(6,20,32,.28)",
  pop: "0 8px 24px -8px rgba(6,20,32,.20)",
} as const;

export const overlays = {
  hero: "linear-gradient(90deg, rgba(6,20,32,.86) 0%, rgba(6,20,32,.60) 38%, rgba(6,20,32,.16) 68%, rgba(6,20,32,0) 100%)",
  heroMobile: "linear-gradient(180deg, rgba(6,20,32,0) 0%, rgba(6,20,32,.35) 45%, rgba(6,20,32,.88) 100%)",
  tile: "linear-gradient(180deg, rgba(6,20,32,0) 50%, rgba(6,20,32,.72) 100%)",
  /** The 64 px fade on the carousel's right edge (M14). */
  carouselFade: `linear-gradient(90deg, rgba(246,244,239,0), ${colors.ivory[100]})`,
  /** The dialog backdrop. */
  scrim: "rgba(6,20,32,.55)",
} as const;

/** Opacity values used by the design system (percent). */
export const opacity = [0, 16, 40, 48, 60, 70, 80, 92, 100] as const;

export const durations = {
  fast: 120,
  base: 180,
  panel: 240,
  reveal: 450,
  image: 600,
  heading: 600,
  divider: 800,
  editorial: 900,
  hero: 1200,
  flash: 1200,
  skeleton: 1600,
} as const;

export const easings = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const measure = "68ch";
export const introMeasure = "56ch";
