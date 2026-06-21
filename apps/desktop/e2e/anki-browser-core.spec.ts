import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-001 ANKI-BROWSER-003: Browser shows search, table, editor, and selected row fields", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await expect(page.getByRole("textbox", { name: "Search cards" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Card list" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Selected note editor" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Capital of France/ })).toBeVisible();

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();

  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue(
    "Capital of France",
  );
  await expect(page.getByRole("textbox", { name: "Selected note back" })).toHaveValue("Paris");
});

test("ANKI-BROWSER-002: submitted browser search filters matching cards", async ({ page }) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("textbox", { name: "Search cards" }).fill("Jupiter");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("row", { name: /Largest planet/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Capital of France/ })).toHaveCount(0);
});

test("ANKI-BROWSER-004: editor save updates stored field text and refreshes the table", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("textbox", { name: "Selected note front" }).fill("Capital city of France");
  await page.getByRole("button", { name: "Save note" }).click();

  await expect(page.getByRole("row", { name: /Capital city of France/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue(
    "Capital city of France",
  );
});

test("ANKI-BROWSER-005 ANKI-BROWSER-006: browser toggles between card and note row modes", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      {
        back: "Shared answer",
        front: "Sibling one",
        id: "card-1",
        noteId: "note-shared",
      },
      {
        back: "Shared answer",
        front: "Sibling two",
        id: "card-2",
        noteId: "note-shared",
      },
    ],
  });
  await page.goto("/browse");

  await expect(page.getByText("0 of 2 row(s) selected.")).toBeVisible();

  await page.getByRole("radio", { name: "Note rows" }).click();
  await expect(page.getByText("0 of 1 row(s) selected.")).toBeVisible();
  await expect(page.getByRole("row", { name: /Sibling one/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Sibling two/ })).toHaveCount(0);

  await page.getByRole("radio", { name: "Card rows" }).click();
  await expect(page.getByText("0 of 2 row(s) selected.")).toBeVisible();
  await expect(page.getByRole("row", { name: /Sibling two/ })).toBeVisible();
});
