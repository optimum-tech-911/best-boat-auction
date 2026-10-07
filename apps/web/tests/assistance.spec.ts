import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 900 } });

async function checkDialog(page: Page) {
  await expect.poll(() => page.locator("dialog[open] .motion-dialog-panel").evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  const { violations } = await new AxeBuilder({ page }).include("dialog[open]").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(violations.filter(({ impact }) => impact === "serious" || impact === "critical").map(({ id }) => id)).toEqual([]);
  expect(await page.locator("dialog[open]").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
}

test("seller interest opens immediately, matches a model and carries its answers into the existing estimate", async ({ page }) => {
  await page.goto("/fr");
  await page.locator("header").getByRole("link", { name: "Vendre mon bateau", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Qui recherche votre bateau ?" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/fr$/);
  await dialog.getByLabel("Modèle de votre bateau").fill("Solenne 38");
  await expect(dialog.getByRole("status")).toContainText("38");
  await expect(dialog.getByRole("status")).toContainText("70 000 € – 86 000 €");
  await expect(dialog).toContainText("profils et prix fictifs");
  await checkDialog(page);
  await dialog.getByRole("link", { name: "Préparer ma vente" }).click();
  await expect(page).toHaveURL(/vendre-mon-bateau\?type=sailboat&length=11.4&value=78500$/);
  await expect(page.getByRole("button", { name: "Voilier", pressed: true })).toBeVisible();
  await expect(page.getByText("11,40 m").first()).toBeVisible();
});

test("unknown models do not invent demand; Escape restores the seller trigger", async ({ page }) => {
  await page.goto("/fr/ventes");
  const trigger = page.locator("header").getByRole("link", { name: "Vendre mon bateau", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Modèle de votre bateau").fill("Mon modèle inconnu");
  await expect(dialog.getByRole("status")).toContainText("n’a pas encore d’exemple");
  await expect(dialog.getByRole("status")).not.toContainText("acheteurs recherchent");
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("dialog").getByRole("link", { name: "Continuer sans estimation" }).click();
  await expect(page).toHaveURL(/\/fr\/vendre-mon-bateau$/);
});

test("both expertise modes use the selected boat, without following the card link", async ({ page }) => {
  await page.goto("/fr/ventes");
  const cards = page.locator("main article");
  await expect(cards).toHaveCount(12);
  await expect(cards.locator("[data-expertise-actions] button")).toHaveCount(24);
  await cards.getByRole("button", { name: "Expertise digitale pour Solenne 38", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Solenne 38");
  await expect(dialog).toContainText("visioconférence");
  await expect(page).toHaveURL(/\/fr\/ventes$/);
  await checkDialog(page);
  await page.keyboard.press("Escape");
  await cards.getByRole("button", { name: "Expertise sur place pour Kerlys 31", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Kerlys 31");
  await expect(page.getByRole("dialog")).toContainText("à bord");
  await expect(page).toHaveURL(/\/fr\/ventes$/);
});

test("detail assistance demonstrates a local conversation and preserves the boat page", async ({ page }) => {
  await page.goto("/fr/ventes/7702-kerlys-31");
  const requests: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") requests.push(request.url()); });
  const trigger = page.getByRole("button", { name: "Expertise digitale pour Kerlys 31", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Essayer l’accompagnement" }).click();
  await expect(dialog.getByRole("log")).toContainText("Pour Kerlys 31");
  await expect(dialog.getByRole("button", { name: "Envoyer", exact: true })).toBeDisabled();
  await dialog.getByLabel("Votre question à l’expert").fill("Que vérifier sur le gréement ?");
  await dialog.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(dialog.getByRole("log")).toContainText("Que vérifier sur le gréement ?");
  await expect(dialog.getByRole("log")).toContainText("réponse est préparée à l’avance");
  await expect(dialog).toContainText("aucun expert n’est connecté");
  expect(requests).toEqual([]);
  await checkDialog(page);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kerlys 31");
  await page.getByRole("button", { name: "Expertise sur place pour Kerlys 31", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Essayer l’accompagnement" }).click();
  await expect(page.getByRole("log")).toContainText("Préparons ensemble la visite de Kerlys 31");
});

test("expertise is also available in the closing-order rows", async ({ page }) => {
  await page.goto("/fr/ventes?view=order");
  await page.getByRole("button", { name: "Expertise sur place pour Solenne 38", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Solenne 38");
  await expect(page).toHaveURL(/view=order/);
});

test.describe("mobile and English", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the mobile sell bar opens an English sheet and the model price stays readable", async ({ page }) => {
    await page.goto("/en/auctions");
    await page.locator("[data-mobile-sell-bar]").getByRole("link").click();
    const dialog = page.getByRole("dialog", { name: "Who is looking for your boat?" });
    await dialog.getByLabel("Your boat model").fill("Kerlys 31");
    await expect(dialog.getByRole("status")).toContainText("24");
    await expect(dialog).toContainText("fictional profiles and prices");
    await checkDialog(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "On-site expertise for Kerlys 31", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("On-board assistance");
    await checkDialog(page);
  });
});
