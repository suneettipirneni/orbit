import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test.beforeEach(async ({ page }) => {
  await mockOrbitApi(page);
});

test("ANKI-BROWSER-043 ANKI-BROWSER-044 ANKI-BROWSER-045: browser display zoom can increase, decrease, and reset", async ({
  page,
}) => {
  await page.goto("/decks/deck-1");

  const browserWorkArea = page.getByTestId("browser-work-area");
  await expect(browserWorkArea).toHaveAttribute("data-browser-zoom", "1");
  await expect(browserWorkArea).toHaveCSS("zoom", "1");

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-zoom", "1.1");
  await expect(browserWorkArea).toHaveCSS("zoom", "1.1");

  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-zoom", "1");
  await expect(browserWorkArea).toHaveCSS("zoom", "1");

  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-zoom", "0.9");
  await expect(browserWorkArea).toHaveCSS("zoom", "0.9");

  await page.getByRole("button", { name: "Reset zoom" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-zoom", "1");
  await expect(browserWorkArea).toHaveCSS("zoom", "1");
});
