import { expect, test } from "@playwright/test";
import { signUp } from "./support";

test.use({ viewport: { width: 1280, height: 900 } });

test("a lot shows its viewing, its public questions, and asks bidders to sign in before asking", async ({ page }) => {
  await page.goto("/fr/ventes/7701-solenne-38");
  await expect(page.locator("#viewing")).toContainText(/Date fixée avec (le vendeur|le courtier du vendeur)/);
  const questions = page.locator("#questions");
  await expect(questions.getByText("Réponse du vendeur").first()).toBeVisible();
  await expect(page.getByText(/personnes? suit|personnes suivent/)).toBeVisible();
  await questions.getByRole("button", { name: "Se connecter" }).click();
  await signUp(page);
  await questions.getByLabel("Votre question au vendeur").fill("Le gréement dormant a-t-il été changé récemment ?");
  await questions.getByRole("button", { name: "Envoyer la question" }).click();
  await expect(questions.getByText("Question transmise.", { exact: false })).toBeVisible();
});

test("broker partnership requests need the agency's name and an explicit consent", async ({ page }) => {
  await page.goto("/fr/courtiers#partenaire");
  const form = page.locator("#partenaire form");
  await form.getByLabel("Nom complet").fill("Marc Leroy");
  await form.getByLabel("Adresse e-mail").fill("marc@agence-du-port.fr");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(form.getByText("Indiquez le nom de votre agence.")).toBeVisible();
  await form.getByLabel("Agence").fill("Agence du Port");
  await form.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByText("Demande envoyée, merci.")).toBeVisible();
});

test("a service request from a lot names the lot and preselects the subject", async ({ page }) => {
  await page.goto("/fr/ventes/7701-solenne-38");
  await page.locator("section[aria-labelledby='around-title']").getByRole("link", { name: /Financement/ }).click();
  await expect(page).toHaveURL(/services\?topic=finance&lot=7701#demande/);
  await expect(page.getByText("Au sujet du lot 7701 · Solenne 38")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Sujet" })).toHaveValue("finance");
});

test("brokers keep their mandate commission and receive half of ours for a buyer", async ({ page }) => {
  await page.goto("/fr/courtiers");
  await expect(page.getByText("prévue dans votre mandat de vente")).toBeVisible();
  await expect(page.getByText(/^Votre commission \+ 50/)).toBeVisible();
  await expect(page.getByText(/vous en recevez 5\s000\s€/)).toBeVisible();
  const preview = page.locator("#espace table");
  await expect(preview.locator("tbody tr")).toHaveCount(5);
  await expect(preview).toContainText("Solenne 38");
});
