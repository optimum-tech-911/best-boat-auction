import { locales, type Locale } from "./locales";

/**
 * Public URLs per language. The application's route folders use the English paths;
 * French paths are rewritten to them, so each page is written once.
 * A `[name]` segment is a parameter.
 */
export const routePatterns = {
  home: { fr: "", en: "" },
  auctions: { fr: "ventes", en: "auctions" },
  lot: { fr: "ventes/[lot]", en: "auctions/[lot]" },
  results: { fr: "resultats", en: "results" },
  calendar: { fr: "calendrier", en: "calendar" },
  howItWorks: { fr: "comment-ca-marche", en: "how-it-works" },
  sell: { fr: "vendre-mon-bateau", en: "sell-my-boat" },
  sellListing: { fr: "vendre-mon-bateau/annonce", en: "sell-my-boat/listing" },
  brokers: { fr: "courtiers", en: "brokers" },
  services: { fr: "services", en: "services" },
  account: { fr: "mon-compte", en: "account" },
  accountSettings: { fr: "mon-compte/parametres", en: "account/settings" },
  legalNotice: { fr: "mentions-legales", en: "legal-notice" },
  terms: { fr: "conditions-generales", en: "terms" },
  privacy: { fr: "confidentialite", en: "privacy" },
  cookies: { fr: "cookies", en: "cookies" },
  designSystem: { fr: "dev/ui", en: "dev/ui" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteName = keyof typeof routePatterns;
export type RouteParams = Readonly<Record<string, string>>;

const routeNames = Object.keys(routePatterns) as RouteName[];

/** The localized path of a page: href("fr", "lot", { lot: "7701-solenne-38" }) → "/fr/ventes/7701-solenne-38". */
export function href(locale: Locale, route: RouteName, params: RouteParams = {}, query?: Readonly<Record<string, string | undefined>>): string {
  const pattern = routePatterns[route][locale];
  const path = pattern.replace(/\[(\w+)\]/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing route parameter "${name}" for ${route}.`);
    return encodeURIComponent(value);
  });
  const search = query ? new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined)).toString() : "";
  return `/${locale}${path ? `/${path}` : ""}${search ? `?${search}` : ""}`;
}

export interface MatchedRoute {
  locale: Locale;
  route: RouteName;
  params: Record<string, string>;
}

function matchPattern(pattern: string, segments: readonly string[]): Record<string, string> | null {
  const expected = pattern ? pattern.split("/") : [];
  if (expected.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (const [index, part] of expected.entries()) {
    const segment = segments[index] ?? "";
    const parameter = /^\[(\w+)\]$/.exec(part);
    if (parameter?.[1]) params[parameter[1]] = decodeURIComponent(segment);
    else if (part !== segment) return null;
  }
  return params;
}

/** Recognises a public path in either language. */
export function matchRoute(pathname: string): MatchedRoute | null {
  const [first, ...segments] = pathname.split(/[?#]/)[0]!.split("/").filter(Boolean);
  const locale = locales.find((candidate) => candidate === first);
  if (!locale) return null;
  for (const route of routeNames) {
    const params = matchPattern(routePatterns[route][locale], segments);
    if (params) return { locale, route, params };
  }
  return null;
}

/** The same page in another language, for the language menu and alternate links. */
export function translatePath(pathname: string, target: Locale): string {
  const match = matchRoute(pathname);
  return match ? href(target, match.route, match.params) : `/${target}`;
}

/** Next.js rewrites from each localized path to the route folder that renders it. */
export function localizedRewrites(): { source: string; destination: string }[] {
  const toNext = (pattern: string) => pattern.replace(/\[(\w+)\]/g, ":$1");
  return locales.flatMap((locale) => routeNames
    .filter((route) => routePatterns[route][locale] !== routePatterns[route].en)
    .map((route) => ({ source: `/${locale}/${toNext(routePatterns[route][locale])}`, destination: `/${locale}/${toNext(routePatterns[route].en)}` })));
}

/** The lot route parameter: "7701-solenne-38". */
export function lotSlug(lotNumber: number, title: string): string {
  const slug = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${lotNumber}-${slug}`;
}

export function lotNumberFromSlug(slug: string): number | null {
  const number = Number.parseInt(slug, 10);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
