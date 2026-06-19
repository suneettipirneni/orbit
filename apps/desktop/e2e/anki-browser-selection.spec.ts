import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-007 ANKI-BROWSER-008: Browser can select all visible rows and invert the selection", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page.getByRole("checkbox", { name: "Select all rows" }).click();
  await expect(page.getByText("2 of 2 row(s) selected.")).toBeVisible();

  await page.getByRole("button", { name: "Invert selection" }).click();
  await expect(page.getByText("0 of 2 row(s) selected.")).toBeVisible();

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Invert selection" }).click();

  await expect(page.getByText("1 of 2 row(s) selected.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue(
    "Largest planet",
  );
});

test("ANKI-BROWSER-009: Select notes selects sibling card rows for selected notes", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      { back: "Shared answer", front: "Sibling one", id: "card-1", noteId: "note-shared" },
      { back: "Shared answer", front: "Sibling two", id: "card-2", noteId: "note-shared" },
      { back: "Other answer", front: "Other card", id: "card-3", noteId: "note-other" },
    ],
  });
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Sibling one/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Select notes" }).click();

  await expect(page.getByText("2 of 3 row(s) selected.")).toBeVisible();
  await expect(page.getByRole("row", { name: /Sibling two/ }).getByRole("checkbox")).toBeChecked();
  await expect(
    page.getByRole("row", { name: /Other card/ }).getByRole("checkbox"),
  ).not.toBeChecked();
});

test("ANKI-BROWSER-010 ANKI-BROWSER-011: Browser adds and removes tags on selected notes", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("textbox", { name: "Selected note tag" }).fill("review");
  await page.getByRole("button", { name: "Add tag" }).click();

  await expect(page.getByText("Tags: review")).toBeVisible();

  await page.getByRole("textbox", { name: "Selected note tag" }).fill("review");
  await page.getByRole("button", { name: "Remove tag" }).click();

  await expect(page.getByText("Tags: none")).toBeVisible();
});

test("ANKI-BROWSER-013 ANKI-BROWSER-014: Browser toggles marked state for selected notes", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/decks/deck-1");

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Mark note" }).click();

  await expect(page.getByText("Tags: marked")).toBeVisible();

  await page.getByRole("button", { name: "Unmark note" }).click();
  await expect(page.getByText("Tags: none")).toBeVisible();
});
