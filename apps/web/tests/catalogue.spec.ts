import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 900 } });

test("filters live in the address and survive a reload", async ({ page }) => {
  await page.goto("/fr/ventes");
  const sailboats = page.getByRole("checkbox", { name: /^Voilier/ });
  await sailboats.check();
  await expect(page).toHaveURL(/type=sailboat/);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /^Voilier/ })).toBeChecked();
  await expect(page.locator("main article").first()).toContainText("Voilier");
});

test("results sum up the last sale and list closed lots with their outcome", async ({ page }) => {
  await page.goto("/fr/resultats");
  await expect(page.getByText(/Vente de septembre · 7 bateaux vendus sur 10 · .* adjugés/)).toBeVisible();
  await expect(page.getByText("Vendu").first()).toBeVisible();
  await expect(page.getByText("Invendu").first()).toBeVisible();
});
