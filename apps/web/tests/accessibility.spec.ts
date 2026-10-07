import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const paths = ["/fr", "/fr/ventes", "/fr/resultats", "/fr/ventes/7701-solenne-38", "/fr/calendrier", "/fr/comment-ca-marche", "/fr/vendre-mon-bateau", "/fr/courtiers", "/fr/services", "/fr/mon-compte", "/en/terms"];

for (const path of paths) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });
}

test("every interactive element shows a visible focus ring", async ({ page }) => {
  await page.goto("/fr");
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return "none";
      const style = getComputedStyle(element);
      return style.outlineStyle === "none" && style.boxShadow === "none" ? "none" : "visible";
    });
    expect(outline).toBe("visible");
  }
});
