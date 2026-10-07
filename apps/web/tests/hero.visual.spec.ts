import { expect, test } from "@playwright/test";

/*
 * The locked hero (docs/design/HERO_BRIEF.md). Live values (sale name, dates, countdown, price)
 * change with the demonstration clock, so they are masked; everything else is in the baseline.
 */
for (const locale of ["fr", "en"] as const) {
  for (const width of [390, 1280, 1920]) {
    test(`hero ${locale} ${width}`, { tag: "@visual" }, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".hero__image")).toHaveJSProperty("complete", true);
      // Capturing an element taller than the screen resizes the page; keep the fixed mobile bar out of it.
      await page.addStyleTag({ content: "[data-mobile-sell-bar] { visibility: hidden !important; }" });
      const rail = page.locator(".hero [data-phase]");
      await expect(page.locator(".hero")).toHaveScreenshot(`hero-${locale}-${width}.png`, {
        mask: [page.getByRole("timer"), rail.locator(".type-title-m, .type-body-s, .type-num-l")],
      });
    });
  }
}
