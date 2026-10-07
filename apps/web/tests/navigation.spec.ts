import { expect, test } from "@playwright/test";

const pages = [
  { name: "home", fr: "/fr", en: "/en" },
  { name: "auctions", fr: "/fr/ventes", en: "/en/auctions" },
  { name: "results", fr: "/fr/resultats", en: "/en/results" },
  { name: "lot", fr: "/fr/ventes/7701-solenne-38", en: "/en/auctions/7701-solenne-38" },
  { name: "calendar", fr: "/fr/calendrier", en: "/en/calendar" },
  { name: "how it works", fr: "/fr/comment-ca-marche", en: "/en/how-it-works" },
  { name: "sell", fr: "/fr/vendre-mon-bateau", en: "/en/sell-my-boat" },
  { name: "brokers", fr: "/fr/courtiers", en: "/en/brokers" },
  { name: "services", fr: "/fr/services", en: "/en/services" },
  { name: "account", fr: "/fr/mon-compte", en: "/en/account" },
  { name: "terms", fr: "/fr/conditions-generales", en: "/en/terms" },
] as const;

test("the root address opens the French site", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

for (const { name, fr, en } of pages) {
  test(`${name} answers in French and English with one heading`, async ({ page }) => {
    for (const [path, lang] of [[fr, "fr"], [en, "en"]] as const) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByText(/Présentation de démonstration|Demonstration preview/).first()).toBeVisible();
    }
  });
}

test("the language menu keeps the page and its query", async ({ page }) => {
  await page.goto("/fr/ventes?type=sailboat");
  await page.getByRole("button", { name: /Langue/ }).first().click();
  await page.getByRole("link", { name: "English" }).first().click();
  await expect(page).toHaveURL(/\/en\/auctions\?type=sailboat$/);
});

test("a lot address with an outdated name redirects to the canonical one", async ({ page }) => {
  await page.goto("/fr/ventes/7701-ancien-nom");
  await expect(page).toHaveURL(/\/fr\/ventes\/7701-solenne-38$/);
});

test("unknown addresses show the localized not-found page with a 404 status", async ({ page }) => {
  const response = await page.goto("/en/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/does not exist/);
  await expect(page.getByRole("link", { name: "See current auctions" })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the sell bar waits until the hero's own sell button has scrolled away", async ({ page }) => {
    await page.goto("/fr");
    const bar = page.locator("[data-mobile-sell-bar]");
    await expect(bar).toHaveAttribute("inert", "");
    await page.mouse.wheel(0, 1_600);
    await expect(bar).not.toHaveAttribute("inert", "");
    await page.goto("/fr/ventes");
    await expect(bar).not.toHaveAttribute("inert", "");
  });
});
