import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 900 } });

test("the worked example costs 1 108 € a month and lists every line", async ({ page }) => {
  await page.goto("/fr/vendre-mon-bateau");
  const results = page.locator("#estimation-resultat");
  await expect(results.getByText("1 108 € / mois")).toBeVisible();
  await expect(results.getByText("13 299 € par an", { exact: false })).toBeVisible();
  await expect(page.getByText("Vous gardez 4 800 € de plus")).toBeVisible();
});

test("the homepage estimator carries its answers to the sell page", async ({ page }) => {
  await page.goto("/fr");
  const seller = page.locator("section[aria-labelledby='seller-title']");
  await seller.getByLabel("Type").selectOption("sailboat");
  await seller.getByLabel("Longueur (m)").fill("12");
  await seller.getByRole("link", { name: /coût complet|Voir le coût/i }).first().click();
  await expect(page).toHaveURL(/vendre-mon-bateau\?type=sailboat&length=12/);
  await expect(page.getByRole("button", { name: "Voilier", pressed: true })).toBeVisible();
  await expect(page.getByText("12,00 m").first()).toBeVisible();
});

test("the lead dialog never sends without explicit consent", async ({ page }) => {
  await page.goto("/fr/vendre-mon-bateau");
  await page.getByRole("button", { name: /Vendre à la vente du/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom complet").fill("Camille Martin");
  await dialog.getByLabel("Adresse e-mail").fill("camille@example.com");
  await expect(dialog.getByRole("checkbox")).not.toBeChecked();
  await dialog.getByRole("button", { name: "Envoyer" }).click();
  await expect(dialog.getByText("Cochez la case d’accord pour être contacté.")).toBeVisible();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByRole("dialog", { name: "C’est noté, merci." })).toContainText(/Référence : BBA-/);
});

test("a pack card opens the lead dialog with that pack chosen", async ({ page }) => {
  await page.goto("/fr/vendre-mon-bateau#packs");
  await expect(page.getByText("Inscription 100 % gratuite")).toBeVisible();
  await page.getByRole("button", { name: "Choisir le Pack Boost" }).click();
  const dialog = page.getByRole("dialog", { name: "Vendons votre bateau" });
  await expect(dialog.getByLabel("Pack souhaité")).toHaveValue("boost");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the monthly cost stays in view while the owner answers", async ({ page }) => {
    await page.goto("/fr/vendre-mon-bateau");
    const bar = page.locator("a[href='#estimation-resultat']");
    await expect(bar).toHaveAttribute("inert", "");
    await page.locator("#estimation-saisie").getByRole("button", { name: "Voilier", exact: true }).scrollIntoViewIfNeeded();
    await expect(bar).not.toHaveAttribute("inert", "");
    await expect(bar).toContainText("1 108 € / mois");
    await bar.click();
    await expect(page.locator("#estimation-resultat")).toBeInViewport();
  });
});
