import { expect, type Page } from "@playwright/test";

/** Creates the demonstration account through the sign-up dialog that is open on the page. */
export async function signUp(page: Page, name = "Camille Martin", email = "camille.martin@example.fr") {
  const dialog = page.getByRole("dialog", { name: /Créer votre compte|Create your bidder account/ });
  await dialog.getByLabel(/Nom complet|Full name/).fill(name);
  await dialog.getByLabel(/Adresse e-mail|Email address/).fill(email);
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: /Créer mon compte|Create my account/ }).click();
  await expect(dialog).toBeHidden();
}

/** Places the suggested bid on Solenne 38, signing up and verifying the identity on the way. */
export async function bidOnSolenne(page: Page) {
  await page.goto("/fr/ventes/7701-solenne-38");
  const panel = page.locator("aside section[aria-label='Enchérir sur ce lot']");
  await panel.getByRole("button", { name: /^Enchérir \d/ }).click();
  await signUp(page);
  const review = page.getByRole("dialog", { name: /Vérifiez votre enchère/ });
  await review.getByRole("button", { name: "Vérifier mon identité" }).click();
  await review.getByRole("checkbox", { name: /ferme et définitive/ }).check();
  await review.getByRole("button", { name: /Confirmer l’enchère de/ }).click();
  await expect(page.getByText(/Enchère placée/).first()).toBeVisible();
  return panel;
}

/** Replaces the value of a money input as a person would type it. */
export async function typeAmount(page: Page, label: string, euros: number) {
  const input = page.getByLabel(label, { exact: true });
  await input.fill("");
  await input.pressSequentially(String(euros));
}
