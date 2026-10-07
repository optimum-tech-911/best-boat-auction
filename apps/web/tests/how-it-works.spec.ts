import { expect, test } from "@playwright/test";
import { typeAmount } from "./support";

test.use({ viewport: { width: 1280, height: 900 } });

test("SC-04 follows the bidding engine (specification vectors 3 and 4)", async ({ page }) => {
  await page.goto("/fr/comment-ca-marche");
  const result = page.getByText(/^Prix résultant :/);
  await expect(result).toHaveText("Prix résultant : 14 500 € · Vous êtes en tête");
  await typeAmount(page, "Votre maximum", 14_000);
  await expect(result).toHaveText("Prix résultant : 14 000 € · Le concurrent est en tête");
});

test("the calculator matches buyerTotal: 10 % commission plus 20 % VAT on it", async ({ page }) => {
  await page.goto("/fr/comment-ca-marche#frais");
  const table = page.locator("table").filter({ hasText: "Total si vous gagnez" });
  await expect(table).toContainText("Commission acheteur (10 %)2 100 €");
  await expect(table).toContainText("TVA sur la commission (20 %)420 €");
  await expect(table).toContainText("Total si vous gagnez23 520 €");
  await expect(page.getByText("Exemple : bateau adjugé 100 000 € → commission 10 000 €, plus 2 000 € de TVA.")).toBeVisible();
});
