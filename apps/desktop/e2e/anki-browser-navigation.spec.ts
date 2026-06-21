import { expect, test } from "@playwright/test";
import { mockOrbitApi } from "./fixtures/orbit-api";

test("ANKI-BROWSER-056 ANKI-BROWSER-057 ANKI-BROWSER-058 ANKI-BROWSER-059 ANKI-BROWSER-060: Browser focus commands move focus to search, filter, sidebar, editor, and card list", async ({
  page,
}) => {
  await mockOrbitApi(page);
  await page.goto("/browse");

  await page.getByRole("button", { name: "Find/search focus" }).click();
  await expect(page.getByRole("textbox", { name: "Search cards" })).toBeFocused();

  await page.getByRole("button", { name: "Filter focus" }).click();
  await expect(page.getByRole("textbox", { name: "Sidebar filter" })).toBeFocused();

  await page.getByRole("button", { name: "Sidebar focus" }).click();
  await expect(page.locator("#browser-sidebar-tree")).toBeFocused();

  await page
    .getByRole("row", { name: /Capital of France/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Note focus" }).click();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toBeFocused();

  await page.getByRole("button", { name: "Card list focus" }).click();
  await expect(page.getByRole("region", { name: "Card list" })).toBeFocused();
});

test("ANKI-BROWSER-061 ANKI-BROWSER-062 ANKI-BROWSER-063 ANKI-BROWSER-064: Browser row navigation moves to first, previous, next, and last cards", async ({
  page,
}) => {
  await mockOrbitApi(page, {
    browserCards: [
      { back: "One back", front: "First card", id: "card-1", noteId: "note-1" },
      { back: "Two back", front: "Middle card", id: "card-2", noteId: "note-2" },
      { back: "Three back", front: "Last card", id: "card-3", noteId: "note-3" },
    ],
  });
  await page.goto("/browse");

  await page
    .getByRole("row", { name: /First card/ })
    .getByRole("checkbox")
    .click();
  await page.getByRole("button", { name: "Next card" }).click();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue(
    "Middle card",
  );

  await page.getByRole("button", { name: "Last card" }).click();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue("Last card");

  await page.getByRole("button", { name: "Previous card" }).click();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue(
    "Middle card",
  );

  await page.getByRole("button", { name: "First card" }).click();
  await expect(page.getByRole("textbox", { name: "Selected note front" })).toHaveValue(
    "First card",
  );
});
