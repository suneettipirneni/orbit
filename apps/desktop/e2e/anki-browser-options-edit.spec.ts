import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-037: Browser Options applies font, font size, and line size display settings", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Browser settings" }).click();
  await expect(page.getByRole("dialog", { name: "Browser Options" })).toBeVisible();
  await page.getByRole("combobox", { name: "Browser font" }).selectOption("serif");
  await page.getByRole("spinbutton", { name: "Browser font size" }).fill("18");
  await page.getByRole("spinbutton", { name: "Browser line size" }).fill("1.8");
  await page.getByRole("button", { name: "Save browser options" }).click();

  const browserWorkArea = page.getByTestId("browser-work-area");
  await expect(browserWorkArea).toHaveAttribute("data-browser-font", "serif");
  await expect(browserWorkArea).toHaveAttribute("data-browser-font-size", "18");
  await expect(browserWorkArea).toHaveAttribute("data-browser-line-size", "1.8");
});

test("ANKI-BROWSER-038: Browser Options can include formatting markup in search", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      {
        back: "Answer",
        front: '<span data-secret="omega">Visible text</span>',
        id: "card-1",
      },
    ],
  });
  await page.goto("/browse");

  await page.getByRole("textbox", { name: "Search cards" }).fill("omega");
  await page.keyboard.press("Enter");
  await expect(page.getByText("No cards yet.")).toBeVisible();

  await page.getByRole("button", { name: "Browser settings" }).click();
  await page.getByRole("checkbox", { name: "Search within formatting" }).click();
  await page.getByRole("button", { name: "Save browser options" }).click();
  await page.getByRole("textbox", { name: "Search cards" }).fill("omega");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("row", { name: /Visible text/ })).toBeVisible();
});

test("ANKI-BROWSER-039 ANKI-BROWSER-040: Browser Undo and Redo revert and reapply note edits", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("textbox", { name: "Selected note front" }).fill("Capital city");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByRole("row", { name: /Capital city/ })).toBeVisible();

  await page.getByRole("button", { name: "Undo browser change" }).click();
  await expect(page.getByRole("row", { name: /Capital of France/ })).toBeVisible();

  await page.getByRole("button", { name: "Redo browser change" }).click();
  await expect(page.getByRole("row", { name: /Capital city/ })).toBeVisible();
});

test("ANKI-BROWSER-041 ANKI-BROWSER-042: Browser Close hides the browser and Full Screen toggles fullscreen state", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  const browserWorkArea = page.getByTestId("browser-work-area");
  await page.getByRole("button", { name: "Full screen browser" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-full-screen", "true");
  await page.getByRole("button", { name: "Full screen browser" }).click();
  await expect(browserWorkArea).toHaveAttribute("data-browser-full-screen", "false");

  await page.getByRole("button", { name: "Close browser" }).click();
  await expect(page.getByRole("region", { name: "Card list" })).toBeHidden();
  await expect(page.getByRole("region", { name: "Selected note editor" })).toBeHidden();
});
