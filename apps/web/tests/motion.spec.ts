import { expect, test } from "@playwright/test";

test("with reduced motion every section is visible at once", async ({ page }) => {
  await page.goto("/fr");
  await page.mouse.wheel(0, 6_000);
  await expect(page.locator("[data-motion='waiting']")).toHaveCount(0);
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("sections below the fold reveal once as they enter the viewport", async ({ page }) => {
    await page.goto("/fr/vendre-mon-bateau");
    const steps = page.locator("#seller-steps-title");
    await expect(page.locator("[data-motion='waiting']").first()).toBeAttached();
    await steps.scrollIntoViewIfNeeded();
    await expect(steps).toBeVisible();
    await expect.poll(() => steps.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  });
});
