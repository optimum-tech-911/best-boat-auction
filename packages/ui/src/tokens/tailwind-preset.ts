import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import {
  chartColors,
  colors,
  componentSpacing,
  container,
  durations,
  easings,
  fontFamilies,
  introMeasure,
  measure,
  opacity,
  overlays,
  radii,
  screens,
  shadows,
  sizes,
  spacingScale,
  stickyTop,
  typography,
  type TypeToken,
} from "./tokens";

const px = (value: number) => `${value}px`;
const mapValues = <T extends Record<string, unknown>, R>(object: T, map: (value: T[keyof T]) => R) =>
  Object.fromEntries(Object.entries(object).map(([key, value]) => [key, map(value as T[keyof T])])) as Record<keyof T, R>;

/** 4 → "1", 8 → "2" … so the keys match Tailwind's usual names for the same sizes. */
const spacing = Object.fromEntries([["0", "0px"], ...spacingScale.map((value) => [String(value / 4), px(value)])]);
const namedSizes = mapValues(sizes, px);
const componentSpaces = mapValues(componentSpacing, px);

function typeClass(token: TypeToken) {
  const family = token.family === "display" ? "var(--font-display), Georgia, serif" : "var(--font-ui), Arial, sans-serif";
  const desktopDiffers = token.desktop.size !== token.mobile.size || token.desktop.lineHeight !== token.mobile.lineHeight;
  return {
    fontFamily: family,
    fontWeight: String(token.weight),
    fontSize: px(token.mobile.size),
    lineHeight: px(token.mobile.lineHeight),
    letterSpacing: token.tracking,
    ...(token.numeric ? { fontVariantNumeric: "tabular-nums lining-nums" } : {}),
    ...(token.uppercase ? { textTransform: "uppercase" } : {}),
    ...(desktopDiffers ? { [`@media (min-width: ${px(screens.lg)})`]: { fontSize: px(token.desktop.size), lineHeight: px(token.desktop.lineHeight) } } : {}),
  };
}

function cssVariables() {
  const variables: Record<string, string> = {};
  for (const [family, shades] of Object.entries(colors)) {
    if (typeof shades === "string") variables[`--color-${family}`] = shades;
    else for (const [shade, value] of Object.entries(shades)) variables[`--color-${family}-${shade}`] = value;
  }
  for (const [index, value] of Object.entries(chartColors)) variables[`--chart-${index}`] = value;
  for (const [name, value] of Object.entries(radii)) variables[`--radius-${name}`] = px(value);
  for (const [name, value] of Object.entries(shadows)) variables[`--shadow-${name}`] = value;
  for (const [name, value] of Object.entries(overlays)) variables[`--overlay-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`] = value;
  for (const [name, value] of Object.entries(durations)) variables[`--duration-${name}`] = `${value}ms`;
  for (const [name, value] of Object.entries(easings)) variables[`--ease-${name}`] = value;
  variables["--header-height"] = px(sizes["header-mobile"]);
  variables["--sticky-top"] = px(stickyTop);
  variables["--container-padding"] = px(container.padding.base);
  return variables;
}

const foundation = plugin(({ addBase, addComponents, addUtilities }) => {
  addBase({
    ":root": {
      ...cssVariables(),
      [`@media (min-width: ${px(screens.sm)})`]: { "--container-padding": px(container.padding.sm) },
      [`@media (min-width: ${px(screens.lg)})`]: { "--container-padding": px(container.padding.lg), "--header-height": px(sizes.header) },
      [`@media (min-width: ${px(container.wideFrom)})`]: { "--container-padding": px(container.padding.wide) },
    },
    "html": { scrollPaddingTop: "var(--header-height)", WebkitTextSizeAdjust: "100%" },
    "body": {
      margin: "0",
      backgroundColor: colors.ivory[100],
      color: colors.navy[900],
      ...typeClass(typography["body-m"]),
      WebkitFontSmoothing: "antialiased",
      textRendering: "optimizeLegibility",
    },
    ":focus-visible": { outline: `2px solid ${colors.teal[700]}`, outlineOffset: "2px" },
    ".on-dark :focus-visible, .on-dark:focus-visible": { outlineColor: colors.ivory[100] },
    "::selection": { backgroundColor: colors.navy[900], color: colors.ivory[100] },
    "button, a, input, select, textarea": { WebkitTapHighlightColor: "transparent" },
  });

  addComponents({
    ...Object.fromEntries(Object.entries(typography).map(([name, token]) => [`.type-${name}`, typeClass(token)])),
    ".page-container": {
      width: "100%",
      maxWidth: `calc(${px(container.maxWidth)} + 2 * var(--container-padding))`,
      marginInline: "auto",
      paddingInline: "var(--container-padding)",
    },
  });

  addUtilities({
    ".numerals": { fontVariantNumeric: "tabular-nums lining-nums" },
    ".overlay-hero": { backgroundImage: overlays.hero },
    ".overlay-hero-mobile": { backgroundImage: overlays.heroMobile },
    ".overlay-tile": { backgroundImage: overlays.tile },
    ".scrollbar-none": { scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } },
    ".scheme-dark": { colorScheme: "dark" },
    /* Below-the-fold sections skip rendering work until they approach the viewport (DESIGN_V1_1.md section 3). */
    ".content-auto": { contentVisibility: "auto", containIntrinsicSize: "auto 720px" },
  });
});

const preset = {
  content: [],
  theme: {
    screens: mapValues(screens, px),
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      ...colors,
      chart: chartColors,
    },
    spacing,
    fontFamily: { display: [...fontFamilies.display], sans: [...fontFamilies.sans] },
    fontSize: {},
    fontWeight: { normal: "400", medium: "500", semibold: "600" },
    letterSpacing: { normal: "0" },
    lineHeight: { none: "1" },
    borderRadius: { ...mapValues(radii, px), full: "9999px" },
    borderWidth: { 0: "0px", DEFAULT: "1px", 2: "2px", 3: "3px" },
    outlineWidth: { 0: "0px", 2: "2px" },
    outlineOffset: { 0: "0px", 2: "2px" },
    boxShadow: { none: "none", ...shadows },
    opacity: Object.fromEntries(opacity.map((value) => [String(value), String(value / 100)])),
    zIndex: { 0: "0", raised: "10", sticky: "20", header: "30", overlay: "40", dialog: "50", toast: "60" },
    aspectRatio: { auto: "auto", square: "1 / 1", "4/3": "4 / 3", "4/5": "4 / 5", "3/2": "3 / 2", "16/9": "16 / 9", "9/16": "9 / 16", "21/9": "21 / 9" },
    maxWidth: { none: "none", full: "100%", measure, intro: introMeasure, ...namedSizes },
    transitionDuration: { 0: "0ms", DEFAULT: `${durations.base}ms`, ...mapValues(durations, (value) => `${value}ms`) },
    transitionTimingFunction: { DEFAULT: easings.standard, ...easings },
    transitionDelay: { 0: "0ms" },
    textUnderlineOffset: { 2: "2px", 3: "3px", 4: "4px" },
    extend: {
      width: namedSizes,
      height: namedSizes,
      minWidth: namedSizes,
      minHeight: { ...namedSizes, screen: "100vh", svh: "100svh" },
      maxHeight: { sheet: "92svh" },
      size: namedSizes,
      // C-11 rows: thumbnail, text, action.
      gridTemplateColumns: { row: "auto minmax(0, 1fr) auto" },
      padding: componentSpaces,
      margin: componentSpaces,
      gap: componentSpaces,
    },
  },
  plugins: [foundation],
} satisfies Config;

export default preset;
