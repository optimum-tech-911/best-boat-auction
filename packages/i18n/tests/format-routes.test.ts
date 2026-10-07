import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatDay,
  formatLength,
  formatMoney,
  formatPercent,
  formatSaleName,
  formatTime,
  getMessages,
  href,
  localizedRewrites,
  lotNumberFromSlug,
  lotSlug,
  matchRoute,
  parseAmount,
  plural,
  translatePath,
} from "../src";

/** French uses narrow and regular no-break spaces; compare their visible form. */
const visible = (text: string) => text.replace(/[  ]/g, " ");
const closing = Date.UTC(2026, 9, 19, 18, 0); // Monday 19 October 2026, 20:00 in Paris
const MINUTE = 60_000;

describe("money and numbers", () => {
  it("places the euro sign by language", () => {
    expect(visible(formatMoney(4_250_000, "fr"))).toBe("42 500 €");
    expect(formatMoney(4_250_000, "en")).toBe("€42,500");
    expect(visible(formatMoney(2_557_380, "fr", { withCents: true }))).toBe("25 573,80 €");
  });

  it("formats rates, lengths and parses typed amounts", () => {
    expect(visible(formatPercent(1_800, "fr"))).toBe("18 %");
    expect(formatPercent(1_200, "en")).toBe("12%");
    expect(visible(formatLength(1_140, "fr"))).toBe("11,40 m");
    expect(parseAmount("60 000 €")).toBe(6_000_000);
    expect(parseAmount("€42,500")).toBe(4_250_000);
  });
});

describe("dates", () => {
  it("writes the long and short forms of section 9", () => {
    expect(visible(formatDateLong(closing, "fr"))).toBe("lundi 19 octobre 2026 à 20 h 00");
    expect(formatDateLong(closing, "en")).toBe("Monday 19 October 2026 at 20:00");
    expect(visible(formatDateShort(closing, "fr"))).toBe("19 oct. · 20 h 00");
    expect(visible(formatDateTime(closing, "fr"))).toBe("lundi 19 octobre · 20 h 00");
  });

  it("drops zero minutes in compact times and abbreviates days", () => {
    expect(visible(formatTime(closing, "fr", { compact: true }))).toBe("20 h");
    expect(formatTime(closing, "en", { compact: true })).toBe("20:00");
    expect(formatDay(Date.UTC(2026, 10, 14, 9), "fr", { weekday: "short", month: "short" })).toBe("sam. 14 nov.");
  });

  it("names a sale after its month, with French elision", () => {
    expect(formatSaleName(closing, "fr")).toBe("Vente d’octobre");
    expect(formatSaleName(Date.UTC(2026, 10, 16, 19), "fr")).toBe("Vente de novembre");
    expect(formatSaleName(closing, "en")).toBe("October auction");
  });
});

describe("countdown", () => {
  it("uses days and hours from 24 hours", () => {
    expect(visible(formatCountdown((12 * 24 + 4) * 60 * MINUTE + 5 * MINUTE, "fr").text)).toBe("12 j 04 h");
  });

  it("uses hours and minutes from one hour", () => {
    const countdown = formatCountdown((4 * 60 + 12) * MINUTE + 30_000, "fr");
    expect(visible(countdown.text)).toBe("4 h 12 min");
    expect(countdown.spoken).toBe("4 heures et 12 minutes");
  });

  it("shows minutes and seconds under one hour", () => {
    expect(formatCountdown(4 * MINUTE + 28_000, "en")).toEqual({ text: "04:28", spoken: "4 minutes", label: "Closes in 4 minutes", ended: false });
    expect(formatCountdown(40_000, "fr").spoken).toBe("moins d’une minute");
  });

  it("shows the closed state", () => {
    expect(formatCountdown(0, "fr")).toEqual({ text: "Clôturé", spoken: "Clôturé", label: "Clôturé", ended: true });
  });
});

describe("routes", () => {
  it("builds localized paths", () => {
    expect(href("fr", "lot", { lot: "7701-solenne-38" })).toBe("/fr/ventes/7701-solenne-38");
    expect(href("en", "howItWorks")).toBe("/en/how-it-works");
    expect(href("fr", "home")).toBe("/fr");
    expect(href("fr", "auctions", {}, { type: "sailboat", page: undefined })).toBe("/fr/ventes?type=sailboat");
  });

  it("translates a page into the other language", () => {
    expect(translatePath("/fr/ventes/7701-solenne-38", "en")).toBe("/en/auctions/7701-solenne-38");
    expect(translatePath("/en/sell-my-boat", "fr")).toBe("/fr/vendre-mon-bateau");
    expect(translatePath("/fr/inconnu", "en")).toBe("/en");
    expect(matchRoute("/en")).toEqual({ locale: "en", route: "home", params: {} });
  });

  it("rewrites French paths to the English route folders", () => {
    expect(localizedRewrites()).toContainEqual({ source: "/fr/ventes/:lot", destination: "/fr/auctions/:lot" });
    expect(localizedRewrites().some((rewrite) => rewrite.source.startsWith("/en/"))).toBe(false);
  });

  it("builds and reads lot slugs", () => {
    expect(lotSlug(7712, "Alizé 40")).toBe("7712-alize-40");
    expect(lotNumberFromSlug("7712-alize-40")).toBe(7712);
    expect(lotNumberFromSlug("solenne")).toBeNull();
  });
});

describe("messages", () => {
  it("selects plural forms", () => {
    const messages = getMessages("fr");
    expect(plural("fr", messages.lot.bidCount, 1)).toBe("1 enchère");
    expect(plural("fr", messages.lot.bidCount, 0)).toBe("Aucune enchère");
    expect(plural("en", getMessages("en").lot.bidCount, 0)).toBe("No bids");
    expect(plural("fr", messages.lot.bidCount, 12)).toBe("12 enchères");
  });

  it("keeps the same keys in every language", () => {
    const keys = (value: unknown, prefix = ""): string[] => value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`))
      : [prefix];
    expect(keys(getMessages("en"))).toEqual(keys(getMessages("fr")));
  });
});

describe("rule figures", () => {
  /** Figures that come from the house rules must be placeholders, never written into the copy. */
  const ruleFigures = [/\b72 ?(h|heures|hours)\b/, /\b\d+ (dernières )?minutes\b/i, /\blast \d+ minutes\b/i, /\b(28|30|35) (jours|days)\b/, /\b(4|14) (jours|days)\b/];

  it("never writes a rule's value into a message", () => {
    const strings: string[] = [];
    const collect = (value: unknown) => {
      if (typeof value === "string") strings.push(value);
      else if (value && typeof value === "object") Object.values(value).forEach(collect);
    };
    collect(getMessages("fr"));
    collect(getMessages("en"));
    const offending = strings.filter((text) => ruleFigures.some((pattern) => pattern.test(text)));
    expect(offending).toEqual([]);
  });
});
