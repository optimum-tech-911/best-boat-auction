import { expect, test } from "@playwright/test";
import { bidOnSolenne } from "./support";

test.use({ viewport: { width: 1280, height: 1000 } });

test("a new bidder signs up, verifies, bids and leads; the bid survives a reload", async ({ page }) => {
  const panel = await bidOnSolenne(page);
  await expect(panel.getByText("En tête").first()).toBeVisible();
  await expect(panel.getByText("Vous").first()).toBeVisible();
  await page.reload();
  await expect(panel.getByText("En tête").first()).toBeVisible();
});

test("my bids list the lot under its status, and the watchlist shows followed lots", async ({ page }) => {
  await bidOnSolenne(page);
  await page.goto("/fr/ventes/7702-kerlys-31");
  await page.getByRole("button", { name: "Suivre" }).first().click();
  await page.goto("/fr/mon-compte");
  await expect(page.getByRole("tab", { name: /En tête\s*\(1\)/ })).toBeVisible();
  await expect(page.getByRole("tabpanel").getByRole("link", { name: "Solenne 38" })).toBeVisible();
  await expect(page.locator("#watchlist-title")).toContainText("(1)");
});

test("account settings validate the VAT number and persist", async ({ page }) => {
  await bidOnSolenne(page);
  await page.goto("/fr/mon-compte/parametres");
  await page.getByLabel("Nom affiché").fill("Camille M.");
  await page.locator("#profil").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées").first()).toBeVisible();
  await page.getByRole("checkbox", { name: "J’achète pour une entreprise" }).check();
  await page.getByLabel("Raison sociale").fill("Voiles SARL");
  await page.getByLabel("Numéro de TVA intracommunautaire").fill("12");
  await page.locator("#entreprise").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Indiquez un numéro de TVA valide/)).toBeVisible();
  await page.getByLabel("Numéro de TVA intracommunautaire").fill("fr 12 345678901");
  await page.locator("#entreprise").getByRole("button", { name: "Enregistrer" }).click();
  await page.reload();
  await expect(page.getByLabel("Nom affiché")).toHaveValue("Camille M.");
  await expect(page.getByLabel("Numéro de TVA intracommunautaire")).toHaveValue("FR12345678901");
});
